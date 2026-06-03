import { renderHook, act } from '@testing-library/react-native';
import { useHaptics, useHapticEffect, useTensionHaptics } from '../useHaptics';
import { IntelligentHaptics, HapticFeedbackPattern } from '../IntelligentHaptics';

jest.mock('../IntelligentHaptics', () => ({
  IntelligentHaptics: {
    trigger: jest.fn(),
    impact: jest.fn(),
  },
  HapticFeedbackPattern: {
    SUCCESS: 'SUCCESS',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    LIGHT: 'LIGHT',
    MEDIUM: 'MEDIUM',
    HEAVY: 'HEAVY',
    SELECTION: 'SELECTION',
  },
}));

describe('useHaptics hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useHaptics', () => {
    it('should provide trigger functions', () => {
      const { result } = renderHook(() => useHaptics());

      act(() => {
        result.current.success();
      });
      expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.SUCCESS);

      act(() => {
        result.current.error();
      });
      expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.ERROR);

      act(() => {
        result.current.warning();
      });
      expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.WARNING);

      act(() => {
        result.current.light();
      });
      expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.LIGHT);

      act(() => {
        result.current.medium();
      });
      expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.MEDIUM);

      act(() => {
        result.current.heavy();
      });
      expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.HEAVY);

      act(() => {
        result.current.selection();
      });
      expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.SELECTION);

      act(() => {
        result.current.impact(0.5);
      });
      expect(IntelligentHaptics.impact).toHaveBeenCalledWith(0.5);
    });
  });

  describe('useHapticEffect', () => {
    it('should trigger haptics when dependency changes', () => {
      const { rerender } = renderHook(
        (props: any) =>
          useHapticEffect(props.dep, HapticFeedbackPattern.SUCCESS, { skipFirst: false }),
        { initialProps: { dep: 0 } }
      );

      expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.SUCCESS);
      jest.clearAllMocks();

      rerender({ dep: 1 });
      expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.SUCCESS);
    });

    it('should skip first trigger by default', () => {
      renderHook((props: any) => useHapticEffect(props.dep, HapticFeedbackPattern.SUCCESS), {
        initialProps: { dep: 0 },
      });

      expect(IntelligentHaptics.trigger).not.toHaveBeenCalled();
    });
  });
});
