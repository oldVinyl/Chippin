# Decisions

- The specified Next.js / NestJS / PostgreSQL stack takes priority over alternative website hosting runtimes.
- PostgreSQL is required even in mock mode. Mock refers to the payment rail, never to ledger persistence.
- Transactions serialize per pot through a PostgreSQL row lock. Outstanding payouts and refunds reserve funds through persisted jobs; settled transfers create one negative ledger entry.
- Unknown outcomes remain pending until a provider status check confirms a terminal result.
- Public status links use unguessable UUIDs. Public endpoints never return phone numbers.
- GHS is displayed in mock mode. Sandbox shows EUR explicitly; no conversion is implied.
- Provider mode cannot be switched with outstanding jobs without operator reconciliation.

## Discretionary changes

- Warm editorial layouts, cookie illustrations, open sections and filled surfaces.
- Packaged Fontsource fonts loaded through next/font/local avoid build-time Google requests.
- Live mode requires LIVE_PAYMENTS_ENABLED=true as well as environment-specific credentials.
