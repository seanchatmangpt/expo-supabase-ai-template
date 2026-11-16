import { ZkClaim, ZkProof, ZkVerificationResult } from './types';
import { verifyDidSignature } from '../identity/didResolver';
import { verifyZKProofReceipt, sha256, canonicalStringify } from '../../../lib/crypto/receipts';

export interface VerifiableCredentialEnvelope {
  credential: {
    id?: string;
    type: string[];
    issuer: string;
    issuanceDate: string;
    credentialSubject: {
      id?: string;
      [key: string]: any;
    };
  };
  proof: {
    type: string;
    created?: string;
    verificationMethod?: string;
    proofPurpose?: string;
    jws?: string;
    r?: string;
    s?: string;
  };
}

export class ZkCredentialVerifier {
  public async verifyCredentialProof(
    claim: ZkClaim,
    proof: ZkProof,
    credentialEnvelope: VerifiableCredentialEnvelope
  ): Promise<ZkVerificationResult> {
    try {
      // 1. Verify that proof claimId matches
      if (proof.claimId !== claim.id) {
        return {
          verified: false,
          claimId: claim.id,
          timestamp: Date.now(),
          error: 'Proof claimId mismatch',
        };
      }

      // 2. Verify W3C Credential Signature by the Issuer DID
      const issuerDid = credentialEnvelope.credential.issuer;
      const canonicalCred = canonicalStringify(credentialEnvelope.credential);
      const credentialHash = sha256(canonicalCred);

      let r = credentialEnvelope.proof.r || '';
      let s = credentialEnvelope.proof.s || '';
      if (!r && !s && credentialEnvelope.proof.jws) {
        try {
          const parsedJws = JSON.parse(credentialEnvelope.proof.jws);
          r = parsedJws.r || '';
          s = parsedJws.s || '';
        } catch {
          const parts = credentialEnvelope.proof.jws.split(',');
          if (parts.length === 2) {
            r = parts[0].trim();
            s = parts[1].trim();
          }
        }
      }

      if (!r || !s) {
        return {
          verified: false,
          claimId: claim.id,
          timestamp: Date.now(),
          error: 'Credential signature components (r, s) are missing or invalid',
        };
      }

      const isSignatureValid = verifyDidSignature(issuerDid, credentialHash, { r, s });
      if (!isSignatureValid) {
        return {
          verified: false,
          claimId: claim.id,
          timestamp: Date.now(),
          error: 'Issuer DID signature verification failed',
        };
      }

      // 3. Parse and validate the Groth16 coordinates via verifyZKProofReceipt
      if (!proof.proofData) {
        return {
          verified: false,
          claimId: claim.id,
          timestamp: Date.now(),
          error: 'Proof data is missing',
        };
      }

      let parsedProof: any;
      try {
        parsedProof = JSON.parse(proof.proofData);
      } catch {
        return {
          verified: false,
          claimId: claim.id,
          timestamp: Date.now(),
          error: 'Proof data is not valid JSON',
        };
      }

      const a = parsedProof.a || parsedProof.pi_a;
      const b = parsedProof.b || parsedProof.pi_b;
      const c = parsedProof.c || parsedProof.pi_c;

      if (!Array.isArray(a) || !Array.isArray(b) || !Array.isArray(c)) {
        return {
          verified: false,
          claimId: claim.id,
          timestamp: Date.now(),
          error: 'Invalid SnarkJS proof structure inside proofData',
        };
      }

      const receiptForVerification = {
        proof: {
          a: [a[0], a[1]] as [string | bigint, string | bigint],
          b: [
            [b[0][0], b[0][1]],
            [b[1][0], b[1][1]]
          ] as [[string | bigint, string | bigint], [string | bigint, string | bigint]],
          c: [c[0], c[1]] as [string | bigint, string | bigint]
        },
        publicInputs: proof.publicSignals,
        receiptHash: parsedProof.receiptHash || proof.publicSignals[0] || '0'
      };

      const vk = {
        expectedInputsCount: proof.publicSignals.length
      };

      const zkpVerificationResult = verifyZKProofReceipt(receiptForVerification, vk);
      if (!zkpVerificationResult.valid) {
        return {
          verified: false,
          claimId: claim.id,
          timestamp: Date.now(),
          error: `ZK proof validation failed: ${zkpVerificationResult.error}`,
        };
      }

      // 4. Verify signal operator thresholds matching operators: GT, GTE, LT, LTE, EQ, NEQ
      if (!proof.publicSignals || proof.publicSignals.length === 0) {
        return {
          verified: false,
          claimId: claim.id,
          timestamp: Date.now(),
          error: 'Public signals are empty',
        };
      }

      const signalValue = parseFloat(proof.publicSignals[0]);
      const thresholdValue = parseFloat(claim.threshold);

      let comparisonResult = false;
      if (isNaN(signalValue) || isNaN(thresholdValue)) {
        if (claim.operator === 'EQ') {
          comparisonResult = proof.publicSignals[0] === String(claim.threshold);
        } else if (claim.operator === 'NEQ') {
          comparisonResult = proof.publicSignals[0] !== String(claim.threshold);
        } else {
          comparisonResult = false;
        }
      } else {
        switch (claim.operator) {
          case 'GT':
            comparisonResult = signalValue > thresholdValue;
            break;
          case 'GTE':
            comparisonResult = signalValue >= thresholdValue;
            break;
          case 'LT':
            comparisonResult = signalValue < thresholdValue;
            break;
          case 'LTE':
            comparisonResult = signalValue <= thresholdValue;
            break;
          case 'EQ':
            comparisonResult = signalValue === thresholdValue;
            break;
          case 'NEQ':
            comparisonResult = signalValue !== thresholdValue;
            break;
          default:
            return {
              verified: false,
              claimId: claim.id,
              timestamp: Date.now(),
              error: `Unsupported operator: ${claim.operator}`,
            };
        }
      }

      if (!comparisonResult) {
        return {
          verified: false,
          claimId: claim.id,
          timestamp: Date.now(),
          error: `Operator threshold verification failed for field ${claim.field}`,
        };
      }

      return {
        verified: true,
        claimId: claim.id,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      return {
        verified: false,
        claimId: claim.id,
        timestamp: Date.now(),
        error: err.message || 'Verification failed with internal error',
      };
    }
  }
}
