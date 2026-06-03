## 2026-06-03T00:45:32Z
Please act as teamwork_preview_worker.
Your working directory is: /Users/sac/expo-supabase-ai-template/.agents/worker_supabase_ws_fix
Your task is to fix the critical bundler regression in `/Users/sac/expo-supabase-ai-template/lib/supabase.ts`.

### Task 1: Supabase WebSocket import fix
In `/Users/sac/expo-supabase-ai-template/lib/supabase.ts` lines 29-32, Metro tries to statically resolve `require('ws')`. Change it to use a variable name for the require argument so Metro ignores it during static bundling:
```typescript
if (isServer) {
  // Polyfill WebSocket for Supabase Realtime during SSR
  const wsModule = 'ws';
  global.WebSocket = require(wsModule);
}
```

### Task 2: Verification
After applying the fix, run the following verification steps:
1. TypeScript check: `npx tsc --noEmit`
2. ESLint check: `npx eslint .` (must pass with 0 errors, 0 warnings)
3. Unit test suite: `npx jest --watchAll=false`
4. Run the simulator capture and validation scripts:
   - `bash scripts/capture_all_routes.sh`
   - `bash scripts/validate_ocr.sh`
Ensure that these scripts execute successfully and do not crash with module resolution errors.

Write your report to `/Users/sac/expo-supabase-ai-template/.agents/worker_supabase_ws_fix/handoff.md` and report back via `send_message`.
