import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { InfrastructureModule } from './infrastructure.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { PotsModule } from './pots/pots.module';
import { PrivacyModule } from './privacy/privacy.module';
import {
  AdminController,
  AuthController,
  DashboardController,
  PublicController,
} from './controllers';
@Module({
  imports: [
    InfrastructureModule,
    AuthModule,
    PaymentsModule,
    PotsModule,
    PrivacyModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 90 }]),
  ],
  controllers: [
    PublicController,
    AuthController,
    DashboardController,
    AdminController,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
