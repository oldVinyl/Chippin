# Three-minute demo

Before starting: seed mock mode, sign in as `ama@chippin.local` using DEMO_PASSWORD from `.env`, keep the public AKWAABA page and dashboard in two tabs. Create a separate small pot for closing/refunding so AKWAABA remains open for judges. A phone should open the deployed URL; localhost is only for development.

**0:00–0:25 — the problem.** “In our family groups, someone posts a MoMo number and asks everyone to help. The giving is easy. Knowing the total, who is organizing it, and where the money goes is harder. Chippin puts that kindness in one shared pot.”

**0:25–0:50 — start a pot.** Create a pot with a clear name, a short story and “When I close the pot.” Show that the payout number locks after the first successful contribution. Point out that instant payouts require a verified organizer.

**0:50–1:25 — bring people in.** Open sharing, copy the exact message and show the QR. “No account. No app.” Ask judges to open the public page. Give 20 in mock mode. The receipt confirms and the public total updates. Say “mock mode moves no money” plainly; sandbox uses simulated EUR and does not send real phone prompts.

**1:25–1:55 — the record.** Show the donor book, anonymity toggle, organizer badge and payout transparency. Open the dashboard and download CSV/PDF. “The total comes from a ledger we can add to but cannot rewrite.”

**1:55–2:20 — when things go wrong.** Give using “Declined,” show the friendly retry. Try “Still checking” and point to the saved reference. “A timeout doesn’t mean failure. We check with MoMo so we don’t count twice or ask someone to pay again.”

**2:20–2:45 — payouts and refunds.** Close the separate demonstration pot, run reconciliation if needed, and show the payout status. Cancel a pot with available funds to show its refund jobs. Explain post-payout recovery: “The organizer has to approve returning the money. We cannot pull it from their wallet.” The scheduled worker runs every 30 seconds, so prepare a settled example tab if the live segment would take too long.

**2:45–3:00 — what comes next.** “We want to work with MTN or a licensed payment provider on live settlement, identity checks and Ghana-ready operations. Our first users are families, schools and communities that already help each other. Chippin gives them a clear record.”

If sandbox is unavailable: use the deployed mock environment, show the same flows and disclose simulation. Do not switch provider mode on a database with unresolved jobs. Use a separate mock deployment/database or reconcile first.
