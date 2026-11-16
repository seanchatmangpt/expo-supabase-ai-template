import { mod, modPow, verifyEcdsaSignature } from '../../../lib/crypto/receipts';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const SECP256K1_P = 2n ** 256n - 2n ** 32n - 977n;

/**
 * Decodes a Base58BTC string without leading 'z' to a byte array.
 */
export function decodeBase58Btc(str: string): Uint8Array {
  let target = str;
  if (target.startsWith('z')) {
    target = target.slice(1);
  }

  let num = 0n;
  for (let i = 0; i < target.length; i++) {
    const char = target[i];
    const index = BASE58_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base58 character: ${char}`);
    }
    num = num * 58n + BigInt(index);
  }

  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num = num >> 8n;
  }

  // Handle leading '1' characters which represent leading zero bytes in Base58
  for (let i = 0; i < target.length && target[i] === '1'; i++) {
    bytes.unshift(0);
  }

  return new Uint8Array(bytes);
}

/**
 * Resolves a did:key DID representing a compressed secp256k1 public key to its
 * uncompressed (x, y) coordinates.
 */
export function resolveDidKeySecp256k1(did: string): { x: bigint; y: bigint } {
  if (!did.startsWith('did:key:')) {
    throw new Error(`Invalid did:key format: must start with did:key:`);
  }
  const idString = did.substring('did:key:'.length);
  const bytes = decodeBase58Btc(idString);

  if (bytes.length !== 35) {
    throw new Error(`Invalid byte length for did:key secp256k1. Expected 35 bytes, got ${bytes.length}`);
  }

  if (bytes[0] !== 0xe7 || bytes[1] !== 0x01) {
    throw new Error(`Invalid multicodec prefix for secp256k1. Expected [0xe7, 0x01], got [0x${bytes[0].toString(16)}, 0x${bytes[1].toString(16)}]`);
  }

  const prefix = bytes[2];
  if (prefix !== 0x02 && prefix !== 0x03) {
    throw new Error(`Invalid decompression prefix. Expected 0x02 or 0x03, got 0x${prefix.toString(16)}`);
  }

  // Extract x coordinate
  const xBytes = bytes.slice(3, 35);
  let x = 0n;
  for (const b of xBytes) {
    x = (x << 8n) | BigInt(b);
  }

  // Elliptic curve math: y^2 = x^3 + 7 mod P
  const rhs = mod(x * x * x + 7n, SECP256K1_P);
  const exp = (SECP256K1_P + 1n) / 4n;
  let y = modPow(rhs, exp, SECP256K1_P);

  // Validate that the computed y is indeed a square root of rhs
  if (mod(y * y, SECP256K1_P) !== rhs) {
    throw new Error('x coordinate does not correspond to a valid point on secp256k1');
  }

  // Align parity of y with the decompression prefix
  const isEven = (y % 2n) === 0n;
  const wantEven = (prefix === 0x02);

  if (isEven !== wantEven) {
    y = SECP256K1_P - y;
  }

  return { x, y };
}

/**
 * Verifies an ECDSA signature against resolved DID coordinates.
 */
export function verifyDidSignature(
  did: string,
  messageHash: string,
  signature: { r: string; s: string }
): boolean {
  try {
    const { x, y } = resolveDidKeySecp256k1(did);
    const result = verifyEcdsaSignature(
      messageHash,
      { r: signature.r, s: signature.s },
      { x: x.toString(), y: y.toString() }
    );
    return result.valid;
  } catch {
    return false;
  }
}
