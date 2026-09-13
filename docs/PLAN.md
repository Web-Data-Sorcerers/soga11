# SOGA 11 — Delivery Plan and Completed Phases

> Updated 13 September 2026. Phase-level record; use `docs/NEXT-STEPS.md` for immediate execution.

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

All major implemented visual surfaces are frozen.

## Current release phase — Vercel staging

Product-owner action:

1. Import `Web-Data-Sorcerers/soga11` into Vercel.
2. Set Framework `Other`, Root `.`, Build `./scripts/build-release.sh`, Output `dist`.
3. Add no secrets.
4. Create the initial Vercel URL.
5. Give the URL to the AI/developer.

AI/developer action after URL exists:

1. Verify deployed commit SHA and build output.
2. Verify runtime assets/CDNs and all entry points.
3. Exercise public hashes and standalone legal/Admin/Certificate pages.
4. Confirm registration status/legal links, Find Ticket, QR, and Certificate export.
5. Ask the owner to verify old/new Admin credential outcomes privately without sharing values.
6. Run authenticated read-only Admin checks through the owner's browser/session.
7. Record zero-mutation results.

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

- `master` matches remote.
- build returns exactly 28 files unless manifest deliberately changes.
- no docs, ZIPs, reference packages, `.env*`, or notes in `dist/`.
- JS checks and browser smoke pass.
- public/backend contracts remain intact.

### Security

- old Admin credential rejection recorded.
- new Admin credential success recorded.
- session invalidation reviewed.
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
