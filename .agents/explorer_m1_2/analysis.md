# ESLint Static Analysis Report

## Executive Summary
A static analysis investigation was conducted on the `expo-supabase-ai-template` repository using ESLint (v9.39.4). The analysis parsed all TypeScript (`.ts`, `.tsx`) and JavaScript (`.js`, `.jsx`) files. 

Initial runs of `npx eslint .` failed due to the absence of an ESLint configuration file and parser mismatch for TypeScript syntax. To perform a robust and complete investigation without modifying the project's root files (violating the read-only constraint), a localized ESLint environment was initialized under `.agents/explorer_m1_2`.

The final configuration used includes parser support for TypeScript (`@typescript-eslint/parser`), TypeScript rules (`@typescript-eslint/eslint-plugin`), React (`eslint-plugin-react`), React Hooks (`eslint-plugin-react-hooks`), and React Native (`eslint-plugin-react-native`).

The static analysis identified a total of **349 warnings** across the codebase:
- **`@typescript-eslint/no-unused-vars`**: 312 warnings (unused imports, unused local variables, unused parameters, and unused catch bindings).
- **`react-hooks/exhaustive-deps`**: 36 warnings (missing dependency arrays or omitted reactive values in React Native hooks).
- **Unused eslint-disable directive**: 1 warning.

---

## 1. Investigation Methodology
To execute the static analysis cleanly and respect the read-only and workspace conventions:
1. Initialized a package workspace inside `.agents/explorer_m1_2` by running `npm init -y`.
2. Installed linting tools locally: `eslint@9`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-native`.
3. Created a custom `proposed_eslint.config.js` configuration inside the agent folder mapping flat config patterns, typescript configurations, and react hooks configurations.
4. Executed ESLint from the project root referencing the local binary and config:
   ```bash
   NODE_PATH=.agents/explorer_m1_2/node_modules .agents/explorer_m1_2/node_modules/.bin/eslint -c .agents/explorer_m1_2/proposed_eslint.config.js .
   ```
5. Logged the findings into `.agents/explorer_m1_2/proposed_eslint_report.txt` and summarized them.

---

## 2. Categorized Findings & Key Locations

### Category A: Unused Variables (`@typescript-eslint/no-unused-vars`)
* **Total Occurrences**: 312 warnings
* **Description**: Variables, functions, parameters, or import statements are declared but never utilized. 
* **Key Locations & Examples**:

1. **Unused Component Imports**:
   - `src/app/(tabs)/audit.tsx` (Line 2): `'Dimensions' is defined but never used.`
   - `src/app/_layout.tsx` (Line 19): `'GestureHandlerRootView' is defined but never used.`
   - `src/app/admin/realtime.tsx` (Line 2): `'StyleSheet' is defined but never used.`
   - `src/framework/ui/Button.tsx` (Line 2): `'StyleSheet', 'StyleProp', 'ViewStyle', 'TextStyle' are defined but never used.`

2. **Unused Functions & Hooks**:
   - `src/app/(tabs)/account.tsx` (Line 119): `'handleUsernameBlur' is assigned a value but never used.`
   - `src/app/(tabs)/account.tsx` (Line 129): `'handleAvatarBlur' is assigned a value but never used.`
   - `src/app/(tabs)/index.tsx` (Line 7): `'useAgiCourt' is defined but never used.`

3. **Unused Exception Variables (`catch (e)`)**:
   - `src/lib/actor/dispatcher.ts` (Lines 354, 389, 483, 533, 591, 643): `'e' is defined but never used.`
   - `src/app/admin/outbox.tsx` (Lines 38, 126, 158): `'e' is defined but never used.`
   - `src/framework/sync/compression/strategies.ts` (Lines 80, 92): `'e' is defined but never used.`
   - `src/framework/ui/a11y/hooks/useFocusTrap.ts` (Line 27): `'e' is defined but never used.`

4. **Unused API/Destructured Parameters**:
   - `src/app/(auth)/index.tsx` (Lines 245, 284): `'data' is assigned a value but never used.`
   - `src/framework/2030/adversarial/SybilMeshAdapter.ts` (Lines 25, 30, 41, 44): `'message', 'peerId', 'callback' are defined but never used.`
   - `src/framework/ai/on-device/__tests__/LocalInferenceEngine.test.ts` (Lines 46, 50, 51, 62): `'_req', '_onToken' are defined but never used.` (Note: prefixed with `_` but eslint wasn't configured to ignore them in default runs, which is resolved under the proposed configuration).

---

### Category B: React Hook Dependencies (`react-hooks/exhaustive-deps`)
* **Total Occurrences**: 36 warnings
* **Description**: React hooks (`useEffect`, `useCallback`, `useMemo`) omit reactive values (props, state, or callback functions) in their dependency arrays. This can result in stale closures, outdated state updates, or infinite render loops.
* **Key Locations & Examples**:

1. **Stale Closures due to Missing Dependencies**:
   - `src/app/(tabs)/account.tsx` (Line 196): `React Hook useEffect has a missing dependency: 'session'.`
   - `src/app/(tabs)/account.tsx` (Line 246): `React Hook useCallback has a missing dependency: 'session.user'.`
   - `src/app/admin/actor-lab.tsx` (Line 210, 347): `React Hook useEffect has a missing dependency: 'refreshState'.`
   - `src/components/VkgProvider.tsx` (Line 102): `React Hook useEffect has missing dependencies: 'activeHookId' and 'avatar'.`
   - `src/pcp/auth/AuthProvider.tsx` (Line 110): `React Hook useEffect has a missing dependency: 'setSession'.`

2. **Unnecessary Dependencies**:
   - `src/framework/core/i18n/I18nProvider.tsx` (Line 122): `React Hook useCallback has an unnecessary dependency: 'translations'.`
   - `src/framework/sync/crdt/hooks.ts` (Line 20): `React Hook useMemo has an unnecessary dependency: 'tick'.`

3. **Complex Expressions in Dependency Arrays**:
   - `src/framework/admin/collaboration/usePresence.ts` (Line 35): `React Hook useEffect has a complex expression in the dependency array. Extract it to a separate variable so it can be statically checked.`

---

### Category C: Unused ESLint Disable Directive
* **Total Occurrences**: 1 warning
* **Location**: `src/route-law/ReceiptTheaterGuard.tsx` (Line 129):
  ```typescript
  /* eslint-disable no-console */
  ```
* **Description**: An eslint disable comment was declared, but no violations of the specified rule (`no-console`) occurred in the file, making the directive redundant.

---

## 3. Concrete Fix Proposals

### Fix Proposal 1: Implement Project-wide ESLint Flat Configuration
To permanently configure ESLint for the project, create `eslint.config.js` in the project root (`/Users/sac/expo-supabase-ai-template/eslint.config.js`).

#### Proposed `eslint.config.js`:
```javascript
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const reactNativePlugin = require("eslint-plugin-react-native");

