export type ProviderStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';
export type PayoutMode = 'INSTANT' | 'SCHEDULED' | 'ON_CLOSE';
export function parseMoney(value: string): number {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value)) throw new Error('Use an amount with at most two decimal places.');
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function providerMoney(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error('Invalid money amount');
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}`;
}
export function formatMoney(minor: number, currency = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(minor / 100);
}
export function normalizePhone(input: string): string {
  const clean = input.replace(/[\s()-]/g, '').replace(/^\+/, '');
  const number = clean.startsWith('0') ? `233${clean.slice(1)}` : clean;
  if (!/^233[235]\d{8}$/.test(number)) throw new Error('Enter a Ghana mobile number, such as 024 123 4567.');
  return number;
}
export function networkFor(number: string): string {
  const prefix = normalizePhone(number).slice(3, 5);
  return ['24','25','53','54','55','59'].includes(prefix) ? 'MTN' : ['20','50'].includes(prefix) ? 'Telecel' : ['26','27','56','57'].includes(prefix) ? 'AT' : 'Mobile money';
}
export function maskPhone(number: string): string { return `0${number.slice(3, 5)} *** **${number.slice(-2)}`; }
export function shareText(name: string, link: string): string {
  return `Chip In with ${name}!\n\n${link}\n\nNote: Please verify the room/organizer/org name to ensure that you are not getting scammed by malicious actors.`;
}
