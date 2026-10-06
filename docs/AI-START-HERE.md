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
- Admin credential rotation: complete; old `REJECTED`, new `ACCEPTED`, session invalidation confirmed.
- **Live site:** https://soga11.vercel.app (HTTP 200, auto-deploys from `master`).
- Canonical branch: **`master`**. Code checkpoint: **`c1a2c54`** (final CTA sized to content), built on `900c69f` (Merge PR #3). Documentation commits may sit on top, so confirm the exact HEAD with `git log -1`.
- GitHub automation: `gh` CLI installed at `~/.local/bin/gh`, authenticated; PRs #2 and #3 merged into `master`.

## Repository and branch state (verified 06 Oct 2026)

| Ref | Commit | Meaning |
|---|---|---|
| `master` | `c1a2c54` + docs | **Canonical.** Code checkpoint `c1a2c54` (final CTA sizing) plus documentation commits; run `git log` for the exact HEAD. |
| `feat/responsive-ui-faq-fix` | `de8cdcb` | Merged; tree identical to `master`. |
| `experiment/redesign` | `8d9aa82` | Already integrated (ancestor of `master`). |
| `backup/hero-theme-2026-09-27` | `bd0bad6` | **Divergent — do not merge.** Contains a revert of the cinematic hero. |

Work from `master`. Do not merge the backup branch. This local clone is configured single-branch
(`remote.origin.fetch` only tracks `feat/responsive-ui-faq-fix`); run
`git fetch origin '+refs/heads/*:refs/remotes/origin/*'` if `origin/master` looks stale.

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
