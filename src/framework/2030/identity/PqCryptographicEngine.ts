import { WasmCryptoBindings } from './bindings';
import { sha256 } from '../../../lib/crypto/receipts';

// =========================================================================
// Simulated WebAssembly Memory and Allocator
// =========================================================================

const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 }); // 16MB - 32MB linear memory
let heapEnd = 1024; // Start allocations after 1KB offset to avoid NULL pointers
const activeAllocations = new Map<number, number>(); // ptr -> alignedSize

function malloc(size: number): number {
  const alignedSize = Math.ceil(size / 8) * 8; // Align to 8-byte boundary
  const ptr = heapEnd;
  if (ptr + alignedSize > memory.buffer.byteLength) {
    throw new Error('Out of WebAssembly linear memory');
  }
  heapEnd += alignedSize;
  activeAllocations.set(ptr, alignedSize);
  return ptr;
}

function free(ptr: number): void {
  if (activeAllocations.has(ptr)) {
    activeAllocations.delete(ptr);
  }
}

function getWasmMemoryView(): Uint8Array {
  return new Uint8Array(memory.buffer);
}

// Helper utilities for byte conversions
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex;
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function base64ToBytes(str: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(str, 'base64'));
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  const bufferLength = str.length * 0.75;
  let len = str.length;
  if (str[str.length - 1] === '=') {
    len--;
    if (str[str.length - 2] === '=') {
      len--;
    }
  }
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[str.charCodeAt(i)];
    const encoded2 = lookup[str.charCodeAt(i + 1)];
    const encoded3 = lookup[str.charCodeAt(i + 2)];
    const encoded4 = lookup[str.charCodeAt(i + 3)];
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return bytes.subarray(0, p);
}

function fillRandomBytes(arr: Uint8Array): void {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr as any);
  } else {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
}

