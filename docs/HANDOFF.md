# SOGA 11 — Master Handoff

> **Last verified:** 13 September 2026, Asia/Jakarta
> **Purpose:** master context for a new AI/developer continuing this repository.
> **Mandatory reading order:** `docs/AI-START-HERE.md` → this file → `docs/aturan.md` → `docs/NEXT-STEPS.md` → `docs/PLAN.md`.

---

## 1. Project identity

**SOGA 11 — Sorcery Gathering #11** is an offline community event website for **Data Sorcerers**.

- Event date: **Sunday, 25 October 2026**.
- Countdown target: **08:00 WIB**, meaning the start of activity/check-in.
- Approved location specificity: **Yogyakarta only**.
- Venue name/address: **not final**.
- Event format: **offline**. Never call it hybrid.
- Theme: **“Orkestrasi Kecerdasan untuk Masa Depan Nusantara.”**
- Public contact: `contact@data-sorcerers.com`.
- Visual system: **Sorcery Editorial System**.

This is a working codebase, not a project to recreate. SOGA 10 is reference-only.

---

## 2. Current one-line status

The major frontend redesign, Admin, legal pages, release builder, Git security rewrite, manual Admin credential rotation, and Vercel build configuration are complete. `master` is pushed to GitHub. **No Vercel deployment has been created yet.** The immediate next action is for the product owner to import the GitHub repository into Vercel, deploy the allowlisted `dist/`, and return the URL for online regression testing.

Release status: **release candidate with conditions**.

Conditions still open:

1. Explicitly record manual verification that the old Admin credential is rejected and the new credential is accepted.
2. Verify session invalidation/revocation status.
3. Deploy to a Vercel staging URL and run online regression.
4. Finalize agenda, venue, speakers, social links, and production-domain metadata.

---

## 3. Non-negotiable architecture

| Layer | Current implementation |
|---|---|
| Frontend | Vanilla HTML, CSS, and JavaScript |
| Public navigation | URL hash routing with fetched HTML fragments |
| Backend | Supabase PostgreSQL, Auth, RLS, and existing RPC functions |
| Build | No framework bundler; deterministic shell release builder |
| Hosting target | Vercel static output from `dist/` only |
| UI font | Plus Jakarta Sans |
| Certificate font | Cormorant Garamond only inside ceremonial output |
| Technical data | System monospace stack |

Do not migrate to React, Vue, Svelte, Tailwind, or another framework/build system without separate approval. Do not change Supabase schema, Auth, RLS, or RPC merely for a visual change.

---

## 4. Runtime entry points and routes

### Standalone entry points

| File | Purpose |
|---|---|
| `index.html` | Public shell, shared credential template, hash-routed app |
| `dashboard.html` | Admin Login and Command Center |
| `certificate.html` | Certificate Claim and Certificate Output |
| `terms.html` | Bilingual Terms of Participation |
| `privacy.html` | Bilingual Privacy Notice |

### Public hash routes

| Hash | Behavior |
|---|---|
| `#home` | Fetches `pages/home/home.html` |
| `#agenda` | Loads Home when needed, then scrolls to `#agenda` |
| `#speakers` | Loads Home when needed, then scrolls to `#speakers` |
| `#legacy` | Loads Home when needed, then scrolls to `#legacy` |
| `#faq` | Loads Home when needed, then scrolls to `#faq` |
| `#register` | Fetches `pages/register/register.html` |
| `#find-ticket` | Fetches `pages/find-ticket/find-ticket.html` |

Router: `js/app.js`.

Existing lifecycle protections:

- request IDs prevent stale fragment responses from winning;
- leaving Home clears the countdown interval;
- repeated Home entry creates one countdown timer;
- mobile navigation preserves hashes and Back/Forward.

Do not replace hash routing with server routes during maintenance.

---

## 5. Final tracked structure

```text
/home/faiz/soga-11/
├── index.html
├── dashboard.html
├── certificate.html
├── terms.html
├── privacy.html
├── vercel.json
├── release-manifest.txt
├── scripts/build-release.sh
├── assets/
│   ├── apple-touch-icon.png
│   ├── favicon.ico
│   ├── favicon.png
│   ├── logo-web.png
│   ├── logo.png                 # tracked, not in runtime allowlist
│   └── og-image.png
├── components/
│   ├── navbar/navbar.css
│   └── footer/footer.css
├── css/
│   ├── variables.css
│   ├── global.css
│   ├── dashboard.css
│   ├── certificate.css
│   └── legal.css
├── js/
│   ├── config.js
│   ├── api.js
│   ├── app.js
│   ├── dashboard.js
│   └── certificate.js
├── pages/
│   ├── home/home.html
│   ├── home/home.css
│   ├── register/register.html
│   ├── register/register.css
│   ├── find-ticket/find-ticket.html
│   └── find-ticket/find-ticket.css
└── docs/
    ├── AI-START-HERE.md
    ├── HANDOFF.md
    ├── aturan.md
    ├── PLAN.md
    └── NEXT-STEPS.md
```

