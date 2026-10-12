import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { createHash, randomUUID } from 'node:crypto';
import { Contribution, Prisma } from '@prisma/client';
import { normalizePhone, networkFor } from '@chippin/shared';
import { balance, Db, lockPot } from '../db';
import { decrypt, encrypt, phoneHash } from '../security';
import { PaymentProvider, ProviderResult } from './provider';
import { ContributionDto } from '../pots/dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: Db,
    private readonly provider: PaymentProvider,
  ) {}
  async contribute(code: string, dto: ContributionDto, key: string) {
    if (!key || key.length > 100)
      throw new BadRequestException('An idempotency key is required.');
    if (dto.consent !== true)
      throw new BadRequestException(
        'Please accept the privacy policy and terms.',
      );
    let phone: string;
    try {
      phone = normalizePhone(dto.phone);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    const requestHash = createHash('sha256')
      .update(JSON.stringify({ code, ...dto, phone }))
      .digest('hex');
    const existing = await this.db.contribution.findUnique({
      where: { idempotencyKey: key },
    });
    if (existing) {
      if (existing.requestHash !== requestHash)
        throw new ConflictException(
          'This request key was already used for a different payment.',
        );
      return this.safe(existing);
    }
    const pot = await this.db.pot.findUnique({
      where: { code },
      include: { organizer: true },
    });
    if (!pot) throw new NotFoundException('This pot could not be found.');
    if (
      dto.amountMinor < pot.minContributionMinor ||
      dto.amountMinor > Number(process.env.MAX_CONTRIBUTION_MINOR ?? 500000)
    )
      throw new BadRequestException(
        'This amount is outside the allowed contribution range.',
      );
    if (dto.isAnonymous && !pot.allowAnonymous)
      throw new BadRequestException(
        'This pot does not allow anonymous contributions.',
      );
    const contribution = await this.db.$transaction(async (tx) => {
      await lockPot(tx, pot.id);
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${phoneHash(phone)}))`;
      const recent = await tx.contribution.count({
        where: {
          msisdnHash: phoneHash(phone),
          createdAt: { gt: new Date(Date.now() - 600000) },
        },
      });
      if (recent >= 10)
        throw new BadRequestException(
          'This number has made several requests. Please wait ten minutes before trying again.',
        );
      const current = await tx.pot.findUniqueOrThrow({ where: { id: pot.id } });
      if (
        current.status !== 'OPEN' ||
        current.suspended ||
        pot.organizer.verificationStatus === 'SUSPENDED' ||
        (current.deadlineAt && current.deadlineAt <= new Date())
      )
        throw new BadRequestException(
          'This pot is no longer accepting contributions.',
        );
      const replay = await tx.contribution.findUnique({
        where: { idempotencyKey: key },
      });
      if (replay) {
        if (replay.requestHash !== requestHash)
          throw new ConflictException('Request key already used.');
        return replay;
      }
      const duplicate = await tx.contribution.findFirst({
        where: {
          potId: pot.id,
          msisdnHash: phoneHash(phone),
          amountMinor: dto.amountMinor,
          createdAt: { gt: new Date(Date.now() - 60000) },
          status: { in: ['CREATED', 'PENDING', 'SUCCESSFUL'] },
        },
      });
      if (duplicate && !dto.confirmDuplicate)
        throw new ConflictException(
          'You just made a similar contribution. Check your receipt, or confirm you want to give again.',
        );
      return tx.contribution.create({
        data: {
          potId: pot.id,
          displayName: dto.isAnonymous ? null : dto.displayName,
          message: dto.message,
          isAnonymous: dto.isAnonymous,
          msisdnEnc: encrypt(phone),
          msisdnHash: phoneHash(phone),
          network: networkFor(phone),
          amountMinor: dto.amountMinor,
          providerReference: randomUUID(),
          idempotencyKey: key,
          requestHash,
          consentAt: new Date(),
          consentVersion: '2026-10-12',
          scenario:
            process.env.MOMO_MODE === 'mock'
              ? (dto.scenario ?? 'success')
              : 'success',
        },
      });
    });
    // CREATED is durable before any provider request. Reconciliation also recovers a crash here.
    await this.submitContribution(contribution);
    return this.safe(
      await this.db.contribution.findUniqueOrThrow({
        where: { id: contribution.id },
      }),
    );
  }
  private safe(c: Contribution) {
    return {
      id: c.id,
      status: c.status,
      amountMinor: c.amountMinor,
      feeMinor: c.feeMinor,
      reference: c.providerReference,
      failureReason: c.failureReason,
      createdAt: c.createdAt,
      settledAt: c.settledAt,
    };
  }
  async status(id: string) {
    const c = await this.db.contribution.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Receipt not found.');
    if (['CREATED', 'PENDING'].includes(c.status))
      await this.reconcileContribution(c);
    return this.safe(
      await this.db.contribution.findUniqueOrThrow({ where: { id } }),
    );
  }
  private async submitContribution(c: Contribution) {
    if (!c.msisdnEnc) return;
    try {
      await this.provider.requestToPay(
        c.providerReference,
        c.amountMinor,
        decrypt(c.msisdnEnc),
        'Chippin contribution',
        c.scenario,
      );
    } catch {
      /* Never infer failure from a response timeout. */
    }
    await this.db.contribution.updateMany({
      where: { id: c.id, status: 'CREATED' },
      data: { status: 'PENDING' },
    });
  }
  private matches(result: ProviderResult, amount: number, party: string) {
    return (
      (process.env.MOMO_MODE === 'mock' ||
        !process.env.MOMO_MODE ||
        result.currency === (process.env.MOMO_CURRENCY ?? 'EUR')) &&
      result.amountMinor === amount &&
      result.party?.replace(/^\+/, '') === party
    );
  }
  async reconcileContribution(c: Contribution) {
    if (c.status === 'CREATED') await this.submitContribution(c);
    let result: ProviderResult;
    try {
      result = await this.provider.getCollectionStatus(c.providerReference);
    } catch {
      return;
    }
    await this.db.contribution.update({
      where: { id: c.id },
      data: { lastCheckedAt: new Date() },
    });
    if (result.notFound && c.msisdnEnc) {
      await this.submitContribution(c);
      return;
    }
    if (result.status === 'PENDING') return;
    if (
      !c.msisdnEnc ||
      !this.matches(result, c.amountMinor, decrypt(c.msisdnEnc))
    ) {
      await this.db.audit('provider', 'PAYMENT_MISMATCH', c.id);
      return;
    }
    await this.db.$transaction(async (tx) => {
      await lockPot(tx, c.potId);
      const current = await tx.contribution.findUniqueOrThrow({
        where: { id: c.id },
      });
      if (!['CREATED', 'PENDING'].includes(current.status)) return;
      await tx.contribution.update({
        where: { id: c.id },
        data: {
          status: result.status,
          failureReason: result.status === 'FAILED' ? result.reason : null,
          settledAt: new Date(),
          providerTxnId: result.transactionId,
        },
      });
      if (result.status === 'SUCCESSFUL') {
        await tx.ledgerEntry.create({
          data: {
            potId: c.potId,
            type: 'CONTRIBUTION',
            amountMinor: c.amountMinor,
            refType: 'contribution',
            refId: c.id,
          },
        });
        await tx.pot.update({
          where: { id: c.potId },
          data: { payoutLocked: true },
        });
      }
    });
    const pot = await this.db.pot.findUniqueOrThrow({ where: { id: c.potId } });
    if (result.status === 'SUCCESSFUL' && pot.status === 'REFUNDING')
      await this.queueRefunds(pot.id);
    else if (
      result.status === 'SUCCESSFUL' &&
      (pot.payoutMode === 'INSTANT' || pot.status === 'CLOSED')
    )
      await this.reservePayout(pot.id);
  }
  async callback(reference: string) {
    const c = await this.db.contribution.findUnique({
      where: { providerReference: reference },
    });
    if (c && ['CREATED', 'PENDING'].includes(c.status))
      await this.reconcileContribution(c);
    const payout = await this.db.payout.findUnique({
      where: { providerReference: reference },
    });
    if (payout) await this.processTransfer('payout', payout.id);
    const refund = await this.db.refund.findUnique({
      where: { providerReference: reference },
    });
    if (refund) await this.processTransfer('refund', refund.id);
    const recovery = await this.db.recovery.findUnique({
      where: { providerReference: reference },
    });
    if (recovery) await this.processRecovery(recovery.potId);
    const attempt = await this.db.transferAttempt.findUnique({
      where: { providerReference: reference },
    });
    if (attempt)
      await this.processTransfer(
        attempt.kind as 'payout' | 'refund',
        attempt.jobId,
      );
    return { received: true };
  }
  async reservePayout(potId: string) {
    return this.db.$transaction(async (tx) => {
      await lockPot(tx, potId);
      const pot = await tx.pot.findUniqueOrThrow({
        where: { id: potId },
        include: { organizer: true },
      });
      if (
        pot.suspended ||
        pot.organizer.verificationStatus === 'SUSPENDED' ||
        ['REFUNDING', 'REFUNDED', 'CANCELLED'].includes(pot.status)
      )
        return;
      if (
        pot.payoutMode === 'INSTANT' &&
        pot.organizer.verificationStatus !== 'VERIFIED'
      )
        return;
      const available = await balance(tx, potId);
      if (
        await tx.payout.count({
          where: { potId, status: 'FAILED', attempts: { gte: 3 } },
        })
      )
        return;
      if (available <= 0) return;
      // The persisted QUEUED row is the reservation, subtracted by balance().
      return tx.payout.create({
        data: {
          potId,
          amountMinor: available,
          providerReference: randomUUID(),
        },
      });
    });
  }
  async processTransfer(kind: 'payout' | 'refund', id: string) {
    const job =
      kind === 'payout'
        ? await this.db.payout.findUnique({
            where: { id },
            include: { pot: { include: { organizer: true } } },
          })
        : await this.db.refund.findUnique({
            where: { id },
            include: {
              contribution: {
                include: { pot: { include: { organizer: true } } },
              },
            },
          });
    if (
      !job ||
      ['SUCCESSFUL', 'FAILED'].includes(job.status) ||
      job.nextAttemptAt > new Date()
    )
      return;
    const pot = 'pot' in job ? job.pot : job.contribution.pot;
    const partyEnc =
      'pot' in job ? job.pot.payoutMsisdnEnc : job.contribution.msisdnEnc;
    if (!partyEnc) return;
    const model = kind === 'payout' ? this.db.payout : this.db.refund;
    const update = (where: any, data: any) =>
      (model as any).updateMany({ where, data });
    let attempt = await this.db.transferAttempt.findFirst({
      where: { jobId: id, kind },
      orderBy: { createdAt: 'desc' },
    });
    if (job.status === 'QUEUED') {
      if (
        kind === 'payout' &&
        (pot.suspended ||
          pot.organizer.verificationStatus === 'SUSPENDED' ||
          pot.status === 'REFUNDING')
      )
        return;
      const claimed = await this.db.$transaction(async (tx) => {
        await lockPot(tx, pot.id);
        const txModel = kind === 'payout' ? tx.payout : tx.refund;
        const current = await (txModel as any).findUnique({ where: { id } });
        const currentPot = await tx.pot.findUniqueOrThrow({
          where: { id: pot.id },
          include: { organizer: true },
        });
        if (
          current.status !== 'QUEUED' ||
          (kind === 'payout' &&
            (currentPot.suspended ||
              currentPot.status === 'REFUNDING' ||
              currentPot.organizer.verificationStatus === 'SUSPENDED'))
        )
          return null;
        await (txModel as any).update({
          where: { id },
          data: { status: 'SENT', attempts: { increment: 1 } },
        });
        return tx.transferAttempt.create({
          data: {
            jobId: id,
            kind,
            providerReference:
              current.attempts === 0 ? job.providerReference : randomUUID(),
            amountMinor: job.amountMinor,
            partyEnc,
          },
        });
      });
      if (!claimed) return;
      attempt = claimed;
      try {
        await this.provider.transfer(
          attempt.providerReference,
          job.amountMinor,
          decrypt(partyEnc),
          'Chippin ' + kind,
        );
      } catch {
        await update(
          { id, status: 'SENT' },
          { status: 'UNKNOWN', lastError: 'Awaiting provider confirmation' },
        );
      }
    }
    // Recover an older persisted SENT job with no attempt row (including a pre-send crash).
    if (!attempt)
      attempt = await this.db.transferAttempt.upsert({
        where: { providerReference: job.providerReference },
        create: {
          jobId: id,
          kind,
          providerReference: job.providerReference,
          amountMinor: job.amountMinor,
          partyEnc,
        },
        update: {},
      });
    const reference = attempt.providerReference;
    let result: ProviderResult;
    try {
      result = await this.provider.getTransferStatus(reference);
    } catch {
      return;
    }
    if (result.notFound) {
      // Safe recovery after a crash between claiming the job and sending it: same reference and party.
      try {
        await this.provider.transfer(
          reference,
          job.amountMinor,
          decrypt(partyEnc),
          'Chippin ' + kind,
        );
      } catch {}
      return;
    }
    if (result.status === 'PENDING') return;
    if (!this.matches(result, job.amountMinor, decrypt(partyEnc))) {
      await this.db.audit('provider', 'TRANSFER_MISMATCH', id);
      return;
    }
    await this.db.$transaction(async (tx) => {
      await lockPot(tx, pot.id);
      const txModel = kind === 'payout' ? tx.payout : tx.refund;
      const current = await (txModel as any).findUnique({ where: { id } });
      if (['SUCCESSFUL', 'FAILED'].includes(current.status)) return;
      const latest = await tx.transferAttempt.findFirst({
        where: { jobId: id, kind },
        orderBy: { createdAt: 'desc' },
      });
      if (latest?.providerReference !== reference || latest.status === 'FAILED')
        return;
      await tx.transferAttempt.update({
        where: { providerReference: reference },
        data: { status: result.status as 'SUCCESSFUL' | 'FAILED' },
      });
      await (txModel as any).update({
        where: { id },
        data: {
          status:
            result.status === 'FAILED' && current.attempts < 3
              ? 'QUEUED'
              : result.status,
          lastError: result.status === 'FAILED' ? result.reason : null,
          nextAttemptAt:
            result.status === 'FAILED'
              ? new Date(Date.now() + 30000 * 2 ** current.attempts)
              : new Date(),
        },
      });
      if (result.status === 'SUCCESSFUL') {
        await tx.ledgerEntry.create({
          data: {
            potId: pot.id,
            type: kind === 'payout' ? 'PAYOUT' : 'REFUND',
            amountMinor: -job.amountMinor,
            refType: kind,
            refId: id,
          },
        });
        if ('contributionId' in job)
          await tx.contribution.update({
            where: { id: job.contributionId },
            data: { status: 'REFUNDED' },
          });
      }
    });
  }
  async cancel(potId: string) {
    await this.db.$transaction(async (tx) => {
      await lockPot(tx, potId);
      const current = await tx.pot.findUniqueOrThrow({ where: { id: potId } });
      if (current.status === 'REFUNDED')
        throw new BadRequestException('This pot has already been refunded.');
      await tx.pot.update({
        where: { id: potId },
        data: { status: 'REFUNDING', closedAt: current.closedAt ?? new Date() },
      });
    });
    // Wait for outstanding payouts to resolve before calculating recovery.
    await this.queueRefunds(potId);
    return { queued: true };
  }
  async refundOne(potId: string, contributionId: string) {
    return this.db.$transaction(async (tx) => {
      await lockPot(tx, potId);
      const existing = await tx.refund.findUnique({
        where: { contributionId },
      });
      if (existing) return { id: existing.id, status: existing.status };
      const c = await tx.contribution.findFirst({
        where: { id: contributionId, potId, status: 'SUCCESSFUL' },
      });
      if (!c || !c.msisdnEnc)
        throw new BadRequestException('This contribution cannot be refunded.');
      if ((await balance(tx, potId)) < c.amountMinor)
        throw new BadRequestException(
          'These funds have been paid out or reserved. Cancel the pot to request recovery from the organizer first.',
        );
      const refund = await tx.refund.create({
        data: {
          contributionId,
          amountMinor: c.amountMinor,
          providerReference: randomUUID(),
          reason: 'Organizer requested contribution refund',
        },
      });
      return { id: refund.id, status: refund.status };
    });
  }
  async retryTransfer(kind: 'payout' | 'refund', id: string) {
    const job=kind==='payout'?await this.db.payout.findUnique({where:{id}}):await this.db.refund.findUnique({where:{id},include:{contribution:true}});
    if(!job||job.status!=='FAILED')throw new BadRequestException('Only a confirmed failed job can be retried. Unknown outcomes must be reconciled.');
    const potId='potId' in job?job.potId:job.contribution.potId;
    return this.db.$transaction(async tx=>{
      await lockPot(tx,potId);
      if(await balance(tx,potId)<job.amountMinor)throw new BadRequestException('There are not enough unreserved funds to retry this job.');
      const model=kind==='payout'?tx.payout:tx.refund;
      const current=await (model as any).findUnique({where:{id}});
      if(current.status!=='FAILED')return {queued:true};
      await (model as any).update({where:{id},data:{status:'QUEUED',nextAttemptAt:new Date(),lastError:null}});
      return {queued:true};
    });
  }
  async queueRefunds(potId: string) {
    await this.db.$transaction(async (tx) => {
      await lockPot(tx, potId);
      const pendingPayout = await tx.payout.count({
        where: { potId, status: { in: ['SENT', 'UNKNOWN'] } },
      });
      await tx.payout.updateMany({
        where: { potId, status: 'QUEUED' },
        data: { status: 'FAILED', lastError: 'Cancelled before sending' },
      });
      if (pendingPayout) return;
      const contributions = await tx.contribution.findMany({
        where: { potId, status: 'SUCCESSFUL', refund: null },
      });
      let available = await balance(tx, potId);
      const needed = contributions.reduce((sum, c) => sum + c.amountMinor, 0);
      if (needed > available) {
        const recovery = await tx.recovery.findUnique({ where: { potId } });
        if (!recovery)
          await tx.recovery.create({
            data: {
              potId,
              amountMinor: needed - available,
              providerReference: randomUUID(),
              expiresAt: new Date(
                Date.now() +
                  Number(process.env.RECOVERY_WINDOW_HOURS ?? 72) * 3600000,
              ),
            },
          });
        return;
      }
      for (const c of contributions) {
        if (c.amountMinor > available) break;
        await tx.refund.create({
          data: {
            contributionId: c.id,
            amountMinor: c.amountMinor,
            providerReference: randomUUID(),
            reason: 'Pot cancelled by organizer',
          },
        });
        available -= c.amountMinor;
      }
      const unsettled = await tx.contribution.count({
        where: { potId, status: { in: ['CREATED', 'PENDING', 'SUCCESSFUL'] } },
      });
      if (!unsettled)
        await tx.pot.update({
          where: { id: potId },
          data: { status: 'REFUNDED' },
        });
    });
  }
  private async processRecovery(potId: string) {
    const recovery = await this.db.recovery.findUnique({
      where: { potId },
      include: { pot: true },
    });
    if (!recovery || ['SUCCESSFUL', 'FAILED'].includes(recovery.status)) return;
    if (recovery.status === 'CREATED') {
      try {
        await this.provider.requestToPay(
          recovery.providerReference,
          recovery.amountMinor,
          decrypt(recovery.pot.payoutMsisdnEnc),
          'Return funds for Chippin refunds',
        );
      } catch {}
      await this.db.recovery.updateMany({
        where: { id: recovery.id, status: 'CREATED' },
        data: { status: 'PENDING' },
      });
    }
    let result: ProviderResult;
    try {
      result = await this.provider.getCollectionStatus(
        recovery.providerReference,
      );
    } catch {
      return;
    }
    if (result.notFound) {
      try {
        await this.provider.requestToPay(
          recovery.providerReference,
          recovery.amountMinor,
          decrypt(recovery.pot.payoutMsisdnEnc),
          'Return funds for refunds',
        );
      } catch {}
      return;
    }
    if (result.status === 'PENDING') {
      if (recovery.expiresAt < new Date())
        await this.db.pot.update({
          where: { id: potId },
          data: { unrecovered: true },
        });
      return;
    }
    if (
      !this.matches(
        result,
        recovery.amountMinor,
        decrypt(recovery.pot.payoutMsisdnEnc),
      )
    ) {
      await this.db.audit('provider', 'RECOVERY_MISMATCH', recovery.id);
      return;
    }
    await this.db.$transaction(async (tx) => {
      await lockPot(tx, potId);
      const current = await tx.recovery.findUniqueOrThrow({ where: { potId } });
      if (['SUCCESSFUL', 'FAILED'].includes(current.status)) return;
      await tx.recovery.update({
        where: { potId },
        data: { status: result.status },
      });
      if (result.status === 'SUCCESSFUL') {
        await tx.ledgerEntry.create({
          data: {
            potId,
            type: 'RECOVERY',
            amountMinor: recovery.amountMinor,
            refType: 'recovery',
            refId: recovery.id,
          },
        });
        await tx.pot.update({
          where: { id: potId },
          data: { unrecovered: false },
        });
      } else
        await tx.pot.update({
          where: { id: potId },
          data: { unrecovered: true },
        });
    });
    if (result.status === 'SUCCESSFUL') await this.queueRefunds(potId);
  }
  private running = false;
  @Interval(30000)
  async reconcile() {
    if (this.running) return;
    this.running = true;
    try {
      const pending = await this.db.contribution.findMany({
        where: { status: { in: ['CREATED', 'PENDING'] } },
        take: 100,
        orderBy: { lastCheckedAt: { sort: 'asc', nulls: 'first' } },
      });
      for (const c of pending) {
        const interval =
          Date.now() - c.createdAt.getTime() < 600000 ? 30000 : 300000;
        if (
          !c.lastCheckedAt ||
          Date.now() - c.lastCheckedAt.getTime() >= interval
        )
          await this.reconcileContribution(c);
      }
      const pots = await this.db.pot.findMany({
        where: {
          OR: [
            { status: 'REFUNDING' },
            { status: 'CLOSED' },
            { status: 'OPEN', payoutMode: 'INSTANT' },
            {
              status: 'OPEN',
              payoutMode: 'SCHEDULED',
              payoutAt: { lte: new Date() },
            },
          ],
        },
      });
      for (const pot of pots) {
        if (pot.status === 'REFUNDING') {
          await this.processRecovery(pot.id);
          await this.queueRefunds(pot.id);
        } else await this.reservePayout(pot.id);
      }
      await this.db.pot.updateMany({
        where: { status: 'OPEN', deadlineAt: { lte: new Date() } },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
      for (const job of await this.db.payout.findMany({
        where: { status: { in: ['QUEUED', 'SENT', 'UNKNOWN'] } },
        take: 100,
      }))
        await this.processTransfer('payout', job.id);
      for (const job of await this.db.refund.findMany({
        where: { status: { in: ['QUEUED', 'SENT', 'UNKNOWN'] } },
        take: 20,
      }))
        await this.processTransfer('refund', job.id);
    } finally {
      this.running = false;
    }
  }
}
