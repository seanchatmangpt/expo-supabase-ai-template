import { decodeBase58Btc, resolveDidKeySecp256k1, verifyDidSignature } from '../didResolver';
import { SECP256K1_G } from '../../../../lib/crypto/receipts';

// Simple Base58 encoder for dynamic test vector generation
function encodeBase58Btc(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const b of bytes) {
    num = (num << 8n) | BigInt(b);
  }
  let str = '';
  while (num > 0n) {
    const rem = num % 58n;
    str = alphabet[Number(rem)] + str;
    num = num / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    str = '1' + str;
  }
  return 'z' + str;
}

describe('didResolver', () => {
  describe('decodeBase58Btc', () => {
    it('decodes standard Base58BTC string', () => {
      const bytes = new Uint8Array([0, 1, 2, 3, 255]);
      const encoded = encodeBase58Btc(bytes);
      const decoded = decodeBase58Btc(encoded);
      expect(decoded).toEqual(bytes);
    });

    it('throws error for invalid characters', () => {
      expect(() => decodeBase58Btc('zInvalidCharacter_0')).toThrow();
    });
  });

  describe('resolveDidKeySecp256k1', () => {
    it('resolves compressed secp256k1 Generator point (even parity)', () => {
      const xBytes = new Uint8Array(32);
      let temp = SECP256K1_G.x;
      for (let i = 31; i >= 0; i--) {
        xBytes[i] = Number(temp & 0xffn);
        temp = temp >> 8n;
      }

      // Prefix: multicodec = 0xe7 0x01, decompression = 0x02 (even)
      const pkBytes = new Uint8Array(35);
      pkBytes[0] = 0xe7;
      pkBytes[1] = 0x01;
      pkBytes[2] = 0x02;
      pkBytes.set(xBytes, 3);

      const did = 'did:key:' + encodeBase58Btc(pkBytes);
      const coords = resolveDidKeySecp256k1(did);

      expect(coords.x).toBe(SECP256K1_G.x);
      expect(coords.y).toBe(SECP256K1_G.y);
    });

    it('throws error for invalid did format', () => {
      expect(() => resolveDidKeySecp256k1('did:other:abc')).toThrow();
    });

    it('throws error for invalid multicodec prefix', () => {
      const badPkBytes = new Uint8Array(35);
      badPkBytes[0] = 0x99;
      badPkBytes[1] = 0x99;
      const did = 'did:key:' + encodeBase58Btc(badPkBytes);
      expect(() => resolveDidKeySecp256k1(did)).toThrow();
    });
  });

  describe('verifyDidSignature', () => {
    it('returns false for invalid signature math', () => {
      const xBytes = new Uint8Array(32);
      let temp = SECP256K1_G.x;
      for (let i = 31; i >= 0; i--) {
        xBytes[i] = Number(temp & 0xffn);
        temp = temp >> 8n;
      }

      const pkBytes = new Uint8Array(35);
      pkBytes[0] = 0xe7;
      pkBytes[1] = 0x01;
      pkBytes[2] = 0x02;
      pkBytes.set(xBytes, 3);

      const did = 'did:key:' + encodeBase58Btc(pkBytes);
      const messageHash = '0x1234567890';
      const sig = { r: '123', s: '456' };

      const result = verifyDidSignature(did, messageHash, sig);
      expect(result).toBe(false);
    });
  });
});
