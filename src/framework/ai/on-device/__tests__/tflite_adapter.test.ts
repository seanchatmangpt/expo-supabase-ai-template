import { FastTFLiteAdapter } from '../FastTFLiteAdapter';
import { EdgeAiSyncBroker } from '../EdgeAiSyncBroker';
import { LocalInferenceEngine } from '../LocalInferenceEngine';
import { expoDb } from '@/src/lib/db/db';

describe('FastTFLiteAdapter & EdgeAiSyncBroker', () => {
  let adapter: FastTFLiteAdapter;

  beforeEach(() => {
    adapter = new FastTFLiteAdapter();
  });

  describe('FastTFLiteAdapter Tokenization & Classifier', () => {
    it('should split text and map known BPE tokens to correct IDs', () => {
      const tokens = adapter.tokenize('hello fitness profile');
      // Starts with <s> (1) and ends with </s> (2)
      expect(tokens[0]).toBe(1);
      expect(tokens[tokens.length - 1]).toBe(2);

      // 'hello' -> 3, 'fitness' -> 5, 'profile' -> 8
      expect(tokens).toContain(3);
      expect(tokens).toContain(5);
      expect(tokens).toContain(8);
    });

    it('should fall back to deterministic character-hashing for out-of-vocab words', () => {
      const tokens = adapter.tokenize('unknownword');
      expect(tokens.length).toBe(3); // <s>, hashed token, </s>
      expect(tokens[1]).toBeGreaterThanOrEqual(14);
      expect(tokens[1]).toBeLessThanOrEqual(24);
    });

    it('should convert tokens to a float array normalized between 0 and 1', () => {
      const tokens = [1, 3, 8, 2];
      const floats = adapter.toFloatTensor(tokens);
      expect(floats.length).toBe(4);
      floats.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0.0);
        expect(val).toBeLessThanOrEqual(1.0);
      });
      // 3 -> 3 / 30 = 0.1
      expect(floats[1]).toBeCloseTo(0.1);
    });

    it('should correctly classify greeting intent', () => {
      const tokens = adapter.tokenize('hi there hello');
      const floats = adapter.toFloatTensor(tokens);
      const classification = adapter.runTFLiteClassifier(floats);
      expect(classification.intent).toBe('greeting');
    });

    it('should correctly classify conformance intent', () => {
      const tokens = adapter.tokenize('check fitness alignment and conformance');
      const floats = adapter.toFloatTensor(tokens);
      const classification = adapter.runTFLiteClassifier(floats);
      expect(classification.intent).toBe('conformance');
    });

    it('should correctly classify profile intent', () => {
      const tokens = adapter.tokenize('open profile account');
      const floats = adapter.toFloatTensor(tokens);
      const classification = adapter.runTFLiteClassifier(floats);
      expect(classification.intent).toBe('profile');
    });

    it('should return correct response text and usage stats on run()', async () => {
      const result = await adapter.run({
        requestId: 'req-1',
        modelId: 'phi-2-orange',
        prompt: 'hello assistant',
        issuedAt: new Date().toISOString(),
      });

      expect(result.text).toContain('Hello! I am your on-device assistant');
      expect(result.usage.promptTokens).toBeGreaterThan(0);
      expect(result.usage.completionTokens).toBeGreaterThan(0);
    });

    it('should stream tokens and return final response on stream()', async () => {
      const tokensReceived: string[] = [];
      const onToken = (t: string) => {
        tokensReceived.push(t);
      };

      const result = await adapter.stream(
        {
          requestId: 'req-2',
          modelId: 'phi-2-orange',
          prompt: 'open profile',
          issuedAt: new Date().toISOString(),
        },
        onToken
      );

      expect(tokensReceived.length).toBeGreaterThan(0);
      const joined = tokensReceived.join('');
      expect(joined).toContain('profile');
      expect(result.text).toBe(joined);
    });
  });

  describe('EdgeAiSyncBroker SQLite & Supabase Sync', () => {
    let broker: EdgeAiSyncBroker;
    let engine: LocalInferenceEngine;

    let localDbState: any[] = [];

    beforeEach(() => {
      broker = new EdgeAiSyncBroker();
      engine = new LocalInferenceEngine(adapter);
      localDbState = [];

      (expoDb.runSync as jest.Mock).mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('INSERT OR REPLACE INTO edge_ai_inference_results')) {
          localDbState.push({
            id: params[0],
            request_id: params[1],
            model_id: params[2],
            prompt: params[3],
            response_text: params[4],
            latency_ms: params[5],
            delta_hash: params[6],
            previous_hash: params[7],
            status: params[8],
            created_at: params[9],
          });
        } else if (sql.includes("UPDATE edge_ai_inference_results SET status = 'synced'")) {
          const id = params[0];
          const found = localDbState.find((r) => r.id === id);
          if (found) {
            found.status = 'synced';
          }
        } else if (sql.includes("UPDATE edge_ai_inference_results SET status = 'failed'")) {
          const id = params[0];
          const found = localDbState.find((r) => r.id === id);
          if (found) {
            found.status = 'failed';
          }
        }
      });

      (expoDb.getAllSync as jest.Mock).mockImplementation((sql: string, params: any[]) => {
        if (sql.includes("status = 'pending'")) {
          return localDbState.filter((r) => r.status === 'pending');
        }
        if (sql.includes('WHERE id = ?')) {
          const id = params[0];
          return localDbState.filter((r) => r.id === id);
        }
        return localDbState;
      });
    });

    it('should persist inference response locally and sync pending receipts to Supabase', async () => {
      const response = await engine.inferTyped({
        requestId: 'req-1',
        modelId: 'phi-2-orange',
        prompt: 'hello user',
        issuedAt: new Date().toISOString(),
      });

      // 1. Persist local
      broker.persistLocal(response, 'hello user');

      const localResults = expoDb.getAllSync("SELECT * FROM edge_ai_inference_results") as any[];
      expect(localResults.length).toBe(1);
      expect(localResults[0].id).toBe(response.receipt.id);
      expect(localResults[0].prompt).toBe('hello user');
      expect(localResults[0].status).toBe('pending');
      expect(localResults[0].response_text).toContain('Hello!');

      // Mock Supabase sync client
      const mockSupabase = require('@/lib/supabase').supabase;
      const originalFrom = mockSupabase.from;

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      // 2. Sync to Supabase
      await broker.syncPendingReceipts();

      expect(mockUpsert).toHaveBeenCalled();
      
      const localResultsAfter = expoDb.getAllSync(
        "SELECT * FROM edge_ai_inference_results WHERE id = ?",
        [response.receipt.id]
      ) as any[];
      expect(localResultsAfter[0].status).toBe('synced');

      // Restore original
      mockSupabase.from = originalFrom;
    });
  });
});
