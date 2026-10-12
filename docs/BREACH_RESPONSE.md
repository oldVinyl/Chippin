# Breach response

1. Restrict access to the affected service. Freeze new payouts while preserving provider reconciliation for already-sent transfers. Do not edit or delete ledger entries.
2. Revoke exposed sessions and credentials. Capture timestamps, deployment revision and request IDs. Store forensic evidence in restricted storage; do not paste personal data into issues.
3. Assess what records and provider keys were exposed. Ask MTN to restrict compromised wallets/credentials; reconcile references against provider status.
4. Notify the named controller contact, legal counsel and the Data Protection Commission using the obligations/timeline confirmed by counsel. Inform affected people with factual, plain-language guidance.
5. Restore from a verified backup into isolated infrastructure, rotate secrets, patch the cause and run ledger reconciliation before reopening payments.
6. Record actions, impact and prevention work in a private incident record. Public communications must avoid blaming users or claiming unverified outcomes.

Controller contact and on-call owner must be named before live operation. No full phone numbers, OTPs, session cookies or provider tokens belong in application logs.