`dist/` is generated and ignored. Never commit it unless policy changes explicitly.

---

## 6. External runtime dependencies

| Dependency | Use |
|---|---|
| `@supabase/supabase-js@2` UMD | Public API and Admin Auth/data |
| `qrcodejs@1.0.0` | Participant QR generation |
| `html5-qrcode@2.3.8` | Admin camera scanner |
| `Chart.js` | Admin analytics |
| `html2canvas@1.4.1` | Certificate capture |
| `jsPDF@2.5.1` | A4 landscape PDF |
| Google Fonts | Plus Jakarta Sans; Certificate-only Cormorant Garamond |

No npm dependency or root `package.json` is required.

---

## 7. Design system and references

The approved implementation is the **Sorcery Editorial System**:

- warm paper and white surfaces;
- deep plum typography;
- signal violet primary interaction;
- rare Data Sorcerers blue/gold details;
- editorial grids, thin rules, technical labels, restrained constellation geometry;
- expressive public site, dense operational Admin, formal Certificate.

Core tokens are in `css/variables.css`: brand and purple scales, semantic colors, spacing 4–160px, containers 760/1200/1280px, breakpoint foundations at 768/1024/1280px, radii, shadows, motion, and z-index. Shared primitives and the participant credential are in `css/global.css`.

### Local-only design package

`SOGA11-DESIGN-HANDOFF/` contains:

- `README.md`
- `DESIGN-HANDOFF.md`
- `QA-AUDIT.md`
- `IMPLEMENTATION-FREEDOM.md`
- `COMPONENT-STATES.md`
- `ACCEPTANCE-CRITERIA.md`
- `ASSET-MANIFEST.md`
- `AI-REFERENCE-PROMPTS.md`
- official assets under `brand/`
- ten approved images under `references/`

The directory and ZIP are untracked and excluded from `dist/`. Do not delete, edit, or commit them without approval.

Source-of-truth order:

1. Real code/backend behavior and product-owner-approved facts.
2. This handoff and `docs/aturan.md`.
3. Design package specifications.
4. Approved PNGs for composition only.
5. Mockup placeholders are never facts.

---

## 8. Completed frontend surfaces

### Public shell and Landing — frozen

- Sticky editorial navbar, official logo, accessible full-screen mobile menu.
- Focus trap, Escape close, focus restoration, body-scroll lock.
- Deep-plum footer with real Terms/Privacy links.
- Editorial Hero, decorative SOGA type, SVG constellation, real metadata.
- Countdown: `2026-10-25T08:00:00+07:00`.
- Approved stats: `10+ Edisi`, `08 Chapter`, `1000+ Peserta`, `50+ Pembicara & Mitra`.
- Current draft agenda; speakers remain explicit TBA where unknown.
- 16 unique Instagram Legacy embeds.
- Native `<details>` FAQ.
- Approved claims: 100% gratis, kuota terbatas, akses materi, networking.
- Final registration CTA.

Touch only for objective regression or approved content replacement.

### Registration — frozen

- One-page long form; never wizard/multi-step/accordion/carousel.
- Exactly 5 sections, 17 controls, 13 required, 4 optional.
- Desktop contextual rail; responsive one-column form below desktop.
- Loading/Open/Closed/Unavailable registration states.
- Double-submit protection and accessible validation.
- Local bilingual Terms/Privacy links.
- Success uses the shared credential renderer.

Field contract:

| UI ID | Payload mapping | Required |
|---|---|---|
| `f-name` | `full_name` | yes |
| `f-email` | `email` | yes |
| `f-whatsapp` | `whatsapp` | yes |
| `f-gender` | `gender` | yes |
| `f-institution` | `institution` | yes |
| `f-job` | `job` | yes |
| `f-linkedin` | `linkedin` | optional |
| `f-github` | `github` | optional |
| `f-level` | `level` | yes |
| `f-focus` | `focus` | yes |
| `f-tools` | `tools` | optional |
| `f-source` | `source` | yes |
| `f-expectation` | `expectation` | yes |
| `f-question` | `question` | optional |
| `f-attend` | required UI confirmation | yes |
| `f-doc` | required documentation consent | yes |
| `f-consent` | required Terms/Privacy consent | yes |

Important: the last three checkboxes are validated in the browser but are **not persisted as separate fields in the current insert payload/documented schema**. Do not silently add columns. Durable consent evidence requires product/legal/backend approval and a migration plan.

Critical anonymous insert contract:

```js
.from("participants")
.insert([data])
```

Never append `.select()`; anonymous SELECT is denied by design. Duplicate prevention remains deferred/out of scope.

### Shared credential and Find My Ticket — frozen

