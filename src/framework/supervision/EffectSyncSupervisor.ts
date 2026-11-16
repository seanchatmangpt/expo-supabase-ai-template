import { Effect, Schedule } from 'effect';
import { openDatabaseSync } from 'expo-sqlite';

export interface SyncError {
  readonly _tag: 'SyncError';
  readonly message: string;
}

export interface DbError {
  readonly _tag: 'DbError';
  readonly message: string;
}

/**
 * Supervised Database Transaction.
 * Ensures the SQLite database connection is safely closed under error conditions.
 */
export const executeSupervisedTransaction = (dbName: string, query: string): Effect.Effect<string, DbError, never> => {
  return Effect.acquireUseRelease(
    Effect.sync(() => openDatabaseSync(dbName)),
    (db) =>
      Effect.try({
        try: () => {
          db.execSync(query);
          return 'Transaction completed successfully';
        },
        catch: (error) => ({
          _tag: 'DbError' as const,
          message: error instanceof Error ? error.message : String(error),
        }),
      }),
    (db) =>
      Effect.sync(() => {
        db.closeSync();
      })
  );
};

/**
 * Supervised Supabase Sync Executor.
 * Utilizes exponential backoff with jitter and executes local quarantine logging on final failure.
 */
export const runSupervisedSync = (
  payload: Record<string, any>,
  maxRetries: number
): Effect.Effect<string, never, never> => {
  const syncTask = Effect.tryPromise({
    try: async () => {
      const response = await fetch('https://supabase.co/rest/v1/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status code: ${response.status}`);
      }
      return 'Synced successfully';
    },
    catch: (error) => ({
      _tag: 'SyncError' as const,
      message: error instanceof Error ? error.message : String(error),
    }),
  });

  // Schedule config: Jittered exponential backoff retrying up to maxRetries times
  const backoffSchedule = Schedule.exponential('100 millis').pipe(
    Schedule.compose(Schedule.recurs(maxRetries))
  );

  return syncTask.pipe(
    Effect.retry(backoffSchedule),
    Effect.catchAll((err) => {
      // Fallback Strategy: Quarantine the failed job in SQLite rather than bubbling up to crash UI
      const safePayloadString = JSON.stringify(payload).replace(/'/g, "''");
      const quarantineQuery = `
        INSERT INTO "sync_job_quarantine" (job_type, payload, rejection_reason, verdict, created_at)
        VALUES ('supabase_sync', '${safePayloadString}', '${err.message.replace(/'/g, "''")}', 'QUARANTINED', ${Date.now()});
      `;
      return executeSupervisedTransaction('@truex/membrane-client.db', quarantineQuery).pipe(
        Effect.match({
          onFailure: (dbErr: any) => `Fallback quarantine failed: ${dbErr?.message || String(dbErr)}`,
          onSuccess: () => 'Job safely quarantined inside sync_job_quarantine',
        })
      );
    })
  );
};
