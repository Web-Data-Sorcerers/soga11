# ATURAN — SOGA 11

> Canonical rules, safety constraints, and error log. Read completely before any work. Never delete prior lessons; append new ones.

## 1. Repository and source-of-truth rules

1. This is an existing working project. Never restart or scaffold from zero.
2. Source priority:
   - real current code/backend behavior and approved facts;
   - `docs/HANDOFF.md` and this file;
   - `docs/NEXT-STEPS.md` / `docs/PLAN.md`;
   - local design package specifications;
   - visual mockups only for composition.
3. Never treat mockup names, portraits, counts, addresses, emails, signatures, or features as facts.
4. Inspect dependencies/selectors before edits. Preserve all JS hook IDs.
5. Keep commits focused. Never include unrelated untracked files.
6. Before edits, run `git status --short`. Existing user changes and untracked files belong to the user.
7. Do not delete/move/commit these without approval:
   - `SOGA11-DESIGN-HANDOFF.zip`;
   - `SOGA11-DESIGN-HANDOFF/`;
   - `assets/page saat ini/`;
   - `docs/DESIGN-HANDOFF.md`;
   - `soga-section-build.zip`;
   - `soga-section-build/`.

## 2. Supabase — project boundary

| Project | Ref | Rule |
|---|---|---|
| **soga-11** | `metnsgficvfvkmmksoua` | only allowed project |
| jelajah | `vzohtezrdhselrommvcm` | never touch |

- All database/Auth work must target `soga-11` only.
- MCP naming may be misleading; always confirm project ref before operations.
- Account/management credentials live outside the repository.
- Never copy tokens, passwords, or privileged keys into files, commands that print them, screenshots, logs, chat, or Vercel.
- Never expose a Supabase service-role key in frontend code.
- The browser anon configuration in `js/config.js` is not authorization; RLS/RPC controls are the security boundary.

## 3. Architecture rules

- Vanilla HTML/CSS/JS only.
- No React/Vue/Svelte/Tailwind/framework migration without separate approval.
- Preserve public hash routing and fragment loading.
- Preserve Supabase Auth and existing API/RPC contracts.
- Do not change schema/RLS/RPC for a visual task.
- No new dependency unless objectively required and approved.
- No server-side assumptions: current deployment is static.
- Use Plus Jakarta Sans for UI; Cormorant Garamond only inside final Certificate content.
- Respect `prefers-reduced-motion` and progressive enhancement.
- Never hide content by default in a way that makes JS failure blank the page.

## 4. Frozen surfaces

The following are complete and frozen except for objective defects or approved factual content replacement:

- Navbar/mobile menu/Footer;
- Landing Hero/Countdown/Event Scale;
- Agenda/Speakers/Legacy/FAQ/Final CTA;
- Registration layout;
- shared participant credential/Find Ticket;
- Admin Login/Shell/operational modules/mobile registry/modal;
- Certificate Claim/Output;
- bilingual Terms/Privacy pages.

Do not use “while I am here” redesigns.

## 5. Registration contract

- Always one-page long form.
- Exactly five sequential sections.
- No wizard, multi-step, carousel, or per-step accordion.
- Preserve 17 controls, IDs, option values, validation, and payload mapping.
- Below 768px all fields are one column; 768–1023 defaults to one; desktop may use safe two-column pairs.
- Optional fields remain optional.
- `f-doc` documentation consent stays independent from `f-consent` Terms/Privacy consent.
- Current three legal/attendance checkboxes are validated but not stored as separate database columns. Never silently migrate the backend.
- Anonymous insert must stay:

```js
.from("participants").insert([data])
```

- Never append `.select()` to anonymous registration insert.
- Duplicate-specific UI and uniqueness constraints remain out of scope.
- Never claim an email/WhatsApp confirmation was sent; no delivery feature exists.

## 6. Ticket and QR contract

- Registration Success and Find Ticket Found use one shared renderer and one QR helper.
- QR content is the exact Ticket ID token only.
- Never encode URL, JSON, participant name, email, or combined payload.
- Keep a white quiet zone; never overlay decoration/logo on the QR.
- Ticket ID must remain visible as text.
- Find Ticket uses one flexible email-or-WhatsApp input and the existing RPC.
- Do not expose full email, phone, institution, or internal database ID publicly.

## 7. Admin contract and mutation safety

- Preserve email/password login, session restore, logout, and Auth/RLS enforcement.
- Never add signup, Remember Me, Forgot Password, OAuth, or magic link without approval.
- Admin is operational, not a public landing page.
- Mobile order: Check-in → Registration → Summary → Registry → Analytics.
- Never duplicate scanner/chart/table modules to change responsive order.
- Do not invent Admin routes/features such as staff, settings, Add Participant, exit tracking, or notifications.
- Production check-in response cannot claim “already checked in” unless backend proves it.
- Registration-status fetch failure must show unavailable, never silently Open.
- Spreadsheet export must neutralize leading `=`, `+`, `-`, `@` in exported cells only.
- Default QA is read-only. Without explicit mutation approval:

```text
insert = 0
update = 0
delete = 0
check-in = 0
registration-toggle = 0
```

## 8. Certificate contract

