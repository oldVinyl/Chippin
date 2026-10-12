# Decisions

- The specified Next.js / NestJS / PostgreSQL stack takes priority over alternative website hosting runtimes.
- PostgreSQL is required even in mock mode. Mock refers to the payment rail, never to ledger persistence.
- Transactions serialize per pot through a PostgreSQL row lock. Outstanding payouts and refunds reserve funds through persisted jobs; settled transfers create one negative ledger entry.
- Unknown outcomes remain pending until a provider status check confirms a terminal result.
- Public status links use unguessable UUIDs. Public endpoints never return phone numbers.
- GHS is displayed in mock mode. Sandbox shows EUR explicitly; no conversion is implied.
- Provider mode cannot be switched with outstanding jobs without operator reconciliation.
- The database records its payment environment on first API startup. A different MOMO_MODE is refused; sandbox and live use separate databases so demo balances can never become real payout instructions.
- The local handoff uses a fresh chippin_demo database with only the two seeded pots. Earlier invariant-test records remain preserved in the original chippin database; no ledger entries were rewritten or deleted to clean the demo.
- Prisma uses the PostgreSQL driver adapter because the default query-engine library does not support this Windows ARM runtime. The migration CLI remains Prisma 6.19.
- Confirmed transfer failures retain their failed attempt and create a new UUID for retry. Unknown outcomes never change reference. Reservations stay held during backoff; after exhaustion an admin reviews and explicitly retries.
- Refund accounting includes recovered organizer funds: payouts plus refunds must not exceed contributions plus confirmed recoveries. Without this distinction, a legitimate post-payout refund would violate the prompt’s simplified invariant.
- Individual refunds use available unreserved funds. When funds have already left the pot, the organizer cancels the pot to initiate the recovery flow.

## Discretionary changes

- Warm editorial layouts, cookie illustrations, open sections and filled surfaces.
- Packaged Fontsource fonts loaded through next/font/local avoid build-time Google requests.
- Live mode requires LIVE_PAYMENTS_ENABLED=true as well as environment-specific credentials.
- Local PostgreSQL uses 127.0.0.1 to avoid a Windows IPv6 loopback connection issue.
- The session lookup endpoint has its own read rate limit; it does not inherit the strict login/OTP limit.
- Next.js uses separate development and production output directories to keep preview and Lighthouse runs independent.
- Local fonts use optional display to prevent late font swaps on slow connections. Matching hero SVG dimensions reserve the correct image space; the final Lighthouse run measured zero layout shift.
- Product copy is in copy/en.ts; shared labels are in copy/interface.ts. The noun substitution helper uses terms.ts so the Pot naming can change without searching page files.
