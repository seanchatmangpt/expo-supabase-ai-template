export type SupervisionStrategy = 'OneForOne' | 'OneForAll';

export interface ProverActor {
  id: string;
  state: 'idle' | 'proving' | 'failed' | 'quarantined';
  lastError?: string;
  runCount: number;
}

export class ZkpProverSupervisor {
  private actors: Map<string, ProverActor> = new Map();
  private restartTimestamps: Map<string, number[]> = new Map();
  private readonly maxRestarts = 3;
  private readonly timeWindowMs = 5000; // 5 seconds
  private strategy: SupervisionStrategy = 'OneForOne';

  constructor(strategy: SupervisionStrategy = 'OneForOne') {
    this.strategy = strategy;
  }

  /**
   * Registers a prover actor with the supervisor.
   */
  registerActor(id: string): void {
    this.actors.set(id, {
      id,
      state: 'idle',
      runCount: 0,
    });
    this.restartTimestamps.set(id, []);
  }

  /**
   * Executes a proof generation task on a specific actor.
   * Wraps execution to isolate panics and handle restarts.
   */
  async executeProvingTask<T>(
    actorId: string,
    task: () => Promise<T>
  ): Promise<T> {
    const actor = this.actors.get(actorId);
    if (!actor) {
      throw new Error(`Actor ${actorId} is not registered.`);
    }

    if (actor.state === 'quarantined') {
      throw new Error(`Actor ${actorId} is quarantined and cannot execute tasks.`);
    }

    actor.state = 'proving';
    actor.runCount++;

    try {
      const result = await task();
      actor.state = 'idle';
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      actor.state = 'failed';
      actor.lastError = errMsg;

      // Handle Erlang-style recovery/restart isolation
      return this.handleActorFailure(actorId, task);
    }
  }

  /**
   * Internal handler to apply supervision strategy and restart logic.
   */
  private async handleActorFailure<T>(
    actorId: string,
    task: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const timestamps = this.restartTimestamps.get(actorId) || [];
    
    // Filter timestamps within the sliding window
    const recentRestarts = timestamps.filter(t => now - t < this.timeWindowMs);
    recentRestarts.push(now);
    this.restartTimestamps.set(actorId, recentRestarts);

    const actor = this.actors.get(actorId)!;

    // Check if max restarts exceeded in the time window
    if (recentRestarts.length > this.maxRestarts) {
      actor.state = 'quarantined';
      
      if (this.strategy === 'OneForAll') {
        // Quarantine all actors under OneForAll strategy
        this.actors.forEach((act) => {
          act.state = 'quarantined';
        });
      }

      throw new Error(
        `Actor ${actorId} escalated to QUARANTINED: Max restarts (${this.maxRestarts}) exceeded in ${this.timeWindowMs}ms.`
      );
    }

    // Attempt recovery / restart (Erlang-style isolation retry)
    actor.state = 'idle';
    return this.executeProvingTask(actorId, task);
  }

  /**
   * Gets the current status of an actor.
   */
  getActorStatus(id: string): ProverActor | undefined {
    return this.actors.get(id);
  }

  /**
   * Resets the quarantine status of a specific actor.
   */
  resetActor(id: string): void {
    const actor = this.actors.get(id);
    if (actor) {
      actor.state = 'idle';
      actor.lastError = undefined;
      this.restartTimestamps.set(id, []);
    }
  }
}
