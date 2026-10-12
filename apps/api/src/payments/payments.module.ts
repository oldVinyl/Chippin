import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentProvider } from './provider';
import { MockProvider } from './mock';
import { MomoProvider } from './momo';
import { AuthModule } from '../auth/auth.module';
import { NotificationsService } from './notifications.service';
@Module({
  imports: [AuthModule],
  providers: [
    PaymentsService,
    NotificationsService,
    MockProvider,
    MomoProvider,
    {
      provide: PaymentProvider,
      useFactory: (mock: MockProvider, momo: MomoProvider) => {
        const mode = process.env.MOMO_MODE ?? 'mock';
        if (!['mock', 'sandbox', 'live'].includes(mode))
          throw new Error('MOMO_MODE must be mock, sandbox or live.');
        if (mode === 'live' && process.env.LIVE_PAYMENTS_ENABLED !== 'true')
          throw new Error(
            'Live payments require reviewed deployment and LIVE_PAYMENTS_ENABLED=true',
          );
        return mode === 'mock' ? mock : momo;
      },
      inject: [MockProvider, MomoProvider],
    },
  ],
  exports: [PaymentsService, PaymentProvider],
})
export class PaymentsModule {}
