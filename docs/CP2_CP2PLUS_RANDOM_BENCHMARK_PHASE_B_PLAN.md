# CP2 versus CP2+ Random-Graph Benchmark Phase B Plan

## 1. Exact benchmark scope

Phase B compares CP2 and CP2+ only.

- Problem: acyclic longest `(D,G)`-consistent simple paths.
- Graph inputs: generated deterministic acyclic Erdos-Renyi graphs and generated deterministic acyclic scale-free-style graphs only.
- Solvers: `solveCP2` and `solveCP2Plus`.
- Evidence type: educational structural evaluation, not runtime evidence.

Non-claims:

- No paper reproduction.
- No new research method.
- No universal runtime superiority.
- No production-scale benchmark claim.
- No CP3/CP4 cyclic-trail comparison.

## 2. Minimal generated corpus

Keep the corpus fixed in source, small, and serialized from generator parameters. Suggested cases:

| Case ID | Tier | Family | Parameters | Max events | Purpose |
| --- | --- | --- | --- | ---: | --- |
| `er-tiny-1` | S | `acyclic-erdos-renyi` | `{ n: 4, pD: 0.45, pG: 0.45, seed: 101 }` | `200000` | Completed equality on sparse tiny graph |
| `er-tiny-2` | S | `acyclic-erdos-renyi` | `{ n: 5, pD: 0.65, pG: 0.35, seed: 102 }` | `200000` | Completed equality with denser directed arcs |
| `sf-tiny-1` | S | `acyclic-scale-free` | `{ n: 5, m: 1, seed: 201 }` | `200000` | Completed equality on narrow preferential graph |
| `sf-tiny-2` | S | `acyclic-scale-free` | `{ n: 6, m: 2, seed: 202 }` | `200000` | Completed equality with more connectivity |
| `er-medium-1` | M | `acyclic-erdos-renyi` | `{ n: 8, pD: 0.40, pG: 0.30, seed: 301 }` | `200000` | Structural CP2 vs CP2+ comparison |
| `er-medium-2` | M | `acyclic-erdos-renyi` | `{ n: 9, pD: 0.55, pG: 0.55, seed: 302 }` | `200000` | Dense generated comparison |
| `sf-medium-1` | M | `acyclic-scale-free` | `{ n: 9, m: 2, seed: 401 }` | `200000` | Structural comparison |
| `sf-medium-2` | M | `acyclic-scale-free` | `{ n: 10, m: 3, seed: 402 }` | `200000` | Denser scale-free-style comparison |
| `er-stress-1` | L | `acyclic-erdos-renyi` | `{ n: 12, pD: 0.60, pG: 0.25, seed: 501 }` | `30000` | Bounded stress with truthful cap semantics |
| `sf-stress-1` | L | `acyclic-scale-free` | `{ n: 13, m: 3, seed: 601 }` | `30000` | Bounded stress with truthful cap semantics |

This is deliberately small: 10 generated cases, two families, explicit seeds, explicit caps.

## 3. Required benchmark result shape

Use a serializable object with only necessary fields:

```ts
interface CP2RandomBenchmarkResult {
  caseId: string;
  tier: 'S' | 'M' | 'L';
  graphFamily: 'acyclic-erdos-renyi' | 'acyclic-scale-free';
  generatorParameters: { n: number; pD?: number; pG?: number; m?: number; seed: number };
  seed: number;
  graph: {
    vertexCount: number;
    directedEdgeCount: number;
    genomicEdgeCount: number;
  };
  cap: {
    maxEvents: number;
    cp2InterruptedByCap: boolean;
    cp2PlusInterruptedByCap: boolean;
  };
  cp2: {
    status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
    objective: number;
    proofComplete: boolean;
    exploredStates: number;
    prunedStates: number;
  };
  cp2Plus: {
    status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
    objective: number;
    proofComplete: boolean;
    exploredStates: number;
    directedBoundPrunes: number;
    genomicPropagationChecks: number;
    genomicPropagationPrunes: number;
  };
  exactness: {
    objectiveEquality: boolean | null;
    winnerEquality: boolean | null;
    validityEquality: boolean | null;
    proofCompleteEquality: boolean;
  };
  classification: 'complete-comparable' | 'incomplete-capped' | 'incomplete-cancelled' | 'error';
}
```

`null` exactness means the comparison is not valid because at least one solver did not complete.

## 4. Fair-comparison rules

