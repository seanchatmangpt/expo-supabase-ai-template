# How to Inject WASM Capability Typestates

This manual details the highly complex procedure of injecting Capability Typestates directly into WebAssembly (WASM) binaries. This technique is utilized within the `ostar-*` generative pipeline (e.g., `wasm4pm`) to enforce strict, unbypassable capability bounds at the byte-code level, preventing arbitrary execution and capability leakage.

> [!WARNING]
> Malformed typestate injections will corrupt the WASM AST, leading to immediate trap upon instantiation. Complete semantic understanding of the target WASM module is mandatory.

## 1. Prerequisites and Environmental Setup

- **WASM Toolchain:** `wasm-tools`, `wasm-bindgen`, and the `ostar-architect` capability module.
- **Target Binary:** Must be a valid `.wasm` file compiled without aggressive stripping (debug symbols preferred).
- **Capability Manifest:** Defines the typestates to be injected.

## 2. Capability Typestate Manifest

The manifest defines the transitions allowed for specific linear memory regions and imported functions.

### `typestate_manifest.json`

```json
{
  "module_name": "core_logic",
  "injections": [
    {
      "target_function": "fs_read",
      "capability_type": "ReadOnlyToken",
      "pre_condition": "Token::Valid",
      "post_condition": "Token::Consumed",
      "violation_trap": true
    },
    {
      "target_memory_region": {
        "offset": "0x1000",
        "size": 1024
      },
      "capability_type": "SecureEnclave",
      "access_control": ["EnclaveManager::Read", "EnclaveManager::Write"]
    }
  ]
}
```

## 3. Typestate Forging and AST Traversal

The injection process requires parsing the WASM binary, identifying function signatures, and rewriting the AST to include typestate transition checks before and after the target instructions.

### Combinatorial Edge Cases in Injection

| Permutation | WASM Construct | Challenge | Resolution |
|-------------|----------------|-----------|------------|
| C-01 | Indirect Calls (`call_indirect`) | Target function unknown at compile time | Inject dynamic type check via `table` modification |
| C-02 | Memory Instructions | Arbitrary pointer arithmetic | Inject bounds checking mask on pointer variables |
| C-03 | Shared Memory (Threads) | Race conditions on typestate | Inject atomic locking around capability transitions |
| C-04 | Exception Handling | Typestate leak on throw | Inject `catch` blocks to invalidate capabilities |

## 4. Execution Sequence

### Phase 1: AST Disassembly

Convert the WASM binary to WebAssembly Text (WAT) format for structural analysis.

```bash
$ wasm2wat ./target.wasm -o ./target.wat
```

### Phase 2: Capability Injection (Automated)

Utilize the `ostar-architect` to perform the surgical injection based on the manifest.

```bash
$ ostar-architect inject-typestate --input ./target.wasm --manifest ./typestate_manifest.json --output ./secure_target.wasm
```

### Phase 3: Verification and Validation

The modified binary must be exhaustively verified. The `ostar-auditor` must confirm that no execution path exists that bypasses the injected typestate transitions.

```bash
$ ostar-auditor verify-wasm --binary ./secure_target.wasm --strict-capabilities
```

> [!TIP]
> Always run the capability fuzzer (`ostar-doctor fuzz-wasm`) post-injection. The fuzzer will attempt to construct ROP (Return-Oriented Programming) chains within the WASM linear memory to bypass the typestates.

## 5. Architectural Implications

- **Performance Overhead:** Typestate checking adds a 2-5% runtime overhead due to additional branching and stack manipulation.
- **Binary Size:** Injected binaries are typically 10-15% larger.
- **Interoperability:** Hosts executing the WASM module must support the `capability-v1` custom section, otherwise the module will be rejected during instantiation.
