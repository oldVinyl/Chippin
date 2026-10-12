import { parseMoney, providerMoney, normalizePhone, shareText } from '@chippin/shared';
import { MockProvider } from './mock';
import { encrypt, decrypt } from '../security';
process.env.PHONE_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.PHONE_HASH_KEY = 'b'.repeat(64);

describe('money and identity boundaries', () => {
  test('pesewas are parsed without floating point rounding', () => {
    expect(parseMoney('0.29')).toBe(29); expect(providerMoney(1029)).toBe('10.29');
    for (const bad of ['1.234','-1','1e3','NaN']) expect(() => parseMoney(bad)).toThrow();
  });
  test('forgiving Ghana phone input', () => {
    for (const number of ['024 123 4567','0241234567','+233241234567']) expect(normalizePhone(number)).toBe('233241234567');
  });
  test('encryption authenticates ciphertext', () => {
    const sealed = encrypt('233241234567'); expect(sealed).not.toContain('233'); expect(decrypt(sealed)).toBe('233241234567');
    expect(() => decrypt(sealed.slice(0,-3) + 'xxx')).toThrow();
  });
  test('share copy is exact', () => expect(shareText('Ama','https://x/p/AMA')).toBe('Chip In with Ama!\n\nhttps://x/p/AMA\n\nNote: Please verify the room/organizer/org name to ensure that you are not getting scammed by malicious actors.'));
});
describe('mock provider failure injection', () => {
  const records = new Map<string, any>();
  const db = { mockTransaction: { upsert: async ({ where, create }: any) => { if (!records.has(where.reference)) records.set(where.reference, { ...create, createdAt: new Date(Date.now()-60000) }); return records.get(where.reference); }, findUnique: async ({ where }: any) => records.get(where.reference) } };
  const provider = new MockProvider(db as any);
  test.each(['success','delayed','duplicate','missing-callback','transfer-timeout'])('%s resolves by status', async scenario => {
    try { await provider.transfer(scenario, 1000, '233241234567', 'test', scenario); } catch {}
    expect((await provider.getTransferStatus(scenario)).status).toBe('SUCCESSFUL');
  });
  test.each(['declined','transfer-fails'])('%s confirms failure', async scenario => {
    await provider.transfer(scenario,1000,'233241234567','test',scenario);
    expect((await provider.getTransferStatus(scenario)).status).toBe('FAILED');
  });
  test('timeout never guesses failed', async () => {
    await expect(provider.requestToPay('timeout',1000,'233241234567','test','timeout')).rejects.toThrow();
    expect((await provider.getCollectionStatus('timeout')).status).toBe('PENDING');
  });
  test('references cannot change amount or recipient', async () => {
    await provider.transfer('immutable',1000,'233241234567','test');
    await expect(provider.transfer('immutable',2000,'233241234567','test')).rejects.toThrow('Reference reuse');
    await expect(provider.transfer('immutable',1000,'233241234568','test')).rejects.toThrow('Reference reuse');
  });
});
