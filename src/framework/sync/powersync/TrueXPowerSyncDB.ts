import { PowerSyncDatabase } from '@powersync/react-native';
import { SupabaseClient } from '@supabase/supabase-js';
import { POWERSYNC_SCHEMA } from './powersyncSchema';
import { SupabaseConnector } from './SupabaseConnector';
import { blake3, canonicalStringify } from '@/src/lib/crypto/receipts';
import { DefaultAdmissionGate, type AdmissionGate } from '@/src/lib/sync/TrueXSyncReplicationEngine';

const GENESIS_HASH = '@truex/membrane-client:outbox-admission:genesis';

export interface SyncPayload {
  readonly entityId: string;
  readonly jobType: string;
  readonly payload: Record<string, unknown>;
}

export class TrueXPowerSyncDB {
  public powerSyncDb: PowerSyncDatabase;
  private connector: SupabaseConnector;

  constructor(supabaseClient: SupabaseClient) {
    this.powerSyncDb = new PowerSyncDatabase({
      schema: POWERSYNC_SCHEMA,
      database: {
        dbFilename: '@truex/membrane-powersync.db',
      },
    });
    this.connector = new SupabaseConnector(supabaseClient);
  }

  /**
   * Initializes the PowerSync database and starts synchronization.
   */
  async initialize(): Promise<void> {
    await this.powerSyncDb.initialize();
    await this.powerSyncDb.connect(this.connector);
  }

  /**
   * Retrieves the latest receipt hash from the sync_admission_receipts table.
   * If none exists, falls back to the genesis hash.
   */
  private async getLatestReceiptHash(): Promise<string> {
    const result = await this.powerSyncDb.execute(
      'SELECT receipt_hash FROM sync_admission_receipts ORDER BY admitted_at DESC LIMIT 1'
    );
    if (result.rows && result.rows.length > 0) {
      return result.rows.item(0).receipt_hash;
    }
    return GENESIS_HASH;
  }

  /**
   * Enforces PATQ Admission Gate checks. Returns void if successful,
   * otherwise throws an error and writes the rejected payload to the quarantine table.
   */
  private async runAdmissionGate(
    jobType: string,
    payload: Record<string, unknown>,
    entityId: string
  ): Promise<void> {
    const gate: AdmissionGate = new DefaultAdmissionGate();
    const decision = gate.evaluate({
      entityId,
      eventType: jobType,
      payload,
      idempotencyKey: entityId || 'dummy',
      occurredAt: new Date().toISOString(),
    });

    if (decision.verdict !== 'admit') {
      const reason = decision.reason || 'Admission gate validation failed';
      await this.powerSyncDb.execute(
        `INSERT INTO sync_job_quarantine (job_type, payload, entity_id, rejection_reason, verdict, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          jobType,
          JSON.stringify(payload),
          entityId,
          reason,
          decision.verdict === 'reject' ? 'quarantine' : decision.verdict,
          new Date().toISOString(),
        ]
      );
      throw new Error(`[PATQ Gate Reject] ${reason}`);
    }
  }

  /**
   * Atomically commits a transaction that saves the receipt and updates the table.
   * receiptHash = BLAKE3(previousReceiptHash + payloadHash + admittedAt + jobType)
   */
  async submitAdmittedProfileUpdate(
    profileId: string,
    username: string,
    fullName: string,
    website: string,
    avatarUrl: string
  ): Promise<void> {
    const jobType = 'profiles.upsert';
    const profilePayload = { username, fullName, website, avatarUrl };

    // Phase 1: Gate Admission Check
    await this.runAdmissionGate(jobType, profilePayload, profileId);

    // Phase 2: Compute Chained BLAKE3 cryptographic receipt
    const prevHash = await this.getLatestReceiptHash();
    const payloadCanonical = canonicalStringify({
      entityId: profileId,
      jobType,
      payload: JSON.stringify(profilePayload),
    });
    const payloadHash = blake3(payloadCanonical);

    const admittedAt = new Date().toISOString();
    const receiptHash = blake3(prevHash + payloadHash + admittedAt + jobType);
    const receiptId = `rcpt_${receiptHash.substring(0, 32)}`;

    // Phase 3: Single atomic transaction commit (Receipt must be written in the same write lock)
    await this.powerSyncDb.writeTransaction(async (tx) => {
      // 1. Insert the receipt record
      await tx.execute(
        `INSERT INTO sync_admission_receipts (
           id, job_type, entity_id, payload_hash, previous_receipt_hash, receipt_hash, admitted_at, status, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          receiptId,
          jobType,
          profileId,
          payloadHash,
          prevHash,
          receiptHash,
          admittedAt,
          'committed',
          new Date().toISOString(),
        ]
      );

      // 2. Perform the target table update
      await tx.execute(
        `INSERT OR REPLACE INTO profiles (
           id, username, full_name, website, avatar_url, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          profileId,
          username,
          fullName,
          website,
          avatarUrl,
          new Date().toISOString(),
        ]
      );
    });
  }
}
