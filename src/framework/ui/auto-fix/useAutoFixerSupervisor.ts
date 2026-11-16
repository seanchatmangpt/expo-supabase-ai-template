import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mmkvInstance } from '../../../lib/store/mmkvStorage';
import { analyzeError } from './analyzer';
import { SuggestedFix } from './types';

export interface SystemDiagnostics {
  isStorageReadable: boolean;
  hasOutboxBackpressure: boolean;
  timestamp: string;
}

export function useAutoFixerSupervisor(onRecoveryComplete: () => void) {
  const [activeError, setActiveError] = useState<Error | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const registerSystemFailure = (error: Error) => {
    setActiveError(error);
    setLogs((prev) => [...prev, `[System Failure] ${error.name}: ${error.message}`]);
  };

  const runDiagnostics = async (): Promise<SystemDiagnostics> => {
    setLogs((prev) => [...prev, '[Diagnostics] Running system integrity checks...']);
    
    let isStorageReadable = false;
    try {
      await AsyncStorage.setItem('__diagnostics_probe__', 'active');
      const testVal = await AsyncStorage.getItem('__diagnostics_probe__');
      isStorageReadable = testVal === 'active';
      await AsyncStorage.removeItem('__diagnostics_probe__');
    } catch {
      isStorageReadable = false;
    }

    const keys = mmkvInstance.getAllKeys();
    const hasOutboxBackpressure = keys.some(key => key.includes('outbox'));

    const result = {
      isStorageReadable,
      hasOutboxBackpressure,
      timestamp: new Date().toISOString()
    };

    setLogs((prev) => [
      ...prev,
      `[Diagnostics Complete] Storage Active: ${result.isStorageReadable}, Outbox Pressure: ${result.hasOutboxBackpressure}`
    ]);

    return result;
  };

  const applyAutoFix = async (fix: SuggestedFix) => {
    setRecovering(true);
    setLogs((prev) => [...prev, `[AutoFix Engine] Applying fix: ${fix.title}`]);
    try {
      await fix.action();
      setLogs((prev) => [...prev, `[AutoFix Engine] Success: ${fix.title} applied.`]);
      setActiveError(null);
      onRecoveryComplete();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLogs((prev) => [...prev, `[AutoFix Engine] Failed: ${fix.title} -> ${msg}`]);
    } finally {
      setRecovering(false);
    }
  };

  const executeEmergencyStateWipe = async () => {
    setRecovering(true);
    setLogs((prev) => [...prev, '[Emergency Action] Starting complete local state purge...']);
    try {
      await AsyncStorage.clear();
      mmkvInstance.clearAll();
      setLogs((prev) => [...prev, '[Emergency Action] State successfully wiped. Requesting reload.']);
      setActiveError(null);
      onRecoveryComplete();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLogs((prev) => [...prev, `[Emergency Action] State wipe failed: ${msg}`]);
    } finally {
      setRecovering(false);
    }
  };

  const errorAnalysis = activeError ? analyzeError(activeError) : null;

  return {
    activeError,
    recovering,
    logs,
    errorAnalysis,
    registerSystemFailure,
    runDiagnostics,
    applyAutoFix,
    executeEmergencyStateWipe
  };
}