module.exports = [
  // 1. Global Ignores for generated/environment files
  {
    ignores: [
      "**/node_modules/**",
      "**/.expo/**",
      "**/.agents/**",
      "**/dist/**",
      "**/web-build/**"
    ]
  },

  // 2. TypeScript and React / React Native Source Configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        FormData: "readonly",
        WebSocket: "readonly",
        process: "readonly",
        __DEV__: "readonly",
        alert: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-native": reactNativePlugin
    },
    rules: {
      // Unused variables configured to ignore variables prefixed with an underscore
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],

      // Disable no-undef for TypeScript since type checking handles it
      "no-undef": "off",

      // React and React Native Hooks verification
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Clean up redundant directives
      "eslint-comments/no-unused-disable": "warn"
    }
  },

  // 3. JavaScript configuration/scripts environment (Node.js)
  {
    files: [
      "*.config.js",
      "*.config.ts",
      "babel.config.js",
      "metro.config.js",
      "postcss.config.js",
      "tailwind.config.js"
    ],
    languageOptions: {
      globals: {
        module: "readonly",
        exports: "readonly",
        require: "readonly",
        __dirname: "readonly",
        process: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn"
    }
  },

  // 4. Test Files Environment (Jest globals)
  {
    files: [
      "**/__tests__/**/*.ts",
      "**/__tests__/**/*.tsx",
      "**/*.test.ts",
      "**/*.test.tsx",
      "test-mock-worklets.js"
    ],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        module: "readonly",
        require: "readonly"
      }
    }
  }
];
```

#### Steps to Install Dev Dependencies:
Run the following command at the project root to install the necessary ESLint infrastructure:
```bash
npm install --save-dev eslint@9 @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-native
```

---

### Fix Proposal 2: Code Refactoring for Common Patterns

#### Code Fix 2.1: Resolving Unused Variables
- **Action**: Delete unused variables and unused imports.
- **Example in `src/app/_layout.tsx`**:
  - *Before*:
    ```typescript
    import { useEffect, useState } from 'react';
    ```
  - *After* (`useState` is never called, only `useEffect`):
    ```typescript
    import { useEffect } from 'react';
    ```

#### Code Fix 2.2: Resolving Unused Exception Bindings
- **Action**: Use ES2019 optional catch binding to omit unused `(e)` or `(err)` in try/catch blocks.
- **Example in `src/lib/actor/dispatcher.ts`**:
  - *Before*:
    ```typescript
    try {
      // operation
    } catch (e) {
      // error is ignored
    }
    ```
  - *After*:
    ```typescript
    try {
      // operation
    } catch {
      // optional binding removes unused 'e'
    }
    ```

#### Code Fix 2.3: Fixing Hook Dependency Arrays
- **Action**: Include omitted reactive bindings in hook dependencies, or wrap callbacks in `useCallback` to prevent stale closure warnings.
- **Example in `src/app/(tabs)/account.tsx`**:
  - *Before*:
    ```typescript
    useEffect(() => {
      if (session) {
        getProfile();
      }
    }, []); // missing dependency 'session'
    ```
  - *After*:
    ```typescript
    useEffect(() => {
      if (session) {
        getProfile();
      }
    }, [session]);
    ```
