# SOGA 11 — Immediate Next Steps

> Operational checklist as of 13 September 2026.

## Current position

- GitHub `master` includes Vercel configuration.
- Canonical remote HEAD before this documentation update: `0c4ee9f`.
- Vercel project: not connected/deployed yet.
- Build artifact: allowlisted `dist/`, expected 28 files.
- Major UI: complete/frozen.
- Manual Admin credential rotation: reported complete.
- Explicit old/new authentication and prior-session result: still needs recorded confirmation.

## Next action — product owner in Vercel

1. Choose **Add New → Project** in Vercel.
2. Connect GitHub if necessary.
3. Import `Web-Data-Sorcerers/soga11`.
4. Confirm:
   - Framework Preset: `Other`;
   - Root Directory: `.`;
   - Build Command: `./scripts/build-release.sh`;
   - Output Directory: `dist`;
   - Install Command: blank;
   - Environment Variables: none.
5. Do not enter an Admin password, access token, or service-role key.
6. Deploy and copy the generated `.vercel.app` URL.
7. Send only the URL to the AI/developer.

The initial URL is reachable by anyone who knows it. Do not announce it or connect the production domain before online QA.

## Online QA — AI/developer

### Deployment integrity

- confirm intended `master` commit;
- confirm build ran `scripts/build-release.sh`;
- confirm only `dist/` is served;
- check `/`, `/dashboard.html`, `/certificate.html`, `/terms.html`, `/privacy.html`;
- verify runtime assets and CDN dependencies;
- verify no directory listing/internal file exposure;
- verify `/docs/HANDOFF.md`, ZIPs, `.env`, and reference packages are unavailable.

### Public route matrix

- `/#home`
- `/#agenda`
- `/#speakers`
- `/#legacy`
- `/#faq`
- `/#register`
- `/#find-ticket`

For each: direct URL, refresh, Back/Forward, mobile menu, no stale fragment, no console error, and no overflow at 375/768/1024/1440.

### Registration

- registration state is factual: Open/Closed/Unavailable;
- five sections and 17 controls remain;
- legal links reach deployed Terms/Privacy pages;
- required validation works;
- do not submit a production record without permission;
- inspect the contract without changing data.

### Credential and Find Ticket

- initial/empty/not-found/network states;
- use an owner-approved existing record only when real lookup is authorized;
- QR encodes exact Ticket ID only;
- downloaded QR remains scannable;
- Registration Success and Find Ticket share renderer/helper.

### Certificate

- Claim loads and keeps Ticket ID/WhatsApp lookup only;
- use an approved existing attendee or local stub;
- unavailable and network states remain distinct;
- Certificate remains unsigned;
- PNG contains artifact only;
- PDF is one A4 landscape page;
- long names remain readable.

### Admin security verification — owner performs, values never shared

Use a private/incognito browser:

1. Attempt old credential and record only `REJECTED`.
2. Attempt new credential and record only `ACCEPTED`.
3. Confirm dashboard, stats, registry, analytics, registration-status reads.
4. Confirm logout.
5. Review whether a session created before rotation still works.
6. Never paste credentials into AI chat, screenshots, logs, or files.

Do not check in, toggle registration, edit, delete, or insert during release QA.

Expected instrumentation:

```text
insert = 0
update = 0
delete = 0
check-in = 0
registration-toggle = 0
```

## After online QA

1. Decide whether the `.vercel.app` deployment may remain available.
2. Supply final agenda, venue, speakers/assets, and social/ecosystem URLs.
3. Choose production domain.
4. Update absolute `og:image` metadata.
5. Connect custom domain.
6. Run final domain smoke test.
7. Explicitly approve public announcement.

## Stop and ask owner when

- Vercel serves repository root instead of `dist/`;
- build count differs from 28 without approved manifest change;
- a secret/environment variable appears necessary;
- Admin verification cannot be performed privately;
- anonymous participant rows become readable;
- a real mutation appears necessary for testing;
- deployed URL exposes docs/ZIP/reference/internal files;
- content is missing and completing it would require invention;
- custom-domain/public-launch approval is absent.
