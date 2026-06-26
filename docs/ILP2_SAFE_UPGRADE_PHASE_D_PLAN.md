# ILP2 Safe Upgrade Phase D Plan

## 1. Exact Phase D scope

Phase D keeps ILP2 as the same educational rooted-level formulation solved by deterministic bounded enumeration.

Implement only two low-risk candidates:

- Observability counters for already observable ILP2 candidate outcomes.
- Early rejection of complete directed paths whose selected induced genomic graph is disconnected.

Preserve:

- Current deterministic path enumeration: `enumeratePaths(vertices, edgesD).sort(comparePaths)`.
- Current objective and lexicographic winner semantics.
- Current rooted-level witness semantics for connected candidates.
- Existing graph validation and cycle rejection behavior.
- Phase B and Phase C benchmark behavior except for reading the new ILP2 counters.

Out of scope:

- CP2+-style partial-path genomic propagation.
- Branch-and-bound redesign.
- Native MILP backend.
- New ILP2 formulation.
- Solver rewrite.
- Packages, UI, CLI, backend, database, API, worker, profiler, or generic benchmark framework.
- Runtime-superiority, native-MILP, paper-reproduction, or new-research-method claims.

## 2. Current ILP2 sequence

Current `solveILP2` sequence:

```text
enumerate directed paths
-> derive ILP2 candidate
-> build rooted witness
-> validate assignment
-> update incumbent
```

Actual code path:

- Validate graph references and duplicates with `validateGraphs`.
- Reject cyclic `D` with `hasCycle`.
- Emit initialization and variable-definition events.
- Build `paths = enumeratePaths(vertices, edgesD).sort(comparePaths)`.
- For each full directed path:
  - Check cancellation.
  - Increment `exploredCandidates`.
  - Call `deriveILP2Candidate`.
  - `deriveILP2Candidate` initializes decisions, sets `x` and `y`, builds rooted witness, and validates assignment.
  - Emit candidate, assignment, witness, constraint, rejection/update, and backtrack traces.

Safe insertion point:

- Immediately after `exploredCandidates++` and before `deriveILP2Candidate(path, vertices, edgesD, edgesG)`.
- Check `isInducedGConnected(path, edgesG)`.
- If disconnected, emit one concise rejection trace event, increment disconnected rejection counters, and continue to the next already-enumerated complete path.

This is a complete-path check only. It is not CP2+-style partial-path propagation.

## 3. Soundness argument

A valid ILP2 candidate requires selected vertices to induce a connected genomic graph.

The rooted-level witness encodes that connectivity:

- One selected root.
- Parent links over real `G` edges.
- Exactly one parent for every selected non-root vertex.
- Strictly increasing levels.
- Reachability from the root through selected parent links.

Therefore, if `isInducedGConnected(path, edgesG)` is false for a complete selected directed path, that selected set cannot possess a valid rooted parent/level witness. Rejecting it before full witness construction preserves:

- Feasible set.
- Objective.
- Deterministic winner.
- `optimal` and `no-solution` results on complete runs.
- Proof-complete semantics, because every enumerated complete path is still considered or explicitly rejected.

Trace and cap risks:

- Trace shape changes for disconnected candidates because the solver no longer emits full variable/witness/constraint events for them.
- Event counts may decrease, so cap boundaries can move; tests must assert truthfulness, not exact old trace length.
- The rejection reason must remain visible through a concise event with reason `induced-G-disconnected`.
- If the cap is reached before emitting that rejection event or before proof completion, the run remains `incomplete` and `proofCompleteEmitted` remains false.

## 4. Observability-counter design

Add one small counters object to `ILP2SolverResult`, for example:

```ts
interface ILP2Counters {
  enumeratedCandidates: number;
  rejectedDisconnectedGenomicCandidates: number;
  rejectedWitnessCandidates: number;
  acceptedFeasibleCandidates: number;
  candidateEvaluationEvents: number;
  witnessParentLinksAssigned: number;
  witnessLevelsAssigned: number;
}
```

Definitions:

- `enumeratedCandidates`: number of complete directed paths reached by the ILP2 loop. It should equal existing `exploredCandidates`.
- `rejectedDisconnectedGenomicCandidates`: candidates rejected by the new full-path induced-G disconnected check.
- `rejectedWitnessCandidates`: connected candidates that still fail `validateILP2Assignment`.
- `acceptedFeasibleCandidates`: candidates whose ILP2 assignment is feasible.
- `candidateEvaluationEvents`: number of candidate-level evaluation/rejection/check events emitted; use only if already easy to increment beside trace emission.
- `witnessParentLinksAssigned`: aggregate count of parent links emitted for connected candidates.
- `witnessLevelsAssigned`: aggregate count of levels emitted for connected candidates.

