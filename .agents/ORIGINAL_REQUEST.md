# Original User Request

## 2026-06-03T00:25:09Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Execute the delegated project through the teamwork_preview subagent.

Conduct a comprehensive full-stack sweep to find and fix all remaining issues, technical debt, and bugs across the application.

Working directory: /Users/sac/expo-supabase-ai-template
Integrity mode: benchmark

## Requirements

### R1. Full-Stack Diagnostic Sweep
Perform a comprehensive scan across the workspace to identify unresolved technical debt, structural flaws, and semantic inconsistencies.

### R2. Compile-Time and Runtime Resolution
Fix all discovered TypeScript violations, strict ESLint warnings, runtime panics, unhandled promise rejections, and DB/state schema mismatches.

### R3. Visual and Component Integrity
Identify and resolve any missing components, visual overflows, broken links, or UX degradation in the Expo layout and routing structure.

## Acceptance Criteria

### Static Analysis Verification
- [ ] Programmatic: `npx tsc --noEmit` and `npx eslint .` complete with absolutely zero errors or warnings.

### Runtime Verification
- [ ] Programmatic: All unit test suites and Detox UI tests execute cleanly without any unhandled exceptions or panics.

### UX Resolution Verification
- [ ] Agent-as-Judge: An independent auditor agent reviews the UI codebase and confirms that all identified visual overflows, missing components, and broken links have been structurally patched.
