import { Module } from '@nestjs/common';
import {
  AuthService,
  ConsoleSmsProvider,
  TwilioSmsProvider,
  SmsProvider,
} from './auth.service';
@Module({
  providers: [
    AuthService,
    ConsoleSmsProvider,
    TwilioSmsProvider,
    {
      provide: SmsProvider,
      useFactory: (
        consoleSms: ConsoleSmsProvider,
        twilio: TwilioSmsProvider,
      ) => (process.env.SMS_MODE === 'twilio' ? twilio : consoleSms),
      inject: [ConsoleSmsProvider, TwilioSmsProvider],
    },
  ],
  exports: [AuthService, SmsProvider],
})
export class AuthModule {}
