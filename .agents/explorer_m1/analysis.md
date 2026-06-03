# Milestone 1: Exploration & Setup - Detailed Analysis Report

## Summary of Findings
We have completed a comprehensive read-only investigation of the test frameworks, configurations, and capabilities across the `expo-supabase-ai-template` and `pcp` directories. We identified critical syntax and mock setup errors blocking the execution of existing test suites, located the 10 capability modules in the PCP repository that currently lack dedicated unit tests, and verified that no Detox E2E configurations currently exist.

---

## 1. Directory Structure and Configuration Files

Both directories contain standard React Native and TypeScript configurations. Below is the summary of configuration files located in each workspace:

| Config File / Tool | `/Users/sac/expo-supabase-ai-template` | `/Users/sac/pcp` | Notes / Details |
| :--- | :--- | :--- | :--- |
| **Jest Configuration** | `jest.config.js` | `jest.config.js` | Both repositories use `jest-expo` preset. `pcp` includes a custom `setupFilesAfterEnv` property targeting `src/test/jest-setup.ts`. |
| **Babel Configuration** | `babel.config.js` | `babel.config.js` | Both configure `react-native-worklets/plugin`. `pcp` conditionally injects `nativewind/babel` and JSX import source based on whether Jest is running (`process.env.NODE_ENV === 'test'`). |
| **TypeScript Config** | `tsconfig.json` | `tsconfig.json` | The template extends `expo/tsconfig.base` and maps paths like `@pcp/*` and `@wasm4pm/types`. `pcp` targets `ESNext` and `CommonJS`. |
| **Detox E2E Config** | *None* | *None* | No `.detoxrc.js` or `detox.config.js` files are present in either repository. |

---

## 2. Test Execution and Failure Analysis

We ran the existing test suites in both repositories using the Jest testing framework. The execution results and specific blockers are detailed below.

### A. Template Workspace (`/Users/sac/expo-supabase-ai-template`)
* **Command Executed:** `npx jest --watchAll=false`
* **Result:** **Failed (182 / 182 test suites failed to run)**
* **Root Cause:**
  The Jest setup in `/Users/sac/expo-supabase-ai-template/src/test/jest-setup.ts:107` attempts to mock `react-native-worklets-core`:
  ```typescript
  jest.mock('react-native-worklets-core', () => {
    return {
      makeMutable: jest.fn((v: any) => ({ value: v })),
      makeShareable: jest.fn((v: any) => v),
      runOnJS: jest.fn((v: any) => v),
      runOnUI: jest.fn((v: any) => v),
    };
  });
  ```
  Since `react-native-worklets-core` is **not installed** in `node_modules` (the template package.json only specifies `"react-native-worklets": "0.8.3"`), Jest fails to resolve the module path, resulting in:
  `Cannot find module 'react-native-worklets-core' from 'src/test/jest-setup.ts'`
  
  **Verification:** A grep search across the `src/` directory confirms there are no actual import statements referencing `react-native-worklets-core` in the template's source files. It is only referenced inside the Jest mock itself.

### B. PCP Workspace (`/Users/sac/pcp`)
* **Command Executed:** `npm run test` (mapped to `jest` in package.json)
* **Result:** **Failed (7 Test Suites Failed, 207 Passed out of 214 total)**
* **Detailed Failures:**

#### 1. Syntax Error in `mmkvStorage.ts` (Impacts 5 test suites)
* **Impacted Test Suites:**
  * `src/framework/data/export/__tests__/export.test.ts`
  * `src/lib/store/mmkvStorage.test.ts`
  * `src/framework/ui/auto-fix/__tests__/analyzer.test.ts`
  * `src/framework/dx/ab-testing/__tests__/ab-testing.test.tsx`
  * `src/framework/state/__tests__/storage.test.ts`
* **Root Cause:**
  The file `pcp/src/lib/store/mmkvStorage.ts` contains corrupted syntax around lines 23-26:
  ```typescript
  23:   removeItem: (name: string): void => {
  24:  * @returns A Zustand StateStorage adapter and its underlying MMKV instance.
  25:  */
  26: export function createIsolatedMMKVStorage(storeId: string): {
  ```
  The implementation of the `removeItem` function is cut off, lacking its body braces and the closing syntax of the `mmkvStorage` object.

