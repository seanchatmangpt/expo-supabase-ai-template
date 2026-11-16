# expo-supabase-ai-template: commit or clean uncommitted changes

- Standing: OPEN
- Created: 2026-09-19 (v26.9.19 gh survey wave)
- Source: working tree dirty at survey time
- Evidence: `git status --porcelain` → 414 path(s) (tracked-modified: 358, untracked: 56); sample:  D .agents/ORIGINAL_REQUEST.md; D .agents/auditor/BRIEFING.md; D .agents/auditor/ORIGINAL_REQUEST.md;?? .prettierignore;?? .prettierrc;

## Work to complete
- Review the 358 tracked-modified path(s); commit them as atomic pieces on a purpose branch, or revert what is transient.
- For the 56 untracked path(s): add intentional files to git and commit; gitignore or delete build artifacts/temp files.
- Note: this survey's ticket files under docs/jira/v26.9.19/ are intentionally uncommitted; include or exclude them deliberately in the commit plan.

## Acceptance
- `git status --porcelain` is clean (except items deliberately deferred and recorded here).

## History
- 2026-09-19 | OPEN | survey found dirty tree | 414 paths (T358/U56) | commit/clean pending
