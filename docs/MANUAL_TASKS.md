# Manual tasks

The mock prototype works without external accounts. These tasks are required for public deployment, sandbox integration or live launch.

```text
ACTION NEEDED (YOU): Get MTN sandbox credentials
Why: Only your account can subscribe and issue subscription keys.
Steps:
  1. Open https://momodeveloper.mtn.com and choose Sign up; complete the account and email verification.
  2. Sign in, open Products, and subscribe to Collections and Disbursements. MTN’s Getting Started page links to the subscription guide.
  3. Open your profile’s subscriptions and copy each product’s primary subscription key into the matching variable in .env.
  4. Run ngrok http 4000. Put the printed HTTPS forwarding address plus /callbacks in MOMO_CALLBACK_URL.
  5. Run pnpm exec tsx scripts/momo-sandbox-setup.ts from the repository root.
  6. For local sandbox testing, run docker compose exec -T postgres psql -U chippin -d postgres -c "CREATE DATABASE chippin_sandbox". Set DATABASE_URL=postgresql://chippin:local_only_change_me@127.0.0.1:5434/chippin_sandbox, MOMO_MODE=sandbox and MOMO_CURRENCY=EUR in .env, then run pnpm dev. Create an organizer account and a new empty pot. Each database stays bound to one payment environment.
  7. Verify the operation paths and request schemas in MTN’s API reference, then make one collection and one transfer with test funds.
Where to put the result: .env variables MOMO_COLLECTION_SUBSCRIPTION_KEY, MOMO_DISBURSEMENT_SUBSCRIPTION_KEY, MOMO_CALLBACK_URL; the script fills product USER and API_KEY variables.
How to check it worked: GET /health shows mode sandbox; a test contribution resolves to SUCCESSFUL and exactly one CONTRIBUTION ledger entry; a transfer resolves by status GET. Sandbox does not send a real handset prompt.
```

Portal product documentation was checked; authenticated screen labels may vary. If subscriptions are unavailable, request sandbox access through MTN support. Do not paste keys into chat or commit them.

```text
ACTION NEEDED (YOU): Publish the web and API
Why: Vercel, Render and PostgreSQL hosting require your accounts and billing choices.
Steps:
  1. Create an empty GitHub repository. Run git remote add origin <your-repository-url>, then git push -u origin main. No Git remote is configured by this build.
  2. Create a PostgreSQL database in Neon or Supabase and copy its connection string with TLS enabled. Confirm the hosting region before using real personal data.
  3. In Render, choose New > Blueprint, connect the repository and select render.yaml. Set DATABASE_URL, PHONE_ENCRYPTION_KEY, PHONE_HASH_KEY, ADMIN_PASSWORD and DEMO_PASSWORD from your private environment values.
  4. In Vercel, choose Add New > Project, import the same repository, set Root Directory to apps/web, and use the tracked vercel.json commands. Add API_URL=<Render HTTPS URL> and NEXT_PUBLIC_WEB_URL=<your Vercel HTTPS URL>.
  5. In Render, set WEB_URL to the exact Vercel origin. Keep MOMO_MODE=mock for the demonstration without sandbox keys.
  6. In Render Shell, run pnpm seed once in mock mode. Seeding is blocked for sandbox/live to avoid fake balances on a real payment ledger.
  7. For sandbox, add both products’ environment credentials and MOMO_CALLBACK_URL=<Render URL>/callbacks; provision users for that callback host, then restart.
Where to put the result: hosting environment variables; record public URLs in docs/SUBMISSION_CHECKLIST.md.
How to check it worked: API /health returns ok; the web opens on a phone, AKWAABA loads in mock mode, login works, a contribution and payout resolve once, and QR links use the public origin.
```

```text
ACTION NEEDED (YOU): Connect SMS for public organizer sign-up
Why: The console SMS provider is development-only and does not deliver verification codes.
Steps:
  1. Create a Twilio account at https://www.twilio.com and open Console > Account Info for your Account SID and Auth Token.
  2. Obtain an approved SMS sender in the console; confirm Ghana delivery permissions and sender requirements with Twilio before launch.
  3. Set SMS_MODE=twilio, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM in the API hosting environment.
  4. Restart the API and sign up with your own Ghana mobile number. Trial accounts may require recipient verification first.
Where to put the result: API environment variables only; never NEXT_PUBLIC_ variables.
How to check it worked: The six-digit code arrives on your phone, verifies once and expires after ten minutes. Use the seeded verified organizer until this is ready.
```

