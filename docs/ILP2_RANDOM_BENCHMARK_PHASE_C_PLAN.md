# ILP2 Random Benchmark Phase C Plan

## 1. Exact Phase C scope

Phase C evaluates ILP2 on the same 10 generated deterministic cases released in Phase B.

- Problem: acyclic longest `(D,G)`-consistent simple path.
- Corpus: `CP2_RANDOM_BENCHMARK_CORPUS` exactly as exported from `src/domain/cp2RandomBenchmark.ts`.
- Solver: current `solveILP2` only.
- ILP2 interpretation: educational rooted-level formulation solved by deterministic bounded enumeration.
- Out of scope: ILP2 optimization, ILP2 upgrade, native MILP solving, new graph distributions, runtime ranking, UI, CLI, backend, API, database, worker, charts, profiler, packages, and generic benchmark framework.

## 2. Corpus reuse

Reuse the Phase B fixed corpus exactly:

- Do not duplicate seeds, parameters, case IDs, tiers, caps, or generator logic.
- Materialize graphs through `generateAcyclicErdosRenyiGraph` and `generateAcyclicScaleFreeGraph` using each existing corpus spec.
- Keep graph families and metadata exactly: `acyclic-erdos-renyi`, `acyclic-scale-free`, `seed`, `parameters`, `statistics`.

Tier comparison rules:

- Tier S: complete exactness comparison against CP2 and CP2+ is expected and required before release.
- Tier M: exactness fields are populated only if ILP2, CP2, and CP2+ all complete under the fixed cap; otherwise the result is descriptive.
- Tier L: capped stress results are descriptive only; they can report incumbent, cap flags, and structural ILP2 counts, but not exactness.

Feasibility under current event caps:

- Tier S is realistically safe for ILP2 at `200000` events.
- Tier M is likely safe for bounded local evaluation at `200000` events, but completion is not assumed until the Phase C test run proves it.
- Tier L is safe only as bounded descriptive stress. `solveILP2` calls `enumeratePaths(vertices, edgesD).sort(comparePaths)` before checking the event cap, so `maxEvents` does not bound upfront path-list construction. The generated Tier L cases are small enough to try, but they remain the main local-runtime risk.

## 3. ILP2 result mapping

Audit of current `solveILP2` output fields:

- Status: `status`.
- Winner/objective: `bestPath`, objective as `bestPath?.length ?? 0`.
- Candidate witness: `bestCandidate.root`, `bestCandidate.parentLinks`, `bestCandidate.levels`.
- Counters: `exploredCandidates`, `rejectedCandidates`, `stepCount`, `trace.length`.
- Completion flags: `searchCompleted`, `proofCompleteEmitted`, `interruptedByCap`, `cancelled`.
- Error detail: `error`.

Smallest serializable Phase C result shape:

```ts
interface ILP2RandomBenchmarkResult {
  caseId: string;
  tier: 'S' | 'M' | 'L';
  graphFamily: 'acyclic-erdos-renyi' | 'acyclic-scale-free';
  generatorParameters: { n: number; pD?: number; pG?: number; m?: number; seed: number };
  seed: number;
  graph: { vertexCount: number; directedEdgeCount: number; genomicEdgeCount: number };
  maxEvents: number;
  ilp2: {
    status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
    path: string[] | null;
    objective: number;
    proofComplete: boolean;
    searchComplete: boolean;
    interruptedByCap: boolean;
    cancelled: boolean;
    exploredCandidates: number;
    rejectedCandidates: number;
    witnessRoot: string | null;
    witnessParentLinkCount: number | null;
    witnessLevelCount: number | null;
  };
  pathValid: boolean;
  exactness: {
    cp2ObjectiveEquality: boolean | null;
    cp2WinnerEquality: boolean | null;
    cp2PlusObjectiveEquality: boolean | null;
    cp2PlusWinnerEquality: boolean | null;
    proofCompleteEquality: boolean | null;
  };
  classification: 'complete-comparable' | 'incomplete-capped' | 'incomplete-cancelled' | 'error';
}
```

Witness-related metrics stay limited to already observable `bestCandidate` fields. Do not add solver counters or trace semantics in Phase C.

## 4. Scientific comparison rules

- CP2/CP2+ states are not directly equivalent to ILP2 candidate counts.
- Objective, winner, validity, and proof equality are valid only when all compared runs complete and are in this same acyclic simple-path scope.
- Tier L capped results are descriptive only.
- Incomplete runs never support optimality or exactness claims.
- Do not rank solvers by runtime.
- Do not claim ILP2 is native MILP.
- Do not claim generated graphs recreate published experimental distributions.
- Do not claim a new research method or paper reproduction.

