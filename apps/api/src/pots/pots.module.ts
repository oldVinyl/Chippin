import { Module } from '@nestjs/common';
import { PotsService } from './pots.service';
@Module({ providers: [PotsService], exports: [PotsService] })
export class PotsModule {}
