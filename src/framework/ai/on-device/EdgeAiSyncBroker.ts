import { expoDb } from '@/src/lib/db/db';
import { supabase } from '@/lib/supabase';
import { InferenceResponse } from './LocalInferenceEngine';

export class EdgeAiSyncBroker {
  constructor() {
    // Dynamically initialize the local SQLite table for Edge AI inference tracking
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS "edge_ai_inference_results" (
        "id" TEXT PRIMARY KEY,
        "request_id" TEXT NOT NULL,
        "model_id" TEXT NOT NULL,
        "prompt" TEXT NOT NULL,
        "response_text" TEXT NOT NULL,
        "latency_ms" INTEGER NOT NULL,
        "delta_hash" TEXT NOT NULL,
        "previous_hash" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "created_at" TEXT NOT NULL
      );
    `);
  }

  /**
   * Persists the inference response locally to SQLite.
   */
  persistLocal(response: InferenceResponse, prompt: string = ''): void {
    expoDb.runSync(
      `INSERT OR REPLACE INTO edge_ai_inference_results (
        id, request_id, model_id, prompt, response_text, latency_ms, delta_hash, previous_hash, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        response.receipt.id,
        response.requestId,
        response.receipt.modelId,
        prompt,
        response.text,
        response.latencyMs,
        response.receipt.deltaHash,
        response.receipt.previousHash,
        'pending',
        response.completedAt,
      ]
    );
  }

  /**
   * Synchronizes pending inference receipts from local SQLite to the remote Supabase DB.
   */
  async syncPendingReceipts(): Promise<void> {
    const pending = expoDb.getAllSync(
      `SELECT * FROM edge_ai_inference_results WHERE status = 'pending'`
    ) as any[];

    for (const row of pending) {
      try {
        const { error } = await supabase.from('edge_ai_inference_results').upsert({
          id: row.id,
          request_id: row.request_id,
          model_id: row.model_id,
          prompt: row.prompt,
          response_text: row.response_text,
          latency_ms: row.latency_ms,
          delta_hash: row.delta_hash,
          previous_hash: row.previous_hash,
          created_at: row.created_at,
        });

        if (!error) {
          expoDb.runSync(
            `UPDATE edge_ai_inference_results SET status = 'synced' WHERE id = ?`,
            [row.id]
          );
        } else {
          console.error(`[EdgeAiSyncBroker] Supabase upload failed for ${row.id}:`, error.message);
          expoDb.runSync(
            `UPDATE edge_ai_inference_results SET status = 'failed' WHERE id = ?`,
            [row.id]
          );
        }
      } catch (err: any) {
        console.error(`[EdgeAiSyncBroker] Failed to sync ${row.id}:`, err.message);
        expoDb.runSync(
          `UPDATE edge_ai_inference_results SET status = 'failed' WHERE id = ?`,
          [row.id]
        );
      }
    }
  }
}
