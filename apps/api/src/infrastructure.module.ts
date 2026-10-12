import { Global, Module } from '@nestjs/common';
import { Db } from './db';
import { PublicIdempotency } from './idempotency';
@Global()
@Module({
  providers: [Db, PublicIdempotency],
  exports: [Db, PublicIdempotency],
})
export class InfrastructureModule {}