function sha256Bytes(data: Uint8Array): Uint8Array {
  const hex = sha256(bytesToHex(data));
  return hexToBytes(hex);
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

function intToBytes(val: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = (val >> 24) & 0xff;
  buf[1] = (val >> 16) & 0xff;
  buf[2] = (val >> 8) & 0xff;
  buf[3] = val & 0xff;
  return buf;
}

// =========================================================================
// Cryptographic Simulated FIPS implementations
// =========================================================================

const simulatedWasm: WasmCryptoBindings = {
  memory,
  malloc,
  free,

  ml_kem_768_keypair(pkPtr: number, skPtr: number): number {
    const seed = new Uint8Array(32);
    fillRandomBytes(seed);

    // PK = seed + deterministic components = 1184 bytes
    const pkBytes = new Uint8Array(1184);
    pkBytes.set(seed, 0);
    for (let offset = 32; offset < 1184; offset += 32) {
      const hash = sha256Bytes(concatBytes(seed, intToBytes(offset)));
      pkBytes.set(hash.slice(0, Math.min(32, 1184 - offset)), offset);
    }

    // SK = decryption key (1152 bytes) + pk (1184 bytes) + H(pk) (32 bytes) + z (32 bytes) = 2400 bytes
    const skBytes = new Uint8Array(2400);
    const skSecret = new Uint8Array(1152);
    for (let offset = 0; offset < 1152; offset += 32) {
      const hash = sha256Bytes(concatBytes(seed, intToBytes(offset + 9999)));
      skSecret.set(hash.slice(0, Math.min(32, 1152 - offset)), offset);
    }
    skBytes.set(skSecret, 0);
    skBytes.set(pkBytes, 1152);

    const h_pk = sha256Bytes(pkBytes);
    skBytes.set(h_pk, 1152 + 1184);

    const z = new Uint8Array(32);
    fillRandomBytes(z);
    skBytes.set(z, 1152 + 1184 + 32);

    const view = getWasmMemoryView();
    view.set(pkBytes, pkPtr);
    view.set(skBytes, skPtr);
    return 0;
  },

  ml_kem_768_encapsulate(cPtr: number, ssPtr: number, pkPtr: number): number {
    const view = getWasmMemoryView();
    const pkBytes = view.slice(pkPtr, pkPtr + 1184);
    const r = new Uint8Array(32);
    fillRandomBytes(r);

    const pkHash = sha256Bytes(pkBytes);
    const ss = sha256Bytes(concatBytes(r, pkHash));

    const cBytes = new Uint8Array(1088);
    // c0 = r ^ pkHash
    const c0 = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      c0[i] = r[i] ^ pkHash[i];
    }
    cBytes.set(c0, 0);

    // c1 = ss ^ sha256(r)
    const rHash = sha256Bytes(r);
    const c1 = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      c1[i] = ss[i] ^ rHash[i];
    }
    cBytes.set(c1, 32);

    // Padding (1024 bytes) derived from r
    for (let offset = 64; offset < 1088; offset += 32) {
      const hash = sha256Bytes(concatBytes(r, intToBytes(offset)));
      cBytes.set(hash.slice(0, Math.min(32, 1088 - offset)), offset);
    }

    view.set(cBytes, cPtr);
    view.set(ss, ssPtr);
    return 0;
  },

  ml_kem_768_decapsulate(ssPtr: number, cPtr: number, skPtr: number): number {
    const view = getWasmMemoryView();
    const skBytes = view.slice(skPtr, skPtr + 2400);
    const cBytes = view.slice(cPtr, cPtr + 1088);

    const pkBytes = skBytes.slice(1152, 1152 + 1184);
    const pkHash = sha256Bytes(pkBytes);

    const c0 = cBytes.slice(0, 32);
    const c1 = cBytes.slice(32, 64);

    // Recover r
    const r = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      r[i] = c0[i] ^ pkHash[i];
    }

    // Recompute ss
    const ss = sha256Bytes(concatBytes(r, pkHash));

    // Check c1
    const rHash = sha256Bytes(r);
    let isValid = true;
    for (let i = 0; i < 32; i++) {
      if (c1[i] !== (ss[i] ^ rHash[i])) {
        isValid = false;
      }
    }

    // Verify padding
    for (let offset = 64; offset < 1088; offset += 32) {
      const expectedHash = sha256Bytes(concatBytes(r, intToBytes(offset)));
      const len = Math.min(32, 1088 - offset);
      for (let i = 0; i < len; i++) {
        if (cBytes[offset + i] !== expectedHash[i]) {
          isValid = false;
        }
      }
    }

    if (isValid) {
      view.set(ss, ssPtr);
    } else {
      // Decapsulation failure: implicit rejection returns pseudorandom derived bytes
      const z = skBytes.slice(1152 + 1184 + 32, 1152 + 1184 + 32 + 32);
      const badSs = sha256Bytes(concatBytes(z, cBytes));
      view.set(badSs, ssPtr);
    }

    return 0;
  },

  ml_dsa_65_keypair(pkPtr: number, skPtr: number): number {
    const seed = new Uint8Array(32);
    fillRandomBytes(seed);

    // PK = seed + deterministic components = 1952 bytes
    const pkBytes = new Uint8Array(1952);
    pkBytes.set(seed, 0);
    for (let offset = 32; offset < 1952; offset += 32) {
      const hash = sha256Bytes(concatBytes(seed, intToBytes(offset + 20000)));
      pkBytes.set(hash.slice(0, Math.min(32, 1952 - offset)), offset);
    }

    // SK = pk (1952 bytes) + secret parameters (2080 bytes) = 4032 bytes
    const skBytes = new Uint8Array(4032);
    skBytes.set(pkBytes, 0);
    for (let offset = 1952; offset < 4032; offset += 32) {
      const hash = sha256Bytes(concatBytes(seed, intToBytes(offset + 30000)));
      skBytes.set(hash.slice(0, Math.min(32, 4032 - offset)), offset);
    }

    const view = getWasmMemoryView();
    view.set(pkBytes, pkPtr);
    view.set(skBytes, skPtr);
    return 0;
  },

  ml_dsa_65_sign(
    sigPtr: number,
    skPtr: number,
    msgPtr: number,
    msgLen: number,
    ctxPtr: number,
    ctxLen: number
  ): number {
    const view = getWasmMemoryView();
    const skBytes = view.slice(skPtr, skPtr + 4032);
    const msgBytes = view.slice(msgPtr, msgPtr + msgLen);
    const ctxBytes = view.slice(ctxPtr, ctxPtr + ctxLen);

    const seed = skBytes.slice(0, 32);
    const r = new Uint8Array(32);
    fillRandomBytes(r);

    const inputToHash = concatBytes(concatBytes(concatBytes(seed, msgBytes), ctxBytes), r);
    const h = sha256Bytes(inputToHash);

    const sigBytes = new Uint8Array(3309);
    sigBytes.set(r, 0);
    sigBytes.set(h, 32);

    // Padding (3245 bytes) derived from h
    for (let offset = 64; offset < 3309; offset += 32) {
      const hash = sha256Bytes(concatBytes(h, intToBytes(offset + 40000)));
      sigBytes.set(hash.slice(0, Math.min(32, 3309 - offset)), offset);
    }

    view.set(sigBytes, sigPtr);
    return 0;
  },

  ml_dsa_65_verify(
    pkPtr: number,
    sigPtr: number,
    msgPtr: number,
    msgLen: number,
    ctxPtr: number,
    ctxLen: number
  ): number {
    const view = getWasmMemoryView();
    const pkBytes = view.slice(pkPtr, pkPtr + 1952);
    const sigBytes = view.slice(sigPtr, sigPtr + 3309);
    const msgBytes = view.slice(msgPtr, msgPtr + msgLen);
    const ctxBytes = view.slice(ctxPtr, ctxPtr + ctxLen);

    const seed = pkBytes.slice(0, 32);
    const r = sigBytes.slice(0, 32);
    const h = sigBytes.slice(32, 64);

    const inputToHash = concatBytes(concatBytes(concatBytes(seed, msgBytes), ctxBytes), r);
    const expectedH = sha256Bytes(inputToHash);

    let isValid = true;
    for (let i = 0; i < 32; i++) {
      if (h[i] !== expectedH[i]) {
        isValid = false;
      }
    }

    // Verify padding integrity
    for (let offset = 64; offset < 3309; offset += 32) {
      const expectedHash = sha256Bytes(concatBytes(h, intToBytes(offset + 40000)));
      const len = Math.min(32, 3309 - offset);
      for (let i = 0; i < len; i++) {
        if (sigBytes[offset + i] !== expectedHash[i]) {
          isValid = false;
        }
      }
    }

    return isValid ? 1 : 0;
  },
};

