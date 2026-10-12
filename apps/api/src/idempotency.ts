import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { Db } from './db';
@Injectable()
export class PublicIdempotency {
  constructor(private readonly db: Db) {}
  async run(
    key: string,
    scope: string,
    body: unknown,
    operation: (tx: Prisma.TransactionClient) => Promise<Prisma.InputJsonValue>,
  ) {
    if (!key || key.length > 100)
      throw new BadRequestException(
        'A request key is required. Refresh and try again.',
      );
    const id = `${scope}:${key}`;
    const requestHash = createHash('sha256')
      .update(JSON.stringify(body))
      .digest('hex');
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${id}))`;
      const existing = await tx.publicRequest.findUnique({ where: { id } });
      if (existing) {
        if (existing.requestHash !== requestHash)
          throw new ConflictException(
            'This request key has already been used.',
          );
        return existing.response;
      }
      const response = await operation(tx);
      await tx.publicRequest.create({ data: { id, requestHash, response } });
      return response;
    });
  }
}
