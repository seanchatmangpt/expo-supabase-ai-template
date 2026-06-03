# BRIEFING — 2026-06-02T17:45:32-07:00

## Mission
Fix critical bundler regression in `lib/supabase.ts` and verify with linters, tests, and route validation.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: /Users/sac/expo-supabase-ai-template/.agents/worker_supabase_ws_fix
- Original parent: 1ef45b7e-9fac-41ca-89bf-0dd1735d6c8d
- Milestone: Complete

## 🔒 Key Constraints
- CODE_ONLY network mode: No external network access.
- Do not cheat, do not hardcode, do not use dummy/facade implementations.
- Write report to `.agents/worker_supabase_ws_fix/handoff.md` and send_message.

## Current Parent
- Conversation ID: 5c7b3c04-a910-419d-93b8-ae0c54a8225f
- Updated: 2026-06-03T00:47:30Z

## Task Summary
- **What to build**: Fix static require('ws') in lib/supabase.ts using a variable argument.
- **Success criteria**:
  - Replace require('ws') with require(wsModule) under `isServer`.
  - Passing `tsc --noEmit`.
  - Passing `eslint .` (0 errors, 0 warnings).
  - Passing `jest --watchAll=false`.
  - Successful execution of capture and validation scripts without module resolution errors.
- **Interface contracts**: /Users/sac/expo-supabase-ai-template/lib/supabase.ts
- **Code layout**: Expo project structure

## Key Decisions Made
- Replaced require('ws') with dynamic parameter variable to prevent Metro from statically analyzing and resolving the module during build time.

## Artifact Index
- /Users/sac/expo-supabase-ai-template/.agents/worker_supabase_ws_fix/handoff.md — Handoff report

## Change Tracker
- **Files modified**:
  - `lib/supabase.ts`: Replaced static require with dynamic require using variable.
- **Build status**: Pass (all tests and route capture / validation passed successfully)
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (Jest: 182 test suites passed; tsc: 0 errors; eslint: 0 errors/warnings)
- **Lint status**: 0 errors, 0 warnings
- **Tests added/modified**: None (verified with existing extensive suite)

## Loaded Skills
- None
