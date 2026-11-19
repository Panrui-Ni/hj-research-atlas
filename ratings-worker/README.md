# Optional anonymous ratings service

**What it is:** A small separate Cloudflare Worker + D1 service for aggregated community ratings of **papers**, not people or journals. The public UI has five separate dimensions and four ordered grades. No total score or site-wide ranking is computed.

**What it is not:** Anonymous voting is **not** a cryptographic guarantee of one vote per individual. One browser gets one mutable vote per paper/dimension using an opaque random local identifier. Clearing browser storage, using other browsers/devices, or automation can bypass this. A Turnstile check and privacy-preserving short-term IP-hash-based rate limit deter some abuse. Treat these results as unverified opinion samples, never as evidence of mathematical correctness.

## Setup (after GitHub Pages is live)

You need a Cloudflare account, Node.js, and Wrangler. Commands below run in this folder:

1. Install Wrangler CLI or use `npx wrangler`. Log in with `npx wrangler login`.
2. Create a D1 database: `npx wrangler d1 create hj-atlas-ratings`. Copy its `database_id`.
3. Copy `wrangler.toml.example` to `wrangler.toml` and fill in `database_id` and `ALLOWED_ORIGIN`, e.g. `https://YOUR_GITHUB_USERNAME.github.io` **with no project path or trailing slash**. Check `ALLOWED_PAPERS` against `data/atlas.json` whenever you add a new paper.
4. Create database tables: `npx wrangler d1 execute hj-atlas-ratings --remote --file=./schema.sql`.
5. Create a Cloudflare Turnstile widget for your actual Pages hostname; copy its **public site key** and **private secret**. Keep the private secret secret. Verify the widget supports your chosen domain.
6. Deploy the Worker once: `npx wrangler deploy`.
7. Supply secrets using `npx wrangler secret put RATING_SECRET` (generate a random 32-byte value, e.g. `openssl rand -hex 32`) and `npx wrangler secret put TURNSTILE_SECRET` (enter the **private** Turnstile secret). Deploy again if needed.
8. In the parent site's `config.js`, set `ratings.apiBase` to the Worker origin, e.g. `https://hj-atlas-ratings.YOUR_SUBDOMAIN.workers.dev`, and set `ratings.turnstileSiteKey` to the public site key. Publish GitHub Pages again.
9. Check that a paper shows the Turnstile verification, submitting a rating succeeds, and a second submit updates the existing browser's vote. Visit the site in a different browser to verify that aggregate counts are public and identities are not.

**Until step 8, the website only saves private rating drafts in each visitor's browser. No vote is submitted or counted.**

### Privacy and operations

- The rating database stores only: paper ID, rating dimension/grade, keyed HMAC digest of the anonymous browser token, timestamp, and a rotating daily keyed IP hash with submission counts. It does **not** store usernames, emails, free-text comments, raw browser token, or raw IP addresses.
- Hosting providers can still process IP addresses and other connection data in their normal infrastructure; this is **not** absolute anonymity.
- Enable appropriate retention limits. For example, periodically run `DELETE FROM daily_limits WHERE day < date('now','-14 days')` against D1, or configure scheduled cleanup if the community uses the service long-term.
- One per-browser vote ≠ one person. Self-ratings and coordinated voting are not reliably detectable without identity checks. Publish response counts, suppress detailed distributions below five responses per dimension, and do not rank authors or papers.
- GitHub/giscus discussions are **not anonymous**; users need GitHub login. Rating and commenting identities are deliberately not linked.
- The public Worker permits only origins matching `ALLOWED_ORIGIN`; this prevents ordinary cross-site browser access but is not an anti-bot boundary. Turnstile's **server-side Siteverify** is mandatory.
- In production, add monitoring, stronger per-IP atomic throttling, privacy policy, moderation/governance, and abuse response if traffic grows.
