import { ZkpProvingController, ProverStage } from '../ZkpProvingController';
import { IntelligentHaptics, HapticFeedbackPattern } from '../IntelligentHaptics';

// Mock IntelligentHaptics
jest.mock('../IntelligentHaptics', () => {
  return {
    IntelligentHaptics: {
      trigger: jest.fn(),
      impact: jest.fn(),
      setEnabled: jest.fn(),
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
  };
});

describe('ZkpProvingController', () => {
  let controller: ZkpProvingController;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    controller = new ZkpProvingController();
  });

  afterEach(() => {
    controller.clearTimer();
    jest.useRealTimers();
  });

  it('triggers SELECTION and schedules sweep on new stage start', () => {
    controller.updateProgress(ProverStage.SETUP, 10);

    expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.SELECTION);
    expect(controller.getCurrentStage()).toBe(ProverStage.SETUP);
    expect(controller.getCurrentProgress()).toBe(10);

    // Fast-forward time to fire the scheduled sweep haptic
    jest.advanceTimersByTime(500);
    expect(IntelligentHaptics.impact).toHaveBeenCalledWith(0.1);
  });

  it('adjusts frequency sweep (timer speed) based on progress percentage', () => {
    // At 10% progress, interval should be: 500 - 10 * 4.5 = 455ms
    controller.updateProgress(ProverStage.WITNESS_GEN, 10);
    jest.clearAllMocks();

    jest.advanceTimersByTime(455);
    expect(IntelligentHaptics.impact).toHaveBeenCalledWith(0.1);

    // At 80% progress, interval should be: 500 - 80 * 4.5 = 140ms
    controller.updateProgress(ProverStage.WITNESS_GEN, 80);
    jest.clearAllMocks();

    jest.advanceTimersByTime(140);
    expect(IntelligentHaptics.impact).toHaveBeenCalledWith(0.8);
  });

  it('triggers SUCCESS haptic and clears timers on DONE stage', () => {
    controller.updateProgress(ProverStage.CONSTRAINTS, 50);
    jest.clearAllMocks();

    controller.updateProgress(ProverStage.DONE, 100);

    expect(IntelligentHaptics.trigger).toHaveBeenCalledWith(HapticFeedbackPattern.SUCCESS);
    expect(controller.getCurrentStage()).toBe(ProverStage.DONE);

    // Ensure no more sweeps are fired
    jest.advanceTimersByTime(1000);
    expect(IntelligentHaptics.impact).not.toHaveBeenCalled();
  });
});