// =========================================================================
// GC Finalizer & Memory Block Wrapper
// =========================================================================

const wasmCleanupRegistry = new FinalizationRegistry<number>((ptr) => {
  simulatedWasm.free(ptr);
});

export class WasmBuffer {
  public readonly ptr: number;
  public readonly size: number;
  public readonly bytes: Uint8Array;
  private freed = false;

  constructor(size: number) {
    this.ptr = simulatedWasm.malloc(size);
    this.size = size;
    this.bytes = new Uint8Array(simulatedWasm.memory.buffer, this.ptr, this.size);
    wasmCleanupRegistry.register(this, this.ptr, this);
  }

  public free(): void {
    if (!this.freed) {
      simulatedWasm.free(this.ptr);
      this.freed = true;
      wasmCleanupRegistry.unregister(this);
    }
  }
}

function wrapWasmBytes(buffer: WasmBuffer): Uint8Array {
  const array = new Uint8Array(buffer.size);
  array.set(buffer.bytes);
  Object.defineProperty(array, '_wasmBuffer', {
    value: buffer,
    enumerable: false,
    writable: false,
  });
  return array;
}

// =========================================================================
// PqCryptographicEngine Implementation
// =========================================================================

export class PqCryptographicEngine {
  /**
   * Generates a combined or individual ML-KEM-768/ML-DSA-65 key pair.
   */
  public async generateKeyPair(
    type: 'ML-KEM-768' | 'ML-DSA-65' | 'kem' | 'dsa' = 'ML-KEM-768'
  ): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
    const isKem = type === 'ML-KEM-768' || type === 'kem';
    const pkSize = isKem ? 1184 : 1952;
    const skSize = isKem ? 2400 : 4032;

    const pkBuf = new WasmBuffer(pkSize);
    const skBuf = new WasmBuffer(skSize);

    if (isKem) {
      simulatedWasm.ml_kem_768_keypair(pkBuf.ptr, skBuf.ptr);
    } else {
      simulatedWasm.ml_dsa_65_keypair(pkBuf.ptr, skBuf.ptr);
    }

    const publicKey = wrapWasmBytes(pkBuf);
    const privateKey = wrapWasmBytes(skBuf);