Keep existing `exploredCandidates` and `rejectedCandidates` for compatibility:

- `exploredCandidates` remains the complete directed path count.
- `rejectedCandidates` remains total rejected candidates, including disconnected-genomic and witness-validation rejections.

Do not compare ILP2 counters directly with CP2 `exploredStates` or CP2+ `statesExplored`; they measure different search objects.

## 5. Trace behavior

Disconnected candidates should still emit one concise rejection trace event.

Minimal trace decision:

- Add trace type `genomic-rejection`, or reuse `constraint-rejection` with reason `induced-G-disconnected`.
- Prefer `genomic-rejection` only if tests need to distinguish the early check cleanly; otherwise reuse `constraint-rejection` to avoid expanding trace vocabulary.
- Event fields should include `currentPath`, `decisions: null`, `root: null`, empty parent links, empty levels, and reason `induced-G-disconnected`.

MaxEvents behavior:

- The rejection event consumes one event.
- If the event cannot be emitted because `trace.length >= maxEvents`, set `interruptedByCap`, return `incomplete`, and do not silently count proof completion.
- If disconnected rejection is emitted, increment rejection counters and continue.
- `proof-complete` remains truthful only after the loop finishes without cap or cancellation and the proof event is emitted.

## 6. Result-shape impact

Smallest required changes:

- `ILP2SolverResult`: add optional or required `counters: ILP2Counters`.
- `ILP2TraceEvent`: no required shape change if reusing `constraint-rejection`; add one trace type only if using `genomic-rejection`.
- `solveILP2`: add the early full-path induced-G check and increment counters.
- `ilp2Solver.test.ts`: update assertions for disconnected-path trace reason and new counters.
- `ilp2RandomBenchmark.ts`: map the new counters into the ILP2 benchmark result.
- `ilp2RandomBenchmark.test.ts`: assert metadata and summary behavior still derive from results; add counter preservation checks.

Do not change CP2, CP2+, graph generators, Phase B corpus, winner comparison, validation utilities, or unrelated modules.

## 7. Differential-test protocol

Complete-run equality must hold versus:

- Legacy `solveConsistentPath`.
- CP1.
- CP2.
- CP2+.
- AlgoBB++.
- ILP1.
- Subset DP where applicable and under its limits.

Required coverage:

- Existing 6,349-case ILP2 differential corpus.
- Tiny deterministic generated corpus from Phase C safe tiers.
- Explicit cap case where `maxEvents` interrupts before proof completion.
- Cancellation case with `shouldCancel`.
- Lexicographic tie case.
- Disconnected-but-directed-valid paths, including a longest directed path rejected by induced-G disconnection.
- Counter invariants:
  - `enumeratedCandidates === exploredCandidates`.
  - `rejectedDisconnectedGenomicCandidates + rejectedWitnessCandidates === rejectedCandidates`.
  - `acceptedFeasibleCandidates + rejectedCandidates === exploredCandidates` on complete runs.
  - disconnected early rejection emits a visible reason.
- No flaky timing assertions.

## 8. Minimal implementation proposal

Likely changed files:

- `src/domain/ilp2Solver.ts`
- `src/domain/ilp2Solver.test.ts`
- `src/domain/ilp2RandomBenchmark.ts`
- `src/domain/ilp2RandomBenchmark.test.ts`

No other files unless TypeScript requires a local import/test adjustment. Do not add docs, runners, fixtures, snapshots, benchmark framework, or helper modules during implementation.

## 9. Ponytail checkpoint

Must not be created:

- Packages.
- UI.
- CLI.
- Backend, database, API, worker.
- Profiler.
- Native MILP backend.
- Generic benchmark framework.
- Solver adapter layer.
- CP2+-style partial-path propagation.
- Branch-and-bound path iterator.
- New graph generator or corpus.

Existing logic to reuse:

- `isInducedGConnected` from `pathAlgorithms.ts`.
- `enumeratePaths` and `comparePaths`.
- `validateGraphs` and `hasCycle`.
- Existing cap, cancellation, status, and proof-complete conventions.
- Current Phase C ILP2 benchmark mapping style.
- Existing 6,349-case differential corpus.

Over-engineering would be:

- New counter framework.
- New trace event hierarchy.
- Shared benchmark abstraction.
- Config switches for old/new ILP2 behavior.
- Precomputing reusable graph analysis structures before a measured need.
- Any partial-path feasibility theorem work in this phase.

## 10. Final decision

READY FOR PHASE D IMPLEMENTATION
