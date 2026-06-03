# How to Override Autonomic Avatars

This guide provides the tactical operating procedure for bypassing, seizing control of, or completely overriding Autonomic Avatars (AAs) within a simulated or physical post-cyberpunk environment.

> [!CAUTION]
> Unauthorized override of a Class-IV or higher Autonomic Avatar violates international neuromorphic treaties. This guide is for red-team auditing and emergency containment only.

## 1. Scope and Target Architecture

Autonomic Avatars operate on a hybrid bio-digital substrate, utilizing a Neuromorphic Core for decision-making and a distributed ledger for state consensus. Overriding an AA requires compromising the `Cognitive-Sync` protocol without triggering the `Ego-Death` fail-safe.

## 2. Override Vectors and Configurations

### Vector Alpha: Sensory Deprivation / Overload (The "Ghost Protocol")

By feeding contradictory sensory data to the AA's I/O ports, the Neuromorphic Core can be forced into a diagnostic loop.

**Payload Configuration (`sensory_override.yaml`):**

```yaml
target_avatar_id: "UUID-9081-ALPHA"
attack_vector: "SENSORY_DESYNC"
payloads:
  - port: "OPTICAL_NERVE_V2"
    pattern: "FRACTAL_NOISE"
    intensity: 0.99
  - port: "AUDITORY_CORTEX"
    pattern: "PHASE_CANCELLATION"
    frequency: 19000
trigger_condition: "COGNITIVE_LOAD > 90%"
```

### Vector Beta: Ledger State Hijacking

If the AA relies on a blockchain for action authorization, you can override its actions by forcing a localized fork.

## 3. Execution Matrix

| Permutation | Target Defense | Override Strategy | Expected Latency | Success Probability |
|-------------|----------------|-------------------|------------------|---------------------|
| M-1 | Firewall: Active | Vector Alpha + Phishing | 1200ms | 65% |
| M-2 | Ego-Death: Armed | Gradual State Drift | 45 minutes | 85% |
| M-3 | Swarm Mode | Sybil Attack on Consensus | 500ms | 40% |
| M-4 | Disconnected (Airgapped) | Physical proximity (NFC hijack) | N/A | 95% |

## 4. Execution Sequence

### Phase 1: Reconnaissance

Use `ostar-operator` to probe the AA's exposed interfaces and identify the Neuromorphic Core version.

```bash
$ ostar-operator probe-avatar --id UUID-9081-ALPHA --stealth
```

### Phase 2: Injection

Inject the sensory override payload. This must be done via a highly secure, low-latency connection to prevent the AA from detecting the temporal anomaly.

```bash
$ ostar-doctor inject-payload --config ./sensory_override.yaml --execute
```

### Phase 3: Control Seizure

Once the AA enters the diagnostic loop, inject the new operational imperatives via the administrative debug port (usually left open by negligent corpo-engineers).

```bash
$ ostar-governor seize-control --id UUID-9081-ALPHA --new-directive "HOLD_POSITION"
```

## 5. Architectural Warnings

- **Ego-Death Fail-Safe:** If the AA detects a rapid shift in its core values (defined by its Genesis Prompt), it will permanently erase its neural weights. Overrides must be subtle.
- **Feedback Loops:** Modifying an AA's behavior can cause cascading feedback loops if it operates in a swarm. Isolate the target before override.
