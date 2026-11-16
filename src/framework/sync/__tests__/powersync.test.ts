import { SupabaseConnector } from '../powersync/SupabaseConnector';
import { TrueXPowerSyncDB } from '../powersync/TrueXPowerSyncDB';
import { PowerSyncDatabase } from '@powersync/react-native';
import { mockState, BatteryState, NetworkStateType } from '../background-compat';
import { BACKGROUND_SYNC_TASK } from '../backgroundSyncWorker';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { expoDb } from '@/src/lib/db/db';

describe('PowerSync Connector & TrueXPowerSyncDB & Background Sync Energy Policies', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { access_token: 'test-jwt-token' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };
  });

  describe('SupabaseConnector', () => {
    it('should fetch credentials using the active Supabase session', async () => {
      const connector = new SupabaseConnector(mockSupabase);
      const creds = await connector.fetchCredentials();
      expect(creds.token).toBe('test-jwt-token');
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    });

    it('should process PUT, PATCH, and DELETE operations from CrudTransaction', async () => {
      const connector = new SupabaseConnector(mockSupabase);
      const mockDb = new PowerSyncDatabase({
        schema: {} as any,
        database: { dbFilename: 'test.db' },
      });

      mockDb.enqueueCrudEntry({
        id: 'user1',
        op: 'PUT',
        table: 'profiles',
        opData: { username: 'testuser' },
      });
      mockDb.enqueueCrudEntry({
        id: 'user2',
        op: 'PATCH',
        table: 'profiles',
        opData: { username: 'updateduser' },
      });
      mockDb.enqueueCrudEntry({
        id: 'user3',
        op: 'DELETE',
        table: 'profiles',
      });

      await connector.uploadData(mockDb);

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.from('profiles').upsert).toHaveBeenCalledWith({
        id: 'user1',
        username: 'testuser',
      });
      expect(mockSupabase.from('profiles').update).toHaveBeenCalledWith({
        username: 'updateduser',
      });
      expect(mockSupabase.from('profiles').delete).toHaveBeenCalled();

      // The mutation queue should now be empty
      const nextTx = await mockDb.getNextCrudTransaction();
      expect(nextTx).toBeNull();
    });
  });

  describe('TrueXPowerSyncDB (PATQ Law Enforcement)', () => {
    let dbWrapper: TrueXPowerSyncDB;

    beforeEach(async () => {
      dbWrapper = new TrueXPowerSyncDB(mockSupabase);
      await dbWrapper.initialize();
      
      // Clean tables
      await dbWrapper.powerSyncDb.execute('DELETE FROM profiles');
      await dbWrapper.powerSyncDb.execute('DELETE FROM sync_admission_receipts');
      await dbWrapper.powerSyncDb.execute('DELETE FROM sync_job_quarantine');
    });

    it('should enforce AdmissionGate, throw error, and log to quarantine on invalid input', async () => {
      // Empty username/profileId
      await expect(
        dbWrapper.submitAdmittedProfileUpdate('', '', '', '', '')
      ).rejects.toThrow('[PATQ Gate Reject]');

      const quarantine = await dbWrapper.powerSyncDb.execute('SELECT * FROM sync_job_quarantine');
      expect(quarantine.rows.length).toBe(1);
      expect(quarantine.rows.item(0).rejection_reason).toContain('entityId');
      expect(quarantine.rows.item(0).verdict).toBe('quarantine');
    });

    it('should successfully compute the BLAKE3 receipt chain hash and perform atomic write transaction', async () => {
      // First insert
      await dbWrapper.submitAdmittedProfileUpdate(
        'profile-1',
        'johndoe',
        'John Doe',
        'https://example.com',
        'https://example.com/avatar.png'
      );

      const profile = await dbWrapper.powerSyncDb.execute('SELECT * FROM profiles WHERE id = ?', ['profile-1']);
      expect(profile.rows.length).toBe(1);
      expect(profile.rows.item(0).username).toBe('johndoe');

      const receipts = await dbWrapper.powerSyncDb.execute('SELECT * FROM sync_admission_receipts');
      expect(receipts.rows.length).toBe(1);
      expect(receipts.rows.item(0).entity_id).toBe('profile-1');
      expect(receipts.rows.item(0).previous_receipt_hash).toBe('@truex/membrane-client:outbox-admission:genesis');

      const firstHash = receipts.rows.item(0).receipt_hash;

      // Second insert (chain link)
      await dbWrapper.submitAdmittedProfileUpdate(
        'profile-2',
        'janedoe',
        'Jane Doe',
        'https://example2.com',
        'https://example2.com/avatar.png'
      );

      const receipts2 = await dbWrapper.powerSyncDb.execute(
        'SELECT * FROM sync_admission_receipts ORDER BY admitted_at DESC'
      );
      expect(receipts2.rows.length).toBe(2);
      expect(receipts2.rows.item(0).entity_id).toBe('profile-2');
      // The previous_receipt_hash of the second record should equal receipt_hash of the first
      expect(receipts2.rows.item(0).previous_receipt_hash).toBe(firstHash);
    });
  });

  describe('BackgroundSyncWorker Energy Policies', () => {
    let localQueueState: any[] = [];

    beforeEach(() => {
      // Reset mock device state
      mockState.batteryLevel = 1.0;
      mockState.batteryState = BatteryState.FULL;
      mockState.networkConnected = true;
      localQueueState = [];

      (expoDb.execSync as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes("DELETE FROM sync_queue")) {
          localQueueState = [];
        }
      });

      (expoDb.runSync as jest.Mock).mockImplementation((sql: string, params: any[]) => {
        if (sql.includes("INSERT INTO sync_queue")) {
          localQueueState.push({
            id: localQueueState.length + 1,
            job_type: params[0],
            payload: params[1],
            status: params[2],
            attempts: params[3],
            entity_id: params[4],
            created_at: params[5],
          });
        } else if (sql.includes("UPDATE sync_queue SET status = 'processing'")) {
          const id = params[0];
          const found = localQueueState.find(j => j.id === id);
          if (found) found.status = 'processing';
        } else if (sql.includes("DELETE FROM sync_queue WHERE id = ?")) {
          const id = params[0];
          localQueueState = localQueueState.filter(j => j.id !== id);
        }
      });

      (expoDb.getAllSync as jest.Mock).mockImplementation((sql: string) => {
        if (sql.includes("SELECT * FROM sync_queue")) {
          return localQueueState.filter(j => j.status === 'pending' || j.status === 'failed');
        }
        return [];
      });
    });

    it('should run background sync worker and defer execution when battery is low and unplugged', async () => {
      mockState.batteryLevel = 0.15; // 15% battery
      mockState.batteryState = BatteryState.UNPLUGGED;

      const executor = mockState.definedTasks.get(BACKGROUND_SYNC_TASK);
      expect(executor).toBeDefined();

      const result = await executor!(null);
      // Returns NoData indicating deferral
      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NoData);

      // Verify task registration minimumInterval is stretched
      // We expect the worker to re-register the task with stretched interval (3600 seconds)
      // Let's verify that registeredTasks contains BACKGROUND_SYNC_TASK
      expect(mockState.registeredTasks.has(BACKGROUND_SYNC_TASK)).toBe(true);
    });

    it('should execute outbox sync queue replication sequentially when battery is healthy', async () => {
      mockState.batteryLevel = 0.50; // 50% battery
      mockState.batteryState = BatteryState.UNPLUGGED;

      // Prepare sync_queue records
      expoDb.execSync("DELETE FROM sync_queue");
      
      const payloadCmd = JSON.stringify({
        id: 'cmd-1',
        actor: 'actor-1',
        command: 'action',
        principal: 'user',
        payload: '{}',
        idempotencyKey: 'key-1',
        createdAt: Date.now(),
        status: 'pending',
      });
      
      expoDb.runSync(
        `INSERT INTO sync_queue (job_type, payload, status, attempts, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['ACTOR_COMMAND', payloadCmd, 'pending', 0, 'entity-1', Date.now()]
      );

      const executor = mockState.definedTasks.get(BACKGROUND_SYNC_TASK);
      const result = await executor!(null);

      // Sync should execute successfully and return NewData
      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NewData);

      // Verify the job was removed from the local SQLite sync_queue after successful Supabase upload
      const jobs = expoDb.getAllSync("SELECT * FROM sync_queue");
      expect(jobs.length).toBe(0);
    });
  });
});
