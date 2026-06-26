# CP2 and ILP2 Educational Emulation, Upgrade, and Random-Graph Evaluation

## 1. Exact scope

This phase is limited to the acyclic longest `(D,G)`-consistent simple-path problem:

- Input: a shared vertex set `V`, an acyclic directed graph `D = (V,A)`, and an undirected genomic graph `G = (V,E)`.
- Feasible answer: a simple directed path in `D` whose selected vertices induce a connected subgraph in `G`.
- Objective: maximize path length; equal-length winners use the existing deterministic lexicographic path order.

Out of scope:

- CP3 and CP4 cyclic-trail work.
- Eulerian subgraph, walk-and-cover, trail coverage, HNet, and conservation grouping experiments.
- Any claim that this reproduces published experiments, published implementations, CPLEX/OR-Tools behavior, or production-scale optimization.

Educational emulation means deterministic TypeScript implementations that expose the variables, constraints, traces, counters, witnesses, caps, and proof semantics of the methods for small graphs. It does not mean native CP/MIP solver execution.

## 2. Existing CP2 and CP2+ audit

CP2 in `src/domain/cp2Solver.ts` is a bounded DFS over simple directed paths in acyclic `D`.

- It validates graph references and duplicate edges through `validateGraphs`.
- It rejects cyclic `D` through `hasCycle`.
- It chooses starts and successors in sorted lexical order.
- It evaluates every non-empty prefix as a candidate.
- It accepts candidates only when `isInducedGConnected(currentPath, edgesG)` is true.
- It updates the incumbent with `comparePaths`, so the objective and tie-break are shared with Legacy.

CP2's directed bound is `safeUpperBound(currentPath, vertices, adjD)`.

- Empty prefix: best longest directed suffix over all sorted starts.
- Non-empty prefix: current path length minus one plus the longest remaining suffix from the current endpoint.
- `prefixCanStillBeatIncumbent` safely prunes branches that cannot beat the incumbent by length or equal-length lexical order.

CP2+ in `src/domain/cp2PlusSolver.ts` is already the CP2 upgrade implemented in this repo. It keeps CP2 search and adds safe genomic-feasibility propagation:

- `collectForwardReachable` collects unused vertices reachable from the current endpoint by directed continuations.
- `inspectGenomicPropagation` checks whether selected genomic components can reconnect in the relaxed graph containing selected plus forward-reachable vertices.
- It prunes only when no forward-reachable genomic bridge can reconnect selected components.
- It deliberately keeps repairable disconnected prefixes.

Existing counters and trace semantics:

- CP2 records `exploredStates`, `prunedStates`, trace events, cap, cancellation, search completion, and proof-complete flags.
- CP2+ records `genomicPropagationChecks`, `genomicPropagationPrunes`, `directedBoundPrunes`, `statesExplored`, and `eventsEmitted`.
- CP2+ trace events include forward-reachable vertices and genomic components for propagation checks/prunes.
- Capped and cancelled runs return `incomplete`; proof-complete is emitted only after exhaustive search completion.

Already complete and should remain unchanged:

- Validation and cycle rejection.
- Objective and lexical winner semantics.
- Directed upper-bound pruning.
- CP2+ safe genomic propagation rule.
- Cap/cancellation/proof-complete behavior.
- CP2+ benchmark protocol's structural, not runtime-superiority, interpretation.

## 3. Existing ILP2 audit

`src/domain/ilp2Solver.ts` is an educational rooted-level formulation solved by deterministic bounded enumeration, not by a native MILP solver.

Path encoding:

- `x[v]` marks selected vertices.
- `y[from->to]` marks selected directed arcs in `D`.
- Selected `y` arcs must use selected endpoints.
- Selected vertices must form one directed path: at most one predecessor and successor, exactly one start/end for non-singletons, and `k - 1` selected arcs.
- Singleton paths are allowed.

Rooted genomic-connectivity witness:

