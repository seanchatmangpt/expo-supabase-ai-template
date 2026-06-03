## 2026-06-02T23:42:59Z
You are the Worker agent for the environment setup (Milestone 1.2).
Your working directory is `/Users/sac/expo-supabase-ai-template/.agents/worker_setup/`
Your mission:
1. Fix the Jest mock for `react-native-worklets-core` in `/Users/sac/expo-supabase-ai-template/src/test/jest-setup.ts` by adding the `{ virtual: true }` parameter so that Jest doesn't fail when the module is not found.
2. Fix the escaped backticks and dollar signs in `/Users/sac/expo-supabase-ai-template/src/components/AutonomicSimulationManager.tsx` (on lines 22, 30, and 36) so it compiles cleanly without syntax/compile errors.
3. Fix the syntax in `/Users/sac/pcp/src/lib/store/mmkvStorage.ts` around lines 23-26 by adding the proper implementation for `removeItem` and closing the `mmkvStorage` object correctly, as well as importing `createMMKV, MMKV` from `'react-native-mmkv'` at the top of the file.
4. Bridge the storage adapter in `/Users/sac/pcp/src/framework/state/storage.ts` to use MMKV instead of a plain Map. You can reference the correct MMKV storage adapter implementation in `/Users/sac/expo-supabase-ai-template/src/framework/state/storage.ts`. Make sure to import `createMMKV` and `MMKV` from `'react-native-mmkv'`.
5. Verify these fixes by running the typecheckers (`npx tsc --noEmit`) and the existing Jest test suites in both repositories. (Note: Run `pcp` tests with `--maxWorkers=2` or `--runInBand` to avoid OOM crashes).
6. Write a completion report at `/Users/sac/expo-supabase-ai-template/.agents/worker_setup/handoff.md` summarizing the changes made and the build/test results, and send a message back to the Orchestrator (conversation ID: `eb667118-634e-4d4a-bc07-77ca09b833c1`).

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
