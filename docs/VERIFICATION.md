# Verification record

Local checks on 12 October 2026, Windows ARM, Node 22.15, PostgreSQL 17 in Docker:

- 43 Jest checks passed across money helpers, provider transport, environment binding and real PostgreSQL invariants.
- 10 Playwright checks passed using installed Chrome: desktop/mobile contribution success and decline, organizer login and creation, CSV download, admin gating, 320px layout and enlarged body text.
- Production Next.js build passed; API TypeScript build passed.
- Configured text/background pairs passed 4.5:1 contrast checks.
- Asset presence, dimensions and format checks passed.
- Dependency audit passed with no known vulnerabilities after patched transitive overrides.
- Final production Lighthouse mobile run: **performance 96, accessibility 100**, cumulative layout shift **0**. Raw report: `docs/lighthouse-final.json`. The first pass scored 91/100 before font/image sizing fixes (`docs/lighthouse.json`). This run is a local benchmark, not a hosted-network guarantee.
- Browser screenshot pass reported no page errors and no horizontal overflow on the tested pot page.

Not verified: actual MTN requests without subscription keys; hosted deployments without owner accounts; live SMS without credentials; a Ghanaian legal review; a physical handset/screen-reader review. Sandbox is a simulator and cannot satisfy a real handset-prompt claim.

The build does not claim live payment authorization. External setup is in MANUAL_TASKS.md. The optional user-uploaded cover workflow is not included; eight included presets are available. Product copy and more than 300 interface labels live in the copy directory. Terms are substituted centrally; a few dynamic status/help fragments should be reviewed before adding a second language.
