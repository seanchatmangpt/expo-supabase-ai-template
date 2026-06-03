import { Vibration } from 'react-native';
import { IntelligentHaptics, HapticFeedbackPattern } from '../IntelligentHaptics';

jest.mock('react-native', () => ({
  Vibration: {
    vibrate: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('IntelligentHaptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    IntelligentHaptics.setEnabled(true);
  });

  it('should trigger SUCCESS haptics', () => {
    IntelligentHaptics.trigger(HapticFeedbackPattern.SUCCESS);
    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 10, 50, 10]);
  });

  it('should trigger WARNING haptics', () => {
    IntelligentHaptics.trigger(HapticFeedbackPattern.WARNING);
    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 20, 100, 20]);
  });

  it('should trigger ERROR haptics', () => {
    IntelligentHaptics.trigger(HapticFeedbackPattern.ERROR);
    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 50, 100, 50, 100, 60]);
  });
});
