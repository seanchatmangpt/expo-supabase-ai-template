# plan.md — Project Plan for Expo-Supabase Bulletproofing

## Architecture & Scope
The project focuses on securing, testing, and hardening an Expo application with Supabase authentication and AI integration, as well as its core engine `pcp`.
There are three main boundaries to bulletproof:
1. **Unit Testing (R1)**: Test Expo components and all 10 advanced capability modules in `pcp/src/capabilities/` using Jest. Target: >90% code coverage on `src/capabilities/`.
2. **E2E & Visual Validation (R2)**: Implement and run Detox tests for simulator flows (SSO bypass, autonomic DB seeding).
3. **Security Audit & Fuzzing (R3)**: Fuzz capability typestates, audit security boundaries, harden error boundaries.

## Code Layout
- **Expo App Workspace**: `/Users/sac/expo-supabase-ai-template/`
- **Pcp Core Workspace**: `/Users/sac/pcp/`
- **Capabilities Target**: `/Users/sac/pcp/src/capabilities/`
  - Causality (`causality/`)
  - Conformance (`conformance/`)
  - Multiperspective (`multiperspective/`)
  - Object Lifecycle (`object_lifecycle/`)
  - Prediction (`prediction/`)
  - Process Cube (`process_cube/`)
  - Process Tree (`process_tree/`)
  - Streaming (`streaming/`)
  - Temporal (`temporal/`)
  - Workflow (`workflow/`)

## Milestones
| # | Milestone Name | Scope | Dependencies | Status | Agent/Task ID |
|---|----------------|-------|--------------|--------|---------------|
| 1 | **M1: Exploration & Setup** | Investigate current test frameworks, coverage, environment, Detox setup | None | DONE | 427faa82-89de-4f5d-a07b-098707a158dc |
| 1.2 | **M1.2: Env Setup Fixes** | Apply setup and compilation fixes for Jest and TypeScript | M1 | IN_PROGRESS | 3d392b09-aec3-4240-9758-39c43e250714 |
| 2 | **M2: Capabilities Unit Testing** | Write exhaustive Jest unit tests for the 10 capability modules in `pcp/src/capabilities/` to reach >90% coverage | M1 | PLANNED | TBD |
| 3 | **M3: App Components Unit Testing** | Write unit tests for the components in `/Users/sac/expo-supabase-ai-template/src/` | M1 | PLANNED | TBD |
| 4 | **M4: E2E and Visual Validation** | Implement Detox E2E tests for SSO bypass and autonomic DB seeding | M1 | PLANNED | TBD |
| 5 | **M5: Security Audit & Fuzz Testing** | Conduct security audit, fuzz typestates, harden error boundaries | M2, M3 | PLANNED | TBD |
| 6 | **M6: Verification & Handover** | Validate all tests pass, audit verification checks, and final handover | M2, M3, M4, M5 | PLANNED | TBD |

## Interface Contracts & Guidelines
- All capability modules must be tested in isolation (mocking dependencies where needed).
- Unit tests must be placed in appropriate `__tests__` directories or files matching `*.test.ts/tsx`.
- Detox tests must be runnable and target the Expo simulator.
- Zero-tolerance for hardcoded test bypasses or dummy implementations.