- Lookup supports Ticket ID or WhatsApp only; no email lookup.
- Eligibility follows existing `claim_certificate` RPC.
- Null cannot prove whether data is wrong or attendance is unverified. Use one factual unavailable message.
- Never label Ticket ID as Certificate ID.
- Certificate remains unsigned: no signer, title, signature, placeholder, or fake seal.
- Output remains A4 landscape, one PDF page, with safe internal margins.
- Export waits for fonts/images; production capture scale is 3.
- Never add a decorative QR or verification system that does not exist.

## 9. Content truth rules

Approved:

- offline event;
- Yogyakarta only;
- 25 October 2026;
- countdown 08:00 WIB for check-in/activity start;
- `10+`, `08`, `1000+`, `50+` public statistics;
- 100% gratis, kuota terbatas, akses materi, networking;
- organization Data Sorcerers;
- contact `contact@data-sorcerers.com`;
- bilingual local Terms/Privacy;
- unsigned Certificate.

Not final—never invent:

- venue/address/map;
- agenda finality or new sessions;
- speaker identities/photos;
- social/ecosystem URLs;
- production domain;
- signer/signature;
- Certificate-specific ID.

Never use “Hybrid Event”.

## 10. Deployment and artifact rules

- Never deploy repository root.
- `release-manifest.txt` is the positive runtime allowlist.
- `scripts/build-release.sh` must produce exactly 28 files until an approved manifest change.
- Vercel output directory is `dist`.
- `dist/` is generated/ignored; do not commit it.
- Never include docs, design references, ZIPs, `.env*`, QA artifacts, internal notes, or unused source packages in deployment.
- `vercel.json` must retain build `./scripts/build-release.sh` and output `dist` unless deployment architecture is explicitly changed.
- No Vercel environment secret is required. Do not add Admin credentials or service-role material.
- Connecting a repo/deploying/custom-domain work requires product-owner authority.

## 11. Security history state

- Credential material was removed from tracked docs.
- Git history was rewritten using `git-filter-repo` and remote `master` reconciled.
- Pre-rewrite commit hashes are obsolete.
- Product owner reported manual credential rotation complete.
- Do not rotate again, rewrite again, or force-push again without explicit approval for a new objective defect.
- Never request the old/new values.
- Still record only status words for manual validation: old `REJECTED`, new `ACCEPTED`, prior session status.
- History rewrite cannot erase old clones/forks/archives/caches/logs; rotation restores the credential boundary.

## 12. SOGA 10 reference rules

Reference-only path: `/home/faiz/clone/sorcery-gathering/`.

- Never edit it for SOGA 11 work.
- May reference official assets and already-approved content lineage.
- Never copy its GAS backend, public data exposure, client PIN/auth shortcut, obfuscation, dark theme, or unapproved features.
- SOGA 11 code/backend always wins.

## 13. Error log

### 2026-09-11 — wrong `pg_policy` columns

- Error: queried `schemaname`/`tablename` on `pg_policy`.
- Rule: filter using `polrelid = 'public.participants'::regclass`; use valid policy columns and `pg_get_expr`.

### 2026-09-11 — inserted generated Auth columns

- Error: manually inserted values into generated `auth.users.confirmed_at` and `auth.identities.email`.
- Rule: never insert generated Auth columns. Prefer authorized Auth administration mechanisms over direct table manipulation.

### 2026-09-11 — anonymous registration failed RLS

- Error: `.insert([data]).select().single()` required anonymous SELECT.
- Rule: anonymous registration uses `.insert([data])` only.

### 2026-09-12 — atomic Auth config PATCH failed

- Error: combined a supported Auth setting with Pro-only leaked-password protection; HTTP 402 rejected the whole PATCH.
- Rule: apply independently supported settings separately. Never assume partial success from a failed configuration request.

### 2026-09-13 — Git history contained credential material

- Error condition: tracked documentation and reachable Git history contained an Admin credential.
- Resolution: sanitize current docs, exact history rewrite from current local history, verify zero matches, force-reconcile only audited `master`, rotate credential externally.
- Rule: credentials never enter documentation, commits, logs, screenshots, command output, or deployment artifacts.

### 2026-09-13 — false-positive secret scanning

- Error: broad keyword searches counted explanatory words such as “password” or “service role” as secrets.
- Rule: secret audits must distinguish credential values/assignments from security documentation; never print matches that might contain a value.

### 2026-09-13 — zsh special variable collision

- Error: used loop variable `path`, overriding zsh's special `$path` array and making commands appear unavailable.
- Rule: use task-specific variable names such as `runtime_file` or `entry_path`; never repurpose shell/system option variables.

### 2026-09-13 — deploying root would expose non-runtime material

- Risk: Git repository contains documentation and local reference material not meant for hosting.
- Resolution: positive allowlist builder and Vercel `outputDirectory: dist`.
- Rule: deployment succeeds only from the verified generated artifact, never repository root.

## 14. Required verification after every relevant change

At minimum:

```bash
node --check js/app.js
node --check js/api.js
node --check js/dashboard.js
node --check js/certificate.js
node --check js/config.js
git diff --check
./scripts/build-release.sh
find dist -type f | wc -l
```

Then test affected entry points at 375, 768, 1024, and 1440; route/hash behavior; keyboard/focus; reduced motion; console/network; no overflow; and zero unauthorized mutation.
