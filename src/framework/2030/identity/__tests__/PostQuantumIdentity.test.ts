/**
 * @fileoverview Test suite for the Post-Quantum Identity framework.
 *
 * Clickable file references:
 * - Source: [PostQuantumZkEngine.ts](file:///Users/sac/pcpapp/src/framework/2030/identity/PostQuantumZkEngine.ts)
 * - Types: [types.ts](file:///Users/sac/pcpapp/src/framework/2030/identity/types.ts)
 * - Test: [PostQuantumIdentity.test.ts](file:///Users/sac/pcpapp/src/framework/2030/identity/__tests__/PostQuantumIdentity.test.ts)
 */

import { PostQuantumZkEngine } from '../PostQuantumZkEngine';
import { ZkClaim } from '../../../auth/zkp/types';
import { PqZkProof, PqSignature, PqReceipt } from '../types';
import { pqZkEngine } from '../index';

const validSnarkProofData = JSON.stringify({
  pi_a: ['12345678901', '12345678902'],
  pi_b: [
    ['12345678903', '12345678904'],
    ['12345678905', '12345678906'],
  ],
  pi_c: ['12345678907', '12345678908'],
});

describe('PostQuantumZkEngine', () => {
  let engine: PostQuantumZkEngine;
  const mockClaim: ZkClaim = {
    id: 'claim-123',
    field: 'age',
    operator: 'GTE',
    threshold: 18,
  };

  beforeEach(() => {
    engine = new PostQuantumZkEngine();
  });

  it('should export a singleton instance', () => {
    expect(pqZkEngine).toBeInstanceOf(PostQuantumZkEngine);
  });

  it('should verify a standard ZK proof', async () => {
    const proof: PqZkProof = {
      claimId: 'claim-123',
      proofData: validSnarkProofData,
      publicSignals: ['18'],
      enclaveSignature: 'valid-signature',
    };

    const result = await engine.verify(mockClaim, proof);
    expect(result.verified).toBe(true);
    expect(result.pqVerified).toBe(false);
    expect(result.quantumResistant).toBe(false);
  });

  it('should verify a proof with PQ signature', async () => {
    const pqSignature: PqSignature = {
      algorithm: 'Dilithium5',
      data: 'valid-signature',
      publicKey: 'valid-pubkey',
    };

    const proof: PqZkProof = {
      claimId: 'claim-123',
      proofData: validSnarkProofData,
      publicSignals: ['18'],
      pqSignature,
      enclaveSignature: 'valid-signature',
    };

    const result = await engine.verify(mockClaim, proof);
    expect(result.verified).toBe(true);
    expect(result.pqVerified).toBe(true);
    expect(result.quantumResistant).toBe(true);
  });
});