#### 2. Logic Failures in `AutoSyncState.test.ts`
* **Failed Assertions:**
  * `expect(mockSet).toHaveBeenCalled()` received 0 calls.
  * `expect(result.current[0]).toBe('cached-value')` received `"initial"`.
* **Root Cause:**
  In `pcp`, `useAutoSyncState` calls `createStorageAdapter` from `src/framework/state/storage.ts`. However, `pcp/src/framework/state/storage.ts` was implemented using a dummy mock Map:
  ```typescript
  export function createStorageAdapter(storeId: string): StorageAdapter {
    const store = new Map<string, string>();
    const storage: StateStorage = {
      setItem: (name: string, value: string): void => { store.set(name, value); },
      getItem: (name: string): string | null => { return store.get(name) ?? null; },
      removeItem: (name: string): void => { store.delete(name); },
    };
    return { storage, instance: store };
  }
  ```
  The unit test for `AutoSyncState` mocks `react-native-mmkv` directly and expects it to be invoked. Because the PCP storage adapter does not use `react-native-mmkv` at all, the assertions fail. (Note: The template workspace has a correct MMKV-backed `createStorageAdapter` implementation).

#### 3. Out-Of-Memory Error in `InclusiveUI.test.tsx`
* **Output:**
  `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`
  * **Root Cause:** Running 214 test suites in a single process results in Node.js memory leaks due to large dependency graphs (React Native, Reanimated mocks, etc.).

---

## 3. TypeScript Compilation Issues

Running `npm run typecheck` or `npx tsc --noEmit` highlighted two critical compilation blocks:

1. **PCP Workspace (`pcp`):**
   * Compilation halts early with syntax errors (TS1109, TS1005) in `src/lib/store/mmkvStorage.ts` due to the truncated code.
2. **Template Workspace (`expo-supabase-ai-template`):**
   * Syntax error in `src/components/AutonomicSimulationManager.tsx:22`:
     ```typescript
     const mockCommandId = \`mock-cmd-\${Date.now()}-\${Math.floor(Math.random() * 10000)}\`;
     ```
     The template strings in this TSX component have backslashes escaping their backticks. Since they are code expressions and not string literals, this escapes the syntax boundaries and throws compiler/parser errors.

---

## 4. Capability Files under `/Users/sac/pcp/src/capabilities/`

We mapped the 10 capability directories in the PCP codebase. Currently, there are **no unit test files** under any capability folder. Below is the breakdown of what needs to be tested for each:

1. **Causality (`causality/index.ts`)**
   * **Scope:** `CausalConsistency` class.
   * **Test Targets:** `validate()` for cycles, missing events (`MissingSourceEvent`, `MissingTargetEvent`), disconnected paths; `evaluateSequence()` for event sequences order constraints.
2. **Conformance (`conformance/index.ts`)**
   * **Scope:** `ConformanceEngine` class.
   * **Test Targets:** `validate()` inputs; `execute()` simulation outputs (fitness, precision, F1, simplicity, generalization metrics); verifying refusal states (`FitnessUnavailable`, `PrecisionUnavailable`, etc.).
3. **Multiperspective (`multiperspective/MultiperspectiveLog.ts`)**
   * **Scope:** `MultiperspectiveLog` class.
   * **Test Targets:** Registration logic for roles, resources, refusals, and events; checking resource-to-role mappings and event perspective types boundaries.
4. **Object Lifecycle (`object_lifecycle/ObjectLifecycle.ts`)**
   * **Scope:** `ObjectLifecycle` class.
   * **Test Targets:** State registration (Initial, Active, Terminal phases); transition validation; trigger tracking; historic state transitions logs.
5. **Prediction (`prediction/index.ts`)**
   * **Scope:** `PredictionEngine` class.
   * **Test Targets:** `validate()` prefix sequences and target metrics; `execute()` simulation results for next activities, risks, compliance constraints, and drift signals.
6. **Process Cube (`process_cube/index.ts`)**
   * **Scope:** `ProcessCube` class.
   * **Test Targets:** Slicing, dicing, and pivoting operations; roll-up and drill-down time/case/activity hierarchies; handling dimension errors.