- One renderer: `renderParticipantCredential()`.
- One QR helper: `renderTicketQr()`.
- Used by Registration Success and Find Ticket Found.
- QR encodes exactly Ticket ID/token, not URL/JSON/name/email.
- White quiet zone and textual Ticket ID.
- Find Ticket uses one email-or-WhatsApp input.
- Explicit initial/invalid/loading/found/not-found/network states.

### Admin — frozen

- Supabase email/password login and session restoration.
- Operational shell, Summary, Check-in, Analytics, Registration Status, Registry.
- Mobile order: Check-in → Registration → Summary → Registry → Analytics.
- Single DOM/data source; responsive registry records.
- Accessible detail/edit/delete dialog with focus trap/restoration.
- CSV formula neutralization for `=`, `+`, `-`, `@` prefixes.
- Registration OPEN/CLOSED/UNAVAILABLE states.
- Check-in failure copy remains generic when RPC cannot prove the cause.

Do not add sidebar routes, staff, settings, Add Participant, exit tracking, or notifications.

### Certificate — frozen

- Claim lookup: Ticket ID or WhatsApp only.
- Existing `claim_certificate` RPC; no email lookup.
- Null result uses one factual unavailable state.
- Formal unsigned A4 landscape output.
- Cormorant only for ceremonial content.
- Capture waits for fonts/assets; `html2canvas` scale 3.
- PDF uses jsPDF A4 landscape millimeters, one page.
- Ticket/Verification ID, never Certificate ID.
- No signer, signature placeholder, or seal.

### Legal — frozen unless approved copy changes

- `terms.html`: bilingual Terms of Participation.
- `privacy.html`: bilingual Privacy Notice.
- Date: 25 October 2026 / 25 Oktober 2026.
- Organization: Data Sorcerers.
- Contact: `contact@data-sorcerers.com`.
- Registration legal links open in a new tab to preserve form state.

Never invent age rules, jurisdiction, fixed retention, unconditional deletion, or absolute security promises.

---

## 9. Backend contract

Supabase project:

- Name: `soga-11`
- Ref: `metnsgficvfvkmmksoua`
- Browser config: `js/config.js`
- Never touch the unrelated project `jelajah`.

### Documented `public.participants`

`id`, `qr_token`, `full_name`, `email`, `whatsapp`, `gender`, `institution`, `job`, `linkedin`, `github`, `level`, `focus`, `tools`, `source`, `expectation`, `question`, `status`, `checkin_time`, `created_at`.

- `qr_token`: unique/non-null.
- `email` and `whatsapp`: not documented unique.
- `status`: default `pending`; attended state `hadir`.

### Documented `public.settings`

- `key`: text primary key.
- `value`: non-null text.
- `registration_open` is accessed through RPC.

### Existing behavior

| API/RPC | Access | Contract |
|---|---|---|
| participant insert | public | INSERT only; no returned row |
| `is_registration_open` | public | boolean |
| `find_ticket` | public | email/WhatsApp; limited name/token |
| `claim_certificate` | public | Ticket ID/WhatsApp; eligible attended only |
| `checkin_participant` | Admin | attendance mutation |
| `set_registration_open` | Admin | setting mutation |
| participant SELECT/UPDATE/DELETE | Admin | Auth/RLS protected |

`js/api.js` is the browser API wrapper. Preserve its contract unless backend work is separately approved.

---

## 10. Security state

Completed:

- anonymous participant SELECT exposes no rows;
- public registration is INSERT-only;
- Admin data is Auth/RLS protected;
- service-role material is absent from frontend;
- Admin rendering is escaped/text-safe;
- CSV formula injection is neutralized on export;
- credential material was removed from tracked documentation;
- Git history was rewritten with `git-filter-repo` and remote reconciled;
- rewritten history and `dist/` scans were clean;
- old local reflogs/unreachable objects were pruned;
- product owner reports manual Admin credential rotation completed;
- release artifact excludes documentation/internal material.

Still needs explicit record:

- old credential rejected;
- new credential accepted;
- previous session invalidation/revocation checked;
- authenticated read-only dashboard regression after rotation.

Never request, print, log, commit, screenshot, or document Admin credential values. Do not rewrite history or rotate again without explicit authorization for a new defect.

History rewriting cannot erase old clones, forks, archives, caches, screenshots, or external logs. Rotation—not rewrite alone—invalidates exposure.

---

## 11. Release and Vercel

`scripts/build-release.sh` copies only `release-manifest.txt` entries into `dist/`. Expected count: **28 files**. Never deploy the repository root.

Excluded: `docs/`, design packages, ZIPs, `.env*`, QA artifacts, internal notes, unused `assets/logo.png`, and user-owned untracked files.

Committed/pushed `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "./scripts/build-release.sh",
  "outputDirectory": "dist"
}
```

Vercel settings:

