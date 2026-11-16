import { openDatabaseSync } from 'expo-sqlite';
import { executeSupervisedTransaction, runSupervisedSync } from '../EffectSyncSupervisor';
import { Effect } from 'effect';

// Setup global fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('EffectSyncSupervisor', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = openDatabaseSync('test');
    // Ensure closeSync exists on the mock DB instance
    mockDb.closeSync = jest.fn();
  });

  describe('executeSupervisedTransaction', () => {
    it('executes the query and closes the connection successfully', async () => {
      mockDb.execSync.mockReturnValue(undefined);

      const effect = executeSupervisedTransaction('test-db', 'SELECT 1;');
      const result = await effect.run();

      expect(result).toBe('Transaction completed successfully');
      expect(mockDb.execSync).toHaveBeenCalledWith('SELECT 1;');
      expect(mockDb.closeSync).toHaveBeenCalled();
    });

    it('closes the connection even if query execution throws an error', async () => {
      const errorMsg = 'SQLite error';
      mockDb.execSync.mockImplementation(() => {
        throw new Error(errorMsg);
      });

      const effect = executeSupervisedTransaction('test-db', 'INVALID QUERY;');

      await expect(effect.run()).rejects.toEqual({
        _tag: 'DbError',
        message: errorMsg,
      });

      expect(mockDb.closeSync).toHaveBeenCalled();
    });
  });

  describe('runSupervisedSync', () => {
    it('syncs successfully when server returns 200 OK', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const payload = { userId: 'usr_1', data: 'hello' };
      const effect = runSupervisedSync(payload, 2);
      const result = await effect.run();

      expect(result).toBe('Synced successfully');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and logs to quarantine on exhaustion', async () => {
      // Server always returns failure
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      mockDb.execSync.mockReturnValue(undefined);

      const payload = { userId: 'usr_1', data: 'hello' };
      // maxRetries = 2 (meaning 1 initial + 2 retries = 3 attempts total)
      const effect = runSupervisedSync(payload, 2);
      const result = await effect.run();

      // Upon exhaustion, it catchAlls and returns the quarantine success message
      expect(result).toBe('Job safely quarantined inside sync_job_quarantine');
      // Fetch should be attempted 3 times
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verify that quarantine SQLite insertion occurred
      expect(mockDb.execSync).toHaveBeenCalled();
      const lastSql = mockDb.execSync.mock.calls[0][0];
      expect(lastSql).toContain('INSERT INTO "sync_job_quarantine"');
      expect(lastSql).toContain('supabase_sync');
      expect(lastSql).toContain('Server returned error status code: 500');
    });
  });
});
