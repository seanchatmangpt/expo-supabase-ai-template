/**
 * @fileoverview WebAssembly Linear Memory structures and interfaces for Post-Quantum cryptographic operations.
 */

export interface WasmAllocation {
  ptr: number;
  size: number;
}

export interface WasmKeyPair {
  publicKeyPtr: number;
  publicKeyLen: number;
  privateKeyPtr: number;
  privateKeyLen: number;
}

export interface WasmEncapsulateResult {
  ciphertextPtr: number;
  ciphertextLen: number;
  sharedSecretPtr: number;
  sharedSecretLen: number;
}

export interface WasmSignatureResult {
  signaturePtr: number;
  signatureLen: number;
}

/**
 * Interface representing the export signatures of our simulated or native WASM module.
 */
export interface WasmCryptoBindings {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(ptr: number): void;
  
  // ML-KEM-768 Bindings
  ml_kem_768_keypair(pkPtr: number, skPtr: number): number;
  ml_kem_768_encapsulate(cPtr: number, ssPtr: number, pkPtr: number): number;
  ml_kem_768_decapsulate(ssPtr: number, cPtr: number, skPtr: number): number;
  
  // ML-DSA-65 Bindings
  ml_dsa_65_keypair(pkPtr: number, skPtr: number): number;
  ml_dsa_65_sign(
    sigPtr: number,
    skPtr: number,
    msgPtr: number,
    msgLen: number,
    ctxPtr: number,
    ctxLen: number
  ): number;
  ml_dsa_65_verify(
    pkPtr: number,
    sigPtr: number,
    msgPtr: number,
    msgLen: number,
    ctxPtr: number,
    ctxLen: number
  ): number;
}
