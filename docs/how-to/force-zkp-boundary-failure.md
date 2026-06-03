# How to Force a Zero-Knowledge Proof (ZKP) Boundary Failure

This tactical guide outlines the exhaustive procedures required to deliberately induce a boundary failure in a Zero-Knowledge Proof (ZKP) verification circuit. This procedure is typically employed by PhD-level operators during penetration testing, adversarial capability auditing, or when collapsing rogue zk-SNARKs/zk-STARKs.

> [!CAUTION]
> Inducing a boundary failure outside of isolated environments can compromise the cryptographic integrity of the entire chain, leading to zero-day value extraction and consensus halts. Proceed strictly under authorized `ostar-auditor` protocols.

## 1. Scope and Circuit Deficiencies

Boundary failures occur when a prover manipulates the execution trace polynomials to satisfy the verifier's constraints while violating the underlying computational logic (e.g., out-of-bounds memory access disguised as a valid state transition).

Target Circuits:
- Plonk-based systems with custom gates.
- Halo2 implementations with insufficiently constrained lookup tables.
- STARKs with improper FRI (Fast Reed-Solomon Interactive Oracle Proof of Proximity) degree bounds.

## 2. Configuration for Witness Forgery

To force the failure, you must forge a witness that satisfies the polynomial identity but exploits a boundary constraint missing in the arithmetization.

### Forgery Payload (`witness_forge.yaml`)

```yaml
target_circuit: "0xzkRogue_v2"
proof_system: "Halo2"
polynomial_degree: 2048
boundary_constraints:
  - gate: "range_check"
    type: "out_of_bounds_overflow"
    injected_value: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE"
    expected_modulo: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
lookup_table_poisoning:
  enabled: true
  table_id: "fibonacci_sequence"
  poisoned_row: [ 1, -1, 0 ] # Invalid state disguised as valid
```

## 3. Combinatorial Execution Matrix

The success of a boundary failure depends on the specific permutation of constraints and verifier logic.

| Permutation | Prover Strategy | Verifier Flaw | Result | Required Tooling |
|-------------|-----------------|---------------|--------|------------------|
| A-1 | Degree Overflow | Loose FRI bounds | Silent Proof Acceptance | `ostar-operator forge-fri` |
| A-2 | Lookup Poisoning | Missing row check | State Corruption | `zk-poison-lookup` |
| B-1 | Custom Gate Bypass | Incomplete selector | Logic Bypass | `halo2-bypass` |
| B-2 | Fiat-Shamir Weakness | Weak hash binding | Proof Replay | `fiat-shamir-crack` |

## 4. Step-by-Step Actuation

### Step 1: Subvert the Setup Phase

If the target uses a trusted setup, attempt to recover the toxic waste or inject a localized bias during a multi-party computation (MPC) ceremony. (Assuming this is a post-setup attack, skip to Step 2).

### Step 2: Witness Generation

Generate the poisoned witness using the `ostar-operator` framework.

```bash
$ ostar-operator zkp-forge --config ./witness_forge.yaml --output ./poisoned_witness.wtns
```

### Step 3: Polynomial Commitment Manipulation

Generate the proof, ensuring the commitment scheme (e.g., KZG) binds to the poisoned polynomial.

```rust
// Exploit snippet
let poisoned_poly = DensePolynomial::from_coefficients_slice(&forged_coeffs);
let commitment = kzg_commit(&srs, &poisoned_poly);
// Ensure the verifier accepts the commitment despite the boundary violation
```

### Step 4: Submission and Collapse

Submit the proof to the verifier contract.

```bash
$ ostar-auditor submit-proof --proof ./forged.proof --target 0xVerifierContract
```

Monitor the contract state. A successful boundary failure will result in the verifier state transitioning to `ACCEPTED` while the internal logic invariants are verifiably corrupted.

> [!IMPORTANT]
> Always maintain a snapshot of the pre-collapse state. Boundary failures can cause recursive state degradation, making post-mortem analysis impossible without a clean snapshot.
