import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mmkvInstance } from '../../../../lib/store/mmkvStorage';
import { useAutoFixerSupervisor } from '../useAutoFixerSupervisor';
import { SuggestedFix } from '../types';

// Mock MMKV
jest.mock('react-native-mmkv', () => {
  const mockClearAll = jest.fn();
  const mockGetAllKeys = jest.fn().mockReturnValue([]);
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      clearAll: mockClearAll,
      getAllKeys: mockGetAllKeys,
    })),
    createMMKV: jest.fn().mockReturnValue({
      clearAll: mockClearAll,
      getAllKeys: mockGetAllKeys,
      clear: jest.fn(),
    }),
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStore: Record<string, string> = {};
  return {
    setItem: jest.fn((key: string, val: string) => {
      mockStore[key] = val;
      return Promise.resolve();
    }),
    getItem: jest.fn((key: string) => {
      return Promise.resolve(mockStore[key] !== undefined ? mockStore[key] : null);
    }),
    removeItem: jest.fn((key: string) => {
      delete mockStore[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      for (const k in mockStore) delete mockStore[k];
      return Promise.resolve();
    }),
  };
});

describe('useAutoFixerSupervisor Hook', () => {
  const mockOnRecovery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers system failures and analyzes errors', () => {
    const { result } = renderHook(() => useAutoFixerSupervisor(mockOnRecovery));

    act(() => {
      result.current.registerSystemFailure(new Error('Cannot read properties of null'));
    });

    expect(result.current.activeError).toBeInstanceOf(Error);
    expect(result.current.activeError?.message).toBe('Cannot read properties of null');
    expect(result.current.errorAnalysis?.isStateRelated).toBe(true);
    expect(result.current.logs[0]).toContain('[System Failure]');
  });

  it('runs write probe diagnostics correctly', async () => {
    (mmkvInstance.getAllKeys as jest.Mock).mockReturnValue(['outbox_queue_item_1']);

    const { result } = renderHook(() => useAutoFixerSupervisor(mockOnRecovery));

    let diagResult: any;
    await act(async () => {
      diagResult = await result.current.runDiagnostics();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('__diagnostics_probe__', 'active');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('__diagnostics_probe__');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('__diagnostics_probe__');

    expect(diagResult.isStorageReadable).toBe(true);
    expect(diagResult.hasOutboxBackpressure).toBe(true);
  });

  it('applies suggested auto-fixes and runs callback', async () => {
    const { result } = renderHook(() => useAutoFixerSupervisor(mockOnRecovery));

    const mockFixAction = jest.fn().mockResolvedValue(undefined);
    const mockFix: SuggestedFix = {
      id: 'test-fix',
      title: 'Test Fix',
      description: 'Test Description',
      impact: 'low',
      action: mockFixAction,
    };

    await act(async () => {
      await result.current.applyAutoFix(mockFix);
    });

    expect(mockFixAction).toHaveBeenCalled();
    expect(mockOnRecovery).toHaveBeenCalled();
    expect(result.current.activeError).toBeNull();
  });

  it('executes emergency state wipes under boundary compromise', async () => {
    const { result } = renderHook(() => useAutoFixerSupervisor(mockOnRecovery));

    await act(async () => {
      await result.current.executeEmergencyStateWipe();
    });

    expect(AsyncStorage.clear).toHaveBeenCalled();
    expect(mmkvInstance.clearAll).toHaveBeenCalled();
    expect(mockOnRecovery).toHaveBeenCalled();
  });
});
