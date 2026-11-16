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

## Follow-up — 2026-06-03T19:40:20Z

# Teamwork Project Prompt

Fix all critical UX/UI issues identified by the 10-agent swarm audit in the TRUEX Expo template codebase, specifically unifying the design system around `@pcp` primitives, resolving the routing architecture disconnect and context loss, standardizing accessibility touch targets, implementing keyboard safety, unifying animation/haptic systems, and integrating the AutoFixer recovery mechanism into the main ErrorBoundary.

Working directory: /Users/sac/expo-supabase-ai-template
Integrity mode: demo

## Requirements

### R1. Navigation & Routing Architecture
- Secure routes via cryptographic gating components (`ProtectedRoute`, `ReceiptTheaterGuard`) instead of brittle layout-level redirections.
- Retain global navigation context when in the admin stack to prevent user dead ends.
- Manage/secure quarantined routes (`openai`, `audit`) cleanly.

### R2. Design System & Theme Unification
- Unify the theme to follow the `@pcp` framework primitives, resolving the split between "SaaS-lite" and "Post-Cyberpunk" design.
- Sync parallel color systems (`Colors.ts` and `defaults.ts`) and ensure dynamic theme adjustments function on all screens (Auth, Admin, Dashboard, Account).
- Resolve WCAG contrast violation on Auth screen.

### R3. Accessibility (A11y)
- Standardize all touch targets of interactive elements to be at least 44px.
- Equip core UI components with accessibility roles.
- Integrate the unused `A11yAuditor` and `AdaptivePressable` systems into the production UI.

### R4. Feedback, Transitions & Perceived Performance
- Implement haptic feedback on critical actions using `IntelligentHaptics`.
- Unify animation framework under Reanimated, removing legacy Animated API usages, and implement entrance/fade/stagger transitions.
- Add skeleton screen loading animations to prevent jumpy layout shifts.

### R5. Form Handling UX
- Address keyboard interference using `KeyboardAvoidingView` or a unified `KeyboardSafeForm` on Account and dynamic forms.
- Provide visual focus indicators for active inputs.
- Correct numeric parser bug in `SemanticForm` to support decimal inputs.

### R6. Resilience & Responsive Design
- Replace static `Dimensions.get` calls with dynamic dimensions and apply `maxWidth` constraints for large screens.
- Avoid platform-specific mismatches (like native alerts/animations) on Web.
- Integrate the `AutoFixer` system with the root `ErrorBoundary` to allow automated UI recovery.

## Acceptance Criteria

### Navigation & Routing
- [ ] Application gating prevents access to secure components unless proper session criteria are met.
- [ ] Navigation out of the admin stack is consistently possible without losing the global tab bar context or getting stuck.

### Theme & Styling
- [ ] All pages successfully toggle between dark and light modes, obeying the system setting.
- [ ] Design tokens unify color palettes between `Colors.ts` and `@pcp` primitives.
- [ ] Text contrast on the Auth screen meets WCAG AA standards.

### Accessibility
- [ ] Critical button targets and navigation links have height and width of at least 44px.
- [ ] Core UI primitives (Button, Badge) specify default accessibilityRole definitions.
- [ ] Auditor reports zero touch target violations for critical paths.

### Form & Logic
- [ ] Decimal characters (e.g., `.`) can be typed and processed correctly in numeric form inputs.
- [ ] Text inputs do not get obscured by the soft keyboard on standard devices.

### Resilience
- [ ] Root `ErrorBoundary` catches simulated UI crashes and triggers `AutoFixer` options instead of showing raw error traces.

### Test Coverage & Verification
- [ ] Run the existing Jest test suite (`npm run test`) successfully.
- [ ] Add new programmatic Jest tests to verify routing gating, accessibility standard touch targets, and form parsing fixes.
- [ ] All unit/integration tests pass.

## 2026-06-03T22:23:57Z

# Teamwork Project Prompt

Launch a coordinated team of 10 Internet search agents to find innovative libraries, best practices, and integration strategies tailored to the TRUEX/Pcp (Post-Cyberpunk/Ambient) Framework stack.

Working directory: /Users/sac/expo-supabase-ai-template
Integrity mode: demo

## Requirements

### R1. Codebase Architecture Alignment
- The agents must scan the existing codebase (`package.json`, `src/framework/docs/ARCHITECTURE.md`, etc.) to align recommendations with current stack layers (React Native, Expo, SQLite, Rust, Supabase, and ZKP/crypto).

### R2. Coordinated Web Search Swarm
- Delegate search roles to 10 distinct agents/streams to research different categories:
  1. Local-first state synchronization and satellite transport databases.
  2. Zero-Knowledge Proofs (ZKP) and decentralized identity (DIDs).
  3. Ambient/holographic visual renderers and device vital sensors.
  4. Post-quantum cryptographic algorithms (Lattice-based ML-KEM/ML-DSA).
  5. Low-latency edge-AI inference engine layers.
  6. High-fidelity haptic engines and interaction wrappers.
  7. Typestate engineering and static analysis tooling for Rust/TS integration.
  8. Self-healing system supervision models and crash-recovery patterns.
  9. Energy-efficient background sync policies.
  10. Developer experience (DX) test generation and fuzzer automation frameworks.

### R3. Comprehensive Integration Report
- Write a unified markdown report at `/Users/sac/expo-supabase-ai-template/RESEARCH_REPORT.md`.
- Each recommended library or best practice must include:
  - Library name and links to source repositories/documentation.
  - Evaluation of how it fits within the layered Pcp stack.
  - A brief integration blueprint or mock code snippet demonstrating usage.

## Acceptance Criteria

### Research Coverage
- [ ] At least 10 distinct innovative libraries or best practices are identified and evaluated.
- [ ] Valid URLs to source code repositories or official docs are provided for all findings.

### Report Quality
- [ ] Each recommendation includes a concrete integration code snippet or schema blueprint.
- [ ] The report is structured in clear Markdown and saved at `/Users/sac/expo-supabase-ai-template/RESEARCH_REPORT.md`.

