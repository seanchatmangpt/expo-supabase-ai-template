import { ZkCredentialVerifier, VerifiableCredentialEnvelope } from '../zkCredentialEngine';
import { ZkClaim, ZkProof } from '../types';

jest.mock('../../identity/didResolver', () => {
  const original = jest.requireActual('../../identity/didResolver');
  return {
    ...original,
    verifyDidSignature: jest.fn().mockReturnValue(true) // Mock DID signature to always succeed
  };
});

jest.mock('../../../../lib/crypto/receipts', () => {
  const original = jest.requireActual('../../../../lib/crypto/receipts');
  return {
    ...original,
    verifyZKProofReceipt: jest.fn().mockReturnValue({ valid: true }) // Mock ZK proof verification to always succeed
  };
});

describe('ZkCredentialVerifier', () => {
  let verifier: ZkCredentialVerifier;

  const mockClaim: ZkClaim = {
    id: 'over-18',
    field: 'age',
    operator: 'GTE',
    threshold: 18
  };

  const mockProof: ZkProof = {
    claimId: 'over-18',
    proofData: JSON.stringify({
      pi_a: ['11883344556677889900112233', '22883344556677889900112233', '1'],
      pi_b: [
        ['33883344556677889900112233', '44883344556677889900112233'],
        ['55883344556677889900112233', '66883344556677889900112233'],
        ['1', '0']
      ],
      pi_c: ['77883344556677889900112233', '88883344556677889900112233', '1'],
      receiptHash: '18' // Set receiptHash to match the first public signal for binding check
    }),
    publicSignals: ['18'],
    enclaveSignature: '0x' + 'a'.repeat(40),
  };

  const mockEnvelope: VerifiableCredentialEnvelope = {
    credential: {
      type: ['VerifiableCredential'],
      issuer: 'did:key:zQ3sh',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: 'did:key:zSubject',
        age: 18
      }
    },
    proof: {
      type: 'JsonWebSignature2020',
      r: '1234567890123456789012345678901234567890',
      s: '1234567890123456789012345678901234567890'
    }
  };

  beforeEach(() => {
    verifier = new ZkCredentialVerifier();
  });

  it('verifies a valid credential proof successfully', async () => {
    const result = await verifier.verifyCredentialProof(mockClaim, mockProof, mockEnvelope);
    expect(result.verified).toBe(true);
    expect(result.claimId).toBe(mockClaim.id);
    expect(result.error).toBeUndefined();
  });

  it('rejects if claimId mismatches', async () => {
    const badProof = { ...mockProof, claimId: 'wrong-claim-id' };
    const result = await verifier.verifyCredentialProof(mockClaim, badProof, mockEnvelope);
    expect(result.verified).toBe(false);
    expect(result.error).toContain('claimId mismatch');
  });

  it('verifies all supported comparison operators', async () => {
    // GT
    {
      const claim: ZkClaim = { ...mockClaim, operator: 'GT', threshold: 17 };
      const result = await verifier.verifyCredentialProof(claim, mockProof, mockEnvelope);
      expect(result.verified).toBe(true);
    }
    // GTE
    {
      const claim: ZkClaim = { ...mockClaim, operator: 'GTE', threshold: 18 };
      const result = await verifier.verifyCredentialProof(claim, mockProof, mockEnvelope);
      expect(result.verified).toBe(true);
    }
    // LT
    {
      const claim: ZkClaim = { ...mockClaim, operator: 'LT', threshold: 19 };
      const result = await verifier.verifyCredentialProof(claim, mockProof, mockEnvelope);
      expect(result.verified).toBe(true);
    }
    // LTE
    {
      const claim: ZkClaim = { ...mockClaim, operator: 'LTE', threshold: 18 };
      const result = await verifier.verifyCredentialProof(claim, mockProof, mockEnvelope);
      expect(result.verified).toBe(true);
    }
    // EQ
    {
      const claim: ZkClaim = { ...mockClaim, operator: 'EQ', threshold: 18 };
      const result = await verifier.verifyCredentialProof(claim, mockProof, mockEnvelope);
      expect(result.verified).toBe(true);
    }
    // NEQ
    {
      const claim: ZkClaim = { ...mockClaim, operator: 'NEQ', threshold: 17 };
      const result = await verifier.verifyCredentialProof(claim, mockProof, mockEnvelope);
      expect(result.verified).toBe(true);
    }
  });

  it('rejects if operator threshold is not satisfied', async () => {
    const claim: ZkClaim = { ...mockClaim, operator: 'GT', threshold: 20 };
    const result = await verifier.verifyCredentialProof(claim, mockProof, mockEnvelope);
    expect(result.verified).toBe(false);
    expect(result.error).toContain('threshold verification failed');
  });
});
