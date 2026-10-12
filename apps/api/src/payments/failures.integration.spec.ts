import { config } from 'dotenv';
import { resolve } from 'node:path';
import { randomUUID, randomInt } from 'node:crypto';
import { Db, balance } from '../db';
import { MockProvider } from './mock';
import { PaymentsService } from './payments.service';
import { encrypt, phoneHash } from '../security';
import { ContributionDto } from '../pots/dto';
config({ path: resolve(__dirname, '../../../../.env'), quiet: true });
const run = process.env.DATABASE_URL ? describe : describe.skip;
run('payment failure matrix against persisted PostgreSQL state', () => {
  let db: Db;
  let provider: MockProvider;
  let payments: PaymentsService;
  let organizerId: string;
  beforeAll(async () => {
    db = new Db();
    await db.$connect();
    provider = new MockProvider(db);
    payments = new PaymentsService(db, provider);
    const u = await db.organizer.create({
      data: {
        name: 'Failure tests',
        email: `${randomUUID()}@test.local`,
        phoneEnc: encrypt('233241234560'),
        phoneHash: phoneHash(randomUUID()),
        passwordHash: 'not-a-login',
        phoneVerifiedAt: new Date(),
        verificationStatus: 'VERIFIED',
      },
    });
    organizerId = u.id;
  });
  afterAll(() => db.$disconnect());
  async function fixture(scenario = 'success') {
    const p = await db.pot.create({
      data: {
        code: randomUUID().slice(0, 8).toUpperCase(),
        name: 'Failure test pot',
        slug: 'test',
        story: 'An isolated money test',
        organizerId,
        payoutMsisdnEnc: encrypt('233241234560'),
        payoutAccountName: 'Test',
      },
    });
    const dto: ContributionDto = {
      amountMinor: 2000,
      phone: `024${randomInt(1000000, 9999999)}`,
      consent: true,
      isAnonymous: false,
      scenario,
    };
    const key = randomUUID();
    const receipt = await payments.contribute(p.code, dto, key);
    const c = await db.contribution.findUniqueOrThrow({
      where: { id: receipt.id },
    });
    await db.mockTransaction.update({
      where: { reference: c.providerReference },
      data: { createdAt: new Date(Date.now() - 60000) },
    });
    return { p, c, dto, key };
  }
  test('double-tap and an idempotent retry create one contribution; changed payload is rejected', async () => {
    const { p, c, dto, key } = await fixture();
    const receipts = await Promise.all([
      payments.contribute(p.code, dto, key),
      payments.contribute(p.code, dto, key),
    ]);
    expect(receipts.map((r) => r.id)).toEqual([c.id, c.id]);
    expect(await db.contribution.count({ where: { potId: p.id } })).toBe(1);
    await expect(
      payments.contribute(p.code, { ...dto, amountMinor: 3000 }, key),
    ).rejects.toThrow('different payment');
  });
  test.each(['amount', 'recipient'])(
    'a mismatching %s is rejected and audited',
    async (field) => {
      const { p, c } = await fixture();
      const result = await provider.getCollectionStatus(c.providerReference);
      const spy = jest
        .spyOn(provider, 'getCollectionStatus')
        .mockResolvedValueOnce({
          ...result,
          ...(field === 'amount'
            ? { amountMinor: 9999 }
            : { party: '233241111111' }),
        });
      await payments.callback(c.providerReference);
      spy.mockRestore();
      expect(await db.ledgerEntry.count({ where: { potId: p.id } })).toBe(0);
      expect(
        (await db.contribution.findUniqueOrThrow({ where: { id: c.id } }))
          .status,
      ).toBe('PENDING');
      expect(
        await db.auditLog.count({
          where: { target: c.id, action: 'PAYMENT_MISMATCH' },
        }),
      ).toBe(1);
    },
  );
  test('a provider status outage leaves money pending and resolves when checks recover', async () => {
    const { p, c } = await fixture();
    const spy = jest
      .spyOn(provider, 'getCollectionStatus')
      .mockRejectedValueOnce(new Error('HTTP 503'));
    await payments.reconcileContribution(c);
    spy.mockRestore();
    expect(await db.ledgerEntry.count({ where: { potId: p.id } })).toBe(0);
    await payments.reconcileContribution(c);
    expect(
      await db.ledgerEntry.count({
        where: { potId: p.id, type: 'CONTRIBUTION' },
      }),
    ).toBe(1);
  });
  test('provider success plus a failed DB transaction is recovered without double-counting', async () => {
    const { p, c } = await fixture();
    const spy = jest
      .spyOn(db, '$transaction')
      .mockRejectedValueOnce(new Error('DB transaction failed'));
    await expect(payments.reconcileContribution(c)).rejects.toThrow(
      'DB transaction failed',
    );
    spy.mockRestore();
    expect(await db.ledgerEntry.count({ where: { potId: p.id } })).toBe(0);
    await payments.reconcileContribution(c);
    await payments.reconcileContribution(c);
    expect(
      await db.ledgerEntry.count({
        where: { potId: p.id, type: 'CONTRIBUTION' },
      }),
    ).toBe(1);
  });
  test('no callback and a closed tab still resolve through provider reconciliation', async () => {
    const { p, c } = await fixture('missing-callback');
    await payments.reconcileContribution(c);
    expect(
      await db.ledgerEntry.count({
        where: { potId: p.id, type: 'CONTRIBUTION' },
      }),
    ).toBe(1);
  });
  test('clock skew and a 24-hour timeout never turn an unknown payment into FAILED', async () => {
    const { c } = await fixture('timeout');
    await db.contribution.update({
      where: { id: c.id },
      data: { createdAt: new Date(Date.now() - 86400000 * 2) },
    });
    await payments.reconcileContribution(c);
    expect(
      (await db.contribution.findUniqueOrThrow({ where: { id: c.id } })).status,
    ).toBe('PENDING');
    const { c: future } = await fixture();
    await db.mockTransaction.update({
      where: { reference: future.providerReference },
      data: { createdAt: new Date(Date.now() + 60000) },
    });
    await payments.reconcileContribution(future);
    expect(
      (await db.contribution.findUniqueOrThrow({ where: { id: future.id } }))
        .status,
    ).toBe('PENDING');
  });
  test('a successful transfer whose response times out is settled once by reference', async () => {
    const { p, c } = await fixture();
    await payments.reconcileContribution(c);
    const job = await payments.reservePayout(p.id);
    expect(job).toBeDefined();
    const send = provider.transfer.bind(provider);
    const spy = jest
      .spyOn(provider, 'transfer')
      .mockImplementation((r, a, n, note) =>
        send(r, a, n, note, 'transfer-timeout'),
      );
    await payments.processTransfer('payout', job!.id);
    expect(
      (await db.payout.findUniqueOrThrow({ where: { id: job!.id } })).status,
    ).toBe('UNKNOWN');
    await db.mockTransaction.update({
      where: { reference: job!.providerReference },
      data: { createdAt: new Date(Date.now() - 60000) },
    });
    await payments.processTransfer('payout', job!.id);
    await payments.processTransfer('payout', job!.id);
    spy.mockRestore();
    expect(
      await db.ledgerEntry.count({ where: { potId: p.id, type: 'PAYOUT' } }),
    ).toBe(1);
    expect(await db.$transaction((tx) => balance(tx, p.id))).toBe(0);
  });
  test('only a definite transfer failure retries with a fresh immutable reference', async () => {
    const { p, c } = await fixture();
    await payments.reconcileContribution(c);
    const job = await payments.reservePayout(p.id);
    const send = provider.transfer.bind(provider);
    let calls = 0;
    const spy = jest
      .spyOn(provider, 'transfer')
      .mockImplementation((r, a, n, note) =>
        send(r, a, n, note, ++calls === 1 ? 'transfer-fails' : 'success'),
      );
    await payments.processTransfer('payout', job!.id);
    await db.mockTransaction.update({
      where: { reference: job!.providerReference },
      data: { createdAt: new Date(Date.now() - 60000) },
    });
    await payments.processTransfer('payout', job!.id);
    expect(
      (await db.payout.findUniqueOrThrow({ where: { id: job!.id } })).status,
    ).toBe('QUEUED');
    await db.payout.update({
      where: { id: job!.id },
      data: { nextAttemptAt: new Date(0) },
    });
    await payments.processTransfer('payout', job!.id);
    const attempts = await db.transferAttempt.findMany({
      where: { jobId: job!.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(attempts).toHaveLength(2);
    expect(attempts[0].providerReference).not.toBe(
      attempts[1].providerReference,
    );
    await db.mockTransaction.update({
      where: { reference: attempts[1].providerReference },
      data: { createdAt: new Date(Date.now() - 60000) },
    });
    await payments.processTransfer('payout', job!.id);
    spy.mockRestore();
    expect(
      await db.ledgerEntry.count({ where: { potId: p.id, type: 'PAYOUT' } }),
    ).toBe(1);
  });
  test('individual refunds reserve once and prevent concurrent payouts from spending their funds', async () => {
    const { p, c } = await fixture();
    await payments.reconcileContribution(c);
    await Promise.all([
      payments.refundOne(p.id, c.id),
      payments.refundOne(p.id, c.id),
    ]);
    expect(await db.refund.count({ where: { contributionId: c.id } })).toBe(1);
    expect(await payments.reservePayout(p.id)).toBeUndefined();
    expect(await db.$transaction((tx) => balance(tx, p.id))).toBe(0);
  });
});
