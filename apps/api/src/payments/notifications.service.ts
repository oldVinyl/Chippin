import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Db } from '../db';
import { SmsProvider } from '../auth/auth.service';
import { decrypt } from '../security';
@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: Db,
    private readonly sms: SmsProvider,
  ) {}
  @Interval(60000)
  async sendRefundNotices() {
    if (process.env.SMS_MODE !== 'twilio') return;
    await this.db.notification.updateMany({
      where: {
        status: 'SENDING',
        updatedAt: { lt: new Date(Date.now() - 300000) },
      },
      data: { status: 'QUEUED' },
    });
    for (const job of await this.db.notification.findMany({
      where: { status: 'QUEUED', attempts: { lt: 3 } },
      take: 10,
    })) {
      const c = await this.db.contribution.findUnique({
        where: { id: job.contributionId },
      });
      if (!c?.msisdnEnc) {
        await this.db.notification.update({
          where: { id: job.id },
          data: { status: 'CANCELLED' },
        });
        continue;
      }
      const claimed = await this.db.notification.updateMany({
        where: { id: job.id, status: 'QUEUED' },
        data: { status: 'SENDING', attempts: { increment: 1 } },
      });
      if (!claimed.count) continue;
      try {
        await this.sms.send(
          decrypt(c.msisdnEnc),
          `Chippin: your contribution was refunded to this MoMo account. Receipt: ${c.providerReference}. We never ask for your PIN.`,
        );
        await this.db.notification.update({
          where: { id: job.id },
          data: { status: 'ACCEPTED' },
        });
      } catch {
        await this.db.notification.update({
          where: { id: job.id },
          data: { status: job.attempts + 1 >= 3 ? 'FAILED' : 'QUEUED' },
        });
      }
    }
  }
}
