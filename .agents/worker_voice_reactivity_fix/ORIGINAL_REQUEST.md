## 2026-06-03T01:06:59Z
Please act as teamwork_preview_worker.
Your working directory is: /Users/sac/expo-supabase-ai-template/.agents/worker_voice_reactivity_fix
Your task is to restore voice command registration reactivity in `VoiceCommandBoundary.tsx` and types.ts:

### Task 1: Expose activeIntents in Context and Types
1. In `/Users/sac/expo-supabase-ai-template/src/framework/ui/voice/VoiceCommandBoundary.tsx`:
   - Replace the `useRef` tracker `activeIntentsRef` with a standard React state:
     `const [activeIntents, setActiveIntents] = useState<VoiceIntent[]>(initialIntents);`
   - Refactor `registerIntents` to update state:
     ```typescript
     const registerIntents = useCallback((newIntents: VoiceIntent[]) => {
       setActiveIntents((prev) => {
         const filtered = prev.filter((p) => !newIntents.some((n) => n.id === p.id));
         return [...filtered, ...newIntents];
       });
     }, []);
     ```
   - Refactor `unregisterIntents` to update state:
     ```typescript
     const unregisterIntents = useCallback((intentIds: string[]) => {
       setActiveIntents((prev) => prev.filter((p) => !intentIds.includes(p.id)));
     }, []);
     ```
   - Update `getActiveIntents` callback to depend on `activeIntents`:
     `const getActiveIntents = useCallback(() => activeIntents, [activeIntents]);`
   - In the context `value` object, expose both `activeIntents` and `getActiveIntents`:
     ```typescript
     const value = useMemo(
       () => ({
         registerIntents,
         unregisterIntents,
         activeIntents,
         getActiveIntents,
         isListening,
         setIsListening,
       }),
       [registerIntents, unregisterIntents, activeIntents, getActiveIntents, isListening]
     );
     ```

2. In `/Users/sac/expo-supabase-ai-template/src/framework/ui/voice/types.ts`:
   - Add `activeIntents: VoiceIntent[];` to the `VoiceContextValue` interface:
     ```typescript
     export interface VoiceContextValue {
       registerIntents: (intents: VoiceIntent[]) => void;
       unregisterIntents: (intentIds: string[]) => void;
       activeIntents: VoiceIntent[];
       getActiveIntents: () => VoiceIntent[];
       isListening: boolean;
       setIsListening: (value: boolean) => void;
     }
     ```

### Task 2: Verification
After applying the fixes, run:
1. `npx jest src/framework/ui/voice/__tests__/VoiceCommandBoundary.test.tsx` and `npx jest src/framework/compositions/inclusive-ui/__tests__/InclusiveUI.test.tsx` to confirm that the failing test suites now pass successfully.
2. `npx jest --watchAll=false` to confirm all 182 test suites pass with 0 failures and 0 warnings.
3. `npx tsc --noEmit` and `npx eslint .` to verify that root static checks remain 100% clean with 0 errors/warnings.
4. Run Deno function checks: `npx tsc --noEmit -p supabase/functions/openai/tsconfig.json` and `npx tsc --noEmit -p supabase/functions/simulate-swarm/tsconfig.json` to verify Deno edge functions compile successfully.
5. Capture and OCR validation: `bash scripts/capture_all_routes.sh` and `bash scripts/validate_ocr.sh`.

Write your report to `/Users/sac/expo-supabase-ai-template/.agents/worker_voice_reactivity_fix/handoff.md` and report back via `send_message`.

> MANDATORY INTEGRITY WARNING — DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
