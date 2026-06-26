# ILP2+ and Hard Random Graph Research Plan

**Date:** 2026-06-26
**Branch:** feature/ilp2plus-hard-random-graphs-plan
**Worktree base:** origin/main (HEAD: 0afd4fe — "Revert fix: improve random graph lab presentation")
**Status:** RESEARCH AND ARCHITECTURE AUDIT ONLY — no application code modified

---

## 1. Current State Audit

### Phase D already implemented in `ilp2Solver.ts`

Phase D (ILP2 Safe Upgrade) is already implemented on the working branch. The solver at
`src/domain/ilp2Solver.ts` includes:

- `ILP2Counters` interface with 7 fields:
  `enumeratedCandidates`, `rejectedDisconnectedGenomicCandidates`, `rejectedWitnessCandidates`,
  `acceptedFeasibleCandidates`, `candidateEvaluationEvents`, `witnessParentLinksAssigned`,
  `witnessLevelsAssigned`.
- Early per-candidate genomic rejection: `isInducedGConnected(path, edgesG)` called before
  full witness construction. Disconnected candidates emit `constraint-rejection` with
  reason `induced-G-disconnected`.
- The main loop still iterates **every** path produced by
  `enumeratePaths(vertices, edgesD).sort(comparePaths)` — it does not terminate early after
  finding the first feasible winner.

`ilp2RandomBenchmark.ts` maps all new counter fields. The 10-case Phase B/C corpus (`CP2_RANDOM_BENCHMARK_CORPUS`) remains unchanged with seeds `101–601`.

### RandomGraphDemoLab UI constraints (from `RandomGraphDemoLab.tsx`)

| Constant | Value | Effect |
|---|---|---|
| `CUSTOM_MAX_N` | 13 | Hard ceiling on custom n in browser |
| `CUSTOM_ILP2_MAX_N` | 10 | ILP2 not run for n > 10 |
| `SMALL_MAX_N` | 6 | Legacy, CP1, AlgoBB++, ILP1, Subset DP limited to n ≤ 6 |
| `MAX_EVENTS` | 200000 | Cap for all solver calls |

Presets are sourced from `CP2_RANDOM_BENCHMARK_CORPUS` (10 cases). The lab runs all eight
acyclic solvers (with guards) plus marks CP3/CP4 as not-applicable.

---

## 2. Section A — ILP2+ Feasibility Analysis

### Current limitation of ILP2

ILP2 at HEAD does the following candidate loop:

```
paths = enumeratePaths(V, D).sort(comparePaths)    // fully sorted best-first
for each path in paths:
  if G-disconnected → emit constraint-rejection, continue
  if witness fails  → emit constraint-rejection, continue
  if better than incumbent → update incumbent
emit proof-complete
```

**The loop does not terminate early after finding the first feasible winner.**
Because paths are sorted with the globally best candidates first (longest, then
lexicographically smallest), the first feasible candidate IS the unique optimal winner.
All subsequent candidates are guaranteed to be suboptimal or equal-length-but-lex-larger
and therefore cannot improve the incumbent. Evaluating them is wasted work.

This is the central limitation that ILP2+ can address.

---

### Candidate 1: Sorted-prefix early termination ("ILP2+ core rule")

**Exact rule:**
After `validateILP2Assignment(candidate)` returns `feasible: true` for the first time, break
out of the main candidate loop, emit `proof-complete`, and return `optimal`.

**Safety analysis:**

Let `P = [p₀, p₁, ..., pₙ₋₁]` be `enumeratePaths(V, D).sort(comparePaths)`.
The sort invariant guarantees `comparePaths(pᵢ, pⱼ) ≤ 0` for all `i < j`
(earlier elements are equal-or-better than later elements).

**Theorem (ILP2+ Early Termination):** If `pₖ` is the first index such that
`validateILP2Assignment(pₖ)` is feasible, then for all `j > k`,
`comparePaths(pⱼ, pₖ) > 0`, i.e., `pⱼ` is strictly worse than `pₖ`.

**Proof:** By the sort invariant, `comparePaths(pⱼ, pₖ) ≥ 0`. Since
`enumeratePaths` never returns duplicate paths (each path is a unique ordered
vertex sequence and the DFS generates distinct vertex orderings), `pⱼ ≠ pₖ`.
Therefore `comparePaths(pⱼ, pₖ) > 0`, i.e., `pⱼ` is strictly worse. ∎

**Conclusion:** `pₖ` is the unique optimal winner. No subsequent path can yield a
better or equal-ranked feasible candidate. Early termination is provably correct.

**Is it safe?** YES.

**Proof obligation:** The theorem above. Depends on: (1) `enumeratePaths` produces
distinct paths, (2) `sort(comparePaths)` is stable and total. Both are already
verified by existing tests (`pathAlgorithms.test.ts`).

**Integration point:**
In `solveILP2`, in the main `for (const path of paths)` loop, after the block that
calls `validateILP2Assignment` and sets `bestPath`/`bestCandidate`, add:

```ts
if (candidate.report.feasible) {
  // ILP2+: first feasible in sorted list is provably optimal — terminate
  break;
}
```

Then emit `proof-complete` normally after the loop.

**Effect on trace/counters:**
- `exploredCandidates` now equals `k + 1` (paths examined up to and including the
  first feasible), not the total path count.
