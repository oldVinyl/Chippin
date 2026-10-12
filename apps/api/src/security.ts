import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';

function key(name: string): Buffer {
  const value = process.env[name];
  if (!value || !/^[a-f0-9]{64}$/i.test(value))
    throw new Error(
      `${name} must contain 32 random bytes as hex. Run pnpm exec tsx scripts/local-setup.ts.`,
    );
  return Buffer.from(value, 'hex');
}
export function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key('PHONE_ENCRYPTION_KEY'), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((x) => x.toString('base64'))
    .join('.');
}
export function decrypt(value: string): string {
  const [iv, tag, data] = value.split('.').map((x) => Buffer.from(x, 'base64'));
  const cipher = createDecipheriv(
    'aes-256-gcm',
    key('PHONE_ENCRYPTION_KEY'),
    iv,
  );
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
}
export function phoneHash(value: string): string {
  return createHmac('sha256', key('PHONE_HASH_KEY'))
    .update(value)
    .digest('hex');
}
