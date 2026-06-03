## 2026-06-02T17:59:24-07:00

Please act as teamwork_preview_worker.
Your working directory is: /Users/sac/expo-supabase-ai-template/.agents/worker_transform_gpu_fix
Your task is to fix the NativeWind transform render crash in the switch knobs:

### Task 1: Remove transform-gpu
1. In `/Users/sac/expo-supabase-ai-template/src/app/(tabs)/account.tsx`, find all occurrences of `transform-gpu` (around lines 571, 594, 617, and 640) and remove them from the template/className strings.
2. In `/Users/sac/expo-supabase-ai-template/src/app/admin/settings.tsx` line 12, find and remove `transform-gpu` from the className string of the knob `View`.

### Task 2: Verification
After applying the fixes, run:
1. TypeScript check: `npx tsc --noEmit`
2. ESLint check: `npx eslint .` (must pass with 0 errors/warnings)
3. Unit tests: `npx jest --watchAll=false` (all 1454 tests must pass)
4. Route capture and OCR validation:
   - `bash scripts/capture_all_routes.sh`
   - `bash scripts/validate_ocr.sh`
Ensure that these scripts run cleanly without fatal React Native transform violations or render crashes.

Write your report to `/Users/sac/expo-supabase-ai-template/.agents/worker_transform_gpu_fix/handoff.md` and report back via `send_message`.
