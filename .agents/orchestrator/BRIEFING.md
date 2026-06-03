# BRIEFING — 2026-06-02T16:38:09-07:00

## Mission
Execute the project described in ORIGINAL_REQUEST.md to comprehensively bulletproof the Expo application across unit, E2E, and security boundaries, ensuring >90% code coverage on advanced capabilities.

## 🔒 My Identity
- Archetype: self
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: /Users/sac/expo-supabase-ai-template/.agents/orchestrator
- Original parent: main agent
- Original parent conversation ID: 082ae6d9-d3d6-4bec-b0cc-68e4ca0a7513

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: /Users/sac/expo-supabase-ai-template/.agents/orchestrator/plan.md
1. **Decompose**: Decompose the project into milestones: unit testing (R1), E2E & visual validation (R2), and security & hardening (R3).
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
  1. Initialize Project plan and progress tracking [in-progress]
  2. R1: Comprehensive Unit Testing for advanced capabilities and components [pending]
  3. R2: E2E and Visual Validation with Detox [pending]
  4. R3: Security Audit, Fuzzing, and Error Boundaries [pending]
- **Current phase**: 1
- **Current focus**: Initialize plan.md and progress.md

## 🔒 Key Constraints
- Never write, modify, or create source code files directly.
- Never run build/test commands yourself — require workers to do so.
- File-editing tools may only be used for metadata/state files (.md) in .agents/ folder.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.
- Zero tolerance for hardcoded test results, facade implementations, or fabricated verification outputs.

## Current Parent
- Conversation ID: 082ae6d9-d3d6-4bec-b0cc-68e4ca0a7513
- Updated: not yet

## Key Decisions Made
- Sibling folder `pcp/src/capabilities/` identified as the target folder for the advanced capability modules.
- Plan to delegate tasks using a structured Project/Sub-orchestrator pattern to specialized subagents.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_m1 | teamwork_preview_explorer | M1: Exploration & Setup | completed | 427faa82-89de-4f5d-a07b-098707a158dc |
| worker_setup | teamwork_preview_worker | M1.2: Environment Setup | in-progress | 3d392b09-aec3-4240-9758-39c43e250714 |

## Succession Status
- Succession required: no
- Spawn count: 2 / 16
- Pending subagents: 3d392b09-aec3-4240-9758-39c43e250714
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: eb667118-634e-4d4a-bc07-77ca09b833c1/task-47
- Safety timer: none

## Artifact Index
- /Users/sac/expo-supabase-ai-template/.agents/orchestrator/ORIGINAL_REQUEST.md — Original User Request
- /Users/sac/expo-supabase-ai-template/.agents/orchestrator/BRIEFING.md — Persistent memory state
