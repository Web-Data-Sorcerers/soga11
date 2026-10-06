# SOGA 11 — AI Start Here

> Entry point for every new AI/developer session.

## Mandatory first steps

Before proposing or changing anything:

1. Read `docs/HANDOFF.md` completely.
2. Read `docs/aturan.md` completely.
3. Read `docs/NEXT-STEPS.md` completely.
4. Read `docs/PLAN.md` completely.
5. Run `git status --short`, `git log -8 --oneline`, and inspect files relevant to the request.
6. Ask before expanding scope, mutating production, deploying publicly, changing backend contracts, or touching user-owned untracked files.

Do not restart the project. Do not infer state from old chats, screenshots, or pre-history-rewrite hashes.

## Current checkpoint

- Product: SOGA 11 / Sorcery Gathering #11 for Data Sorcerers.
- Stack: Vanilla HTML/CSS/JS + Supabase.
- Design: Sorcery Editorial System.
- Major frontend and legal pages: complete/frozen.
- Release builder: complete; `dist/` has **58 files** per `release-manifest.txt`.
- Git security rewrite: complete.
- Admin credential rotation: reported complete; old `REJECTED`, new `ACCEPTED`, session invalidation verified.
- Vercel config: complete, committed, and pushed.
- Vercel deployment: **not yet created.**
- Immediate task: product owner imports GitHub repo into Vercel, deploys `dist/`, returns URL for online regression.

Canonical commit before this documentation update: `aee32ef` on `feat/responsive-ui-faq-fix`.

## Hard safety rules

- Never request or output Admin credential values.
- Never place a privileged Supabase key in frontend, docs, Vercel, logs, or screenshots.
- Supabase target is `soga-11` (`metnsgficvfvkmmksoua`), never `jelajah`.
- No production participant insert/update/delete/check-in/toggle for QA.
- Anonymous registration INSERT must remain without `.select()`.
- Never deploy repository root; deploy allowlisted `dist/` only.
- Preserve hash routing, form IDs, and JS hooks.
- Preserve the one-page five-section registration form.
- Do not modify frozen visuals without an objective defect or approval.
- Do not invent speaker, venue, agenda, signer, social, or delivery facts.
- Do not touch untracked user-owned files without approval.