- `r[v]` selects exactly one root for non-empty selected sets.
- `p[parent->child]` orients selected genomic witness edges.
- `level[v]` records integer rooted levels.
- `buildRootedLevelWitness` picks the lexicographically smallest selected vertex as root and builds a BFS witness in selected `G`.
- `validateILP2Assignment` requires parent edges to exist in `G`, parent/child endpoints to be selected, non-root selected vertices to have exactly one parent, root to have none, levels to strictly increase, and all selected vertices to be reachable from the root through parent links.

Current implementation/search strategy:

- `solveILP2` emits variable-definition trace events for `x_v`, `y_a`, `r_v`, `p_uv`, and `level_v`.
- It enumerates all simple directed paths from `enumeratePaths(vertices, edgesD).sort(comparePaths)`.
- Each path is converted into a candidate by `deriveILP2Candidate`.
- Candidate feasibility is checked by `validateILP2Assignment`.
- The best feasible candidate is updated with `comparePaths`.

Caps, cancellation, and proof-complete behavior:

- `maxEvents` defaults to `7000`.
- `shouldCancel` returns `incomplete` before proof completion.
- Event-cap interruption returns `incomplete`.
- `proof-complete` is emitted only after all candidates are processed without cap/cancellation.

Test coverage and constraints:

- ILP2 tests cover malformed input, cycle rejection, singleton handling, path feasibility, disconnected `G` rejection, root selection, parent-link constraints, level monotonicity, parent cycles, unselected intermediates, deterministic tie-breaking, proof/cap/cancellation behavior, malformed graph boundaries, and differential equality.
- The deterministic ILP2 corpus has 6,349 cases partitioned across tests and matches Legacy, CP1, CP2, AlgoBB++, and ILP1 on comparable complete runs.
- Comparable exact methods are valid only when they complete and share this acyclic simple-path scope.

## 4. Minimal deterministic random-graph design

Implement exactly two reproducible graph families in Phase A.

### Acyclic Erdos-Renyi

Parameters: `n`, `pD`, `pG`, `seed`.

Design:

- Use a fixed seeded PRNG already consistent with local tests, such as the simple LCG pattern in existing solver tests.
- Build vertices as stable IDs, for example `R1..Rn`.
- Shuffle or derive a seeded topological order, serialize it, and generate `D` arcs only from earlier to later order positions.
- For each ordered pair `(i,j)` with `i < j`, include directed arc `order[i] -> order[j]` independently with probability `pD`.
- For each unordered pair, include undirected genomic edge independently with probability `pG`.

Requirements:

- Same seed and parameters produce byte-identical output.
- Output stores `family`, `seed`, `parameters`, `vertices`, `topologicalOrder`, `edgesD`, and `edgesG`.
- No random flakiness: tests compare exact serialized graphs.
- No claim that this generator reproduces a paper distribution.

### Acyclic scale-free

Parameters: `n`, `m`, `seed`.

Design:

- Use the same seeded PRNG and stable vertex IDs.
- Use a fixed seeded topological order and serialize it.
- Build `D` with a documented preferential-attachment-style rule: when adding vertex `order[j]`, connect up to `m` incoming arcs from earlier vertices sampled with probability proportional to current directed degree plus one, then orient arcs forward.
- Build `G` with a documented undirected scale-free-style rule: add each new vertex to up to `m` earlier vertices sampled with probability proportional to current undirected degree plus one.
- Sort all emitted arcs/edges deterministically.

Requirements:

- `D` is always acyclic because every directed arc follows the seeded topological order.
- Same seed and parameters produce identical graph data.
- Outputs are serializable and include enough statistics to verify construction.
- This is a scale-free-style educational generator, not a paper reproduction.

## 5. Experiment tiers

Tier S: tiny graphs.

- Run all exact educational solvers that support the case: Legacy, CP1, CP2, CP2+, AlgoBB++, ILP1, ILP2, and Subset DP when under its hard vertex limit.
- Scientific comparisons: objective equality, winner equality, validity equality, and proof status equality on complete runs.

Tier M: medium graphs.

- Run CP2, CP2+, and ILP2 only.
- Scientific comparisons: exactness equality only for complete runs; structural counters may be compared within solver families.

Tier L: bounded stress graphs.

- Run CP2, CP2+, and ILP2 under explicit caps.
- Scientific comparisons: cap/cancellation truthfulness, incumbent presence, structural work until interruption.
- Do not treat incomplete results as optimality evidence.

