# MoMo integration notes

Checked against MTN’s public documentation on 12 October 2026. No credentials were available, so an actual sandbox request has not been verified.

Sources: [API user and key management](https://momodeveloper.mtn.com/content/html_widgets/ouv7x.html), [payment flow](https://momodeveloper.mtn.com/content/html_widgets/v98wn.html), [sandbox scenarios](https://momodeveloper.mtn.com/content/html_widgets/z0smm.html), [API reference](https://momodeveloper.mtn.com/API-collections).

Verified public documentation describes subscription keys, UUID API users, API keys, Basic authentication for token creation, cached Bearer tokens, asynchronous POST acceptance, and status queries by persisted reference. Callbacks have no guaranteed retry. Sandbox uses EUR and target environment `sandbox`.

The adapter uses collection `/token/`, `/v1_0/requesttopay` and `/v1_0/requesttopay/{reference}`; disbursement `/token/`, `/v1_0/transfer` and `/v1_0/transfer/{reference}`. Headers are Authorization, Ocp-Apim-Subscription-Key, X-Target-Environment, X-Reference-Id and optional X-Callback-Url. The portal’s dynamic operation reference could not be fully extracted in this session: confirm those operation paths and schemas through the portal and a credential-backed smoke test before calling sandbox integration complete. Provider `202` is not settlement; only a matching status GET creates ledger money.

Setup uses `/v1_0/apiuser` and `/v1_0/apiuser/{user}/apikey`. The callback hostname is registered during provisioning. Each product has separate credentials. Keys are written only to ignored `.env`, never printed. Keep the same callback host after provisioning or provision new API users for the new host.

MTN lists 46733123450 as failed, 46733123451 as rejected, 46733123453 as ongoing, and 46733123454 as delayed for request-to-pay. Other numbers return success in the simulator. Public forms validate Ghana numbers; use provider tests or the portal directly for these Swedish-format scenario numbers. The sandbox simulates outcomes and does not produce a real prompt on a Ghanaian phone.

Each provider reference is persisted before sending. Amount and reference updates are blocked in PostgreSQL. A callback body is only a hint; amount/recipient are compared against the status response. Mismatches remain unresolved and produce an admin audit event. A missing callback is handled by polling.

An unknown transfer is polled using its existing reference. Only a confirmed failed attempt creates a new reference after backoff; the attempt history preserves each immutable instruction. After three attempts the job is flagged for admin. Refund transfers are individual jobs, at most 20 per reconciler tick. A bulk refund endpoint is not assumed. The current implementation uses disbursement transfers for refunds.

Account-name lookup returns unsupported (`null`) until the specific account-information capability is enabled and verified. Entered payout names are declared by organizers and must not be presented as provider-verified names.

Outstanding jobs are reconciled on boot. Do not change MOMO_MODE with pending transactions: references belong to one environment. Keep polling after 24 hours and flag old unknowns for manual review rather than guessing failed. Live custody requires a licensed partner, wallet funding/settlement arrangements and a security review.