- Compare objective, winner, and validity only when both runs complete.
- Compare structural counts only as CP2 versus CP2+ on the same graph and same cap.
- Do not interpret fewer states as universal runtime superiority.
- Never label incomplete runs as optimal.
- Preserve existing lexicographic winner semantics from `comparePaths`.
- Preserve existing cap, cancellation, and proof-complete semantics.
- Report CP2+ overhead honestly when genomic checks do not reduce states.

## 5. Existing-code reuse map

From `randomGraphGenerators.ts`:

- `generateAcyclicErdosRenyiGraph`
- `generateAcyclicScaleFreeGraph`
- `AcyclicErdosRenyiGraph`
- `AcyclicScaleFreeGraph`
- `GraphStatistics`

From `cp2Solver.ts`:

- `solveCP2`
- `CP2SolverOptions`
- `CP2SolverResult`
- `exploredStates`, `prunedStates`, `interruptedByCap`, `cancelled`, `proofCompleteEmitted`, `searchCompleted`

From `cp2PlusSolver.ts`:

- `solveCP2Plus`
- `CP2PlusSolverOptions`
- `CP2PlusSolverResult`
- `counters.statesExplored`
- `counters.directedBoundPrunes`
- `counters.genomicPropagationChecks`
- `counters.genomicPropagationPrunes`
- `interruptedByCap`, `cancelled`, `proofCompleteEmitted`, `searchCompleted`

From `cp2PlusBenchmark.ts`:

- `samePath` pattern with `JSON.stringify(path ?? [])`
- `isValidPath` logic for path validity
- `runCP2PlusBenchmarkCase` result-building pattern
- `summarizeCP2PlusBenchmark` aggregate-from-results pattern
- `generateBenchmarkConclusion` style: structural, corpus-specific, no runtime claim

From graph/path utilities:

- `hasCycle` and `validateGraphs` for generator sanity tests.
- `isInducedGConnected` for validity checks.
- `comparePaths` semantics must remain the solver-owned tie-break rule.

## 6. Minimal implementation proposal

Fewest files:

- Add `src/domain/cp2RandomBenchmark.ts`.
- Add `src/domain/cp2RandomBenchmark.test.ts`.
- Update `docs/CP2_PLUS_BENCHMARK_PROTOCOL.md` only if the implementation needs one short note that generated deterministic Phase B cases are a separate fixed corpus. If not needed, skip it.

Implementation shape:

- Define the fixed 10-case generated corpus as parameter objects.
- Materialize each graph by calling the existing generator functions.
- Run `solveCP2` and `solveCP2Plus` with the same `maxEvents`.
- Build result objects from solver outputs.
- Derive summary counts from result arrays.
- Reuse existing validity and equality logic locally if not exported; do not create a generic framework to share two helpers.

Explicitly reject:

- UI.
- Benchmark CLI.
- Charting.
- Runtime ranking.
- Runtime-profiler framework.
- Generic benchmark framework.
- Solver rewrites.
- Generator behavior changes.
- CP2/CP2+/ILP2 semantic changes.
- New packages.

## 7. Test plan

Focused tests only:

- Generated corpus determinism: `JSON.stringify(runRandomBenchmark())` equals itself across two calls.
- All Tier S completed cases preserve objective, winner, validity, and proof-complete equality.
- CP2+ never reports proof-complete when capped.
- All results include seed and generator parameters.
- Graph statistics in each result match generated arrays.
- Benchmark summaries are derived from result arrays, never hard-coded.
- Conclusions contain no forbidden claims: `always faster`, `universally better`, `paper reproduction`, `new research method`, `runtime superiority`.
- No random/flaky assertions: assert exact fixed seeds, exact metadata, boolean invariants, and derived arithmetic.

Do not run wall-clock assertions.

## 8. Ponytail checkpoint

Code/files not needed:

- New UI page.
- CLI runner.
- Backend/API/database/storage.
- Web worker.
- External benchmark package.
- Runtime profiler.
- Chart renderer.
- Generic benchmark abstraction.
- Solver adapter layer.
- Changes to CP2, CP2+, ILP2, or generators.

Proposed code/files needed:

- `src/domain/cp2RandomBenchmark.ts`
- `src/domain/cp2RandomBenchmark.test.ts`
- Optional: one small protocol-doc note only if the benchmark module creates a distinct generated corpus section.

Existing code to reuse instead of duplicating:

- Random graph generators and their metadata.
- CP2 and CP2+ solver outputs and cap/proof flags.
- CP2+ benchmark result/summary conventions.
- `hasCycle`, `validateGraphs`, and `isInducedGConnected`.
- Existing Vitest style and deterministic assertions.

## 9. Final decision

READY FOR PHASE B IMPLEMENTATION
