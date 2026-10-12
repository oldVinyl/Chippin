# Privacy review checklist — draft

Review source: [Data Protection Act, 2012, Act 843](https://dataprotection.org.gh/wp-content/uploads/2025/05/Data-Protection-Act-2012-Act-843.pdf). This is an engineering checklist, not a legal determination.

| Principle / area              | Implementation                                                                             | Before live launch                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Accountability                | Registration manual task, admin audit events, breach runbook                               | Confirm controller identity, DPC category and registration       |
| Lawfulness and consent        | Unticked required checkbox, consent timestamp/version, signup Terms audit                  | Counsel confirms lawful bases and wording                        |
| Purpose specification         | Payments, donor book, refunds and disputes only                                            | Publish actual controller contact and purposes                   |
| Minimality                    | Optional name/message, required MoMo number and transaction details; no PIN                | Review any future analytics or uploads                           |
| Compatible further processing | No marketing use or tracking                                                               | Obtain review before adding secondary uses                       |
| Quality and correction        | Identity-verified admin correction tool; financial recipient stays immutable               | Establish verified correction procedure                          |
| Openness                      | Plain-language privacy and terms pages marked draft                                        | Replace draft with reviewed policy and controller address        |
| Security safeguards           | AES-256-GCM numbers; HMAC lookup; Argon2; cookie sessions; CSRF; rate limits               | Penetration review, credential access policy, backups, alerts    |
| Data subject participation    | Request form, audit-logged admin review, access file, correction and anonymization         | Establish response deadlines and secure delivery process         |
| Retention                     | Daily 03:00 job; 24 months after closure and settlement; unresolved refunds block deletion | Confirm statutory financial retention and dispute holds          |
| Anonymity                     | Anonymous names excluded from public book and exports; numbers retained for refunds        | Confirm notices explain that anonymity is not backend deletion   |
| Children                      | 18+ Terms and contribution confirmation                                                    | Counsel reviews age assurance needs                              |
| Cross-border safeguards       | No runtime remote fonts or trackers; external payment/SMS providers receive necessary data | Record Render, Vercel, database and SMS locations and safeguards |

Unresolved pots/payments/refunds block personal-number deletion because the original recipient must remain available for refunds. The admin tells the requester why and retries after settlement. Financial ledger entries are never deleted. Exports are private and must be delivered only after out-of-band identity verification; the app does not email them automatically.

Controller registration: **pending**. Lawyer review: **pending**. Licensed-payment partnership: **pending**. Hosting regions: **not selected**. Provider contracts: **pending**. No license claim is made.

Key rotation: back up existing encrypted records and keys in a restricted secrets manager. During a maintenance window, decrypt each phone using the old AES key and re-encrypt with a new key; verify authentication tags and counts before switching. Rotate the HMAC key by recomputing all hashes from decrypted values in a single coordinated maintenance window. Never regenerate keys on an existing database without migrating its records. Versioned key rings should be added before routine production rotation.
