import * as BackgroundFetch from 'expo-background-fetch';
import { BackgroundFetchResult } from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { expoDb } from '@/src/lib/db/db';
import { supabase } from '@/lib/supabase';
import { EdgeAiSyncBroker } from '../ai/on-device/EdgeAiSyncBroker';

export const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// Define the background sync task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // 1. Verify network connectivity
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      console.log('[BackgroundSyncWorker] Offline. Skipping sync.');
      return BackgroundFetchResult.NoData;
    }

    // 2. Verify battery status
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryState = await Battery.getBatteryStateAsync();

    // If battery is low (< 20%) and not charging, stretch sync interval or defer execution
    const isLowBattery = batteryLevel < 0.2 && batteryState !== Battery.BatteryState.CHARGING;

    if (isLowBattery) {
      console.log(`[BackgroundSyncWorker] Low battery detected (${Math.round(batteryLevel * 100)}%). Stretching sync interval and deferring execution.`);
      
      // Dynamically stretch sync interval to 1 hour (3600 seconds) to conserve power
      await BackgroundFetch.registerBackgroundTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 3600,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      return BackgroundFetchResult.NoData;
    }

    // Restore normal interval (15 minutes = 900 seconds) if battery is healthy
    await BackgroundFetch.registerBackgroundTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 900,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[BackgroundSyncWorker] Running outbox queue replication sequentially.');

    // 3. Sync AI inference receipts
    const broker = new EdgeAiSyncBroker();
    await broker.syncPendingReceipts();

    // 4. Run outbox queue replication sequentially
    const pendingJobs = expoDb.getAllSync(
      "SELECT * FROM sync_queue WHERE status IN ('pending', 'failed') ORDER BY id ASC"
    ) as any[];

    if (pendingJobs.length === 0) {
      return BackgroundFetchResult.NoData;
    }

    for (const job of pendingJobs) {
      // Mark job as processing
      expoDb.runSync("UPDATE sync_queue SET status = 'processing' WHERE id = ?", [job.id]);

      try {
        const rawData = JSON.parse(job.payload);
        let errorMsg: string | null = null;

        if (job.job_type === 'ACTOR_COMMAND') {
          const { error } = await supabase.from('actor_commands').upsert({
            id: rawData.id,
            actor_ref: rawData.actor,
            command: rawData.command,
            principal: rawData.principal,
            payload: rawData.payload,
            idempotency_key: rawData.idempotencyKey,
            causation_id: rawData.causationId ?? null,
            correlation_id: rawData.correlationId ?? null,
            status: rawData.status,
            created_at: rawData.createdAt,
          });
          if (error) errorMsg = error.message;
        } else if (job.job_type === 'ACTOR_EVENT') {
          const { error } = await supabase.from('actor_events').upsert({
            id: rawData.id,
            command_id: rawData.commandId,
            actor_ref: rawData.actor,
            type: rawData.type,
            payload: rawData.payload,
            created_at: rawData.createdAt,
          });
          if (error) errorMsg = error.message;
        } else if (job.job_type === 'ACTOR_RECEIPT') {
          const { error } = await supabase.from('actor_receipts').upsert({
            id: rawData.id,
            command_id: rawData.commandId,
            actor_ref: rawData.actor,
            status: rawData.status,
            delta_hash: rawData.deltaHash ?? null,
            event_ids: rawData.eventIds,
            error: rawData.error ?? null,
            created_at: rawData.createdAt,
          });
          if (error) errorMsg = error.message;
        }

        if (errorMsg) {
          throw new Error(errorMsg);
        }

        // Successfully synchronized: remove from local outbox queue
        expoDb.runSync("DELETE FROM sync_queue WHERE id = ?", [job.id]);
      } catch (err: any) {
        const nextAttempts = job.attempts + 1;
        const nextStatus = nextAttempts >= 3 ? 'quarantined' : 'failed';
        expoDb.runSync(
          "UPDATE sync_queue SET status = ?, attempts = ? WHERE id = ?",
          [nextStatus, nextAttempts, job.id]
        );
        console.error(`[BackgroundSyncWorker] Job ${job.id} replication failed:`, err.message);
      }
    }

    return BackgroundFetchResult.NewData;
  } catch (globalErr: any) {
    console.error('[BackgroundSyncWorker] Global task execution failure:', globalErr.message);
    return BackgroundFetchResult.Failed;
  }
});

/**
 * Registers the background sync task with the system.
 */
export async function registerBackgroundSyncTask(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    console.log(`[BackgroundSyncWorker] Registering task. BackgroundFetch status: ${status}`);
    
    await BackgroundFetch.registerBackgroundTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 900, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (err: any) {
    console.error('[BackgroundSyncWorker] Failed to register task:', err.message);
  }
}