- `rejectedDisconnectedGenomicCandidates + rejectedWitnessCandidates + acceptedFeasibleCandidates === exploredCandidates` still holds on complete runs.
- Fewer trace events are emitted — traces for paths `pₖ₊₁ … pₙ₋₁` are never generated.
- `proof-complete` is emitted with a message noting early termination.

Add one counter field to `ILP2Counters`:

```ts
earlyTermination: boolean;  // true when loop was broken after first feasible
```

**Effect on proof-complete semantics:**
Proof-complete is still truthfully emitted because the theorem guarantees no better
candidate exists. The message should explicitly state:
`"proof-complete via sorted-prefix: first feasible path is provably optimal"`.

**Avoids candidate enumeration?** No — the full path list is still enumerated by
`enumeratePaths` and sorted before the loop. The improvement is in the evaluation
loop, not the enumeration.

**Rejects candidates earlier?** Yes — candidates at positions `k+1 … n-1` are
never evaluated at all.

**Improves witness derivation?** No — it terminates before reaching them.

**Can it honestly support the name "ILP2+"?** YES.
- It provides a formal theorem backing a provably safe candidate-evaluation shortcut.
- It is categorically different from Phase D's per-candidate G-check:
  Phase D rejects individual disconnected candidates then continues the loop;
  ILP2+ terminates the loop entirely after the first feasible winner.
- It is composable with Phase D: the two pruning layers can coexist and are
  independently sound.
- The witness is derived identically for the first feasible candidate.
- Objective, winner, validity, and exactness semantics are unchanged.

---

### Candidate 2: Precompute directed path list once per graph

**Exact rule:** Cache the result of `enumeratePaths(V, D).sort(comparePaths)` at
the graph level so multiple report/evaluation calls don't re-sort.

**Is it safe?** YES if graph identity is correctly keyed. Low impact on search.

**Verdict:** SAFE, but this is an implementation detail, not a semantic upgrade.
It does not independently justify the name "ILP2+". It can be included as a
micro-optimization alongside Candidate 1 but should not be the defining change.

---

### Candidate 3: CP2+-style genomic propagation inside ILP2 path generation

**Exact rule:** Prune partial directed paths before completing them when selected
G-components cannot reconnect through forward-reachable vertices.

**Is it safe?** REQUIRES THEOREM. The CP2+ theorem was proven for the DFS partial-path
tree; restating it for ILP2's sorted-candidate evaluation model requires fresh proof
obligations:
- The partial-path pruning must be compatible with the sorted evaluation order.
- Caps and proof-complete semantics must be re-established.
- Educational witness visibility for partial paths must be addressed.

**Verdict:** REQUIRES THEOREM. Do not implement in this phase.

---

### Candidate 4: Branch-and-bound objective pruning without preserving candidate order

**Exact rule:** Stop enumerating paths once remaining candidates cannot beat
the incumbent by length.

**Is it safe?** REQUIRES THEOREM about global upper bound over remaining sorted
candidates. The sort already achieves this partially (Candidate 1), but a full
bound-based early exit before finding the first feasible requires proving the
upper-bound function is monotone over the sorted list.

**Verdict:** REQUIRES THEOREM. The sorted-prefix early termination (Candidate 1)
already achieves equivalent practical benefit once the first feasible is found.
If no feasible candidate exists, the loop must exhaust all candidates regardless.

---

### Rejected candidates (must not propose)

| Idea | Reason for rejection |
|---|---|
| Native MILP (CPLEX, OR-Tools) | Violates no-dependency, no-architecture, no-runtime-superiority constraints |
| Heuristic pruning | Not provably exact |
| Changing ILP2 objective or tie-break | Changes winner semantics, breaks correctness equality |
| Runtime-only optimization without exactness proof | Violates exactness guarantee |

---

## 3. Section B — Recommended ILP2+ Design

**Recommended upgrade: Sorted-prefix early termination (Candidate 1 only)**

### Formal invariant

**ILP2+ Loop Invariant:** Throughout the main candidate loop, the incumbent `bestPath`
(if non-null) is the unique optimal feasible path among all paths examined so far.

**ILP2+ Termination Invariant:** When the loop exits via `break` (early termination),
`bestPath` is the optimal feasible path over the entire sorted list.

**ILP2+ Proof-Complete Invariant:** `proof-complete` may only be emitted when either
(a) all candidates were examined and the incumbent is the best feasible, or (b) early
termination was triggered after finding the first feasible, which the theorem proves
is the global optimum.

### Safe pruning/rejection theorem

As proven in Section A, Candidate 1: the first path `pₖ` in the sorted list that
passes `validateILP2Assignment` is the unique optimal feasible path.

### Counter design additions

```ts
interface ILP2Counters {
  // existing Phase D fields (unchanged):
  enumeratedCandidates: number;
  rejectedDisconnectedGenomicCandidates: number;
  rejectedWitnessCandidates: number;
  acceptedFeasibleCandidates: number;
  candidateEvaluationEvents: number;
  witnessParentLinksAssigned: number;
  witnessLevelsAssigned: number;
  // new ILP2+ field:
  earlyTermination: boolean;
}
```

Counter invariants on complete runs (unchanged from Phase D):
- `enumeratedCandidates === exploredCandidates`
- `rejectedDisconnectedGenomicCandidates + rejectedWitnessCandidates === rejectedCandidates`
- `acceptedFeasibleCandidates + rejectedCandidates === exploredCandidates`
- `earlyTermination === true` iff `acceptedFeasibleCandidates === 1` and loop terminated early