- Framework: Other.
- Root: `.`.
- Build: `./scripts/build-release.sh`.
- Output: `dist`.
- Install Command: blank.
- Environment variables: none required.

Never add Admin credentials or service-role keys to Vercel.

Current status: **not deployed**. Product owner must connect GitHub to Vercel and send the generated URL for online QA.

---

## 12. Git state and canonical checkpoints

- Remote: `https://github.com/Web-Data-Sorcerers/soga11.git`
- Branch: `master`
- Last application/deployment checkpoint before this documentation update: `0c4ee9f`
- Local and `origin/master` matched.

Use `git rev-parse --short HEAD` for the current documentation commit after this handoff is committed.

Pre-rewrite hashes are obsolete. Canonical rewritten checkpoints:

```text
7f93236  Phase 1   Editorial foundation
ad4ce63  Phase 2   Public navigation
ea306dd  Phase 2   Public footer
9e6d3ef  Phase 3A  Hero/countdown/event scale
43e534a  Phase 3B  Agenda/Speakers
8bbf570  Phase 3B  Legacy
5ee9d26  Phase 3B  FAQ/final CTA
b7301e6  Phase 4   Registration
478a0c3  Phase 5   Shared credential/Find Ticket
e81c6fb  Phase 6A  Admin Login/shell
f67d76a  Phase 6B  Command Center
bda3056  Phase 6C  Mobile registry/modal
55c93bb  Phase 6C  Operational safety/CSV
4bd2935  Phase 7A  Certificate Claim
3a04b1e  Phase 7B  Certificate Output
f744e46  Phase 8   Routing/accessibility fixes
aa01aa9  Phase 8   Scale-3 certificate capture
155163a  Phase 8.1 Rules move
026acf2  Phase 8.1 Countdown 08:00
0c566e7  Phase 8.1 Offline copy
c255360  Phase 8.1 Release builder
5778999  Phase 8.2 Terms/Privacy
985a9e9  Phase 8.2 Consent integration
ea7dac5  Phase 8.2 Legal manifest
d67afb4  Phase 8.3 Security sanitization descendant
0c4ee9f  Phase 9   Vercel configuration
```

Phase 8.3B was read-only and has no commit. Use small focused commits; never include unrelated untracked files.

---

## 13. Worktree ownership

Intentionally untracked/user-owned at handoff:

```text
SOGA11-DESIGN-HANDOFF.zip
SOGA11-DESIGN-HANDOFF/
assets/page saat ini/
docs/DESIGN-HANDOFF.md
soga-section-build.zip
soga-section-build/
```

Do not delete, move, edit, or commit them without approval. The SOGA 10 reference repository has its own untracked `.omo/`; do not modify it.

---

## 14. SOGA 10 reference

Read-only path:

```text
/home/faiz/clone/sorcery-gathering/
```

Useful files: `index.html`, `scripts/app.js`, `scripts/auth.js`, `scripts/api.js`, `styles/variables.css`, `styles/global.css`, and its original assets.

Reused conceptually: official brand source, five-part form concept, QR/check-in, Command Center, and already-approved FAQ/Legacy/footer lineage.

Never copy back: Google Apps Script backend, public participant reads, client PIN/auth shortcuts, obfuscated JS, old dark theme, or unapproved broadcast/settings features. SOGA 10 is not a source of truth for SOGA 11 data/security.

---

## 15. Verification commands

Do not use `file://`; fragments require HTTP.

```bash
cd /home/faiz/soga-11
node --check js/app.js
node --check js/api.js
node --check js/dashboard.js
node --check js/certificate.js
node --check js/config.js
git diff --check
./scripts/build-release.sh
find dist -type f | wc -l
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Expected count: `28`. Default QA is read-only. Never perform real insert/update/delete/check-in/registration-toggle solely for testing.

---

## 16. Approved and open decisions

Approved:

- offline; Yogyakarta; 25 October 2026; 08:00 countdown;
- public statistics and FAQ claims currently shown;
- unsigned Certificate;
- bilingual local Terms/Privacy.

Not final:

- agenda details;
- venue/address;
- speakers/photos;
- social/ecosystem URLs;
- production domain and absolute `og:image`.

Deferred/out of scope:

- duplicate prevention/uniqueness;
- email/WhatsApp ticket delivery;
- wallet/share;
- Certificate ID and signatures;
- new Admin features/routes;
- backend redesign.

---

## 17. Immediate next action

Do not redesign anything.

1. Product owner imports `Web-Data-Sorcerers/soga11` into Vercel.
2. Confirm Framework Other, root `.`, build `./scripts/build-release.sh`, output `dist`.
3. Add no secrets/environment variables.
4. Deploy the first Vercel URL.
5. Send the URL to the AI/developer.
6. Run `docs/NEXT-STEPS.md` online QA before custom domain or announcement.
