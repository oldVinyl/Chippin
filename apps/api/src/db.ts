import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class Db extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }
  async onModuleInit() {
    await this.$connect();
    const mode = process.env.MOMO_MODE ?? 'mock';
    await this.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext('chippin-payment-environment'))`;
      const setting = await tx.runtimeSetting.findUnique({
        where: { name: 'payment-mode' },
      });
      if (setting && setting.value !== mode)
        throw new Error(
          `This database is bound to ${setting.value} payments. Use a separate empty database for ${mode}; never reinterpret existing provider references.`,
        );
      await tx.runtimeSetting.upsert({
        where: { name: 'payment-mode' },
        create: { name: 'payment-mode', value: mode },
        update: {},
      });
    });
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
  async audit(
    actor: string,
    action: string,
    target: string,
    metadata: Prisma.InputJsonValue = {},
  ) {
    await this.auditLog.create({ data: { actor, action, target, metadata } });
  }
}
export async function lockPot(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "Pot" WHERE id = ${id} FOR UPDATE`;
}
export async function balance(tx: Prisma.TransactionClient, potId: string) {
  const entries = await tx.ledgerEntry.aggregate({
    where: { potId },
    _sum: { amountMinor: true },
  });
  const payouts = await tx.payout.aggregate({
    where: { potId, status: { in: ['QUEUED', 'SENT', 'UNKNOWN'] } },
    _sum: { amountMinor: true },
  });
  const refunds = await tx.refund.aggregate({
    where: {
      contribution: { potId },
      status: { in: ['QUEUED', 'SENT', 'UNKNOWN'] },
    },
    _sum: { amountMinor: true },
  });
  return (
    (entries._sum.amountMinor ?? 0) -
    (payouts._sum.amountMinor ?? 0) -
    (refunds._sum.amountMinor ?? 0)
  );
}
