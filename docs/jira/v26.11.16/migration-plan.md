# expo-supabase-ai-template migration plan v26.11.16

Standing: UNVERIFIED

## Identity
- Path: /Users/sac/expo-supabase-ai-template
- Remote: https://github.com/seanchatmangpt/expo-supabase-ai-template.git (origin/main)
- Branch: main@0afb90b; last commit 2026-06-02; 17 commits; 26 MB
- Languages/build: React Native / Expo Router (package.json), Supabase, NativeWind
- Nested repos: none

## Observed state
- Dirty 358: src/ (272 — large refactor/removal), .agents/ (121 deletions of agent
  briefings), docs/ (4), tsconfig.json, tailwind.config.js, supabase/, debug PNGs
- Untracked 72: not individually listed (likely new src/ layout + screenshots)
- Ahead 0 / behind 0 on main; stash 0
- 4 unpushed local branches: subagent-*-GapCloserAgent-* (all at 2fbc1d5, same commit)
- Build dirs: none (node_modules absent); .expo/ and android/ present
- Secrets: `.env` present at root (196 bytes, git-ignored) and `android/.env`. Never print.

## What it is
Production-ready Expo + Supabase + OpenAI template: auth flow, protected routes, AI assistant
via Supabase Edge Functions, NativeWind UI.

## Classification
WARM (census agrees; last commit 2026-06, with a very large uncommitted rework)

## Migration risk
HIGH. 358 dirty + 72 untracked files in src/ is an entire uncommitted rework; 4 subagent
branches at 2fbc1d5 are unpushed; `.env` and `android/.env` are git-ignored secrets that must
travel out-of-band (password manager / secure copy), never via git.

## Recommended action
COMMIT-PUSH
1. `cd /Users/sac/expo-supabase-ai-template && git diff --stat | tail -5` — gauge the rework.
2. DECISION: is the .agents/ mass deletion intended? If yes, include it.
3. `git checkout -b wip/src-rework-2026-06 && git add -A && git commit -m "wip: src rework"`
4. `git push -u origin wip/src-rework-2026-06`
5. DECISION: the 4 subagent-* branches are identical (2fbc1d5); push one, delete the rest
   later on the new machine.
6. Copy `.env` and `android/.env` to a secure vault manually (do not rsync the repo).
7. `rm -rf .expo android/build` if present; re-clone on new machine.

## First commands on the new machine
`npm ci && npx tsc --noEmit && npx expo-doctor` (restore .env from vault first)

## See Also
- ../v26.9.19/
- /Users/sac/docs/jira/v26.11.16/README.md (master index)
