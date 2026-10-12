import { Injectable } from '@nestjs/common';
import { Db } from '../db';
import { decrypt, encrypt, phoneHash } from '../security';
import { PaymentProvider, ProviderResult } from './provider';

@Injectable()
export class MockProvider extends PaymentProvider {
  constructor(private readonly db: Db) { super(); }
  private async send(reference: string, amountMinor: number, party: string, kind: string, scenario = 'success') {
    const record = await this.db.mockTransaction.upsert({ where: { reference }, create: { reference, amountMinor, partyEnc: encrypt(party), partyHash: phoneHash(party), kind, scenario }, update: {} });
    if (record.amountMinor !== amountMinor || record.partyHash !== phoneHash(party) || record.kind !== kind) throw new Error('Reference reuse rejected');
    if (['timeout','transfer-timeout'].includes(scenario)) throw new Error('Provider response timed out');
  }
  requestToPay(ref: string, amount: number, party: string, _note: string, scenario?: string) { return this.send(ref, amount, party, 'collection', scenario); }
  transfer(ref: string, amount: number, party: string, _note: string, scenario?: string) { return this.send(ref, amount, party, 'transfer', scenario); }
  private async status(reference: string): Promise<ProviderResult> {
    const record = await this.db.mockTransaction.findUnique({ where: { reference } });
    if (!record) return { status: 'PENDING', notFound: true };
    const elapsed = Date.now() - record.createdAt.getTime();
    const delay = record.scenario === 'delayed' ? 45000 : 3500;
    const status = record.scenario === 'timeout' || elapsed < delay ? 'PENDING' : ['declined','transfer-fails'].includes(record.scenario) ? 'FAILED' : 'SUCCESSFUL';
    return { status, amountMinor: record.amountMinor, party: decrypt(record.partyEnc), transactionId: `mock-${reference}`, reason: status === 'FAILED' ? 'The payment was declined.' : undefined };
  }
  getCollectionStatus(ref: string) { return this.status(ref); }
  getTransferStatus(ref: string) { return this.status(ref); }
  async lookupAccountHolder(_msisdn: string) { return null; }
}