    return { publicKey, privateKey };
  }

  /**
   * Encapsulates a shared secret using an ML-KEM-768 public key.
   */
  public async encapsulate(
    publicKeyKem: Uint8Array
  ): Promise<{ ciphertext: Uint8Array; sharedSecret: Uint8Array }> {
    if (publicKeyKem.length !== 1184) {
      throw new Error(`Invalid ML-KEM-768 public key size. Expected 1184, got ${publicKeyKem.length}`);
    }

    const pkBuf = new WasmBuffer(1184);
    pkBuf.bytes.set(publicKeyKem);

    const cBuf = new WasmBuffer(1088);
    const ssBuf = new WasmBuffer(32);

    simulatedWasm.ml_kem_768_encapsulate(cBuf.ptr, ssBuf.ptr, pkBuf.ptr);

    const ciphertext = wrapWasmBytes(cBuf);
    const sharedSecret = wrapWasmBytes(ssBuf);

    pkBuf.free();

    return { ciphertext, sharedSecret };
  }

  /**
   * Decapsulates a shared secret using an ML-KEM-768 private key.
   */
  public async decapsulate(
    privateKeyKem: Uint8Array,
    ciphertext: Uint8Array
  ): Promise<Uint8Array> {
    if (privateKeyKem.length !== 2400) {
      throw new Error(`Invalid ML-KEM-768 private key size. Expected 2400, got ${privateKeyKem.length}`);
    }
    if (ciphertext.length !== 1088) {
      throw new Error(`Invalid ML-KEM-768 ciphertext size. Expected 1088, got ${ciphertext.length}`);
    }

    const skBuf = new WasmBuffer(2400);
    skBuf.bytes.set(privateKeyKem);

    const cBuf = new WasmBuffer(1088);
    cBuf.bytes.set(ciphertext);

    const ssBuf = new WasmBuffer(32);

    simulatedWasm.ml_kem_768_decapsulate(ssBuf.ptr, cBuf.ptr, skBuf.ptr);

    const sharedSecret = wrapWasmBytes(ssBuf);

    skBuf.free();
    cBuf.free();

    return sharedSecret;
  }

  /**
   * Signs a message using an ML-DSA-65 private key and optional context string/bytes.
   */
  public async sign(
    privateKeyDsa: Uint8Array,
    message: Uint8Array,
    context: Uint8Array = new Uint8Array(0)
  ): Promise<Uint8Array> {
    if (privateKeyDsa.length !== 4032) {
      throw new Error(`Invalid ML-DSA-65 private key size. Expected 4032, got ${privateKeyDsa.length}`);
    }
    if (context.length > 255) {
      throw new Error(`Context length exceeds 255 bytes limit: ${context.length}`);
    }

    const skBuf = new WasmBuffer(4032);
    skBuf.bytes.set(privateKeyDsa);

    const msgBuf = new WasmBuffer(message.length);
    msgBuf.bytes.set(message);

    const ctxBuf = new WasmBuffer(context.length);
    ctxBuf.bytes.set(context);

    const sigBuf = new WasmBuffer(3309);

    simulatedWasm.ml_dsa_65_sign(sigBuf.ptr, skBuf.ptr, msgBuf.ptr, message.length, ctxBuf.ptr, context.length);

    const signature = wrapWasmBytes(sigBuf);

    skBuf.free();
    msgBuf.free();
    ctxBuf.free();

    return signature;
  }

  /**
   * Verifies an ML-DSA-65 signature against a message and context string/bytes.
   */
  public async verifySignature(
    publicKeyDsa: Uint8Array,
    message: Uint8Array,
    signature: Uint8Array,
    context: Uint8Array = new Uint8Array(0)
  ): Promise<boolean> {
    return this.verifySignatureSync(publicKeyDsa, message, signature, context);
  }

  /**
   * Synchronous signature verification for internal usage in engines.
   */
  public verifySignatureSync(
    publicKeyDsa: Uint8Array,
    message: Uint8Array,
    signature: Uint8Array,
    context: Uint8Array = new Uint8Array(0)
  ): boolean {
    if (publicKeyDsa.length !== 1952) {
      return false;
    }
    if (signature.length !== 3309) {
      return false;
    }
    if (context.length > 255) {
      return false;
    }

    const pkBuf = new WasmBuffer(1952);
    pkBuf.bytes.set(publicKeyDsa);

    const sigBuf = new WasmBuffer(3309);
    sigBuf.bytes.set(signature);

    const msgBuf = new WasmBuffer(message.length);
    msgBuf.bytes.set(message);

    const ctxBuf = new WasmBuffer(context.length);
    ctxBuf.bytes.set(context);

    const result = simulatedWasm.ml_dsa_65_verify(
      pkBuf.ptr,
      sigBuf.ptr,
      msgBuf.ptr,
      message.length,
      ctxBuf.ptr,
      context.length
    );

    pkBuf.free();
    sigBuf.free();
    msgBuf.free();
    ctxBuf.free();

    return result === 1;
  }
}
