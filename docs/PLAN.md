# SOGA 11 — Delivery Plan and Completed Phases

> Updated 06 October 2026. Phase-level record; use `docs/NEXT-STEPS.md` for immediate execution.

## Goal

Deliver a production-ready static SOGA 11 site while preserving the existing Supabase data/Auth contract, hash routing, QR/check-in behavior, and safe operational Admin experience.

## Completed phases

| Phase | Result | Canonical rewritten commit(s) |
|---|---|---|
| 1 | Sorcery Editorial tokens/global foundation | `7f93236` |
| 2 | Public navbar/mobile menu/footer | `ad4ce63`, `ea306dd` |
| 3A | Hero, countdown, event introduction/statistics | `9e6d3ef` |
| 3B | Agenda, Speakers, Legacy, FAQ, final CTA | `43e534a`, `8bbf570`, `5ee9d26` |
| 4 | One-page Registration redesign | `b7301e6` |
| 5 | Shared credential and Find My Ticket | `478a0c3` |
| 6A | Admin Login and shell | `e81c6fb` |
| 6B | Command Center operational layout | `f67d76a` |
| 6C | Mobile registry, modal, state/CSV safety | `bda3056`, `55c93bb` |
| 7A | Certificate Claim | `4bd2935` |
| 7B | A4 Certificate and deterministic export | `3a04b1e` |
| 8 | Full regression and localized fixes | `f744e46`, `aa01aa9` |
| 8.1 | Rules, countdown/offline copy, release builder | `155163a`, `026acf2`, `0c566e7`, `c255360` |
| 8.2 | Bilingual Terms/Privacy and integration | `5778999`, `985a9e9`, `ea7dac5` |
| 8.3 | Documentation sanitization/history purge/remote reconciliation | `d67afb4` descendant |
| 8.3B | Read-only final security verification | no commit |
| 9 | Vercel build/output configuration | `0c4ee9f` |
| 10 | Cinematic hero background, FAQ chevron animation, responsive UI refinements, legacy asset archive (19 archival images) | `0ca1816`, `2d16931`, `183649f`, `b9ad0e6`, `dc3ae8f`, `2cf741b`, `548cfa9`, `aee32ef` |
| 10B | Documentation refresh: branch, 58-file manifest, verified credentials | `aee32ef` descendant |
| 10C | Full-viewport sections, white hero aura (artwork kept visible), reload-returns-to-hero router fix | `de8cdcb` |
| 11 | PR flow into `master`: PRs #2 and #3 merged via `gh` CLI | `ff5fcb6`, `900c69f` |
| 12 | Documentation refresh for current master state (live deploy, gh flow, branches) | `07478a4` |
| 13 | Final registration callout sized to its content (excluded from full-viewport sections), owner-approved | `c1a2c54` |

All major implemented visual surfaces are frozen.

## Current release phase — deployed, finalizing content

Live: **https://soga11.vercel.app** (auto-deploys from `master`). Remaining work is content and domain:

1. Optional read-only online regression against the live URL (`docs/NEXT-STEPS.md`).
2. Supply final agenda, venue, speakers, and social/ecosystem URLs.
3. Choose a production domain and update absolute `og:image` metadata.
4. Connect the custom domain and re-run the smoke test.
5. Public announcement only with explicit product-owner approval.

## Content finalization phase

Requires product-owner data:

- final agenda;
- venue name/address;
- speakers/photos and usage approval;
- social/ecosystem URLs;
- production domain.

After domain selection:

- update Open Graph images to absolute HTTPS URLs;
- verify social previews;
- connect custom domain;
- re-run final smoke tests.

## Explicitly deferred product work

- duplicate email/WhatsApp prevention or uniqueness migration;
- automatic email/WhatsApp confirmation or ticket delivery;
- wallet/share integrations;
- Certificate-specific ID;
- signer/signature;
- new Admin sections/roles;
- broadcast center;
- backend rewrite.

Each needs separate approval, impact audit, security/migration plan, tests, and focused commits.

## Release gates

### Technical

- canonical branch (`master`) matches remote and the live deployment.
- build returns exactly the files listed in `release-manifest.txt` (currently **58**) unless manifest deliberately changes.
- no docs, ZIPs, reference packages, `.env*`, or notes in `dist/`.
- JS checks and browser smoke pass.
- public/backend contracts remain intact.

### Security

- old Admin credential rejection recorded — **confirmed**.
- new Admin credential success recorded — **confirmed**.
- session invalidation reviewed — **confirmed**.
- anonymous participant reads expose zero rows.
- authenticated Admin reads work.
- release QA mutations remain zero.

### Content

- agenda/venue/speakers approved or explicitly accepted as draft/TBA.
- production social/legal destinations factual.
- absolute Open Graph image configured.

### Launch

- product owner explicitly approves custom domain/public announcement.
- code completion alone never grants deployment authority.