```text
ACTION NEEDED (YOU): Replace placeholder artwork if you want final custom art
Why: The prototype includes original, working placeholder illustrations; no supplied artwork was available.
Steps:
  1. Open docs/ASSETS.md and replace the listed files under apps/web/public/images, keeping names and dimensions.
  2. Keep SVG illustrations under 200 KB, 1200x630 JPG covers under 200 KB, and PNG icons at their exact listed sizes.
  3. Run pnpm assets:check and pnpm --filter @chippin/web build.
Where to put the result: the exact paths in docs/ASSETS.md; update PLACEHOLDER labels once replaced.
How to check it worked: assets:check passes and the web displays every image and social preview without a broken link.
```

```text
ACTION NEEDED (YOU): Confirm Ghana data-controller registration
Why: Real operation requires a registration decision for the organization under Act 843.
Steps:
  1. Open https://app.dataprotection.org.gh and begin the organization registration workflow; contact the Data Protection Commission if an account or form is unavailable.
  2. Prepare organization identity, address, contact person, processing purpose, data categories, hosting locations and security safeguards using docs/PRIVACY_COMPLIANCE.md.
  3. Ask the Commission to confirm your fee category before paying. Its published schedule lists GH₵120 small, GH₵900 medium and GH₵1,800 large; financial institutions can fall in the large specialist category regardless of size.
  4. Submit the requested registration information and retain the receipt/certificate outside Git.
Where to put the result: private organizational records; record confirmation and certificate reference without personal details in docs/PRIVACY_COMPLIANCE.md.
How to check it worked: The Commission confirms registration and the appropriate category for Chippin’s intended activities.
```

Fee source checked 12 October 2026: https://dataprotection.org.gh/wp-content/uploads/2025/07/DPC-fees-and-charges.pdf. The authenticated registration flow was not accessible here; the steps do not invent hidden portal fields.

```text
ACTION NEEDED (YOU): Review policies and payment regulatory position
Why: Draft software policies and a hackathon submission do not authorize holding or moving live funds.
Steps:
  1. Give a Ghanaian lawyer apps/web/src/copy/en.ts, docs/PRIVACY_COMPLIANCE.md and the proposed deployment regions; ask them to review Privacy Policy, Terms, retention, child restrictions and cross-border safeguards.
  2. Open https://www.bog.gov.gh/fintech-innovation/ and use Book a Virtual Appointment or the licensing contact to describe collection, custody, payout and recovery flows.
  3. Ask MTN’s Ghana onboarding team to confirm the licensed-partner model, wallet settlement, permissions and permitted live use.
  4. Keep MOMO_MODE=mock or sandbox until the required written agreements and reviews are complete.
Where to put the result: reviewed policy copy in apps/web/src/copy/en.ts; non-sensitive review status in docs/PRIVACY_COMPLIANCE.md.
How to check it worked: Legal and provider reviews are recorded and the app accurately names its licensed partner before any live activation.
```

```text
ACTION NEEDED (YOU): Finish the hackathon submission
Why: The final entry and recording must be submitted from your participant account.
Steps:
  1. Follow docs/DEMO_SCRIPT.md and record a three-minute walkthrough using the public deployment.
  2. Capture the landing page, open pot, success receipt, dashboard and refund progress on a phone.
  3. Open the hackathon submission form, enter the repository and public web URLs, upload the requested video/screenshots and use docs/PITCH_NOTES.md for the description.
  4. Check the submission confirmation and deadline in the organizer’s portal. No deadline was supplied in the build prompt.
Where to put the result: docs/SUBMISSION_CHECKLIST.md for URLs and completion status; media files in your submission account.
How to check it worked: A judge can open the link without your laptop, follow the demo, and the portal shows the entry as submitted.
```