### Trace event design

Reuse existing `proof-complete` trace type. Update the message string:
- Non-early: `"proof-complete: all N candidates examined"`
- Early: `"proof-complete (early termination): first feasible candidate pₖ is provably optimal; N candidates examined of M total"`

No new trace type is needed. Avoids expanding trace vocabulary unnecessarily.

### Equality validation strategy

After implementation, run the following equality checks:

1. **ILP2 Phase D vs ILP2+**: `bestPath` must be identical on all same-graph/same-seed runs.
2. **ILP2+ vs CP2**: `bestPath` must match on complete runs in Tier S corpus.
3. **ILP2+ vs CP2+**: same.
4. The only permitted difference is `exploredCandidates` and trace length
   (ILP2+ examines fewer paths on early termination).

### Cap/cancellation behavior

- If `maxEvents` is reached before the first feasible is found → `incomplete`,
  `proofCompleteEmitted: false`, `earlyTermination: false`. Same as Phase D.
- If `shouldCancel()` fires before the first feasible → `incomplete`, `cancelled: true`,
  `earlyTermination: false`. Same as Phase D.
- If cap/cancel fires after the first feasible is found and before `proof-complete` event
  is emitted → `incomplete`. The `break` must come before the `proof-complete` emit; the
  cap check should happen in the normal event-emission path.

### Benchmark plan

Run `ilp2RandomBenchmark` with ILP2+ on the existing 10-case Phase B/C corpus plus the
new hard corpus (Section C). Assert:
- All `bestPath` values match Phase D ILP2, CP2, and CP2+ on complete-comparable cases.
- `exploredCandidates` is ≤ Phase D `exploredCandidates` for every case.
- `earlyTermination === true` on every case where a feasible path exists and the run completes.
- Correctness for the no-solution case (empty graph or disconnected G): loop exhausts all
  candidates, `earlyTermination: false`, `proof-complete` emitted normally.

### Distinction from Phase D genomic rejection

| Dimension | Phase D | ILP2+ |
|---|---|---|
| Scope | Per-candidate check | Whole-loop termination |
| Trigger | Induced G disconnected for current path | First feasible path found |
| Loop continues? | YES (to next candidate) | NO (breaks immediately) |
| Candidates evaluated after trigger | All remaining | None |
| Theorem required | Soundness of G-connectivity check | Sorted-prefix optimality theorem |
| Educational visibility | Shows all rejections | Hides suboptimal candidates after winner |

### Final recommendation

> **IMPLEMENT ILP2+ WITH SORTED-PREFIX EARLY TERMINATION (CANDIDATE 1).**
>
> The proof is complete, the change is minimal (one `break` statement + one counter field
> + one message update), and the winner semantics are unchanged.
>
> The name "ILP2+" is honest because: (a) the solver terminates early with a provably
> correct winner, (b) it is composable with and independent from Phase D's per-candidate
> genomic rejection, (c) it is backed by a formal theorem, and (d) it reduces the number
> of evaluated candidates by potentially O(n) on graphs where the optimal path appears
> early in the sorted list.

**Files that change (minimum):**
- `src/domain/ilp2Solver.ts` — `break` + counter field + message
- `src/domain/ilp2Solver.test.ts` — assert `earlyTermination: true` on feasible cases
- `src/domain/ilp2RandomBenchmark.ts` — map `counters.earlyTermination`
- `src/domain/ilp2RandomBenchmark.test.ts` — assert `earlyTermination` in results

---

## 4. Section C — Hard Random Graph Corpus Design

The new corpus uses `generateIndependentAcyclicErdosRenyiGraph` and
`generateIndependentAcyclicScaleFreeGraph` (already in `randomGraphGenerators.ts`) with
separate `seedOrder`, `seedD`, `seedG` for full structural independence between D and G.

All seeds below are unique across the entire corpus. Tier notation:
- **Tiny** (n ≤ 5): all 9 acyclic solvers run
- **Small** (6 ≤ n ≤ 6): SMALL_MAX_N boundary — same as above
- **Medium** (7 ≤ n ≤ 10): CP2/CP2+/ILP2 only (ILP2 allowed up to n=10)
- **Stress** (n > 10): CP2/CP2+ only; ILP2 not run (pre-enumeration risk)

### 4.1 Tiny / Small cases (20 cases)

