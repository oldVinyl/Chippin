import { config } from 'dotenv';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from '@node-rs/argon2';
import { encrypt, phoneHash } from '../src/security';
config({ path: resolve(__dirname, '../../../.env'), quiet: true });
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function seed() {
  if (process.env.MOMO_MODE && process.env.MOMO_MODE !== 'mock') {
    console.log(
      'Skipping demo seed outside mock mode. Create a fresh pot for sandbox or live testing.',
    );
    return;
  }
  if (!process.env.ADMIN_PASSWORD || !process.env.DEMO_PASSWORD)
    throw new Error('Set ADMIN_PASSWORD and DEMO_PASSWORD in .env.');
  const binding = await db.runtimeSetting.findUnique({
    where: { name: 'payment-mode' },
  });
  if (binding && binding.value !== 'mock')
    throw new Error(
      'Never seed fake balances into a sandbox or live database. Use a separate mock database.',
    );
  await db.organizer.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? 'admin@chippin.local' },
    create: {
      name: 'Chippin Admin',
      email: process.env.ADMIN_EMAIL ?? 'admin@chippin.local',
      phoneEnc: encrypt('233241000001'),
      phoneHash: phoneHash('233241000001'),
      passwordHash: await hash(process.env.ADMIN_PASSWORD),
      isAdmin: true,
      phoneVerifiedAt: new Date(),
      verificationStatus: 'VERIFIED',
    },
    update: {},
  });
  const organizer = await db.organizer.upsert({
    where: { email: 'ama@chippin.local' },
    create: {
      name: 'Ama Mensah',
      email: 'ama@chippin.local',
      phoneEnc: encrypt('233241000002'),
      phoneHash: phoneHash('233241000002'),
      passwordHash: await hash(process.env.DEMO_PASSWORD),
      phoneVerifiedAt: new Date(),
      verificationStatus: 'VERIFIED',
    },
    update: {},
  });
  for (const [code, name, story, cover, target, status] of [
    [
      'AKWAABA',
      'A fresh start for Akwaaba School',
      'Our children have big dreams. They just need a little more room to grow.\n\nWe’re getting 20 new desks for the Primary 3 classroom and fixing the reading corner. Every contribution helps a child sit comfortably, open a book and feel ready to learn.\n\nThe school committee will share photos and receipts once the desks arrive. Thank you for being part of our village.',
      5,
      500000,
      'OPEN',
    ],
    [
      'TOGETHER',
      'A warm welcome for baby Esi',
      'Family and friends came together to help Adjoa and Kwame welcome their little girl. Thank you for the love, the kind words and the helping hands.',
      3,
      150000,
      'CLOSED',
    ],
  ] as const) {
    if (await db.pot.findUnique({ where: { code } })) continue;
    await db.$transaction(async (tx) => {
      const pot = await tx.pot.create({
        data: {
          code,
          slug: code.toLowerCase(),
          name,
          story,
          cover,
          targetMinor: target,
          organizerId: organizer.id,
          payoutMsisdnEnc: encrypt('233241000002'),
          payoutAccountName: 'Ama Mensah',
          payoutMode: 'ON_CLOSE',
          status,
          payoutLocked: true,
          closedAt: status === 'CLOSED' ? new Date() : null,
        },
      });
      const names = [
        'Kofi A.',
        'Akosua',
        'Esi & family',
        'Nana Yaw',
        'Anonymous friend',
        'Kwame',
        'Abena',
        'Uncle Kojo',
        'Afia',
        'Yaw B.',
        'Auntie Grace',
        'Selina',
        'Daniel',
        'Nii',
        'Akua',
        'Samuel',
        'Nana Ama',
        'Adjoa',
        'Joseph',
        'Maame',
        'Linda',
        'Michael',
        'Sena',
        'The Mensah family',
      ];
      const amounts =
        code === 'AKWAABA'
          ? [
              10000, 5000, 20000, 5000, 10000, 20000, 5000, 10000, 5000, 20000,
              10000, 5000, 10000, 5000, 10000, 10000, 10000, 10000, 5000, 10000,
              10000, 10000, 10000, 25000,
            ]
          : [50000, 50000, 50000];
      let total = 0;
      for (let i = 0; i < amounts.length; i++) {
        const phone = `23324${String(1200000 + i).padStart(7, '0')}`;
        const date = new Date(Date.now() - (amounts.length - i) * 14400000);
        const reference = randomUUID();
        const c = await tx.contribution.create({
          data: {
            potId: pot.id,
            displayName: i === 4 ? null : names[i],
            isAnonymous: i === 4,
            msisdnEnc: encrypt(phone),
            msisdnHash: phoneHash(phone),
            network: 'MTN',
            amountMinor: amounts[i],
            providerReference: reference,
            idempotencyKey: `seed-${code}-${i}`,
            requestHash: `seed-${code}-${i}`,
            status: 'SUCCESSFUL',
            consentAt: date,
            consentVersion: 'demo-seed',
            createdAt: date,
            settledAt: date,
            message:
              i === 2
                ? 'A little something for the next chapter.'
                : i === 7
                  ? 'For our children. With love.'
                  : null,
          },
        });
        await tx.ledgerEntry.create({
          data: {
            potId: pot.id,
            type: 'CONTRIBUTION',
            amountMinor: c.amountMinor,
            refType: 'contribution',
            refId: c.id,
            createdAt: date,
          },
        });
        total += c.amountMinor;
      }
      if (status === 'CLOSED') {
        const payout = await tx.payout.create({
          data: {
            potId: pot.id,
            amountMinor: total,
            providerReference: randomUUID(),
            status: 'SUCCESSFUL',
            attempts: 1,
          },
        });
        await tx.ledgerEntry.create({
          data: {
            potId: pot.id,
            type: 'PAYOUT',
            amountMinor: -total,
            refType: 'payout',
            refId: payout.id,
          },
        });
      }
    });
  }
  console.log(
    'Seed ready: AKWAABA (open), TOGETHER (paid out). Demo organizer: ama@chippin.local. Passwords are in .env.',
  );
}
seed().finally(() => db.$disconnect());
