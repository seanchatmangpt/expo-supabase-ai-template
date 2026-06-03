# BRIEFING — 2026-06-02T17:30:00-07:00

## Mission
Perform a full-stack sweep on /Users/sac/expo-supabase-ai-template to find and fix all TypeScript, ESLint, runtime, and UX issues.

## 🔒 My Identity
- Archetype: self
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: /Users/sac/expo-supabase-ai-template/.agents/orchestrator
- Original parent: main agent
- Original parent conversation ID: 3076e40f-f875-4572-9d42-ec43e0dc8fcf

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: /Users/sac/expo-supabase-ai-template/PROJECT.md
1. **Decompose**: Decompose the project into milestones: diagnostics, compile & lint resolution, component & UX integrity, and final verification.
2. **Dispatch & Execute**:
   - **Delegate (sub-orchestrator)**: For large milestones, spawn sub-orchestrators/workers to parallelize and isolate work.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: At 16 sub-agent spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Initialize Project plan and progress tracking [done]
  2. M1: Diagnostic Scan & Verification [pending]
  3. M2: Compile & Lint Resolution [pending]
  4. M3: UX & Component Integrity [pending]
  5. M4: Final Verification & Test Execution [pending]
- **Current phase**: 1
- **Current focus**: Run diagnostic scan

## 🔒 Key Constraints
- Never write, modify, or create source code files directly.
- Never run build/test commands yourself — require workers to do so.
- File-editing tools may only be used for metadata/state files (.md) in .agents/ folder.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.
- Zero tolerance for hardcoded test results, facade implementations, or fabricated verification outputs.

## Current Parent
- Conversation ID: 3076e40f-f875-4572-9d42-ec43e0dc8fcf
- Updated: not yet

## Key Decisions Made
- Transitioned project scope to the new ORIGINAL_REQUEST.md requirements focusing on full-stack diagnostic sweep and compile-time/runtime/UX resolution.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_1 | teamwork_preview_explorer | M1: TypeScript Diagnostics | in-progress | 6e9eb0ae-34e9-42a6-881b-fd54d9440660 |
| explorer_2 | teamwork_preview_explorer | M1: ESLint Diagnostics | in-progress | dcead676-3603-4f52-8246-d647216e565e |
| explorer_3 | teamwork_preview_explorer | M1: Jest/UX Diagnostics | in-progress | 9835a2ca-0279-4002-805a-0276c8b8057f |

## Succession Status
- Succession required: no
- Spawn count: 3 / 16
- Pending subagents: 6e9eb0ae-34e9-42a6-881b-fd54d9440660, dcead676-3603-4f52-8246-d647216e565e, 9835a2ca-0279-4002-805a-0276c8b8057f
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 1ef45b7e-9fac-41ca-89bf-0dd1735d6c8d/task-65
- Safety timer: 1ef45b7e-9fac-41ca-89bf-0dd1735d6c8d/task-75
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- /Users/sac/expo-supabase-ai-template/.agents/ORIGINAL_REQUEST.md — Original User Request
- /Users/sac/expo-supabase-ai-template/PROJECT.md — Global Project Plan
- /Users/sac/expo-supabase-ai-template/.agents/orchestrator/BRIEFING.md — Persistent memory state