| CaseId | Family | n | pD | pG | m | seedOrder | seedD | seedG | Tier | Educational Purpose |
|---|---|---|---|---|---|---|---|---|---|---|
| `er-tiny-sparse-1` | ER | 4 | 0.20 | 0.70 | — | 1001 | 1002 | 1003 | S | Sparse D, dense G: many G-connected paths; tests basic ILP2+ early exit |
| `er-tiny-sparse-2` | ER | 4 | 0.15 | 0.80 | — | 1011 | 1012 | 1013 | S | Very sparse D: few paths total; validates no-solution or trivial winner |
| `er-tiny-dense-1` | ER | 5 | 0.80 | 0.30 | — | 1021 | 1022 | 1023 | S | Dense D, sparse G: most paths G-disconnected; tests Phase D rejection rate |
| `er-tiny-dense-2` | ER | 5 | 0.90 | 0.90 | — | 1031 | 1032 | 1033 | S | Dense D and G: high path count, tests ILP2+ early termination benefit |
| `er-tiny-anticorr-1` | ER | 5 | 0.60 | 0.20 | — | 1041 | 1042 | 1043 | S | Anti-correlated D/G densities: structural distinction exercise |
| `er-tiny-anticorr-2` | ER | 4 | 0.70 | 0.10 | — | 1051 | 1052 | 1053 | S | Extreme anti-correlation: long D paths, fragmented G |
| `er-small-medium-1` | ER | 6 | 0.45 | 0.45 | — | 1061 | 1062 | 1063 | S | Balanced density at SMALL_MAX_N: all 9 solvers run |
| `er-small-medium-2` | ER | 6 | 0.55 | 0.35 | — | 1071 | 1072 | 1073 | S | Slightly denser D at boundary: tests ILP1 and Subset DP under cap |
| `er-small-lex-tie-1` | ER | 5 | 1.00 | 1.00 | — | 1081 | 1082 | 1083 | S | Complete D and G: lexicographic tie-break decisive; all full paths G-connected |
| `er-small-lex-tie-2` | ER | 4 | 1.00 | 1.00 | — | 1091 | 1092 | 1093 | S | Tiny complete: confirms deterministic winner |
| `sf-tiny-low-m-1` | SF | 5 | — | — | 1 | 1101 | 1102 | 1103 | S | Low-m SF: chain-like D, sparse G; minimal connectivity |
| `sf-tiny-low-m-2` | SF | 4 | — | — | 1 | 1111 | 1112 | 1113 | S | Tiny low-m: validates acyclicity under preferential attachment |
| `sf-tiny-medium-m-1` | SF | 5 | — | — | 2 | 1121 | 1122 | 1123 | S | Medium-m SF: richer structure than m=1; tests G connectivity paths |
| `sf-tiny-medium-m-2` | SF | 6 | — | — | 2 | 1131 | 1132 | 1133 | S | Small with medium-m: all solvers; comparison point for ER tiny |
| `sf-small-high-m-1` | SF | 6 | — | — | 3 | 1141 | 1142 | 1143 | S | High-m SF at SMALL_MAX_N: hub-dense G, many connected paths |
| `sf-small-high-m-2` | SF | 5 | — | — | 4 | 1151 | 1152 | 1153 | S | Very high-m (clamped to n-1): near-complete G; ILP2+ terminates in 1 candidate |
| `er-tiny-fragmented-g-1` | ER | 5 | 0.50 | 0.05 | — | 1161 | 1162 | 1163 | S | Nearly empty G: most multi-vertex paths fail G-connectivity check |
| `er-tiny-fragmented-g-2` | ER | 4 | 0.60 | 0.08 | — | 1171 | 1172 | 1173 | S | Fragmented G: validates Phase D rejection counter maximised |
| `er-tiny-decoy-1` | ER | 5 | 0.70 | 0.60 | — | 1181 | 1182 | 1183 | S | Dense D with long paths that fail G-test: decoy heavy |
| `er-tiny-no-solution-1` | ER | 5 | 0.50 | 0.00 | — | 1191 | 1192 | 1193 | S | pG=0: G has no edges; only singleton paths are valid |

### 4.2 Medium cases (20 cases)

