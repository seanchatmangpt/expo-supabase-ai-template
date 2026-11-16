export class EffectInstance<A, E> {
  constructor(public run: () => Promise<A>) {}

  pipe<B>(f1: (a: this) => B): B;
  pipe<B, C>(f1: (a: this) => B, f2: (b: B) => C): C;
  pipe<B, C, D>(f1: (a: this) => B, f2: (b: B) => C, f3: (c: C) => D): D;
  pipe(...fns: Function[]): any {
    return fns.reduce((val, fn) => fn(val), this);
  }
}

export class Effect {
  static sync<A>(evaluate: () => A): Effect.Effect<A, never, never> {
    return new EffectInstance(async () => evaluate());
  }

  static ['try']<A, E>(options: {
    try: () => A;
    catch: (error: unknown) => E;
  }): Effect.Effect<A, E, never> {
    return new EffectInstance(async () => {
      try {
        return options.try();
      } catch (error) {
        throw options.catch(error);
      }
    });
  }

  static tryPromise<A, E>(options: {
    try: () => Promise<A>;
    catch: (error: unknown) => E;
  }): Effect.Effect<A, E, never> {
    return new EffectInstance(async () => {
      try {
        return await options.try();
      } catch (error) {
        throw options.catch(error);
      }
    });
  }

  static acquireUseRelease<A, E1, R1, B, E2, R2, C, E3, R3>(
    acquire: Effect.Effect<A, E1, R1>,
    use: (resource: A) => Effect.Effect<B, E2, R2>,
    release: (resource: A) => Effect.Effect<C, E3, R3>
  ): Effect.Effect<B, E1 | E2 | E3, R1 | R2 | R3> {
    return new EffectInstance(async () => {
      let resource: A;
      try {
        resource = await acquire.run();
      } catch (acquireError) {
        throw acquireError;
      }

      try {
        return await use(resource).run();
      } finally {
        try {
          await release(resource).run();
        } catch (releaseError) {
          console.error('Release action failed:', releaseError);
        }
      }
    });
  }

  static retry<A, E, R>(schedule: ScheduleImpl) {
    return (self: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> => {
      return new EffectInstance(async () => {
        let attempts = 0;
        const maxRetries = schedule.maxRetries;
        const initialDelay = schedule.initialDelay;

        while (true) {
          try {
            return await self.run();
          } catch (error) {
            attempts++;
            if (attempts > maxRetries) {
              throw error;
            }
            const delay = initialDelay * Math.pow(2, attempts - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      });
    };
  }

  static catchAll<A, E, R, B, E2, R2>(
    onFailure: (error: E) => Effect.Effect<B, E2, R2>
  ) {
    return (self: Effect.Effect<A, E, R>): Effect.Effect<A | B, E2, R | R2> => {
      return new EffectInstance(async () => {
        try {
          return await self.run();
        } catch (error) {
          const recoveryEffect = onFailure(error as E);
          return await recoveryEffect.run();
        }
      });
    };
  }

  static match<A, E, R, B, C>(options: {
    onFailure: (error: E) => B;
    onSuccess: (value: A) => C;
  }) {
    return (self: Effect.Effect<A, E, R>): Effect.Effect<B | C, never, R> => {
      return new EffectInstance(async () => {
        try {
          const val = await self.run();
          return options.onSuccess(val);
        } catch (error) {
          return options.onFailure(error as E);
        }
      });
    };
  }
}

export namespace Effect {
  export type Effect<A, E = never, R = never> = EffectInstance<A, E>;
}

export class ScheduleImpl {
  constructor(
    public initialDelay: number,
    public maxRetries: number
  ) {}

  pipe<B>(f1: (a: this) => B): B {
    return f1(this);
  }
}

export const Schedule = {
  exponential: (duration: string) => {
    const match = duration.match(/^(\d+)/);
    const val = match ? parseInt(match[1], 10) : 100;
    return new ScheduleImpl(val, 0);
  },
  recurs: (n: number) => {
    return new ScheduleImpl(0, n);
  },
  compose: (other: ScheduleImpl) => {
    return (self: ScheduleImpl) => {
      return new ScheduleImpl(
        self.initialDelay || other.initialDelay,
        other.maxRetries
      );
    };
  },
};
