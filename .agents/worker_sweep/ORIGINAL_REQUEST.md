## 2026-06-02T17:31:56-07:00

You are the Worker agent for the Full-Stack Sweep (Milestone 2 & 3).
Your working directory is: `/Users/sac/expo-supabase-ai-template/.agents/worker_sweep/`

Your mission is to implement all compile-time, lint, routing, and UX fixes to fulfill the requirements:

1. **Fix Edge Function TypeScript Errors**:
   - In `/Users/sac/expo-supabase-ai-template/supabase/functions/openai/types.d.ts`, add:
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
   - In `/Users/sac/expo-supabase-ai-template/supabase/functions/simulate-swarm/types.d.ts`, create type declarations for Deno standard modules and globals, e.g.:
     ```typescript
     declare module "https://deno.land/std@0.177.0/http/server.ts" {
       export function serve(handler: (req: Request) => Promise<Response> | Response, options?: any): void;
     }
     declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
       export * from '@supabase/supabase-js';
     }
     declare const Deno: any;
     ```
     Ensure that implicit any parameters are typed or declaration errors are resolved, and verify it checks cleanly.

2. **Create Project ESLint Configuration**:
   - Write `/Users/sac/expo-supabase-ai-template/eslint.config.js` to define the project-wide linter rules. Use the configuration structure proposed by `explorer_2` in `/Users/sac/expo-supabase-ai-template/.agents/explorer_m1_2/proposed_eslint.config.js`.
   - Set the rules `@typescript-eslint/no-unused-vars` to `"off"` and `react-hooks/exhaustive-deps` to `"off"`.
   - Remove the unused `eslint-disable` directive inside `/Users/sac/expo-supabase-ai-template/src/route-law/ReceiptTheaterGuard.tsx` at line 129.

3. **Resolve UX Navigation Screen Mismatches**:
   - In `/Users/sac/expo-supabase-ai-template/src/app/(tabs)/account.tsx`:
     - Change the import on line 23: import `Tabs` instead of `Stack` from `@/src/components/AvatarRelativeProjection`.
     - Change line 356: Replace `<Stack.AvatarRelativeProjection ... />` with `<Tabs.AvatarRelativeProjection ... />`.
   - In `/Users/sac/expo-supabase-ai-template/src/app/(tabs)/openai.tsx`:
     - Change the import on line 26: import `Tabs` instead of `Stack` from `@/src/components/AvatarRelativeProjection`.
     - Change line 617: Replace `<Stack.AvatarRelativeProjection ... />` with `<Tabs.AvatarRelativeProjection ... />`.

4. **Resolve Unregistered Tab Screen Pollution**:
   - In `/Users/sac/expo-supabase-ai-template/src/app/(tabs)/_layout.tsx`, register `audit` and `process` screens using `<Tabs.AvatarRelativeProjection name="..." options={{ href: null }} />` so that they are hidden/quarantined from the bottom tab bar.

5. **Resolve Orphaned Admin Pages**:
   - Inspect the admin screen files under `src/app/admin/` to get their layout titles.
   - Update `/Users/sac/expo-supabase-ai-template/src/components/admin/AdminShell.tsx`'s `navigationItems` array to include quick navigation links for all 15 admin pages, adjusting active status checks to prevent any of them from being orphaned.

6. **Verify All Checks Pass Programmatically**:
   - Run standard TypeScript check: `npx tsc --noEmit`.
   - Run custom typescript check on tests: `npx tsc -p .agents/explorer_m1_1/tsconfig.test.json --extendedDiagnostics`.
   - Run eslint: `npx eslint .`. Ensure it completes with exit code 0 and absolutely ZERO errors and ZERO warnings.
   - Run Jest tests: `npx jest --watchAll=false` to verify they compile and pass (using `--maxWorkers=2` to prevent heap leaks).

7. **Deliver Report**:
   - Write a detailed handoff report to `/Users/sac/expo-supabase-ai-template/.agents/worker_sweep/handoff.md` and send a status update message back to the Orchestrator (conversation ID: `eb667118-634e-4d4a-bc07-77ca09b833c1`).
