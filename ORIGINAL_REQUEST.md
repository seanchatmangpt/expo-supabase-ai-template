# Original User Request

## Initial Request — 2026-06-02T16:37:59-07:00

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Execute the delegated project through the teamwork_preview subagent.

Launch a swarm of 10 subagents to comprehensively bulletproof the Expo application across unit, E2E, and security boundaries.

Working directory: /Users/sac/expo-supabase-ai-template
Integrity mode: benchmark

## Requirements

### R1. Comprehensive Unit Testing
Write exhaustive unit tests for all components and the advanced capability modules (`src/capabilities/*`) using Jest.

### R2. End-to-End & Visual Validation
Implement and perform end-to-end (E2E) testing and visual validation using Detox to ensure the critical flows (e.g., SSO bypass, autonomic DB seeding) function correctly in the simulator.

### R3. Security Audit & Fuzz Testing
Conduct a security audit, fuzz testing on the capability typestates, and edge-case hardening on error boundaries to ensure no unhandled crashes occur.

## Acceptance Criteria

### Unit Test Verification
- [ ] Programmatic: Running `npm run test` completes with 0 failures and achieves >90% code coverage on `src/capabilities/`.

### E2E Test Verification
- [ ] Programmatic: Running the Detox test suite successfully passes the core user flows without timeout or element-not-found errors.

### Security & Hardening Verification
- [ ] Agent-as-Judge: An independent auditor agent reviews the fuzz testing logs and confirms zero unhandled exceptions or invalid state transitions.