Valid cross-method comparisons:

- Valid: objective/winner/proof equality when all compared methods complete.
- Valid: CP2 versus CP2+ structural work on the same graph and cap because they share search semantics plus CP2+ propagation.
- Limited: ILP2 counter comparisons against CP2/CP2+ because ILP2 counts candidates and trace events in a different model.
- Invalid: runtime superiority claims, incomplete-run optimality claims, paper-reproduction claims, and CP2/ILP2 comparisons against CP3/CP4 trail methods.

## 6. Metrics

Structural and exactness metrics:

- Objective length.
- Winning path.
- Path validity.
- Proof-complete equality.
- Solver status.
- States explored where available.
- Events emitted.
- CP2 directed bound prunes.
- CP2+ genomic propagation checks and prunes.
- ILP2 explored candidates.
- ILP2 rejected candidates.
- ILP2 root, parent-link, and level witness presence.
- Cap/cancellation flags.
- Search-completed and proof-complete flags.

Timing:

- Optional descriptive data only.
- Never use runtime as superiority evidence.
- Never mix machine/browser timing with scientific claims.

## 7. Upgrade direction

CP2+ is the CP2 upgrade already implemented. Do not create another CP2 upgrade unless a concrete defect or theorem-backed rule appears.

ILP2 candidates grounded in current code:

### Candidate 1: Precompute directed path list once per graph

- Exact idea: keep `enumeratePaths(vertices, edgesD).sort(comparePaths)` as the search source, but expose its count and reuse it inside report/evaluation calls for one graph instead of recomputing per metric view.
- Layer affected: search/report orchestration.
- Soundness obligation: the reused list must be exactly the same sorted list currently produced.
- Exactness risk: low; risk is stale reuse if graph identity changes.
- Verdict: `SAFE TO PROTOTYPE`.

### Candidate 2: Add ILP2 structural counters

- Exact idea: count selected vertices, selected directed arcs, parent links, rooted witness failures, path-constraint rejections, and level-constraint rejections separately from `rejectedCandidates`.
- Layer affected: trace/metrics only.
- Soundness obligation: counters must not change candidate ordering, feasibility, incumbent update, cap, cancellation, or proof-complete semantics.
- Exactness risk: low if purely observational.
- Verdict: `SAFE TO PROTOTYPE`.

### Candidate 3: Early reject candidates whose selected `G` is disconnected before building full ILP2 decisions

- Exact idea: call `isInducedGConnected(path, edgesG)` before deriving full decisions and skip full root/parent/level assignment for disconnected candidates.
- Layer affected: search layer and trace semantics.
- Soundness obligation: ILP2 feasibility requires selected vertices to be connected in induced `G`; the shortcut must still emit educational rejection traces or record why no witness can exist.
- Exactness risk: low for objective, medium for trace parity because current ILP2 intentionally demonstrates missing rooted witnesses.
- Verdict: `SAFE TO PROTOTYPE`.

### Candidate 4: Safe CP2+-style genomic propagation inside ILP2 enumeration

- Exact idea: prune partial directed paths before enumerating all completed candidates when selected components cannot reconnect through forward-reachable vertices.
- Layer affected: search generation, not just model validation.
- Soundness obligation: same theorem as CP2+ must be restated for ILP2's candidate-generation tree and proven compatible with sorted winner order, caps, and educational trace semantics.
- Exactness risk: medium; easy to preserve objective, easy to disturb candidate counts and proof/cap behavior.
- Verdict: `REQUIRES THEOREM`.

### Candidate 5: Replace enumeration with a real MILP/CP solver

- Exact idea: add a native optimizer backend for ILP2.
- Layer affected: architecture, dependencies, runtime environment, deployment.
- Soundness obligation: external solver model equivalence, reproducibility, deployment constraints, and UI trace mapping.
- Exactness risk: high for this phase; also violates no-dependency/no-architecture scope.
- Verdict: `REJECT`.

### Candidate 6: Add branch-and-bound objective pruning to ILP2 without preserving candidate order