## 5. Minimal implementation proposal

Add only:

- `src/domain/ilp2RandomBenchmark.ts`
- `src/domain/ilp2RandomBenchmark.test.ts`

Decisions:

- A separate `ilp2RandomBenchmark.ts` is cleaner because the result shape and counters are ILP2-specific.
- Extending `cp2RandomBenchmark.ts` would create misleading coupling between a CP2/CP2+ evaluation module and ILP2 reporting.
- A tiny shared fixed-corpus export is unnecessary in Phase C because `CP2_RANDOM_BENCHMARK_CORPUS` is already exported and has no side effects. Revisit only if a third consumer makes the name harmful.

Implementation outline:

- Import `CP2_RANDOM_BENCHMARK_CORPUS`.
- Materialize each graph with the released generators.
- Run `solveILP2`, `solveCP2`, and `solveCP2Plus` with the case `maxEvents`.
- Build result objects from existing solver outputs.
- Use local `samePath` and `isValidPath` helpers if needed; do not create a generic benchmark framework.
- Derive summaries from result arrays.

## 6. Caps and feasibility plan

Fixed caps:

- Tier S: use Phase B `200000`.
- Tier M: use Phase B `200000`.
- Tier L: use Phase B `30000`.
- Forced cap test: override one Tier S case to `maxEvents: 1`.

Cap semantics:

- ILP2 returns `status: 'incomplete'` when capped or cancelled before proof completion.
- `interruptedByCap` records event-cap interruption.
- `cancelled` records cancellation.
- `proofCompleteEmitted` is false unless the `proof-complete` trace event was emitted.
- `searchCompleted` can be false for incomplete runs; if proof emission itself hits the cap, status remains incomplete.
- `no-solution` is truthful only after completed proof with no feasible path.
- `optimal` is truthful only after completed proof with a best path.
- Medium and stress cases risk local runtime because event caps do not bound the initial full path enumeration and sort.

## 7. Required tests

- Reuse the exact 10 fixed corpus definitions from `CP2_RANDOM_BENCHMARK_CORPUS`.
- Deterministic repeatability: two complete Phase C report runs serialize identically.
- Tier S complete equality against CP2 and CP2+ for objective, winner, validity, and proof-complete status.
- Exactness comparison fields are non-null only when ILP2, CP2, and CP2+ all complete.
- Forced cap with `maxEvents: 1` produces `incomplete`, `interruptedByCap: true`, and `proofComplete: false`.
- Result metadata preserves case ID, tier, graph family, seed, parameters, maxEvents, and graph statistics.
- Summaries are derived from result arrays, not hard-coded.
- No flaky timing assertions.

## 8. Ponytail checkpoint

Must not be created:

- Packages, UI, CLI, backend, database, API, worker, charts, profiler, native MILP solver, generic benchmark framework, generator clone, solver adapter layer, CP2/CP2+/ILP2 rewrites.

Minimum files required:

- This plan document.
- For implementation later: one ILP2 benchmark module and one focused test file.

Existing code to reuse:

- `CP2_RANDOM_BENCHMARK_CORPUS`.
- `generateAcyclicErdosRenyiGraph`, `generateAcyclicScaleFreeGraph`.
- `solveILP2`, `solveCP2`, `solveCP2Plus`.
- `isInducedGConnected` and the existing path equality pattern.
- Existing cap, cancellation, status, and proof-complete flags.

Why no ILP2 upgrade belongs in Phase C:

- Phase C measures current ILP2 on the fixed generated corpus.
- Changing ILP2 search, witness construction, pruning, counters, or model semantics would mix evaluation with method development.
- ILP2 upgrade candidates belong in a later proof/prototype phase.

## 9. Phase C exit criteria

- The Phase C module evaluates exactly the 10 Phase B cases and no extra generated corpus.
- No solver or generator semantics change.
- Tier S comparisons against CP2 and CP2+ complete and match on objective, winner, validity, and proof-complete status.
- Tier M and Tier L exactness fields are null unless all relevant solvers complete.
- Forced cap test proves incomplete/cap/proof flags remain truthful.
- Result metadata, graph statistics, and summaries are derived and deterministic.
- No forbidden claims appear in generated conclusion text.
- `git diff --check` passes.
- `npm test -- src/domain/ilp2RandomBenchmark.test.ts` passes during implementation.

## 10. Final decision

READY FOR PHASE C IMPLEMENTATION
