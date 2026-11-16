import { ZkpProverSupervisor } from '../ZkpProverSupervisor';

describe('ZkpProverSupervisor', () => {
  let supervisor: ZkpProverSupervisor;

  beforeEach(() => {
    supervisor = new ZkpProverSupervisor('OneForOne');
  });

  it('runs successful proving tasks and increments runCount', async () => {
    supervisor.registerActor('actor_1');
    const task = jest.fn().mockResolvedValue('proof_data_bytes');

    const result = await supervisor.executeProvingTask('actor_1', task);

    expect(result).toBe('proof_data_bytes');
    expect(task).toHaveBeenCalledTimes(1);
    expect(supervisor.getActorStatus('actor_1')?.state).toBe('idle');
    expect(supervisor.getActorStatus('actor_1')?.runCount).toBe(1);
  });

  it('retries automatically and quarantines on max restart exhaustion', async () => {
    supervisor.registerActor('actor_1');
    const failingTask = jest.fn().mockRejectedValue(new Error('Prove error'));

    // A call to failingTask will crash, causing the supervisor to restart.
    // Max restarts = 3. So 1 initial attempt + 3 restarts = 4 attempts total.
    // The 4th retry failure should throw the escalated Quarantine error.
    await expect(supervisor.executeProvingTask('actor_1', failingTask)).rejects.toThrow(
      'escalated to QUARANTINED: Max restarts (3) exceeded'
    );

    expect(failingTask).toHaveBeenCalledTimes(4);
    expect(supervisor.getActorStatus('actor_1')?.state).toBe('quarantined');
    expect(supervisor.getActorStatus('actor_1')?.lastError).toBe('Prove error');
  });

  it('applies OneForAll strategy to quarantine all actors when one fails repeatedly', async () => {
    supervisor = new ZkpProverSupervisor('OneForAll');
    supervisor.registerActor('actor_1');
    supervisor.registerActor('actor_2');

    const failingTask = jest.fn().mockRejectedValue(new Error('Prove error'));

    await expect(supervisor.executeProvingTask('actor_1', failingTask)).rejects.toThrow(
      'QUARANTINED'
    );

    // Both actors must be quarantined
    expect(supervisor.getActorStatus('actor_1')?.state).toBe('quarantined');
    expect(supervisor.getActorStatus('actor_2')?.state).toBe('quarantined');
  });

  it('allows resetting actor status', () => {
    supervisor.registerActor('actor_1');
    const status = supervisor.getActorStatus('actor_1')!;
    status.state = 'quarantined';
    status.lastError = 'Some error';

    supervisor.resetActor('actor_1');

    const updated = supervisor.getActorStatus('actor_1')!;
    expect(updated.state).toBe('idle');
    expect(updated.lastError).toBeUndefined();
  });
});
