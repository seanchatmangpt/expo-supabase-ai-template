# OCEL Integration Map: wasm4pm-compat -> Expo Supabase AI Template

## 1. Type Mapping Census

| OCEL Type (wasm4pm) | Intended Usage in Expo App | Primary Location / Consumer |
| :--- | :--- | :--- |
| `OcelLogTs` | Validated JSON payload for OCEL 2.0 process logs. | `src/lib/v2030/intelligence/registry.ts` |
| `OcelObjectTs` | Entity definitions within process intelligence audits. | `src/lib/v2030/intelligence/registry.ts` |
| `OcelEventTs` | Individual process steps captured for audit. | `src/lib/v2030/intelligence/registry.ts` |
| `OcelAttributeTs` | Typed properties for objects and events (Metadata). | `src/lib/v2030/intelligence/registry.ts` |
| `Trace` | Case-centric sequence of activities for conformance check. | `src/lib/truex/supervision/supervision.ts` |
| `Event` | Simplified event model used by the Conformance Auditor. | `src/lib/truex/supervision/supervision.ts` |
| `EventLog` | Top-level container for multiple traces (Logs). | `src/lib/v2030/intelligence/registry.ts` |
| `ReceiptShapeTs` | Structural definition for cryptographic process receipts. | `src/lib/v2030/intelligence/receipts.ts` |
| `EvidenceTs` | Typestate wrapper for data in a specific typestate. | `src/lib/v2030/intelligence/runner.ts` |
| `EvidenceState` | Lifecycle tokens (Raw, Parsed, Admitted, Receipted). | `src/lib/v2030/intelligence/runner.ts` |
| `WitnessKey` | Law identifiers (Ocel20, Xes1849, Pmax24). | `src/lib/v2030/intelligence/registry.ts` |
| `AdmissionTs` | Successful admission boundary crossing result. | `src/lib/v2030/intelligence/registry.ts` |
| `RefusalTs` | Formal refusal result with law name and message. | `src/lib/v2030/intelligence/registry.ts` |
| `WasmLossReport` | Audit of data dropped during OCEL flattening/projection. | `src/lib/v2030/intelligence/registry.ts` |
| `ConformanceRefusal`| Enumeration of failures in conformance evaluation. | `src/lib/v2030/intelligence/registry.ts` |

## 2. Missing Types for Full Process Intelligence Dashboard

The following types are currently missing from `bindings.d.ts` and are required for a comprehensive Process Intelligence capability:

### A. Process Discovery
- `ProcessModelTs`: Representation of discovered models (e.g. BPMN, Petri Net).
- `InductiveMinerParams`: Configuration for discovery algorithms.
- `DiscoveryStatus`: Typestate for the discovery lifecycle.

### B. Performance & Bottleneck Analysis
- `PerformanceMetricTs`: Containers for Cycle Time, Lead Time, and Idle Time.
- `ServiceLevelAgreementTs`: Definitions for performance thresholds.
- `BottleneckIndicator`: Markers for process congestion.

### C. Resource & Organizational Mining
- `ResourceTs`: Profiles for process participants (Actors).
- `OrganizationalUnitTs`: Mapping of resources to roles and teams.
- `HandoverLinkTs`: Transitions between different resources.

### D. Advanced Analytics
- `ConceptDriftMetric`: Formal definitions for P-value and Jaccard drift.
- `PredictionResultTs`: Results for next-step or remaining-time forecasts.

## 3. Integration Status
- **Type Parity**: 75%
- **Capability Coverage**: Fitness, Compliance, Drift, and RL monitoring implemented.
- **Action Required**: Sync updated `bindings.d.ts` with Discovery and Performance primitives.
