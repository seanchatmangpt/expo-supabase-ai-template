import { PqCryptographicEngine } from '../PqCryptographicEngine';

describe('PqCryptographicEngine', () => {
  let engine: PqCryptographicEngine;

  beforeEach(() => {
    engine = new PqCryptographicEngine();
  });

  describe('ML-KEM-768', () => {
    it('generates a valid key pair, encapsulates, and decapsulates correctly', async () => {
      // 1. Generate key pair
      const { publicKey, privateKey } = await engine.generateKeyPair('ML-KEM-768');
      expect(publicKey.length).toBe(1184);
      expect(privateKey.length).toBe(2400);

      // 2. Encapsulate
      const { ciphertext, sharedSecret } = await engine.encapsulate(publicKey);
      expect(ciphertext.length).toBe(1088);
      expect(sharedSecret.length).toBe(32);

      // 3. Decapsulate
      const recoveredSecret = await engine.decapsulate(privateKey, ciphertext);
      expect(recoveredSecret.length).toBe(32);
      expect(recoveredSecret).toEqual(sharedSecret);
    });

    it('returns a different secret on decapsulation failure (implicit rejection)', async () => {
      const { publicKey, privateKey } = await engine.generateKeyPair('ML-KEM-768');
      const { ciphertext, sharedSecret } = await engine.encapsulate(publicKey);

      // Tamper with the ciphertext
      const tamperedCiphertext = new Uint8Array(ciphertext);
      tamperedCiphertext[0] ^= 0xff;

      const recoveredSecret = await engine.decapsulate(privateKey, tamperedCiphertext);
      expect(recoveredSecret).not.toEqual(sharedSecret);
    });
  });

  describe('ML-DSA-65', () => {
    it('generates a valid key pair, signs, and verifies signatures correctly', async () => {
      // 1. Generate key pair
      const { publicKey, privateKey } = await engine.generateKeyPair('ML-DSA-65');
      expect(publicKey.length).toBe(1952);
      expect(privateKey.length).toBe(4032);

      // 2. Sign message
      const message = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const context = new Uint8Array([1, 2, 3]);
      const signature = await engine.sign(privateKey, message, context);
      expect(signature.length).toBe(3309);

      // 3. Verify signature
      const isValid = await engine.verifySignature(publicKey, message, signature, context);
      expect(isValid).toBe(true);
    });

    it('rejects tampered signatures or modified messages', async () => {
      const { publicKey, privateKey } = await engine.generateKeyPair('ML-DSA-65');
      const message = new Uint8Array([72, 101, 108, 108, 111]);
      const context = new Uint8Array([1, 2, 3]);
      const signature = await engine.sign(privateKey, message, context);

      // Tamper message
      const tamperedMessage = new Uint8Array([72, 101, 108, 108, 112]); // "Hellp"
      const isValidWithTamperedMsg = await engine.verifySignature(publicKey, tamperedMessage, signature, context);
      expect(isValidWithTamperedMsg).toBe(false);

      // Tamper signature
      const tamperedSignature = new Uint8Array(signature);
      tamperedSignature[0] ^= 0xff;
      const isValidWithTamperedSig = await engine.verifySignature(publicKey, message, tamperedSignature, context);
      expect(isValidWithTamperedSig).toBe(false);
    });
  });
});
