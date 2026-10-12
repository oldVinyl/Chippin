import { Injectable } from '@nestjs/common';
import { parseMoney, providerMoney } from '@chippin/shared';
import { PaymentProvider, ProviderResult } from './provider';

@Injectable()
export class MomoProvider extends PaymentProvider {
  private tokens = new Map<string, { value: string; expires: number }>();
  private base =
    process.env.MOMO_BASE_URL ?? 'https://sandbox.momodeveloper.mtn.com';
  private config(product: string, suffix: string) {
    const value = process.env[`MOMO_${product.toUpperCase()}_${suffix}`];
    if (!value) throw new Error(`Missing MoMo ${product} ${suffix}`);
    return value;
  }
  private async token(product: string): Promise<string> {
    const cached = this.tokens.get(product);
    if (cached && cached.expires > Date.now() + 60000) return cached.value;
    const response = await fetch(`${this.base}/${product}/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.config(product, 'USER')}:${this.config(product, 'API_KEY')}`).toString('base64')}`,
        'Ocp-Apim-Subscription-Key': this.config(product, 'SUBSCRIPTION_KEY'),
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`MoMo token HTTP ${response.status}`);
    const body = await response.json();
    this.tokens.set(product, {
      value: body.access_token,
      expires: Date.now() + body.expires_in * 1000,
    });
    return body.access_token;
  }
  private async call(
    product: string,
    path: string,
    method = 'GET',
    reference?: string,
    body?: object,
    retried = false,
  ): Promise<Response> {
    const response = await fetch(`${this.base}/${product}/${path}`, {
      method,
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${await this.token(product)}`,
        'Ocp-Apim-Subscription-Key': this.config(product, 'SUBSCRIPTION_KEY'),
        'X-Target-Environment': process.env.MOMO_ENVIRONMENT ?? 'sandbox',
        'Content-Type': 'application/json',
        ...(reference ? { 'X-Reference-Id': reference } : {}),
        ...(body && process.env.MOMO_CALLBACK_URL
          ? {
              'X-Callback-Url': `${process.env.MOMO_CALLBACK_URL}/${reference}`,
            }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 401 && !retried) {
      this.tokens.delete(product);
      return this.call(product, path, method, reference, body, true);
    }
    return response;
  }
  private async send(
    product: string,
    path: string,
    reference: string,
    amount: number,
    party: string,
    note: string,
    field: string,
  ) {
    const response = await this.call(product, path, 'POST', reference, {
      amount: providerMoney(amount),
      currency: process.env.MOMO_CURRENCY ?? 'EUR',
      externalId: reference,
      [field]: { partyIdType: 'MSISDN', partyId: party },
      payerMessage: note.slice(0, 100),
      payeeNote: note.slice(0, 100),
    });
    // A transport/HTTP error is ambiguous. The caller persists pending state and queries this reference.
    if (response.status !== 202 && response.status !== 409)
      throw new Error(`MoMo submission HTTP ${response.status}`);
  }
  requestToPay(ref: string, amount: number, party: string, note: string) {
    return this.send(
      'collection',
      'v1_0/requesttopay',
      ref,
      amount,
      party,
      note,
      'payer',
    );
  }
  transfer(ref: string, amount: number, party: string, note: string) {
    return this.send(
      'disbursement',
      'v1_0/transfer',
      ref,
      amount,
      party,
      note,
      'payee',
    );
  }
  private async status(product: string, path: string): Promise<ProviderResult> {
    const response = await this.call(product, path);
    if (response.status === 404) return { status: 'PENDING', notFound: true };
    if (!response.ok) throw new Error(`MoMo status HTTP ${response.status}`);
    const body = await response.json();
    if (!['SUCCESSFUL', 'FAILED', 'PENDING'].includes(body.status))
      throw new Error('Unrecognized provider status');
    return {
      currency: body.currency,
      status: body.status,
      amountMinor:
        body.amount === undefined ? undefined : parseMoney(String(body.amount)),
      party: (body.payer ?? body.payee)?.partyId,
      transactionId: body.financialTransactionId,
      reason: body.reason?.code ?? 'Payment declined',
    };
  }
  getCollectionStatus(ref: string) {
    return this.status('collection', `v1_0/requesttopay/${ref}`);
  }
  getTransferStatus(ref: string) {
    return this.status('disbursement', `v1_0/transfer/${ref}`);
  }
  async lookupAccountHolder(_msisdn: string) {
    return null;
  }
}