| CaseId | Family | n | pD | pG | m | seedOrder | seedD | seedG | Tier | Educational Purpose |
|---|---|---|---|---|---|---|---|---|---|---|
| `er-med-sparse-d-1` | ER | 7 | 0.20 | 0.60 | — | 2001 | 2002 | 2003 | M | Sparse D: small path count; ILP2+ terminates early if any feasible path exists |
| `er-med-sparse-d-2` | ER | 8 | 0.25 | 0.55 | — | 2011 | 2012 | 2013 | M | Moderate n with sparse D: validates CP2+ genomic prune counts stay low |
| `er-med-dense-d-1` | ER | 8 | 0.75 | 0.40 | — | 2021 | 2022 | 2023 | M | Dense D, moderate G: high candidate count; ILP2+ early exit benefit clear |
| `er-med-dense-d-2` | ER | 9 | 0.80 | 0.35 | — | 2031 | 2032 | 2033 | M | Very dense D, moderate G: near-exponential paths; ILP2+ most impactful |
| `er-med-dense-g-1` | ER | 7 | 0.40 | 0.85 | — | 2041 | 2042 | 2043 | M | Moderate D, dense G: almost all paths G-connected; CP2+ prunes by directed bound only |
| `er-med-dense-g-2` | ER | 8 | 0.35 | 0.90 | — | 2051 | 2052 | 2053 | M | Dense G near-complete: validates winner equals longest D-path in near-complete G |
| `er-med-anticorr-1` | ER | 9 | 0.70 | 0.15 | — | 2061 | 2062 | 2063 | M | Anti-correlated: D rich, G fragmented; most long paths fail G; ILP2+ may find winner late |
| `er-med-anticorr-2` | ER | 10 | 0.65 | 0.12 | — | 2071 | 2072 | 2073 | M | At ILP2 n=10 boundary: anti-correlated; validates ILP2 pre-enumeration guard |
| `sf-med-low-m-1` | SF | 7 | — | — | 1 | 2081 | 2082 | 2083 | M | Chain-like SF at medium n: long D paths, sparse G; ILP2+ Phase D rejection high |
| `sf-med-low-m-2` | SF | 8 | — | — | 1 | 2091 | 2092 | 2093 | M | Slightly larger chain SF: validates acyclicity and sparse-G rejection |
| `sf-med-medium-m-1` | SF | 8 | — | — | 2 | 2101 | 2102 | 2103 | M | m=2 SF: richer G connectivity; CP2+ genomic prunes visible |
| `sf-med-medium-m-2` | SF | 9 | — | — | 2 | 2111 | 2112 | 2113 | M | Larger m=2 SF: tests CP2 vs CP2+ state-count divergence |
| `sf-med-high-m-1` | SF | 9 | — | — | 3 | 2121 | 2122 | 2123 | M | m=3 SF: hub vertices create many G-connected paths; ILP2+ exits early |
| `sf-med-high-m-2` | SF | 10 | — | — | 3 | 2131 | 2132 | 2133 | M | At ILP2 boundary with high-m: hub-dominated G near-complete |
| `er-med-bridge-rep-1` | ER | 7 | 0.45 | 0.30 | — | 2141 | 2142 | 2143 | M | Bridge-repairable G: some paths only connected via single G-bridge |
| `er-med-bridge-rep-2` | ER | 8 | 0.50 | 0.28 | — | 2151 | 2152 | 2153 | M | Bridge repair at higher n: validates CP2+ forward-reachable bridge detection |
| `er-med-community-g-1` | ER | 9 | 0.40 | 0.45 | — | 2161 | 2162 | 2163 | M | Community-structured-like G (pG mid): paths within community succeed, cross-community fail |
| `er-med-community-g-2` | ER | 8 | 0.35 | 0.50 | — | 2171 | 2172 | 2173 | M | Larger community comparison: CP2+ propagation checks visible |
| `er-med-layered-dag-1` | ER | 10 | 0.60 | 0.60 | — | 2181 | 2182 | 2183 | M | Dense D and G at n=10 ILP2 ceiling: high path count; peak ILP2+ benefit |
| `sf-med-unbalanced-1` | SF | 9 | — | — | 4 | 2191 | 2192 | 2193 | M | High-m SF: unbalanced degree distribution; star-shaped G; long paths always connected |

### 4.3 Stress cases (10 cases, CP2/CP2+ only)

| CaseId | Family | n | pD | pG | m | seedOrder | seedD | seedG | Cap | Tier | Educational Purpose |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `er-stress-sparse-1` | ER | 12 | 0.25 | 0.70 | — | 3001 | 3002 | 3003 | 30000 | L | Sparse D stress: CP2+ directed prunes minimal; tests truthful cap |
| `er-stress-dense-1` | ER | 13 | 0.70 | 0.30 | — | 3011 | 3012 | 3013 | 30000 | L | Dense D, moderate G stress: likely capped; incumbent may be partial |
| `er-stress-dense-2` | ER | 12 | 0.80 | 0.25 | — | 3021 | 3022 | 3023 | 30000 | L | Very dense D stress: high path count; validates CP2 vs CP2+ under cap |
| `er-stress-dense-g-1` | ER | 13 | 0.40 | 0.90 | — | 3031 | 3032 | 3033 | 30000 | L | Dense G stress: many G-connected paths; tests cap with many accepted candidates |
| `er-stress-anticorr-1` | ER | 12 | 0.65 | 0.10 | — | 3041 | 3042 | 3043 | 30000 | L | Anti-correlated stress: CP2+ propagation prunes many paths early |
| `sf-stress-low-m-1` | SF | 13 | — | — | 1 | 3051 | 3052 | 3053 | 30000 | L | Chain-like SF stress: sparse G; shows CP2+ minimal overhead |
| `sf-stress-medium-m-1` | SF | 12 | — | — | 2 | 3061 | 3062 | 3063 | 30000 | L | m=2 SF stress: moderate G connectivity; cap likely hit |
| `sf-stress-high-m-1` | SF | 13 | — | — | 3 | 3071 | 3072 | 3073 | 30000 | L | High-m SF stress: hub-rich G; CP2+ genomic prunes fewer |
| `er-stress-bridge-rep-1` | ER | 12 | 0.45 | 0.35 | — | 3081 | 3082 | 3083 | 30000 | L | Bridge-repairable stress: CP2+ propagation detects repairable vs unresponsive prefixes |
| `er-stress-max-n-1` | ER | 13 | 0.55 | 0.55 | — | 3091 | 3092 | 3093 | 30000 | L | Max n balanced density: most stress-heavy scenario; incumbent truthfulness tested |

### 4.4 Corpus spec type extension

The existing `CP2RandomBenchmarkCaseSpec` uses a single `seed`. For the new corpus,
extend the spec type to carry independent seeds:

```ts
type ExtendedCaseSpec = {
  caseId: string;
  tier: 'S' | 'M' | 'L';
  graphFamily: 'acyclic-erdos-renyi' | 'acyclic-scale-free';
  params: IndependentErdosRenyiParams | IndependentScaleFreeParams;
  maxEvents: number;
};
```

This uses `generateIndependentAcyclicErdosRenyiGraph` and
`generateIndependentAcyclicScaleFreeGraph` already exported from
`randomGraphGenerators.ts`. No new generator code is needed.

### 4.5 Stress case completeness claim policy

