import { MomoProvider } from './momo';
const response = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status });
describe('MTN transport failure matrix', () => {
  const original = global.fetch;
  beforeEach(() => {
    for (const product of ['COLLECTION', 'DISBURSEMENT']) {
      process.env[`MOMO_${product}_USER`] = 'test-user';
      process.env[`MOMO_${product}_API_KEY`] = 'test-key';
      process.env[`MOMO_${product}_SUBSCRIPTION_KEY`] = 'test-subscription';
    }
    process.env.MOMO_CURRENCY = 'EUR';
  });
  afterEach(() => {
    global.fetch = original;
  });
  test.each([400, 403, 500, 503])(
    'HTTP %s never supplies a guessed terminal status',
    async (code) => {
      const fetcher = jest
        .fn()
        .mockResolvedValueOnce(
          response(200, { access_token: 'token', expires_in: 3600 }),
        )
        .mockResolvedValueOnce(response(code));
      global.fetch = fetcher;
      const provider = new MomoProvider();
      await expect(
        provider.requestToPay('ref', 29, '233241234567', 'test'),
      ).rejects.toThrow(`HTTP ${code}`);
      const sent = JSON.parse(fetcher.mock.calls[1][1].body);
      expect(sent.amount).toBe('0.29');
      expect(sent.currency).toBe('EUR');
    },
  );
  test('token expiry retries once with the same immutable reference', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(
        response(200, { access_token: 'old', expires_in: 3600 }),
      )
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(
        response(200, { access_token: 'new', expires_in: 3600 }),
      )
      .mockResolvedValueOnce(response(202));
    global.fetch = fetcher;
    await new MomoProvider().transfer(
      'immutable-ref',
      1000,
      '233241234567',
      'test',
    );
    expect(fetcher.mock.calls[1][1].headers['X-Reference-Id']).toBe(
      'immutable-ref',
    );
    expect(fetcher.mock.calls[3][1].headers['X-Reference-Id']).toBe(
      'immutable-ref',
    );
  });
  test('valid cached token is reused and clock skew refreshes an expiring token', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(
        response(200, { access_token: 'short', expires_in: 30 }),
      )
      .mockResolvedValueOnce(response(202))
      .mockResolvedValueOnce(
        response(200, { access_token: 'long', expires_in: 3600 }),
      )
      .mockResolvedValueOnce(response(202))
      .mockResolvedValueOnce(response(202));
    global.fetch = fetcher;
    const provider = new MomoProvider();
    await provider.requestToPay('one', 100, '233241234567', 'test');
    await provider.requestToPay('two', 100, '233241234567', 'test');
    await provider.requestToPay('three', 100, '233241234567', 'test');
    expect(fetcher).toHaveBeenCalledTimes(5);
  });
  test('network timeout remains an error for reconciliation, never FAILED', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(
        response(200, { access_token: 'token', expires_in: 3600 }),
      )
      .mockRejectedValueOnce(new Error('timeout'));
    global.fetch = fetcher;
    await expect(
      new MomoProvider().transfer('ref', 100, '233241234567', 'test'),
    ).rejects.toThrow('timeout');
  });
  test('a missing reference is pending and a status includes expected identity', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(
        response(200, { access_token: 'token', expires_in: 3600 }),
      )
      .mockResolvedValueOnce(response(404))
      .mockResolvedValueOnce(
        response(200, {
          status: 'SUCCESSFUL',
          amount: '12.34',
          currency: 'EUR',
          payer: { partyId: '233241234567' },
          financialTransactionId: 'mtn-id',
        }),
      );
    global.fetch = fetcher;
    const provider = new MomoProvider();
    expect(await provider.getCollectionStatus('missing')).toEqual({
      status: 'PENDING',
      notFound: true,
    });
    expect(await provider.getCollectionStatus('found')).toMatchObject({
      status: 'SUCCESSFUL',
      amountMinor: 1234,
      party: '233241234567',
      currency: 'EUR',
    });
  });
  test('unrecognized provider statuses are rejected', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        response(200, { access_token: 'token', expires_in: 3600 }),
      )
      .mockResolvedValueOnce(response(200, { status: 'MAYBE' }));
    await expect(new MomoProvider().getCollectionStatus('ref')).rejects.toThrow(
      'Unrecognized',
    );
  });
});
