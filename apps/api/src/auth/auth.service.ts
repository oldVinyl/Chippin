import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomInt, createHash } from 'node:crypto';
import * as argon2 from '@node-rs/argon2';
import { Request, Response } from 'express';
import { normalizePhone } from '@chippin/shared';
import { Db } from '../db';
import { decrypt, encrypt, phoneHash } from '../security';
import { LoginDto, SignupDto } from '../pots/dto';

export abstract class SmsProvider {
  abstract send(phone: string, message: string): Promise<void>;
}
@Injectable()
export class ConsoleSmsProvider extends SmsProvider {
  async send(_phone: string, message: string) {
    if (process.env.NODE_ENV === 'production')
      throw new Error(
        'Console SMS is development only. Connect a real SMS provider.',
      );
    console.log(`[development SMS] ${message}`);
  }
}
@Injectable()
export class TwilioSmsProvider extends SmsProvider {
  async send(phone: string, message: string) {
    const sid = process.env.TWILIO_ACCOUNT_SID,
      token = process.env.TWILIO_AUTH_TOKEN,
      sender = process.env.TWILIO_FROM;
    if (!sid || !token || !sender)
      throw new Error('Twilio credentials and sender are required.');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: `+${phone}`,
          From: sender,
          Body: message,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw new Error(`SMS submission HTTP ${response.status}`);
  }
}
@Injectable()
export class AuthService {
  constructor(
    private readonly db: Db,
    private readonly sms: SmsProvider,
  ) {}
  async signup(dto: SignupDto) {
    let phone: string;
    try {
      phone = normalizePhone(dto.phone);
    } catch {
      throw new BadRequestException('Enter a valid Ghana mobile number.');
    }
    const existing = await this.db.organizer.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          { phoneHash: phoneHash(phone) },
        ],
      },
    });
    if (existing)
      throw new BadRequestException(
        'An account with these details already exists. Please sign in.',
      );
    const user = await this.db.organizer.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        phoneEnc: encrypt(phone),
        phoneHash: phoneHash(phone),
        passwordHash: await argon2.hash(dto.password),
      },
    });
    await this.sendOtp(user.id);
    await this.db.audit(user.id, 'TERMS_ACCEPTED', user.id, {
      version: '2026-10-12',
    });
    return user;
  }
  async login(dto: LoginDto) {
    const user = await this.db.organizer.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password)))
      throw new UnauthorizedException('The email or password is incorrect.');
    if (user.verificationStatus === 'SUSPENDED')
      throw new UnauthorizedException('This account is suspended.');
    return user;
  }
  async session(userId: string, res: Response) {
    const token = randomBytes(32).toString('base64url');
    const csrf = randomBytes(32).toString('base64url');
    await this.db.session.create({
      data: {
        id: createHash('sha256').update(token).digest('hex'),
        organizerId: userId,
        csrf,
        expiresAt: new Date(Date.now() + 86400000 * 7),
      },
    });
    res.cookie('chippin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400000 * 7,
      path: '/',
    });
    return { csrf };
  }
  async user(req: Request, mutation = false) {
    const raw = req.cookies?.chippin_session;
    if (!raw) throw new UnauthorizedException('Please sign in.');
    const session = await this.db.session.findUnique({
      where: { id: createHash('sha256').update(raw).digest('hex') },
      include: { organizer: true },
    });
    if (
      !session ||
      session.expiresAt < new Date() ||
      session.organizer.verificationStatus === 'SUSPENDED'
    )
      throw new UnauthorizedException('Please sign in again.');
    if (mutation && req.headers['x-csrf-token'] !== session.csrf)
      throw new UnauthorizedException('Refresh the page and try again.');
    return { ...session.organizer, csrf: session.csrf };
  }
  async logout(req: Request, res: Response) {
    await this.user(req, true);
    await this.db.session.deleteMany({
      where: {
        id: createHash('sha256')
          .update(req.cookies.chippin_session)
          .digest('hex'),
      },
    });
    res.clearCookie('chippin_session', { path: '/' });
    return { signedOut: true };
  }
  async sendOtp(userId: string) {
    const previous = await this.db.otp.findUnique({
      where: { organizerId: userId },
    });
    if (previous && previous.expiresAt.getTime() > Date.now() + 540000)
      throw new BadRequestException(
        'Wait a minute before requesting another code.',
      );
    const user = await this.db.organizer.findUniqueOrThrow({
      where: { id: userId },
    });
    const code = String(randomInt(100000, 1000000));
    await this.db.otp.upsert({
      where: { organizerId: userId },
      create: {
        organizerId: userId,
        hash: await argon2.hash(code),
        expiresAt: new Date(Date.now() + 600000),
      },
      update: {
        hash: await argon2.hash(code),
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      },
    });
    await this.sms.send(
      decrypt(user.phoneEnc),
      `Your Chippin code is ${code}. It expires in 10 minutes.`,
    );
  }
  async verifyOtp(userId: string, code: string) {
    const otp = await this.db.otp.findUnique({
      where: { organizerId: userId },
    });
    if (!otp || otp.expiresAt < new Date() || otp.attempts >= 5)
      throw new BadRequestException(
        'This code has expired. Request a new one.',
      );
    const claimed = await this.db.otp.updateMany({
      where: { organizerId: userId, attempts: { lt: 5 } },
      data: { attempts: { increment: 1 } },
    });
    if (!claimed.count || !(await argon2.verify(otp.hash, code)))
      throw new BadRequestException(
        'That code does not match. Please try again.',
      );
    await this.db.$transaction([
      this.db.organizer.update({
        where: { id: userId },
        data: { phoneVerifiedAt: new Date() },
      }),
      this.db.otp.delete({ where: { organizerId: userId } }),
    ]);
    return { verified: true };
  }
}