**Tier L cases must never be labeled "proof-complete" unless all three conditions hold:**
1. `proofCompleteEmitted === true`
2. `interruptedByCap === false`
3. `cancelled === false`

ILP2 is not run on any Tier L case due to `enumeratePaths` executing before checking
`maxEvents`. The cap in `solveILP2` does not bound the upfront path enumeration.
Tier L ILP2 result = `not-run-preenumeration-risk`.

---

## 5. Section D — D/G Structural Distinction Rule

### Problem statement

The independent-seed generators (`generateIndependentAcyclicErdosRenyiGraph` with separate
`seedD` and `seedG`) guarantee probabilistic independence between D and G edge sets.
Independence does NOT guarantee visual or structural distinctness. Two graphs drawn from
the same probability space can be nearly identical by chance.

For educational use, structural distinctness is important: students should see D and G as
different graphs that happen to share the same vertex set.

### Validator design

Define a pure function:

```ts
function validateDGStructuralDistinction(
  graph: AcyclicErdosRenyiGraph | AcyclicScaleFreeGraph
): DGDistinctionReport
```

```ts
interface DGDistinctionReport {
  distinct: boolean;
  edgeOverlapRatio: number;        // |shared edges| / max(|D|, |G|)
  degreeProfileDistance: number;   // sum of |degD[v] - degG[v]| / n
  gConnectedComponents: number;    // number of G components
  dReachabilityPairs: number;      // |{(u,v): u can reach v in D}|
  densityDistance: number;         // |densityD - densityG|
  recommendation: 'accept' | 'warn' | 'regenerate';
}
```

### Metric definitions

**1. Edge overlap ratio**
A directed arc `(u→v) ∈ D` and undirected edge `{u,v} ∈ G` are "overlapping" if the same
unordered pair appears in both.

```
sharedPairs = |{ {u,v} : (u→v) ∈ D AND {u,v} ∈ G }|
edgeOverlapRatio = sharedPairs / max(|D|, |G|, 1)
```

Threshold: `edgeOverlapRatio > 0.70` → `'warn'`; `> 0.90` → `'regenerate'`.

**2. Degree profile distance**
Compare the total degree sequence of D (in-degree + out-degree) vs G (undirected degree).

```
degreeProfileDistance = (1/n) * Σᵥ |degD[v] - degG[v]|
```

Threshold: `degreeProfileDistance < 0.30` on graphs where densities are similar
→ `'warn'` (structures may look identical).

**3. Connected-component signature**
G components: number of connected components in undirected G.
D reachability: number of vertices reachable from the first topological vertex in D.

These typically differ (G may be fragmented while D is well-connected, or vice versa),
which is a useful visual contrast.

**4. Density distance**
```
densityD = |D| / (n*(n-1)/2)
densityG = |G| / (n*(n-1)/2)
densityDistance = |densityD - densityG|
```

Threshold: `densityDistance < 0.05` → `'warn'` (graphs have nearly identical density,
increasing visual similarity risk).

### Composite decision

```
recommendation:
  if edgeOverlapRatio > 0.90 AND densityDistance < 0.05 → 'regenerate'
  elif edgeOverlapRatio > 0.70 OR (densityDistance < 0.10 AND degreeProfileDistance < 0.25) → 'warn'
  else → 'accept'
```

### Fallback behavior

If a random draw yields `'regenerate'`:
1. Retry by incrementing `seedD` by `+1000` and `seedG` by `+1000` (deterministic, bounded).
2. Maximum 3 retries.
3. After 3 retries without `'accept'`, accept the least-bad result and log a `'warn'` with
   the overlap ratio.
4. Never discard a case silently. The UI should display the distinction report alongside
   the graph statistics.

### What the validator does NOT do

- It does not guarantee that D and G look different to every viewer.
- It does not claim that random independence guarantees visual difference.
- It does not modify the generators — validation is a separate post-generation step.
- It does not block generation; `'warn'` is informational, `'regenerate'` triggers retry.

---

## 6. Section E — Safety Tiers

All tiers assume the `generateIndependentAcyclicErdosRenyiGraph` or
`generateIndependentAcyclicScaleFreeGraph` output is validated as acyclic
(guaranteed by construction).

### Tier S — Tiny/Small (n ≤ 6)

All 9 acyclic solvers run. Proof-complete required before labeling as comparable.

| Solver | Max n | Max events | Proof-complete required | Notes |
|---|---|---|---|---|
| Legacy | 6 | — (full enum) | YES | Only complete if `!error` |
| CP1 | 6 | 200000 | YES | `status === 'optimal' \| 'no-solution'` |
| CP2 | 6 | 200000 | YES | `proofCompleteEmitted` |
| CP2+ | 6 | 200000 | YES | `proofCompleteEmitted` |
| AlgoBB++ | 6 | 200000 | YES | `!cancelled && !eventCapReached` |
| ILP1 | 6 | 200000 | YES | `proofCompleteEmitted` |
| ILP2 (Phase D) | 6 | 200000 | YES | `proofCompleteEmitted` |
| ILP2+ | 6 | 200000 | YES | `proofCompleteEmitted` + `earlyTermination` visible |
| Subset DP | 6 | 200000 | YES | `proofCompleteEmitted`, `maxVertices = 6` |
| CP3 / CP4 | N/A | N/A | N/A | Not applicable — cyclic-trail methods |

