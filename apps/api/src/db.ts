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
