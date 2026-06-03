# Capability Schemas: Temporal, Workflow, and Causal Matrices

## 1. Formal Capability Calculus

Capabilities within the system are governed by a calculus of communicating systems (CCS), extended with temporal logic and causal graphs. A capability $\mathcal{C}$ is mathematically defined as a tuple $\mathcal{C} = (\mathcal{A}, \mathcal{R}, \mathcal{T}, \prec)$, where $\mathcal{A}$ is the action space, $\mathcal{R}$ is the resource bound, $\mathcal{T}$ is the temporal constraint matrix, and $\prec$ is the strict partial order of the causal dependency relation.

### 1.1 Temporal Constraints ($\mathcal{T}$)

Capabilities decay over time matrices, defined as bounded intervals over a continuous time domain $\mathbb{R}^+$. The decay guarantees revocation without explicit garabge collection, relying on cryptographic timeouts.

| Capability Class | Temporal Signature | Decay Function $D(t)$ | Renewal Vector $\vec{R}$ |
|---|---|---|---|
| Ephemeral | $[t_0, t_0 + \epsilon)$ | $e^{-\lambda t}$ | $\emptyset$ (Strictly Non-renewable) |
| Session | $[t_{start}, t_{end}]$ | Step function $u(t - t_{end})$ | $\Delta t_{renew} \in \mathbb{R}^+$ |
| Persistent | $[t_0, \infty)$ | Constant $1$ | $N/A$ |
| Periodic | $\bigcup_{k=0}^{\infty} [t_k, t_k + \delta]$ | Sine pulse $\sin^2(\omega t)$ | Dependent on external clock sync |

## 2. Causal Workflow Dependencies

Let $W$ be a workflow represented as a Directed Acyclic Graph (DAG) $G = (V, E)$. The edges of $E$ represent causal requirements defined by the schema, establishing a topological sort order for capability invocation.

### 2.1 Causal Incidence Matrix

For a set of discrete workflow actions $\mathcal{A} = \{a_1, a_2, \dots, a_n\}$, the incidence matrix $C_{n \times n}$ where $C_{ij} = 1$ implies $a_i \prec a_j$ (action $i$ causally precedes action $j$).

| Action $i \backslash j$ | $a_1$ (Init) | $a_2$ (Auth) | $a_3$ (Read) | $a_4$ (Mutate) | $a_5$ (Finalize) |
|---|---|---|---|---|---|
| $a_1$ | 0 | 1 | 0 | 0 | 0 |
| $a_2$ | 0 | 0 | 1 | 1 | 0 |
| $a_3$ | 0 | 0 | 0 | 1 | 1 |
| $a_4$ | 0 | 0 | 0 | 0 | 1 |
| $a_5$ | 0 | 0 | 0 | 0 | 0 |

## 3. Multiperspective Capability Schemas

Multiperspective capabilities define how actions are projected across different roles and views. The projection operator $\Pi_{\rho}$ maps a global capability vector $\vec{C}_{global}$ to a role-specific manifold.

$$ \Pi_{\rho}: \mathbb{C}^{N} \rightarrow \mathbb{C}^{K}_{\rho} $$

Where $K \le N$ and $\rho$ is the specific role ontology (e.g., Admin, Auditor).

### 3.1 Ontological Matrices

| Ontology Role $\rho$ | Permitted Projection Subspace | Constraint Functors |
|---|---|---|
| `Administrator` | Full Rank ($\text{rank}(C) = N$) | Identity functor $\mathcal{I}$ |
| `Auditor` | Null-space mapping for Mutate | Read-only projection matrix $P_{RO}$ |
| `Operator` | Constrained execution trace | Temporal bound operator $B_t$ |
| `System` | Automated workflow triggers | ZKP-verified causal bounds |
