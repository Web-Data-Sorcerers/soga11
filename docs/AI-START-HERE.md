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
- Release builder: complete; expected `dist/` count is 28.
- Git security rewrite: complete.
- Admin credential rotation: reported complete manually; explicit old/new login and session verification still need recorded confirmation.
- Vercel config: complete, committed, and pushed.
- Vercel deployment: not yet created.
- Immediate task: product owner connects GitHub to Vercel, then AI audits the online URL.

Canonical commit before this documentation update: `0c4ee9f` on `master`.

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

## Ready-to-paste prompt for a new AI

```text
Continue the existing SOGA 11 project in /home/faiz/soga-11.
Do not start from scratch.

Mandatory first action, in order:
1. Read docs/AI-START-HERE.md
2. Read docs/HANDOFF.md completely
3. Read docs/aturan.md completely
4. Read docs/NEXT-STEPS.md completely
5. Read docs/PLAN.md completely

Then run a read-only git/repository status audit and summarize your understanding.
Do not change files until I approve the next concrete task.

Major frontend design is complete/frozen. The security history rewrite is complete.
Manual Admin credential rotation has been reported complete. Vercel configuration
is pushed, and the immediate next step is Vercel import followed by online regression.
Never request or expose credential values. Never touch the Supabase project named jelajah.
```