### Tier M — Medium (7 ≤ n ≤ 10)

CP2, CP2+, ILP2, and ILP2+ only. Exactness comparisons valid only when all complete.

| Solver | Max n | Max events | Proof-complete required for claim | Notes |
|---|---|---|---|---|
| Legacy | NOT RUN | — | — | Pre-enumeration risk for n > 6 |
| CP1 | NOT RUN | — | — | Safety limit |
| CP2 | 10 | 200000 | YES | |
| CP2+ | 10 | 200000 | YES | |
| AlgoBB++ | NOT RUN | — | — | Safety limit |
| ILP1 | NOT RUN | — | — | Safety limit |
| ILP2 (Phase D) | 10 | 200000 | YES | Not run if tier = 'L' spec is passed |
| ILP2+ | 10 | 200000 | YES | Same guard as ILP2 |
| Subset DP | NOT RUN | — | — | `maxVertices = 6` hard limit |
| CP3 / CP4 | N/A | — | N/A | Not applicable |

### Tier L — Stress (n > 10)

CP2 and CP2+ only. No proof-complete claim unless both flags hold.

| Solver | Max n | Max events | Notes |
|---|---|---|---|
| CP2 | 13 | 30000 | Report cap/cancellation truthfully |
| CP2+ | 13 | 30000 | Report cap/cancellation truthfully |
| ILP2 (Phase D) | NOT RUN | — | Pre-enumeration risk: `enumeratePaths` is unbounded |
| ILP2+ | NOT RUN | — | Same risk — early termination does not help upfront enumeration |
| All others | NOT RUN | — | Safety limits |
| CP3 / CP4 | N/A | — | Not applicable |

**Tier L completeness claim rule:** A Tier L result may only say "proof-complete" if
`proofCompleteEmitted === true AND interruptedByCap === false AND cancelled === false`.
An `incumbent` present without `proofCompleteEmitted` is a bounded-search best-so-far,
not an optimality claim.

### Potential ILP2+ tier policy

ILP2+ applies the same tier limits as ILP2 Phase D:
- Run on Tier S (n ≤ 6) and Tier M (n ≤ 10)
- Not run on Tier L (pre-enumeration risk)
- Not run when `spec.tier === 'L'` in the benchmark module
- `canRunILP2()` guard in `RandomGraphDemoLab.tsx` covers both ILP2 and ILP2+

---

## 7. Section F — Teacher Demonstration Flow

### Recommended demonstration sequence for the Random Graph Lab

**Step 1 — Generate independent D/G**
- Choose Tier S/Tiny case from the new corpus (e.g., `er-tiny-dense-2` or
  `sf-tiny-medium-m-1`).
- Point out the three visible seeds: `seedOrder`, `seedD`, `seedG`.
- Explain: "D and G were drawn from independent random number streams. Their edges have
  no algebraic relationship."

**Step 2 — Verify D/G structural distinction**
- Show the `DGDistinctionReport` sidebar (if implemented): edge-overlap ratio,
  degree-profile distance, density distance.
- Explain: "Independence does not guarantee visual difference. Here we explicitly check
  overlap and density to confirm the graphs are meaningfully distinct."

**Step 3 — Run all safe exact methods on Tiny/Small graph**
- Load the Tier S case into the lab.
- Show all 9 solver rows (minus CP3/CP4).
- Point out: all `proof: true`, all `path` fields agree, all `valid: true`.
- Explain: "Every solver reaches the same answer by a different internal strategy.
  This confirms exactness — not that one method is universally faster."
- Emphasize: "Each solver's metric counter (states, candidates, events) measures
  different internal objects. They are not interchangeable."

**Step 4 — CP2 vs CP2+ on a fragmented or bridge-repairable graph**
- Load `er-tiny-fragmented-g-1` (pG ≈ 0.05, fragmented G).
- Show CP2 `prunedStates` and CP2+ `genomicPropagationPrunes`.
- Explain: "CP2+ applies an additional check: can selected G-components reconnect
  through forward-reachable vertices? When G is fragmented, many prefixes are pruned
  here that CP2 would have explored further."
- Then load `er-med-bridge-rep-1` for a bridge-repairable case.
- Show that CP2+ `genomicPropagationPrunes` is lower on the bridge-repairable graph
  (it keeps prefixes that could repair connectivity).

**Step 5 — ILP2 (Phase D) vs ILP2+ on same graph**
- Use `er-tiny-dense-1` (dense D, sparse G) — high candidate count.
- Show ILP2 Phase D: `exploredCandidates` = N (all paths evaluated).
- Show ILP2+: `exploredCandidates` = k+1 (terminated after first feasible).
- Show `earlyTermination: true` in ILP2+ counters.
- Confirm `bestPath` identical between the two.
- Explain: "ILP2+ terminates after finding the first feasible candidate because the
  sorted list guarantees that candidate is the global optimum. ILP2 Phase D keeps
  running to demonstrate all rejections; ILP2+ stops early with a proven winner."
- ONLY compare these two when both complete. Never compare ILP2 candidate counts
  against CP2 state counts directly.