7. **Process Tree (`process_tree/index.ts`)**
   * **Scope:** `ProcessTreeEngine` class.
   * **Test Targets:** Soundness validations for loops, parallel branches, exclusive choices; extraction of activity sets; boundary panic triggers.
8. **Streaming (`streaming/EventWindow.ts`, `OfflineEvidence.ts`, `OnlineEvidence.ts`)**
   * **Scope:** Event stream window buffers.
   * **Test Targets:** Event sorting by timestamp; window closing boundaries; capacity overflow errors (`BufferOverflow`); online rule checks; offline batch aggregations.
9. **Temporal (`temporal/index.ts`)**
   * **Scope:** `TemporalAnalyzer` class.
   * **Test Targets:** Monotonic timestamp verification; clock drift thresholds (`ClockDriftDetected`); computing pairwise relation profiles ("Before", "After", "Concurrent").
10. **Workflow (`workflow/index.ts`)**
    * **Scope:** `WorkflowEngine` class.
    * **Test Targets:** Branch state changes (`START_BRANCH`, `COMPLETE_BRANCH`, `CANCEL_BRANCH`); joining concurrent execution flows; ensuring branch token uniqueness.

### Getting Code Coverage
To collect code coverage for capabilities, run:
```bash
npm run test -- --coverage
```
Since the `jest.config.js` in PCP specifies `collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.test.{js,jsx,ts,tsx}']`, writing tests directly inside the capability subdirectories (e.g., `pcp/src/capabilities/causality/__tests__/causality.test.ts`) will automatically include them in the coverage reports.

---

## 5. Testing Recommendations

### Unit Testing
1. **Fix Worklet Mocking:** Add `{ virtual: true }` to the `react-native-worklets-core` mock inside `/Users/sac/expo-supabase-ai-template/src/test/jest-setup.ts`.
2. **Resolve MMKV Syntax:** Restore the missing braces in `pcp/src/lib/store/mmkvStorage.ts` for the `removeItem` function.
3. **Bridge Storage Adapters:** Replace the plain Map storage implementation in `pcp/src/framework/state/storage.ts` with the actual MMKV adapter implementation currently present in `expo-supabase-ai-template/src/framework/state/storage.ts`.
4. **Fix TSX Escaped Backticks:** Remove the escaping backslashes from the template strings inside `expo-supabase-ai-template/src/components/AutonomicSimulationManager.tsx`.
5. **Mitigate Memory Leaks:** Execute Jest with bounded resource limits:
   ```bash
   npm run test -- --maxWorkers=2 --logHeapUsage
   ```
6. **Capability Tests:** Create test files co-located within each capability directory to test all logical boundaries, including panic checks.

### E2E Testing (Detox Setup)
1. **Scaffold Detox:** Initialize Detox in `expo-supabase-ai-template` using `npm install detox --save-dev` and `npx detox init`.
2. **Target Setup:** Configure `.detoxrc.js` for both iOS Simulator and Android Emulator build configurations (pointing to Debug / Release `.app` and `.apk` targets).
3. **Mock Side-Effects:** Since E2E tests should not rely on external AI inference or external Supabase DB states, create mock layers (e.g. `src/lib/supabase.mock.ts` or a localized mock server) enabled via a custom Metro transformer during E2E builds.
4. **Automated Scripts:** Write test cases under `e2e/` covering:
   * Launching the application and resolving landing routing.
   * Realtime event streaming / Swarm Simulation updates on the dashboard.
   * Offline synchronization fallback.

### Security Testing
1. **Post-Quantum Cryptography Auditing:** Write direct unit tests for `src/framework/2030/identity/PostQuantumIdentity.ts` validating key generation correctness, signature verification, and refusal on malformed/tampered quantum keys.
2. **ZKP & MFA Verification:** Set up edge-case testing for Zero-Knowledge Proof validations and MFA confirmation codes to ensure brute-force resistance and replay-attack rejection.
3. **Static Scans & Audit:** Implement `npm audit` and Semgrep rules checking for vulnerable packages or insecure coding practices (like `eval` or unsafe SQLite queries).
