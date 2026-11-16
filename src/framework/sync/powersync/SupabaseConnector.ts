import { SupabaseClient } from '@supabase/supabase-js';
import { type PowerSyncBackendConnector, type CrudTransaction } from '@powersync/react-native';
import { supabase as defaultSupabase } from '@/lib/supabase';

export class SupabaseConnector implements PowerSyncBackendConnector {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient = defaultSupabase) {
    this.supabase = supabaseClient;
  }

  /**
   * Fetch credentials for authenticating the PowerSync WebSocket stream.
   * Leverages Supabase's active user session.
   */
  async fetchCredentials() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error || !session) {
      return {
        endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL ?? 'http://127.0.0.1:8080',
        token: null,
      };
    }
    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL ?? 'http://127.0.0.1:8080',
      token: session.access_token,
    };
  }

  /**
   * Processes the local mutations queue and sends them to the remote Supabase Postgres DB.
   */
  async uploadData(db: any): Promise<void> {
    const transaction: CrudTransaction | null = await db.getNextCrudTransaction();
    if (!transaction) {
      return;
    }

    try {
      for (const entry of transaction.crud) {
        const table = entry.table;
        const id = entry.id;
        const opData = entry.opData;

        switch (entry.op) {
          case 'PUT': {
            const { error: putError } = await this.supabase
              .from(table)
              .upsert({ id, ...opData });
            if (putError) {
              throw new Error(`Failed to upsert row in ${table}: ${putError.message}`);
            }
            break;
          }
          case 'PATCH': {
            const { error: patchError } = await this.supabase
              .from(table)
              .update(opData || {})
              .eq('id', id);
            if (patchError) {
              throw new Error(`Failed to update row in ${table}: ${patchError.message}`);
            }
            break;
          }
          case 'DELETE': {
            const { error: deleteError } = await this.supabase
              .from(table)
              .delete()
              .eq('id', id);
            if (deleteError) {
              throw new Error(`Failed to delete row in ${table}: ${deleteError.message}`);
            }
            break;
          }
        }
      }
      // Complete transaction to remove it from the local outbox queue
      await transaction.complete();
    } catch (err: any) {
      console.error('Local outbox push failure:', err.message);
      throw err;
    }
  }
}
