import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { normalizePhone, maskPhone } from '@chippin/shared';
import { Db, lockPot, balance } from '../db';
import { decrypt, encrypt } from '../security';
import { PotDto } from './dto';

@Injectable()
export class PotsService {
  constructor(private readonly db: Db) {}
  async publicPot(code: string) {
    const pot = await this.db.pot.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        organizer: true,
        contributions: {
          where: { status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
          orderBy: { settledAt: 'desc' },
          take: 100,
        },
        payouts: {
          select: { status: true, amountMinor: true, createdAt: true },
        },
      },
    });
    if (!pot) throw new NotFoundException('This pot could not be found.');
    const sum = await this.db.contribution.aggregate({
      where: { potId: pot.id, status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
      _sum: { amountMinor: true },
      _count: true,
    });
    return {
      id: pot.id,
      code: pot.code,
      name: pot.name,
      story: pot.story,
      cover: pot.cover,
      status: pot.status,
      suspended: pot.suspended,
      targetMinor: pot.targetMinor,
      deadlineAt: pot.deadlineAt,
      payoutMode: pot.payoutMode,
      payoutAt: pot.payoutAt,
      payoutAccountName: pot.payoutAccountName,
      showAmountsPublicly: pot.showAmountsPublicly,
      allowAnonymous: pot.allowAnonymous,
      minContributionMinor: pot.minContributionMinor,
      thankYouMessage: pot.thankYouMessage,
      unrecovered: pot.unrecovered,
      currency:
        process.env.MOMO_MODE === 'sandbox'
          ? (process.env.MOMO_CURRENCY ?? 'EUR')
          : (process.env.CURRENCY ?? 'GHS'),
      demo: process.env.MOMO_MODE === 'mock',
      mode: process.env.MOMO_MODE ?? 'mock',
      organizer: {
        name: pot.organizer.name,
        verified: pot.organizer.verificationStatus === 'VERIFIED',
      },
      totalMinor: sum._sum.amountMinor ?? 0,
      count: sum._count,
      donors: pot.contributions.map((c) => ({
        id: c.id,
        name: c.isAnonymous
          ? 'Anonymous friend'
          : c.displayName || 'A kind friend',
        amountMinor: pot.showAmountsPublicly ? c.amountMinor : null,
        message: c.message,
        at: c.settledAt,
        status: c.status,
      })),
      payouts: pot.payouts,
    };
  }
  async owned(id: string, userId: string) {
    const pot = await this.db.pot.findUnique({ where: { id } });
    if (!pot || pot.organizerId !== userId)
      throw new ForbiddenException('You do not manage this pot.');
    return pot;
  }
  async create(dto: PotDto, userId: string) {
    const user = await this.db.organizer.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!user.phoneVerifiedAt)
      throw new BadRequestException('Verify your phone before creating a pot.');
    this.validateMode(dto, user.verificationStatus);
    let phone: string;
    try {
      phone = normalizePhone(dto.payoutPhone);
    } catch {
      throw new BadRequestException('Enter a valid payout number.');
    }
    const { payoutPhone, deadlineAt, payoutAt, ...data } = dto;
    const pot = await this.db.pot.create({
      data: {
        ...data,
        code: randomBytes(4).toString('hex').toUpperCase(),
        slug: dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        organizerId: userId,
        payoutMsisdnEnc: encrypt(phone),
        deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
        payoutAt: payoutAt ? new Date(payoutAt) : null,
      },
    });
    await this.db.audit(userId, 'POT_CREATED', pot.id);
    return pot;
  }
  private validateMode(dto: PotDto, verified: string) {
    if (dto.payoutMode === 'INSTANT' && verified !== 'VERIFIED')
      throw new BadRequestException(
        'Instant payouts require a verified organizer.',
      );
    for (const date of [dto.deadlineAt, dto.payoutAt])
      if (
        date &&
        (!Number.isFinite(Date.parse(date)) || Date.parse(date) <= Date.now())
      )
        throw new BadRequestException('Choose a date in the future.');
    if (dto.payoutMode === 'SCHEDULED' && !dto.payoutAt)
      throw new BadRequestException('Choose a payout time.');
  }
  async edit(id: string, dto: PotDto, userId: string) {
    await this.owned(id, userId);
    const user = await this.db.organizer.findUniqueOrThrow({
      where: { id: userId },
    });
    this.validateMode(dto, user.verificationStatus);
    let phone: string;
    try {
      phone = normalizePhone(dto.payoutPhone);
    } catch {
      throw new BadRequestException('Enter a valid payout number.');
    }
    const { payoutPhone, deadlineAt, payoutAt, ...data } = dto;
    return this.db.$transaction(async (tx) => {
      await lockPot(tx, id);
      const pot = await tx.pot.findUniqueOrThrow({ where: { id } });
      if (pot.status !== 'OPEN')
        throw new BadRequestException('Only an open pot can be edited.');
      if (pot.payoutLocked && decrypt(pot.payoutMsisdnEnc) !== phone)
        throw new BadRequestException(
          'The payout number is locked. Close this pot and create a new one to change it.',
        );
      return tx.pot.update({
        where: { id },
        data: {
          ...data,
          payoutMsisdnEnc: encrypt(phone),
          deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
          payoutAt: payoutAt ? new Date(payoutAt) : null,
        },
      });
    });
  }
  async close(id: string, userId: string) {
    await this.owned(id, userId);
    await this.db.$transaction(async (tx) => {
      await lockPot(tx, id);
      const pot = await tx.pot.findUniqueOrThrow({ where: { id } });
      if (pot.status !== 'OPEN')
        throw new BadRequestException('Only an open pot can be closed.');
      await tx.pot.update({
        where: { id },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
    });
    await this.db.audit(userId, 'POT_CLOSED', id);
  }
  async dashboard(userId: string) {
    const pots = await this.db.pot.findMany({
      where: { organizerId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      pots.map(async (pot) => ({
        ...(await this.publicPot(pot.code)),
        balanceMinor: await this.db.$transaction((tx) => balance(tx, pot.id)),
      })),
    );
  }
  async detail(id: string, userId: string) {
    const pot = await this.owned(id, userId);
    const contributions = await this.db.contribution.findMany({
      where: { potId: id },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    return {
      ...(await this.publicPot(pot.code)),
      payoutLocked: pot.payoutLocked,
      payoutPhone: maskPhone(decrypt(pot.payoutMsisdnEnc)),
      contributions: contributions.map((c) => ({
        id: c.id,
        name: c.isAnonymous
          ? 'Anonymous friend'
          : c.displayName || 'A kind friend',
        amountMinor: c.amountMinor,
        status: c.status,
        reference: c.providerReference,
        at: c.createdAt,
        phone: c.isAnonymous
          ? 'Private'
          : c.msisdnEnc
            ? maskPhone(decrypt(c.msisdnEnc))
            : 'Removed',
      })),
      payouts: await this.db.payout.findMany({
        where: { potId: id },
        orderBy: { createdAt: 'desc' },
      }),
      refunds: await this.db.refund.findMany({
        where: { contribution: { potId: id } },
        select: { id: true, status: true, amountMinor: true, lastError: true },
      }),
      balanceMinor: await this.db.$transaction((tx) => balance(tx, id)),
      activity: await this.db.auditLog.findMany({
        where: { target: id },
        orderBy: { at: 'desc' },
        take: 30,
      }),
    };
  }
  async reveal(potId: string, contributionId: string, userId: string) {
    await this.owned(potId, userId);
    const c = await this.db.contribution.findFirst({
      where: { id: contributionId, potId },
    });
    if (!c || !c.msisdnEnc || c.isAnonymous)
      throw new BadRequestException(
        'This number is private or has been removed.',
      );
    await this.db.audit(userId, 'PHONE_REVEALED', contributionId);
    return { phone: decrypt(c.msisdnEnc) };
  }
}
