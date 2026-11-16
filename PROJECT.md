# Project: UI/UX & Routing Remediation

## Architecture & Scope
The project focuses on fixing all critical UX/UI and routing issues in the TRUEX Expo template codebase, specifically:
1. Navigation & Routing: cryptographic gating, context retention, quarantined routes security.
2. Design System & Theme: `@pcp` theme unification, dynamic color sync, WCAG contrast.
3. Accessibility: Touch targets >=44px, accessibility roles, A11yAuditor/AdaptivePressable.
4. Form Handling: Keyboard safe inputs, decimal input parsing.
5. Feedback & Animations: Reanimated transitions, skeleton loaders, IntelligentHaptics.
6. Resilience: AutoFixer ErrorBoundary integration, dynamic dimensions, web safety.

## Milestones
| # | Name | Scope | Dependencies | Status | Agent/Task ID |
|---|------|-------|-------------|--------|---------------|
| 1 | M1: Exploration & Diagnostics | Scan codebase for target areas, run tests to establish baseline | None | DONE | 50510b52-5d22-4538-9bc0-e6a092600200 |
| 2 | M2: Gating & Routing Remediation | Implement ProtectedRoute/ReceiptTheaterGuard gating, fix admin navigation, secure quarantined routes | M1 | DONE | b3192bdf-ca2a-4f63-9ff1-a16b983e3362 |
| 3 | M3: Theme & Contrast Unification | Unify theme under @pcp primitives, sync color systems, fix Auth contrast | M1 | DONE | 4e7d2696-d04d-42fc-a34c-6cb8cf2d6227 |
| 4 | M4: Accessibility & Forms | Touch targets >=44px, accessibility roles, KeyboardSafeForm, SemanticForm decimal parser | M1 | DONE | 2429e725-5fe2-4c16-befc-6f95e737f960 |
| 5 | M5: Feedback, Animations & Recovery | Reanimated transitions, IntelligentHaptics, skeleton screens, dynamic dimensions, AutoFixer in ErrorBoundary | M1 | DONE | 9e6d09e1-0eb7-4684-945e-0605cf4eb959 |
| 6 | M6: Verification & Hardening | Programmatic Jest test coverage, run tests and linter, final verification | M2-M5 | DONE | c1b29b7f-7a17-4c07-ba58-aafb221df461 |

## Interface Contracts & Guidelines
- Strict TypeScript: No `any` where type safety is compromised, resolve all type issues.
- Touch Targets: Ensure all touch targets of interactive elements are at least 44px.
- Accessibility: Equip core UI components with default accessibility roles.
- Animations & Feedback: Use Reanimated and IntelligentHaptics.
- Keyboard Safety: Use KeyboardSafeForm or KeyboardAvoidingView.
- Form Parsers: Support decimal inputs in SemanticForm.
