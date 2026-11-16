import { IntelligentHaptics, HapticFeedbackPattern } from './IntelligentHaptics';

export enum ProverStage {
  SETUP = 'SETUP',
  WITNESS_GEN = 'WITNESS_GEN',
  CONSTRAINTS = 'CONSTRAINTS',
  SYNTHESIS = 'SYNTHESIS',
  DONE = 'DONE',
}

/**
 * ZkpProvingController
 *
 * Drives physical haptic feedback based on ZKP proving progress telemetry.
 * Implements continuous haptic patterns and frequency sweeps.
 */
export class ZkpProvingController {
  private currentStage: ProverStage | null = null;
  private currentProgress: number = 0; // 0 to 100
  private sweepTimer: NodeJS.Timeout | null = null;

  /**
   * Updates the proving progress and triggers appropriate haptic feedback.
   *
   * @param stage - The current ZKP proving stage
   * @param progressPercent - Percentage completion (0 to 100)
   */
  updateProgress(stage: ProverStage, progressPercent: number): void {
    const normalizedProgress = Math.max(0, Math.min(100, progressPercent));
    const stageChanged = this.currentStage !== stage;

    this.currentStage = stage;
    this.currentProgress = normalizedProgress;

    // 1. Stage transition feedback
    if (stageChanged) {
      if (stage === ProverStage.DONE) {
        this.clearTimer();
        IntelligentHaptics.trigger(HapticFeedbackPattern.SUCCESS);
        return;
      } else {
        // Trigger selection haptic on stage change
        IntelligentHaptics.trigger(HapticFeedbackPattern.SELECTION);
      }
    }

    // 2. Continuous sweep updates
    this.startOrAdjustSweep();
  }

  /**
   * Starts or adjusts the frequency sweep timer based on progress.
   */
  private startOrAdjustSweep(): void {
    this.clearTimer();

    if (this.currentStage === ProverStage.DONE) return;

    // Map progress to tick interval: higher progress -> faster frequency (shorter interval)
    // Range: 500ms (0% progress) down to 50ms (100% progress)
    const intervalMs = Math.max(50, 500 - this.currentProgress * 4.5);

    const tick = () => {
      // Impact intensity correlates to progress (0 to 1)
      const intensity = this.currentProgress / 100;
      IntelligentHaptics.impact(intensity);

      // Re-schedule based on current progress
      const nextInterval = Math.max(50, 500 - this.currentProgress * 4.5);
      this.sweepTimer = setTimeout(tick, nextInterval);
    };

    this.sweepTimer = setTimeout(tick, intervalMs);
  }

  /**
   * Clears any active sweep timer.
   */
  clearTimer(): void {
    if (this.sweepTimer) {
      clearTimeout(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  /**
   * Gets the current stage.
   */
  getCurrentStage(): ProverStage | null {
    return this.currentStage;
  }

  /**
   * Gets the current progress.
   */
  getCurrentProgress(): number {
    return this.currentProgress;
  }
}
