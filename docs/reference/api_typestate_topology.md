# API Typestate Topology: Formal Reference

## 1. Topological Foundations of the Typestate System

The typestate topology of the system is formalized as a directed multigraph $\mathcal{G} = (\mathcal{V}, \mathcal{E}, \Sigma, \delta)$, where $\mathcal{V}$ represents the set of strictly evaluated type states, $\mathcal{E}$ represents the valid, cryptographically verified state transitions, $\Sigma$ is the alphabet of trigger events, and $\delta: \mathcal{V} \times \Sigma \rightarrow \mathcal{V}$ is the deterministic transition function constrained by our Rust-level borrow checker semantics.

### 1.1 State Space Mapping

| State Node $\nu \in \mathcal{V}$ | Description | Invariants $\Phi(\nu)$ | Admissible Transitions | Memory Representation |
|---|---|---|---|---|
| `Uninitialized` | Null state pre-allocation. | $\emptyset$ | `Initialize`, `Abort` | `MaybeUninit<T>` |
| `Allocated` | Memory reserved, values unassigned. | $ptr \neq \text{null} \land \text{len} = 0$ | `Hydrate`, `Deallocate` | `*mut T` |
| `Hydrated` | Data validated against schema. | $\text{checksum}(data) = valid$ | `Process`, `Seal` | `&mut T` |
| `Sealed` | Immutable frozen state. | $data = \text{const}$ | `Verify`, `Archive` | `&T` (Static) |

## 2. Capability Transitions and Functorial Semantics

The mappings between distinct API layers form a category where objects are the typestates and morphisms are the capability-granting functions. We apply the Yoneda Lemma to represent states by the transitions they permit.

### 2.1 The Transition Matrix $\mathcal{M}_{T}$

For $N$ states, the transition probability matrix is an $N \times N$ matrix where entries map to boolean validity indicators $\mathbb{B}$.

| Transition $T(i, j)$ | $j=$ Uninit | $j=$ Alloc | $j=$ Hydrated | $j=$ Sealed |
|---|---|---|---|---|
| $i=$ Uninit | 1 | 1 | 0 | 0 |
| $i=$ Alloc | 1 | 1 | 1 | 0 |
| $i=$ Hydrated | 0 | 1 | 1 | 1 |
| $i=$ Sealed | 0 | 0 | 0 | 1 |

## 3. Typestate Invariant Proofs

For each state $\nu$, the following invariants must hold under the Temporal Logic of Actions (TLA+). The system enforces this using linear types.

```tla
Invariant(Hydrated) ==
  /\ ptr /= Null
  /\ capacity >= length
  /\ CRC32(data) == stored_crc
  /\ AccessControl(Entity) == ReadWrite

Invariant(Sealed) ==
  /\ ptr /= Null
  /\ CRC32(data) == stored_crc
  /\ AccessControl(Entity) == ReadOnly
```

## 4. API Endpoints as State Transformers

Each API endpoint represents a functional transformation $f: \mathcal{V}_{in} \rightarrow \mathcal{V}_{out}$ encapsulated within a monad to handle exceptional state divergence.

| Endpoint | $V_{in}$ | $V_{out}$ (Success) | $V_{out}$ (Error) | Complexity |
|---|---|---|---|---|
| `/api/v1/allocate` | `Uninitialized` | `Allocated` | `Uninitialized` | $O(1)$ |
| `/api/v1/hydrate` | `Allocated` | `Hydrated` | `Allocated` | $O(N)$ |
| `/api/v1/seal` | `Hydrated` | `Sealed` | `Hydrated` | $O(1)$ |

This topological mapping ensures that illegal state transitions are rendered theoretically impossible at compile time, eliminating an entire class of runtime vulnerabilities.
