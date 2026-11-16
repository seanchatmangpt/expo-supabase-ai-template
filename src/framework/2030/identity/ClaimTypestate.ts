export type Uninitialized = 'Uninitialized';
export type Allocated = 'Allocated';
export type Hydrated = 'Hydrated';
export type Sealed = 'Sealed';

export type ClaimState = Uninitialized | Allocated | Hydrated | Sealed;

/**
 * ClaimTypestate implements a compile-time typestate machine
 * for Claim processing: Uninitialized -> Allocated -> Hydrated -> Sealed.
 * Generics and strict this-typing parameters prevent invalid state transitions.
 */
export class ClaimTypestate<S extends ClaimState> {
  private readonly _state: S;
  private readonly _data: any;

  private constructor(state: S, data: any) {
    this._state = state;
    this._data = data;
  }

  /**
   * Creates a new ClaimTypestate in the Uninitialized state.
   */
  public static create(): ClaimTypestate<'Uninitialized'> {
    return new ClaimTypestate('Uninitialized', null);
  }

  /**
   * Transitions from Uninitialized to Allocated.
   * Can only be called on an Uninitialized ClaimTypestate.
   */
  public allocate(
    this: ClaimTypestate<'Uninitialized'>,
    claimId: string
  ): ClaimTypestate<'Allocated'> {
    if (!claimId || claimId.trim() === '') {
      throw new Error('claimId cannot be empty');
    }
    return new ClaimTypestate('Allocated', { claimId });
  }

  /**
   * Transitions from Allocated to Hydrated.
   * Can only be called on an Allocated ClaimTypestate.
   */
  public hydrate(
    this: ClaimTypestate<'Allocated'>,
    value: any
  ): ClaimTypestate<'Hydrated'> {
    if (value === undefined || value === null) {
      throw new Error('value cannot be null or undefined');
    }
    return new ClaimTypestate('Hydrated', {
      claimId: this._data.claimId,
      value,
    });
  }

  /**
   * Transitions from Hydrated to Sealed.
   * Can only be called on a Hydrated ClaimTypestate.
   */
  public seal(this: ClaimTypestate<'Hydrated'>): ClaimTypestate<'Sealed'> {
    return new ClaimTypestate('Sealed', {
      claimId: this._data.claimId,
      value: this._data.value,
      sealedAt: Date.now(),
    });
  }

  /**
   * Unwraps the final Sealed object.
   * Can only be called on a Sealed ClaimTypestate.
   */
  public unwrap(
    this: ClaimTypestate<'Sealed'>
  ): { claimId: string; value: any; sealedAt: number } {
    return {
      claimId: this._data.claimId,
      value: this._data.value,
      sealedAt: this._data.sealedAt,
    };
  }

  /**
   * Returns the current state name.
   */
  public getState(): S {
    return this._state;
  }
}