**Step 6 — Show Stress graph with truthful cap status**
- Load `er-stress-dense-1` (n=13, dense D).
- Show CP2 and CP2+ rows: status `incomplete`, proof `false`.
- Show ILP2/ILP2+ row: `not-run-preenumeration-risk`.
- Explain: "At this graph size and cap, CP2 and CP2+ were interrupted before
  completing exhaustive search. An incumbent may be present but it is NOT a proven
  optimum. ILP2 is not run because full path enumeration happens before the cap check,
  making it unsafe to call."

**Step 7 — Counter non-interchangeability explanation**
- Display the counters note already in the UI:
  "Each solver reports work in its own search model. Candidate counts and explored
  states are not interchangeable."
- Add a per-solver tooltip or footnote mapping each counter to its search model:
  - CP2: `exploredStates` = DFS prefixes evaluated
  - CP2+: `statesExplored` = DFS prefixes evaluated (same model as CP2 + propagation)
  - ILP2: `enumeratedCandidates` = complete directed paths evaluated
  - ILP2+: `enumeratedCandidates` = complete paths evaluated before early termination

---

## 8. Section G — Boundaries

The following boundaries are fixed and must not be crossed:

| Boundary | Rule |
|---|---|
| CP3 / CP4 | Remain cyclic-trail methods; never compared in the acyclic lab |
| No runtime ranking | Counter differences between methods are structural, not timing evidence |
| No paper reproduction claim | Generators are educational; they do not reproduce published experiment distributions |
| No native MILP claim | ILP2/ILP2+ are deterministic TypeScript enumeration — not CPLEX, OR-Tools, or Gurobi |
| No fake ILP2+ label | ILP2+ is implemented only as sorted-prefix early termination (Candidate 1), backed by a formal theorem |
| No deployment | This plan covers only `src/domain` changes and docs; no backend, no API, no worker, no CLI |
| ILP2+ inherits ILP2 tier limits | Not run on Tier L; same `canRunILP2` guard in the UI |
| Stress incomplete ≠ optimal | `proofCompleteEmitted === false` cases never claim a proven winner |
| No new solver families | CP2+, ILP2+, and Subset DP are the only additions within this plan |
| No new packages | All new functionality uses existing TypeScript + `pathAlgorithms.ts` + `randomGraphGenerators.ts` |

---

## 9. Main Risks

| Risk | Severity | Mitigation |
|---|---|---|
| ILP2+ `earlyTermination: true` loses educational visibility of suboptimal candidates | Medium | Document explicitly in trace message; offer "verbose mode" as future option (ponytail: skip until needed) |
| New corpus seeds collide with Phase B/C corpus seeds | Low | All new seeds start at 1001+, Phase B/C seeds at 101–601. No overlap. |
| `validateDGStructuralDistinction` fires `'regenerate'` on many corpus cases | Low | Validator is advisory; corpus seeds are pre-selected; regeneration is bounded to 3 retries |
| Tier L ILP2 guard is inconsistently applied | Medium | Single `canRunILP2` function already in `RandomGraphDemoLab.tsx` — extend to ILP2+ |
| Stress case cap result displayed as proof-complete | High | Existing UI already uses `proofCompleteEmitted` flag — do not change flag semantics |
| ILP2+ `exploredCandidates` divergence confuses CP2 state count comparison | Medium | Counter non-interchangeability note already in UI; reinforce in teacher demo flow |
| Corpus too large for CI (50 cases) | Low | Tier S and M are all ≤ n=10; Tier L runs only CP2/CP2+. Tests should run in <10s |
| Adding `earlyTermination` to `ILP2Counters` breaks ilp2RandomBenchmark type | Low | TypeScript will catch the missing field; add mapping immediately |
| ILP2+ and ILP2 Phase D give different `exploredCandidates` on no-solution cases | Expected | No-solution: loop exhausts all paths; `earlyTermination: false`; counts identical |

---

## 10. Final Decision

### ILP2+ Decision

**IMPLEMENT ILP2+** with sorted-prefix early termination (Candidate 1 only).

- Proof: formal, complete, stated in Section A.
- Change: minimal (one `break` + one counter field + one message update).
- Safety: winner, objective, validity, and proof-complete semantics unchanged.
- Education: reduced visibility of suboptimal candidates is an acceptable tradeoff,
  mitigated by an explicit `earlyTermination: true` counter and message.
- Name: "ILP2+" is honest — it provides a provably correct and distinct improvement
  over both unmodified ILP2 and Phase D ILP2 (which addresses per-candidate rejection,
  not loop termination).

**Do NOT implement** Candidates 3, 4, or 5 (CP2+-style propagation, B&B without sorted
order, native MILP) until full theorems are proven.

### Hard Random Corpus Decision

**IMPLEMENT** 50-case deterministic corpus using existing `generateIndependentAcyclicErdosRenyiGraph`
and `generateIndependentAcyclicScaleFreeGraph` with the `IndependentErdosRenyiParams` /
`IndependentScaleFreeParams` types. No new generator code required.

### Structural Distinction Rule Decision

**IMPLEMENT** `validateDGStructuralDistinction` as an advisory post-generation validator.
Bounded retry with `+1000` seed increment. No blocking of generation on `'warn'`.

---

## 11. Appendix — Git Status

```
Branch: feature/ilp2plus-hard-random-graphs-plan
Base: origin/main (0afd4fe)
Changes: docs/ILP2PLUS_AND_HARD_RANDOM_GRAPH_RESEARCH_PLAN.md (new file)
Application code modified: NONE
Packages installed: NONE
```
