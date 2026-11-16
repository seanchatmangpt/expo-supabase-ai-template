/**
 * @fileoverview Entry point for the Post-Quantum Identity framework.
 */

export * from './types';
export * from './PostQuantumZkEngine';
export * from './bindings';
export * from './PqCryptographicEngine';
export * from './ClaimTypestate';

import { PostQuantumZkEngine } from './PostQuantumZkEngine';

/**
 * Singleton instance of the Post-Quantum ZKP Engine.
 */
export const pqZkEngine = new PostQuantumZkEngine();
