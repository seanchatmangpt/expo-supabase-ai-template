import { ClaimTypestate } from '../ClaimTypestate';

describe('ClaimTypestate', () => {
  it('correctly transitions through typestates Uninitialized -> Allocated -> Hydrated -> Sealed', () => {
    // 1. Create Uninitialized typestate
    const state0 = ClaimTypestate.create();
    expect(state0.getState()).toBe('Uninitialized');

    // 2. Allocate claim ID
    const state1 = state0.allocate('my-claim-id');
    expect(state1.getState()).toBe('Allocated');

    // 3. Hydrate value
    const state2 = state1.hydrate({ age: 25 });
    expect(state2.getState()).toBe('Hydrated');

    // 4. Seal claim
    const state3 = state2.seal();
    expect(state3.getState()).toBe('Sealed');

    // 5. Unwrap final sealed object
    const finalData = state3.unwrap();
    expect(finalData.claimId).toBe('my-claim-id');
    expect(finalData.value).toEqual({ age: 25 });
    expect(typeof finalData.sealedAt).toBe('number');
  });

  it('throws runtime error on invalid arguments during transition', () => {
    const state0 = ClaimTypestate.create();
    expect(() => state0.allocate('')).toThrow();
    expect(() => state0.allocate('   ')).toThrow();

    const state1 = state0.allocate('valid-id');
    expect(() => state1.hydrate(null)).toThrow();
    expect(() => state1.hydrate(undefined)).toThrow();
  });
});
