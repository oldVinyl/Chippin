import { ProviderStatus } from '@chippin/shared';
export type Scenario =
  | 'success'
  | 'declined'
  | 'timeout'
  | 'delayed'
  | 'duplicate'
  | 'missing-callback'
  | 'transfer-fails'
  | 'transfer-timeout';
export interface ProviderResult {
  currency?: string;
  status: ProviderStatus;
  amountMinor?: number;
  party?: string;
  transactionId?: string;
  reason?: string;
  notFound?: boolean;
}
export abstract class PaymentProvider {
  abstract requestToPay(
    reference: string,
    amount: number,
    payerMsisdn: string,
    note: string,
    scenario?: string,
  ): Promise<void>;
  abstract getCollectionStatus(reference: string): Promise<ProviderResult>;
  abstract transfer(
    reference: string,
    amount: number,
    payeeMsisdn: string,
    note: string,
    scenario?: string,
  ): Promise<void>;
  abstract getTransferStatus(reference: string): Promise<ProviderResult>;
  abstract lookupAccountHolder(msisdn: string): Promise<string | null>;
}
