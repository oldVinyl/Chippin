import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PaymentsService } from './payments/payments.service';
config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
config({ quiet: true });
async function main() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.use((req: any, res: any, next: any) => {
    const requestId = randomUUID();
    const started = Date.now();
    res.setHeader('X-Request-Id', requestId);
    res.on('finish', () =>
      console.log(
        JSON.stringify({
          requestId,
          method: req.method,
          status: res.statusCode,
          durationMs: Date.now() - started,
        }),
      ),
    );
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      !req.path.startsWith('/callbacks/')
    ) {
      const origin = req.headers.origin;
      if (origin && origin !== (process.env.WEB_URL ?? 'http://localhost:3000'))
        return res
          .status(403)
          .json({ message: 'Request origin is not allowed.' });
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 4000), '0.0.0.0');
  await app.get(PaymentsService).reconcile();
}
void main();
