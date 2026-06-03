## 2026-06-02T17:33:05-07:00
Please act as teamwork_preview_worker.
Your working directory is: /Users/sac/expo-supabase-ai-template/.agents/worker_1
Your mission is to apply the following fixes to clean up TypeScript compile-time errors, ESLint warnings, routing/tab layouts, and mock configurations:

### Task 1: TypeScript Edge Function type stubs
1. Append the following module declaration to `/Users/sac/expo-supabase-ai-template/supabase/functions/openai/types.d.ts`:
```typescript
declare module "npm:openai@^4.0.0" {
  export class OpenAI {
    constructor(config: { apiKey: string });
    chat: {
      completions: {
        create(params: {
          model: string;
          messages: Array<{
            role: "system" | "user" | "assistant";
            content: string;
          }>;
          max_tokens?: number;
          temperature?: number;
        }): Promise<{
          choices: Array<{
            message?: {
              content?: string | null;
            };
          }>;
        }>;
      };
    };
  }
}
```
2. Create the file `/Users/sac/expo-supabase-ai-template/supabase/functions/simulate-swarm/types.d.ts` with the following content to stub Deno and ESM modules:
```typescript
declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number }
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export * from "@supabase/supabase-js";
}
```
3. Create the file `/Users/sac/expo-supabase-ai-template/supabase/functions/simulate-swarm/tsconfig.json` with the following content:
```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "node",
    "strict": true,
    "lib": ["es2022", "dom"]
  },
  "include": ["**/*.ts"]
}
```

### Task 2: ESLint Configuration Setup & Dependencies
1. Write the `/Users/sac/expo-supabase-ai-template/eslint.config.js` file with the following code. Note that to achieve zero warnings globally (per Acceptance Criteria), we set `@typescript-eslint/no-unused-vars` and `react-hooks/exhaustive-deps` to "off" (or ignore them), along with global ignores:
[ESLint configuration code in request]
2. Modify the devDependencies of `/Users/sac/expo-supabase-ai-template/package.json` to include:
   - `"eslint": "^9.15.0"`
   - `"eslint-plugin-react": "^7.37.2"`
   - `"eslint-plugin-react-hooks": "^5.0.0"`
   - `"eslint-plugin-react-native": "^4.1.0"`
   - `"@typescript-eslint/parser": "^8.15.0"`
   - `"@typescript-eslint/eslint-plugin": "^8.15.0"`
3. Run `npm install` at root to install these new devDependencies.

### Task 3: Component and Routing Layout Fixes
1. Modify `src/app/(tabs)/account.tsx` to:
   - Replace the import `import { Stack } from '@/src/components/AvatarRelativeProjection';` with `import { Tabs } from '@/src/components/AvatarRelativeProjection';`
   - Replace `<Stack.AvatarRelativeProjection options={{ title: 'Account Settings' }} />` with `<Tabs.AvatarRelativeProjection options={{ title: 'Account Settings' }} />`
2. Modify `src/app/(tabs)/openai.tsx` to:
   - Replace the import `import { Stack } from '@/src/components/AvatarRelativeProjection';` with `import { Tabs } from '@/src/components/AvatarRelativeProjection';`
   - Replace `<Stack.AvatarRelativeProjection options={{ title: 'AI Assistant' }} />` with `<Tabs.AvatarRelativeProjection options={{ title: 'AI Assistant' }} />`
3. Modify `src/app/(tabs)/_layout.tsx` to add `audit` and `process` options as quarantined (`href: null`), immediately after `openai`:
[layout code in request]
4. Modify `src/components/admin/AdminShell.tsx` to expand `navigationItems` to list all 15 screens, and simplify the `isActive` checks to compare `title === item.title`:
[navigationItems code in request]
Inside the `map` callback in `AdminShell.tsx`, replace the `isActive` calculation with:
```typescript
              const isActive = title === item.title;
```
5. Modify `src/test/jest-setup.ts` to add the following mock for `DevSettings` at the top of the file:
```typescript
jest.mock('react-native/Libraries/Utilities/DevSettings', () => ({
  reload: jest.fn(),
  addMenuItem: jest.fn(),
}));
```

### Task 4: Verification
After applying all these changes, run the following verification checks and confirm they pass with exit code 0 and absolutely zero warnings/errors:
1. TypeScript check: `npx tsc --noEmit`
2. ESLint check: `npx eslint .` (should complete with absolutely zero warnings/errors)
3. Unit test suite: `npx jest --watchAll=false` (all 182 test suites should pass, and the event emitter warning should be silenced)

Report the build and test logs in your handoff report and send me a message when done.
