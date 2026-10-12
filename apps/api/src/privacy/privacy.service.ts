import { Injectable, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Db } from '../db';
import { encrypt, phoneHash } from '../security';
import { normalizePhone } from '@chippin/shared';
import { DataRequestDto, FulfillDataDto } from '../pots/dto';
@Injectable()
export class PrivacyService {
  constructor(private readonly db: Db) {}
  async request(dto: DataRequestDto) {
    const request = await this.db.dataRequest.create({
      data: {
        emailEnc: encrypt(dto.email),
        phoneHash: phoneHash(normalizePhone(dto.phone)),
        kind: dto.kind,
        details: dto.details,
      },
    });
    return { reference: request.id };
  }
  async fulfill(id: string, actor: string, dto: FulfillDataDto) {
    const request = await this.db.dataRequest.findUniqueOrThrow({
      where: { id },
    });
    if (request.status === 'FULFILLED')
      throw new BadRequestException('This request has already been fulfilled.');
    const rows = await this.db.contribution.findMany({
      where: { msisdnHash: request.phoneHash },
      include: { refund: true, pot: true },
    });
    if (request.kind === 'ACCESS') {
      await this.db.audit(actor, 'DATA_ACCESS_PREPARED', id);
      return {
        records: rows.map((c) => ({
          reference: c.providerReference,
          name: c.displayName,
          amountMinor: c.amountMinor,
          status: c.status,
          at: c.createdAt,
        })),
        note: 'Deliver this file only to the identity-verified requester using a secure channel.',
      };
    }
    if (
      request.kind === 'DELETION' &&
      rows.some(
        (c) =>
          ['CREATED', 'PENDING'].includes(c.status) ||
          ['OPEN', 'REFUNDING'].includes(c.pot.status) ||
          (c.refund && c.refund.status !== 'SUCCESSFUL'),
      )
    )
      throw new BadRequestException(
        'A pot, payment or refund is still open. Retain the number for refunds until it settles, then retry this request.',
      );
    if (request.kind === 'CORRECTION' && !dto.displayName)
      throw new BadRequestException(
        'Enter the corrected display name. Payment recipients cannot be changed.',
      );
    await this.db.$transaction(async (tx) => {
      await tx.contribution.updateMany({
        where: { msisdnHash: request.phoneHash },
        data:
          request.kind === 'DELETION'
            ? {
                displayName: null,
                message: null,
                msisdnEnc: null,
                msisdnHash: null,
                isAnonymous: true,
              }
            : { displayName: dto.displayName },
      });
      if (request.kind === 'DELETION')
        await tx.mockTransaction.deleteMany({
          where: { partyHash: request.phoneHash },
        });
      if (request.kind === 'DELETION') {
        const refunds = await tx.refund.findMany({
          where: { contributionId: { in: rows.map((c) => c.id) } },
          select: { id: true },
        });
        await tx.transferAttempt.updateMany({
          where: {
            kind: 'refund',
            jobId: { in: refunds.map((r) => r.id) },
            status: { in: ['SUCCESSFUL', 'FAILED'] },
          },
          data: { partyEnc: '' },
        });
      }
      await tx.dataRequest.update({
        where: { id },
        data: {
          status: 'FULFILLED',
          details: 'Identity verified; request fulfilled.',
        },
      });
      await tx.auditLog.create({
        data: {
          actor,
          action: 'DATA_' + request.kind + '_FULFILLED',
          target: id,
        },
      });
    });
    return { fulfilled: true };
  }
  @Cron('0 3 * * *')
  async retain() {
    const cutoff = new Date();
    cutoff.setUTCMonth(
      cutoff.getUTCMonth() - Number(process.env.RETENTION_MONTHS ?? 24),
    );
    const pots = await this.db.pot.findMany({
      where: {
        closedAt: { lt: cutoff },
        status: { in: ['CLOSED', 'REFUNDED'] },
        contributions: {
          none: {
            OR: [
              { status: { in: ['CREATED', 'PENDING'] } },
              { settledAt: { gte: cutoff } },
            ],
          },
        },
        payouts: {
          none: {
            OR: [
              { status: { in: ['QUEUED', 'SENT', 'UNKNOWN'] } },
              { createdAt: { gte: cutoff } },
            ],
          },
        },
        OR: [
          { recovery: { is: null } },
          {
            recovery: {
              is: { status: 'SUCCESSFUL', createdAt: { lt: cutoff } },
            },
          },
        ],
      },
    });
    for (const pot of pots) {
      if (
        await this.db.refund.count({
          where: {
            contribution: { potId: pot.id },
            status: { not: 'SUCCESSFUL' },
          },
        })
      )
        continue;
      await this.db.contribution.updateMany({
        where: { potId: pot.id },
        data: {
          displayName: null,
          message: null,
          msisdnEnc: null,
          msisdnHash: null,
          isAnonymous: true,
        },
      });
      await this.db.mockTransaction.deleteMany({
        where: {
          reference: {
            in: (
              await this.db.contribution.findMany({
                where: { potId: pot.id },
                select: { providerReference: true },
              })
            ).map((c) => c.providerReference),
          },
        },
      });
      await this.db.audit('retention', 'POT_ANONYMIZED', pot.id);
      const payouts = await this.db.payout.findMany({
        where: { potId: pot.id },
        select: { id: true },
      });
      const refunds = await this.db.refund.findMany({
        where: { contribution: { potId: pot.id } },
        select: { id: true },
      });
      const attempts = await this.db.transferAttempt.findMany({
        where: {
          OR: [
            { kind: 'payout', jobId: { in: payouts.map((p) => p.id) } },
            { kind: 'refund', jobId: { in: refunds.map((r) => r.id) } },
          ],
        },
        select: { id: true, providerReference: true },
      });
      await this.db.transferAttempt.updateMany({
        where: { id: { in: attempts.map((a) => a.id) } },
        data: { partyEnc: '' },
      });
      await this.db.mockTransaction.deleteMany({
        where: { reference: { in: attempts.map((a) => a.providerReference) } },
      });
    }
  }
}
