import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  Sse,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { interval, from, switchMap, catchError, of } from 'rxjs';
import PDFDocument from 'pdfkit';
import { AuthService } from './auth/auth.service';
import { Db } from './db';
import { PaymentsService } from './payments/payments.service';
import { PotsService } from './pots/pots.service';
import { PrivacyService } from './privacy/privacy.service';
import {
  CallbackDto,
  ContributionDto,
  DataRequestDto,
  LoginDto,
  OtpDto,
  PotDto,
  ReportDto,
  SignupDto,
  VerifyDto,
  FulfillDataDto,
} from './pots/dto';
import { decrypt } from './security';
import { PublicIdempotency } from './idempotency';
import { encrypt, phoneHash } from './security';
import { normalizePhone } from '@chippin/shared';

@Controller()
export class PublicController {
  constructor(
    private readonly db: Db,
    private readonly pots: PotsService,
    private readonly payments: PaymentsService,
    private readonly privacy: PrivacyService,
    private readonly idempotency: PublicIdempotency,
  ) {}
  @Get('health') async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: 'ok', mode: process.env.MOMO_MODE ?? 'mock' };
  }
  @Get('pots/:code') pot(@Param('code') code: string) {
    return this.pots.publicPot(code);
  }
  @Post('pots/:code/contributions')
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  contribute(
    @Param('code') code: string,
    @Body() body: ContributionDto,
    @Headers('idempotency-key') key: string,
  ) {
    return this.payments.contribute(code.toUpperCase(), body, key);
  }
  @Get('contributions/:id') status(@Param('id') id: string) {
    return this.payments.status(id);
  }
  @Sse('pots/:code/events') events(@Param('code') code: string) {
    return interval(3000).pipe(
      switchMap(() =>
        from(this.pots.publicPot(code)).pipe(
          catchError(() => of({ unavailable: true })),
        ),
      ),
      switchMap((data) => of({ data })),
    );
  }
  @Sse('contributions/:id/events') paymentEvents(@Param('id') id: string) {
    return interval(3000).pipe(
      switchMap(() =>
        from(this.payments.status(id)).pipe(
          catchError(() => of({ unavailable: true })),
        ),
      ),
      switchMap((data) => of({ data })),
    );
  }
  @Post('callbacks/:reference') callback(
    @Param('reference') reference: string,
    @Body() _body: CallbackDto,
  ) {
    return this.payments.callback(reference);
  }
  @Post('pots/:code/report') async report(
    @Param('code') code: string,
    @Body() body: ReportDto,
    @Headers('idempotency-key') key: string,
  ) {
    await this.pots.publicPot(code);
    return this.idempotency.run(
      key,
      'report',
      { code, ...body },
      async (tx) => {
        await tx.report.create({
          data: { potCode: code, reason: body.reason },
        });
        return { received: true };
      },
    );
  }
  @Post('data-requests') request(
    @Body() body: DataRequestDto,
    @Headers('idempotency-key') key: string,
  ) {
    let phone: string;
    try {
      phone = normalizePhone(body.phone);
    } catch {
      throw new BadRequestException('Enter a valid Ghana mobile number.');
    }
    return this.idempotency.run(key, 'data-request', body, async (tx) => {
      const request = await tx.dataRequest.create({
        data: {
          emailEnc: encrypt(body.email),
          phoneHash: phoneHash(phone),
          kind: body.kind,
          details: body.details,
        },
      });
      return { reference: request.id };
    });
  }
}
@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60000 } })
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('signup') async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.signup(dto);
    return this.auth.session(user.id, res);
  }
  @Post('login') async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.login(dto);
    return this.auth.session(user.id, res);
  }
  @Get('me')
  @Throttle({ default: { limit: 90, ttl: 60000 } })
  async me(@Req() req: Request) {
    const u = await this.auth.user(req);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      verified: u.verificationStatus,
      phoneVerified: !!u.phoneVerifiedAt,
      isAdmin: u.isAdmin,
      csrf: u.csrf,
    };
  }
  @Post('logout') logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.logout(req, res);
  }
  @Post('otp') async otp(@Req() req: Request) {
    const u = await this.auth.user(req, true);
    await this.auth.sendOtp(u.id);
    return { sent: true };
  }
  @Post('otp/verify') async verify(@Req() req: Request, @Body() dto: OtpDto) {
    const u = await this.auth.user(req, true);
    return this.auth.verifyOtp(u.id, dto.code);
  }
}
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly auth: AuthService,
    private readonly pots: PotsService,
    private readonly payments: PaymentsService,
    private readonly db: Db,
  ) {}
  @Get('pots') async list(@Req() req: Request) {
    const u = await this.auth.user(req);
    return this.pots.dashboard(u.id);
  }
  @Get('pots/:id') async detail(@Req() req: Request, @Param('id') id: string) {
    const u = await this.auth.user(req);
    return this.pots.detail(id, u.id);
  }
  @Sse('pots/:id/events') events(@Req() req: Request, @Param('id') id: string) {
    return from(this.auth.user(req)).pipe(
      switchMap(() =>
        interval(5000).pipe(
          switchMap(() =>
            from(
              this.auth.user(req).then((user) => this.pots.detail(id, user.id)),
            ).pipe(catchError(() => of({ unavailable: true }))),
          ),
          switchMap((data) => of({ data })),
        ),
      ),
    );
  }
  @Post('pots') async create(@Req() req: Request, @Body() dto: PotDto) {
    const u = await this.auth.user(req, true);
    return this.pots.create(dto, u.id);
  }
  @Put('pots/:id') async edit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: PotDto,
  ) {
    const u = await this.auth.user(req, true);
    return this.pots.edit(id, dto, u.id);
  }
  @Post('pots/:id/close') async close(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const u = await this.auth.user(req, true);
    await this.pots.close(id, u.id);
    await this.payments.reservePayout(id);
    return { closed: true };
  }
  @Post('pots/:id/cancel') async cancel(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const u = await this.auth.user(req, true);
    await this.pots.owned(id, u.id);
    await this.db.audit(u.id, 'REFUNDS_REQUESTED', id);
    return this.payments.cancel(id);
  }
  @Post('verification') async verification(@Req() req: Request) {
    const u = await this.auth.user(req, true);
    if (!u.phoneVerifiedAt)
      throw new BadRequestException('Verify your phone first.');
    await this.db.organizer.update({
      where: { id: u.id },
      data: { verificationStatus: 'PENDING' },
    });
    return { submitted: true };
  }
  @Post('pots/:id/contributions/:cid/refund') async refund(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('cid') cid: string,
  ) {
    const user = await this.auth.user(req, true);
    await this.pots.owned(id, user.id);
    const result = await this.payments.refundOne(id, cid);
    await this.db.audit(user.id, 'CONTRIBUTION_REFUND_REQUESTED', cid);
    return result;
  }
  @Post('pots/:id/contributions/:cid/reveal') async reveal(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('cid') cid: string,
  ) {
    const u = await this.auth.user(req, true);
    return this.pots.reveal(id, cid, u.id);
  }
  @Get('pots/:id/export') async export(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('format') format: string,
  ) {
    const u = await this.auth.user(req);
    const data = await this.pots.detail(id, u.id);
    await this.db.audit(u.id, 'DONOR_BOOK_EXPORTED', id, {
      format: format ?? 'csv',
    });
    const rows = data.contributions.filter((c) =>
      ['SUCCESSFUL', 'REFUNDED'].includes(c.status),
    );
    if (format === 'pdf' || format === 'card') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="chippin-${format}.pdf"`,
      );
      const pdf = new PDFDocument({ margin: 48 });
      pdf.pipe(res);
      pdf
        .fontSize(28)
        .text(format === 'card' ? 'Thank you for chippin in.' : data.name);
      pdf.moveDown().fontSize(14).text(data.name);
      if (format === 'card')
        pdf
          .moveDown()
          .text(
            `${data.count} friends came together.\n${data.thankYouMessage}`,
          );
      else
        for (const c of rows)
          pdf
            .moveDown(0.5)
            .fontSize(11)
            .text(
              `${c.name} | ${(c.amountMinor / 100).toFixed(2)} ${data.currency} | ${c.at.toISOString().slice(0, 10)}\n${c.reference} | ${c.phone}`,
            );
      pdf.end();
      return;
    }
    const escape = (v: unknown) =>
      `"${String(v)
        .replace(/^\s*[=+@-]/, "'")
        .replace(/"/g, '""')}"`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="chippin-donor-book.csv"',
    );
    res.send(
      [
        'Name,Amount (minor units),Currency,Time,Reference,Phone',
        ...rows.map((c) =>
          [
            c.name,
            c.amountMinor,
            data.currency,
            c.at.toISOString(),
            c.reference,
            c.phone,
          ]
            .map(escape)
            .join(','),
        ),
      ].join('\r\n'),
    );
  }
}
@Controller('admin')
export class AdminController {
  constructor(
    private readonly auth: AuthService,
    private readonly db: Db,
    private readonly payments: PaymentsService,
    private readonly privacy: PrivacyService,
  ) {}
  private async admin(req: Request, mutation = false) {
    const u = await this.auth.user(req, mutation);
    if (!u.isAdmin) throw new ForbiddenException('Admin access required.');
    return u;
  }
  @Post('data-requests/:id/fulfill') async fulfill(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: FulfillDataDto,
  ) {
    const user = await this.admin(req, true);
    return this.privacy.fulfill(id, user.id, dto);
  }
  @Get() async overview(@Req() req: Request) {
    await this.admin(req);
    return {
      organizers: await this.db.organizer.findMany({
        where: {
          verificationStatus: { in: ['PENDING', 'UNVERIFIED', 'SUSPENDED'] },
        },
        select: { id: true, name: true, verificationStatus: true },
      }),
      reports: await this.db.report.findMany({ where: { resolved: false } }),
      failedPayouts: await this.db.payout.findMany({
        where: { status: { in: ['FAILED', 'UNKNOWN'] } },
      }),
      failedRefunds: await this.db.refund.findMany({
        where: { status: { in: ['FAILED', 'UNKNOWN'] } },
      }),
      unrecovered: await this.db.pot.findMany({
        where: { unrecovered: true },
        select: { id: true, name: true, code: true },
      }),
      requests: await this.db.dataRequest.findMany({
        select: { id: true, kind: true, status: true, createdAt: true },
      }),
      reconciliation: await this.db.auditLog.findMany({
        where: {
          action: {
            in: [
              'RECONCILIATION_RUN',
              'PAYMENT_MISMATCH',
              'TRANSFER_MISMATCH',
              'RECOVERY_MISMATCH',
            ],
          },
        },
        orderBy: { at: 'desc' },
        take: 20,
      }),
    };
  }
  @Post('organizers/:id/verify') async verify(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: VerifyDto,
  ) {
    const u = await this.admin(req, true);
    await this.db.organizer.update({
      where: { id },
      data: { verificationStatus: dto.status },
    });
    await this.db.audit(u.id, 'ORGANIZER_' + dto.status, id);
    return { updated: true };
  }
  @Post('pots/:code/suspend') async suspend(
    @Req() req: Request,
    @Param('code') code: string,
  ) {
    const u = await this.admin(req, true);
    const pot = await this.db.pot.update({
      where: { code },
      data: { suspended: true },
    });
    await this.db.audit(u.id, 'POT_SUSPENDED', pot.id);
    return { suspended: true };
  }
  @Post('reconcile') async reconcile(@Req() req: Request) {
    const u = await this.admin(req, true);
    await this.payments.reconcile();
    await this.db.audit(u.id, 'RECONCILIATION_RUN', 'system');
    return { complete: true };
  }
  @Post('transfers/:kind/:id/retry') async retry(
    @Req() req: Request,
    @Param('kind') kind: string,
    @Param('id') id: string,
  ) {
    const user = await this.admin(req, true);
    if (!['payout', 'refund'].includes(kind))
      throw new BadRequestException('Choose a payout or refund.');
    const result = await this.payments.retryTransfer(
      kind as 'payout' | 'refund',
      id,
    );
    await this.db.audit(user.id, 'TRANSFER_RETRY_REQUESTED', id, { kind });
    return result;
  }
  @Get('data-requests/:id') async data(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const u = await this.admin(req);
    const request = await this.db.dataRequest.findUniqueOrThrow({
      where: { id },
    });
    await this.db.audit(u.id, 'DATA_REQUEST_REVIEWED', id);
    return {
      id,
      email: decrypt(request.emailEnc),
      details: request.details,
      kind: request.kind,
      status: request.status,
    };
  }
}
