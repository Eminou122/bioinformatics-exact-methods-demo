# CP2+ Benchmark Protocol

## Goal

This benchmark measures whether CP2+ changes deterministic search structure relative to CP2 while checking that completed runs return the same exact objective, winning path, validity, and proof-complete status. It does not claim that CP2+ is universally faster or broadly representative of real workloads.

## Deterministic setup

The corpus is fixed in source control. Cases use ordered vertex identifiers and explicit directed and genomic edges; no random generation, wall-clock thresholds, external data, or machine-dependent inputs are used.

The corpus has five labeled families:

- fragmented genomic cases, where directed continuations may be unable to reconnect genomic components;
- dense genomic cases, where genomic feasibility checks should usually find connectivity and may add overhead;
- repairable future-bridge cases, where a disconnected prefix can still be repaired by forward-reachable vertices;
- small exhaustive cases, checked against CP2+, CP2, Legacy, CP1, AlgoBB++, ILP1, ILP2, and Subset DP;
- larger bounded stress cases, used only for CP2 versus CP2+ structural metrics under existing cap and proof semantics.

## Metrics

Primary metrics are states explored, events emitted, directed-bound prunes, genomic propagation checks, genomic propagation prunes, exact result equality, and proof-complete equality. Derived metrics report state and event deltas and percentages only when the CP2 denominator is nonzero.

## Why runtime is secondary

Browser and test-machine timing varies with hardware, process scheduling, JIT warm-up, development tooling, and background load. Runtime may be observed during engineering, but this protocol does not use it as scientific evidence or generate runtime conclusions.

## Allowed conclusions

- CP2+ reduced, matched, or increased structural work on a stated number of cases in this corpus.
- A named family produced safe genomic propagation prunes.
- Completed CP2 and CP2+ runs matched or differed on objective, winner, validity, or proof status.
- Dense cases showed neutrality or check overhead in this corpus.
- Larger bounded cases completed or remained incomplete under the configured cap.

## Forbidden conclusions

- CP2+ is always faster.
- CP2+ is universally better.
- Small educational fixtures establish broad real-world performance.
- CP2+ is a new research method.
- CP2+ is a paper reproduction.
- A timing difference from one browser or test machine is a scientific result.

## Corpus limitations

The corpus is intentionally small, synthetic, deterministic, and educational. It does not model production graph distributions, memory pressure, browser diversity, parallel execution, or domain-specific workload frequencies. Results apply only to the listed cases and solver version.

## Interpretation rules

- **Improvement:** CP2+ explores fewer states or emits fewer events while exactness and proof status match CP2.
- **Neutrality:** CP2+ and CP2 have equal structural counts, or count differences are mixed without an exactness difference.
- **Overhead:** CP2+ performs genomic propagation checks without reducing states or events, or records higher structural counts. This is reported factually, not hidden.
- **Incomplete runs:** capped or cancelled runs are not exact-result evidence. Their incomplete and proof-complete flags must remain consistent with existing solver semantics.