- Exact idea: stop enumerating paths once remaining candidates cannot beat incumbent.
- Layer affected: search order and proof logic.
- Soundness obligation: must prove the path iterator is ordered by a valid global upper bound, not merely by current sorted candidate output.
- Exactness risk: high unless backed by a theorem and cap/proof redesign.
- Verdict: `REQUIRES THEOREM`.

## 8. Test protocol

Phase A tests:

- Same seed and same parameters produce identical graph objects and identical serialized JSON.
- Different seeds produce at least one structural difference for representative parameters.
- `D` is always acyclic; verify with `hasCycle`.
- Generated graph statistics are correct: vertex count, directed arc count, genomic edge count, topological order length, no duplicate `D` arcs, no duplicate undirected `G` edges, no invalid endpoints.
- Erdos-Renyi `D` arcs always point forward in the stored topological order.
- Scale-free-style `D` arcs always point forward in the stored topological order.
- Every generated report stores family, seed, parameters, topological order, graph statistics, solver caps, solver statuses, and proof flags.

Evaluation tests:

- Tier S matches available exact solvers on complete cases.
- CP2+ matches CP2 on complete cases.
- ILP2 matches Legacy on comparable complete cases.
- Cap/cancellation semantics remain truthful for CP2, CP2+, and ILP2.
- Incomplete runs never claim proof completion.

## 9. Delivery phases

Phase A: generators and tests.

- Add two pure TypeScript generator utilities and focused tests.
- Add no dependencies.
- Add no UI.
- Add no benchmark generator CLI.

Phase B: CP2 / CP2+ evaluation.

- Reuse `runCP2PlusBenchmarkCase` style metrics.
- Extend only enough to consume deterministic generated graph cases.
- Preserve CP2+ benchmark interpretation rules.

Phase C: ILP2 evaluation.

- Add ILP2 structural metrics for generated cases.
- Compare ILP2 against Legacy only when complete and comparable.
- Keep caps explicit.

Phase D: ILP2 upgrade proof and prototype.

- Prototype only candidates marked `SAFE TO PROTOTYPE`.
- For `REQUIRES THEOREM`, write the proof obligation before code.
- Keep old ILP2 behavior available until tests prove equivalence.

Phase E: comparison UI/report.

- Build only after the data shape stabilizes.
- Report structural metrics first.
- Present runtime, if collected, as descriptive only.

## 10. Ponytail checkpoint

What must not be built yet:

- Benchmark generators beyond the two requested graph families.
- CLI runners.
- New UI.
- New solver backend.
- Native MILP/CP packages.
- Database/storage layer.
- Web workers.
- CP3/CP4 integration.
- Paper-reproduction framing.

Unnecessary abstractions:

- Generator class hierarchy.
- Plugin architecture.
- Generic random-distribution framework.
- Runtime benchmarking framework.
- Solver adapter interfaces before a second real consumer exists.
- Config system beyond plain parameter objects.

Existing utilities to reuse:

- `validateGraphs` and `hasCycle` from `src/domain/graph.ts`.
- `comparePaths`, `enumeratePaths`, and `isInducedGConnected` from `src/domain/pathAlgorithms.ts`.
- Existing `maxEvents`, cancellation, status, and proof-complete conventions.
- Existing deterministic PRNG style from solver tests.
- Existing CP2+ benchmark result/summary style where it fits.

Smallest safe Phase A implementation:

- One pure TypeScript file for seeded graph generation.
- One small test file covering determinism, acyclicity, serialization, graph statistics, duplicate prevention, and metadata preservation.
- No runner, no UI, no dependency, no report generator.

## 11. Main scientific risks

- Treating incomplete capped runs as exact results.
- Treating runtime as scientific superiority evidence.
- Comparing ILP2 candidate counts directly against CP2 state counts as if they measured the same thing.
- Calling educational generators paper distributions.
- Allowing a scale-free-style generator to imply exact reproduction of a published model.
- Accidentally mixing acyclic simple-path work with CP3/CP4 cyclic-trail work.
- Changing CP2/CP2+ semantics while adding evaluation code.
- Optimizing ILP2 trace behavior in a way that loses educational witness visibility.

## 12. Final decision

READY FOR PHASE A GENERATORS
