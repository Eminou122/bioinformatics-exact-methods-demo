# Hard Random Corpus and Random Lab Layout Phase H2 Plan

Date: 2026-06-26
Branch: `feature/hard-random-corpus-and-lab-layout-plan`
Status: read-only audit plus implementation plan. No application code changed.

## 1. Scope

Phase H2 should implement only:

1. A page-local Random Graph Lab layout fix so Graph D and Graph G are fully visible.
2. A deterministic hard random-graph corpus using visible `seedOrder`, `seedD`, and `seedG`.
3. Truthful Random Graph Lab integration of the released `solveILP2Plus(...)`.

Do not change solver semantics, ILP2+ proof logic, CP2/CP2+ behavior, MethodCockpit shared layout, CP3/CP4 status, packages, backend, APIs, workers, deployment, or runtime/paper-reproduction wording.

## 2. Audit Summary

### Files Read

- `src/components/RandomGraphDemoLab.tsx`
- `src/components/MethodCockpit.tsx`
- `src/components/GraphPanel.tsx`
- `src/components/DirectedGraph.tsx`
- `src/components/GenomicGraph.tsx`
- `src/styles/global.css`
- `src/domain/randomGraphGenerators.ts`
- `src/domain/randomGraphGenerators.test.ts`
- `src/domain/cp2RandomBenchmark.ts`
- `src/domain/ilp2RandomBenchmark.ts`
- `src/domain/ilp2Solver.ts`
- `src/domain/ilp2Solver.test.ts`
- `src/domain/challengeGraphLibrary.ts` (`src/domain/challengeGraphs.ts` does not exist)
- `src/domain/methodScenarioHandoff.ts`
- `src/components/ScenarioHandoffBanner.tsx`
- `src/i18n/translations.ts`
- `src/components/RandomGraphDemoLab.test.tsx`
- `src/components/RoutingUI.test.tsx`
- `src/App.tsx`
- `docs/ILP2PLUS_AND_HARD_RANDOM_GRAPH_RESEARCH_PLAN.md`

### Recent Commits

- `0afd4fe`: reverted the prior Random Graph Lab presentation fix.
- `3c9e287`: attempted a `MethodCockpit` `scrollable` prop and global-ish overflow overrides for a Random Graph Lab issue.
- `4258f86`: released `solveILP2Plus(...)` with sorted-prefix early termination.

## 3. Graph-Box Layout Audit

### Exact Clipping Cause

The clipping is caused by `MethodCockpit` desktop layout rules applied to RandomGraphDemoLab:

```css
@media (min-width: 1024px) {
  .method-cockpit {
    height: calc(100vh - 138px);
    min-height: 620px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .method-cockpit__body {
    flex: 1;
    overflow: hidden;
  }
}
```

Combined with:

```css
.method-cockpit__body {
  grid-template-rows: minmax(360px, 1.18fr) minmax(220px, 0.82fr);
}
.method-cockpit__panel {
  min-height: 0;
}
.method-cockpit__panel > .card,
.method-cockpit__graph > .graph-panel-container {
  height: 100%;
  overflow: auto;
}
.method-cockpit__graph > .graph-panel-container {
  overflow: visible;
  min-height: 0;
}
```

`GraphPanel` then tries to fit two SVG panels plus headings and captions inside the fixed first grid row. The SVG containers have `minHeight: 280px` each, and the two graph columns need that height plus GraphPanel heading/description/captions/padding. On desktop the enclosing cockpit body and cockpit root hide overflow, so graph content can be visually clipped. The SVG itself uses padded `viewBox` and `overflow: visible`; the page-level cockpit row is the constraining box.

### Rejected Fix

Do not restore `3c9e287` as-is. It added `scrollable` behavior to `MethodCockpit` and changed shared cockpit overflow behavior through a reusable prop. That crosses the H2 boundary because the Method pages depend on the fixed cockpit shell.

### Recommended Page-Local Fix

Smallest safe fix: wrap the Random Graph Lab `MethodCockpit` in a page-local class and override only this page's cockpit sizing and graph panel minimum height.

Proposed shape:

```tsx
<div className="random-lab-cockpit-shell">
  <MethodCockpit ... />
</div>
```

Page-local CSS inside `RandomGraphDemoLab.tsx`:

```css
@media (min-width: 1024px) {
  .random-lab-cockpit-shell .method-cockpit {
    height: auto;
    min-height: 0;
    overflow: visible;
  }
  .random-lab-cockpit-shell .method-cockpit__body {
    grid-template-rows: auto auto;
    overflow: visible;
  }
  .random-lab-cockpit-shell .method-cockpit__graph {
    min-height: 430px;
  }
  .random-lab-cockpit-shell .method-cockpit__graph > .graph-panel-container {
    height: auto;
    min-height: 430px;
    overflow: visible;
  }
}

@media (max-width: 767px) {
  .random-lab-cockpit-shell .graph-workspace-grid {
    grid-template-columns: 1fr;
  }
}
```

Keep the existing `GraphPanel` side-by-side behavior from `.grid-2` on desktop. Keep mobile tab behavior and stacking under the current `max-width: 767px` rule. Keep the “Test in Methods” section after the `MethodCockpit`, because it already appears after all graph visualization content in DOM order; the fix must not move it into the cockpit.

## 4. Hard Random-Graph Corpus

### Corpus Type

Add a new corpus module rather than bloating the existing 10-case released corpus in place:

`src/domain/hardRandomGraphCorpus.ts`

Proposed spec:

```ts
type HardRandomTier = 'S' | 'M' | 'L';
type AllowedSolver =
  | 'Legacy' | 'CP1' | 'CP2' | 'CP2+' | 'AlgoBB++'
  | 'ILP1' | 'ILP2' | 'ILP2+' | 'Subset DP';

type HardRandomCaseSpec = {
  caseId: string;
  tier: HardRandomTier;
  graphFamily: 'acyclic-erdos-renyi' | 'acyclic-scale-free';
  params:
    | { n: number; pD: number; pG: number; seedOrder: number; seedD: number; seedG: number }
    | { n: number; m: number; seedOrder: number; seedD: number; seedG: number };
  maxEvents: number;
  structuralProperty: string;
  educationalPurpose: string;
  allowedSolvers: AllowedSolver[];
};
```

Solver tier policy:

- Tier S, `n <= 6`: `Legacy`, `CP1`, `CP2`, `CP2+`, `AlgoBB++`, `ILP1`, `ILP2`, `ILP2+`, `Subset DP`.
- Tier M, `7 <= n <= 10`: `CP2`, `CP2+`, `ILP2`, `ILP2+`.
- Tier L, `n > 10`: `CP2`, `CP2+`; ILP2 and ILP2+ are `not-run-preenumeration-risk`.

### Tiny / Small Cases

| ID | Tier | Family | n | Parameters | seedOrder | seedD | seedG | maxEvents | Structural property | Educational purpose | Allowed solvers |
|---|---|---:|---:|---|---:|---:|---:|---:|---|---|---|
| `er-tiny-sparse-d-dense-g-1` | S | ER | 4 | `pD=0.20,pG=0.80` | 1001 | 1002 | 1003 | 200000 | Sparse D, dense G | Few directed paths, likely early feasible winner | all S |
| `er-tiny-sparse-d-dense-g-2` | S | ER | 5 | `pD=0.25,pG=0.85` | 1011 | 1012 | 1013 | 200000 | Sparse D, dense G | Checks replayability and safe equality | all S |
| `er-tiny-dense-d-sparse-g-1` | S | ER | 5 | `pD=0.85,pG=0.15` | 1021 | 1022 | 1023 | 200000 | Dense D, sparse G | Many disconnected-G rejections before winner | all S |
| `er-tiny-dense-d-sparse-g-2` | S | ER | 6 | `pD=0.75,pG=0.20` | 1031 | 1032 | 1033 | 200000 | Dense D, sparse G | Phase D rejection counters visible | all S |
| `er-small-balanced-medium-1` | S | ER | 6 | `pD=0.45,pG=0.45` | 1041 | 1042 | 1043 | 200000 | Balanced densities | Baseline all-solver comparison | all S |
| `er-small-balanced-order-shift-1` | S | ER | 6 | `pD=0.50,pG=0.50` | 1051 | 1052 | 1053 | 200000 | Balanced, shuffled order | Shows topological order independence | all S |
| `er-small-fragmented-g-1` | S | ER | 5 | `pD=0.60,pG=0.05` | 1061 | 1062 | 1063 | 200000 | Fragmented G | Disconnected induced-G examples | all S |
| `er-small-fragmented-g-2` | S | ER | 6 | `pD=0.55,pG=0.08` | 1071 | 1072 | 1073 | 200000 | Fragmented G | Tests no false proof from rejected paths | all S |
| `er-small-lexical-tie-1` | S | ER | 5 | `pD=1.00,pG=1.00` | 1081 | 1082 | 1083 | 200000 | Complete D/G | Lexical tie behavior visible | all S |
| `er-small-decoy-heavy-1` | S | ER | 6 | `pD=0.80,pG=0.25` | 1091 | 1092 | 1093 | 200000 | Long decoy paths | ILP2+ skips only after winner | all S |
| `sf-tiny-low-m-1` | S | SF | 4 | `m=1` | 1101 | 1102 | 1103 | 200000 | Low-m chain-like | Minimal preferential attachment | all S |
| `sf-tiny-low-m-2` | S | SF | 5 | `m=1` | 1111 | 1112 | 1113 | 200000 | Low-m sparse | Sparse scale-free contrast | all S |
| `sf-small-medium-m-1` | S | SF | 5 | `m=2` | 1121 | 1122 | 1123 | 200000 | Medium-m | Richer G with same n | all S |
| `sf-small-medium-m-2` | S | SF | 6 | `m=2` | 1131 | 1132 | 1133 | 200000 | Medium-m | All-solver boundary case | all S |
| `sf-small-high-m-1` | S | SF | 6 | `m=3` | 1141 | 1142 | 1143 | 200000 | High-m hub-like | Dense hubs and many feasible paths | all S |
| `sf-small-high-m-2` | S | SF | 5 | `m=4` | 1151 | 1152 | 1153 | 200000 | High-m clamped | Near-complete SF behavior | all S |
| `er-small-anticorrelated-1` | S | ER | 5 | `pD=0.70,pG=0.10` | 1161 | 1162 | 1163 | 200000 | Anti-correlated D/G | Dense directed candidates, sparse genomic feasibility | all S |
| `er-small-no-solution-style-1` | S | ER | 4 | `pD=0.00,pG=0.00` | 1171 | 1172 | 1173 | 200000 | No directed arcs, empty G | Degenerate singleton-only behavior | all S |
| `er-small-community-g-1` | S | ER | 6 | `pD=0.45,pG=0.35` | 1181 | 1182 | 1183 | 200000 | Community-style G candidate | Visual D/G distinction with components | all S |
| `er-small-repairable-bridge-1` | S | ER | 6 | `pD=0.55,pG=0.30` | 1191 | 1192 | 1193 | 200000 | Repairable bridge candidate | CP2+ must keep repairable prefixes | all S |

### Medium Cases

| ID | Tier | Family | n | Parameters | seedOrder | seedD | seedG | maxEvents | Structural property | Educational purpose | Allowed solvers |
|---|---|---:|---:|---|---:|---:|---:|---:|---|---|---|
| `er-med-sparse-d-dense-g-1` | M | ER | 7 | `pD=0.20,pG=0.75` | 2001 | 2002 | 2003 | 200000 | Sparse D, dense G | Safe medium comparison | CP2, CP2+, ILP2, ILP2+ |
| `er-med-sparse-d-dense-g-2` | M | ER | 8 | `pD=0.25,pG=0.70` | 2011 | 2012 | 2013 | 200000 | Sparse D, dense G | Low ILP2 candidate count | CP2, CP2+, ILP2, ILP2+ |
| `er-med-dense-d-sparse-g-1` | M | ER | 8 | `pD=0.75,pG=0.20` | 2021 | 2022 | 2023 | 200000 | Dense D, sparse G | Heavy rejected-candidate surface | CP2, CP2+, ILP2, ILP2+ |
| `er-med-dense-d-sparse-g-2` | M | ER | 9 | `pD=0.80,pG=0.18` | 2031 | 2032 | 2033 | 200000 | Dense D, sparse G | Late feasible winner pressure | CP2, CP2+, ILP2, ILP2+ |
| `er-med-balanced-1` | M | ER | 7 | `pD=0.45,pG=0.45` | 2041 | 2042 | 2043 | 200000 | Balanced | Medium baseline | CP2, CP2+, ILP2, ILP2+ |
| `er-med-balanced-unbalanced-order-1` | M | ER | 8 | `pD=0.50,pG=0.50` | 2051 | 2052 | 2053 | 200000 | Balanced density, shuffled order | Topological-order teaching | CP2, CP2+, ILP2, ILP2+ |
| `er-med-anticorrelated-1` | M | ER | 9 | `pD=0.70,pG=0.12` | 2061 | 2062 | 2063 | 200000 | Anti-correlated | Long D paths fail G | CP2, CP2+, ILP2, ILP2+ |
| `er-med-anticorrelated-2` | M | ER | 10 | `pD=0.65,pG=0.15` | 2071 | 2072 | 2073 | 200000 | Anti-correlated at ILP2 boundary | Pre-enumeration risk edge | CP2, CP2+, ILP2, ILP2+ |
| `er-med-community-g-1` | M | ER | 8 | `pD=0.40,pG=0.42` | 2081 | 2082 | 2083 | 200000 | Community-style G | Component signature visible | CP2, CP2+, ILP2, ILP2+ |
| `er-med-community-g-2` | M | ER | 9 | `pD=0.45,pG=0.40` | 2091 | 2092 | 2093 | 200000 | Community-style G | D/G distinction validation | CP2, CP2+, ILP2, ILP2+ |
| `er-med-repairable-bridge-1` | M | ER | 8 | `pD=0.50,pG=0.28` | 2101 | 2102 | 2103 | 200000 | Repairable bridge | CP2+ propagation should not over-prune | CP2, CP2+, ILP2, ILP2+ |
| `er-med-layered-high-path-1` | M | ER | 10 | `pD=0.60,pG=0.60` | 2111 | 2112 | 2113 | 200000 | Layered high-path-count DAG | Peak safe ILP2+ comparison | CP2, CP2+, ILP2, ILP2+ |
| `er-med-decoy-heavy-1` | M | ER | 9 | `pD=0.78,pG=0.25` | 2121 | 2122 | 2123 | 200000 | Decoy-heavy DAG | Many infeasible sorted prefixes | CP2, CP2+, ILP2, ILP2+ |
| `er-med-lexical-tie-1` | M | ER | 7 | `pD=0.90,pG=0.90` | 2131 | 2132 | 2133 | 200000 | Dense lexical tie pressure | Canonical tie unchanged | CP2, CP2+, ILP2, ILP2+ |
| `sf-med-low-m-1` | M | SF | 7 | `m=1` | 2141 | 2142 | 2143 | 200000 | Low-m SF | Chain-like sparse case | CP2, CP2+, ILP2, ILP2+ |
| `sf-med-low-m-2` | M | SF | 8 | `m=1` | 2151 | 2152 | 2153 | 200000 | Low-m SF | Sparse scale-free medium | CP2, CP2+, ILP2, ILP2+ |
| `sf-med-medium-m-1` | M | SF | 8 | `m=2` | 2161 | 2162 | 2163 | 200000 | Medium-m SF | Moderate hubs | CP2, CP2+, ILP2, ILP2+ |
| `sf-med-medium-m-2` | M | SF | 9 | `m=2` | 2171 | 2172 | 2173 | 200000 | Medium-m SF | Counter divergence teaching | CP2, CP2+, ILP2, ILP2+ |
| `sf-med-high-m-1` | M | SF | 9 | `m=3` | 2181 | 2182 | 2183 | 200000 | High-m unbalanced | Hub-dominated G | CP2, CP2+, ILP2, ILP2+ |
| `sf-med-high-m-2` | M | SF | 10 | `m=4` | 2191 | 2192 | 2193 | 200000 | High-m boundary | Max safe SF ILP2+ case | CP2, CP2+, ILP2, ILP2+ |

### Stress Cases

| ID | Tier | Family | n | Parameters | seedOrder | seedD | seedG | maxEvents | Structural property | Educational purpose | Allowed solvers |
|---|---|---:|---:|---|---:|---:|---:|---:|---|---|---|
| `er-stress-sparse-d-dense-g-1` | L | ER | 12 | `pD=0.25,pG=0.75` | 3001 | 3002 | 3003 | 30000 | Sparse D, dense G | CP2/CP2+ stress without ILP2 | CP2, CP2+ |
| `er-stress-dense-d-sparse-g-1` | L | ER | 13 | `pD=0.70,pG=0.20` | 3011 | 3012 | 3013 | 30000 | Dense D, sparse G | Likely capped, no optimality claim | CP2, CP2+ |
| `er-stress-dense-d-sparse-g-2` | L | ER | 12 | `pD=0.80,pG=0.18` | 3021 | 3022 | 3023 | 30000 | Dense D, sparse G | Decoy-heavy stress | CP2, CP2+ |
| `er-stress-balanced-1` | L | ER | 13 | `pD=0.55,pG=0.55` | 3031 | 3032 | 3033 | 30000 | Balanced high n | Cap truthfulness | CP2, CP2+ |
| `er-stress-anticorrelated-1` | L | ER | 12 | `pD=0.65,pG=0.10` | 3041 | 3042 | 3043 | 30000 | Anti-correlated | CP2+ propagation visibility | CP2, CP2+ |
| `er-stress-community-g-1` | L | ER | 13 | `pD=0.45,pG=0.38` | 3051 | 3052 | 3053 | 30000 | Community-style G | D/G visual distinction at max n | CP2, CP2+ |
| `er-stress-layered-high-path-1` | L | ER | 13 | `pD=0.62,pG=0.62` | 3061 | 3062 | 3063 | 30000 | Layered high-path-count DAG | Stress UI and cap labels | CP2, CP2+ |
| `sf-stress-low-m-1` | L | SF | 13 | `m=1` | 3071 | 3072 | 3073 | 30000 | Low-m SF | Sparse chain stress | CP2, CP2+ |
| `sf-stress-medium-m-1` | L | SF | 12 | `m=2` | 3081 | 3082 | 3083 | 30000 | Medium-m SF | Moderate hub stress | CP2, CP2+ |
| `sf-stress-high-m-1` | L | SF | 13 | `m=4` | 3091 | 3092 | 3093 | 30000 | High-m unbalanced | Hub-heavy stress | CP2, CP2+ |

## 5. D/G Structural-Distinction Validator

Add a pure validator in the corpus/generator domain:

`src/domain/dgStructuralDistinction.ts`

Proposed API:

```ts
type DGDistinctionStatus = 'passed' | 'warning' | 'regenerated';

type DGDistinctionReport = {
  status: DGDistinctionStatus;
  attempts: number;
  finalSeedD: number;
  finalSeedG: number;
  sharedVertexIds: boolean;
  dAcyclic: boolean;
  gUndirected: boolean;
  independentStreams: boolean;
  projectedEdgeOverlapRatio: number;
  densityDifference: number;
  degreeProfileDistance: number;
  gConnectedComponents: number;
  dReachabilityPairs: number;
  notes: string[];
};
```

Checks:

- Shared vertex IDs: `new Set(vertices)` covers every endpoint in `edgesD` and `edgesG`.
- D acyclic: reuse `hasCycle(vertices, edgesD)`.
- G undirected: enforce normalized unordered pairs, no self-loops, no duplicate reversed pairs.
- Independent generation streams: params have separate numeric `seedOrder`, `seedD`, `seedG`; do not claim that this guarantees visual difference.
- Projected edge overlap ratio: compare unordered D pairs against unordered G pairs, `shared / max(|D|, |G|, 1)`.
- Density difference: `abs(|D| / pairs - |G| / pairs)`.
- Degree-profile distance: average absolute difference between D total degree and G degree.
- Component signature: count G connected components and D reachability pairs.

Decision:

- `passed`: all structural checks pass and overlap/distinction thresholds are acceptable.
- `warning`: graph is valid but visually similar or structurally weakly distinct.
- `regenerated`: initial graph required regeneration and a bounded deterministic retry produced the accepted graph.

Bounded regeneration:

```ts
for attempts in 0..3:
  generate with seedD + attempts * 1000, seedG + attempts * 1000
  validate
  if acceptable return status attempts === 0 ? 'passed' : 'regenerated'
return best report as 'warning'
```

No hidden randomness. Do not mutate `seedOrder`. Always display final seeds if regeneration changes `seedD` or `seedG`.

## 6. ILP2+ Random Graph Lab Integration

### Current State

- `solveILP2Plus(...)` exists and is exported from `src/domain/ilp2Solver.ts`.
- RandomGraphDemoLab imports only `solveILP2`.
- There is no real `/methods/ilp2-plus` route or page.
- `canRunILP2(...)` already captures the correct Tier L pre-enumeration guard and should be reused for ILP2+.

### Minimal Integration

In `RandomGraphDemoLab.tsx`:

- Import `solveILP2Plus`.
- Extend `SolverBundle` with `ilp2Plus: ILP2SolverResult | null`.
- Run ILP2+ only when `canRunILP2(graph, selectedPreset)` is true.
- Add a separate row named `ILP2+`.
- For Tier L/stress, show both ILP2 and ILP2+ as `not-run-preenumeration-risk`.
- In primary results, include `CP2`, `CP2+`, `ILP2`, and `ILP2+`.
- Label ILP2+ metrics separately:
  - `enumerated candidates`
  - `accepted candidates`
  - `earlyTermination`
  - `candidatesSkippedAfterWinner`
- Add a short counter note: “ILP2+ skips candidate evaluation after the winner; it does not skip complete path enumeration.”

Do not present ILP2+ as native MILP, runtime-superior, or a new solver family beyond sorted-prefix early termination.

### Method Launch Action

Do not add “Open in ILP2+” unless a real method route exists. There is no `/methods/ilp2-plus` today.

If the implementation adds a route, keep it minimal:

- Reuse `ILP2Model` logic through a shared prop/config, or add a tiny wrapper that switches solver function and labels.
- Do not duplicate the ILP2 page.
- Only then add the RandomGraphDemoLab action:
  - allowed where `canRunILP2(...)` is true.
  - disabled as `not-run-preenumeration-risk` for stress.

Lazy default for H2: show ILP2+ in the comparison table first; defer “Open in ILP2+” until a real page exists.

## 7. Required Test Plan

Add focused tests only:

1. Random Graph Lab graph visualization cannot be clipped:
   - render `/methods/random-graph-lab`;
   - assert the page-local wrapper exists;
   - assert `MethodCockpit` shared class is not changed;
   - assert graph panel container has page-local min-height/visible overflow rules.
2. Existing non-random MethodCockpit pages remain unchanged:
   - keep existing `RoutingUI` cockpit tests for CP1/CP2/ILP1/ILP2/AlgoBB++;
   - add one assertion that those routes do not get the Random Lab wrapper class.
3. All new corpus cases are deterministic:
   - repeated generation of every case deep-equals.
4. D/G distinction validation behaves correctly:
   - forced identical projected edge sets produce `warning` or regeneration path;
   - valid distinct graph produces `passed`.
5. Retry behavior is deterministic and bounded:
   - assert max attempts is 3;
   - assert seed increments are exactly `+1000`.
6. Tier solver safety is enforced:
   - S allows all acyclic solvers;
   - M allows CP2/CP2+/ILP2/ILP2+;
   - L allows only CP2/CP2+ and marks ILP2/ILP2+ as `not-run-preenumeration-risk`.
7. ILP2+ is displayed and run only where safe:
   - S/M rows include ILP2+;
   - L row is not-run, not capped, not complete.
8. ILP2+ counters are labeled truthfully:
   - row text includes `earlyTermination` and `candidatesSkippedAfterWinner`;
   - explanatory text says post-winner candidate evaluation, not path enumeration.
9. Existing handoff flow remains valid:
   - current CP2, CP2+, ILP2, Legacy, CP1, ILP1, AlgoBB++, Subset DP actions still work.
10. FR / EN / AR and RTL/LTR formatting remain correct:
    - graph workspace stays `dir="ltr"`;
    - Arabic shell stays RTL;
    - new labels have translations and no visible emoji.

## 8. Minimal Files Proposed

Implementation files:

- `src/components/RandomGraphDemoLab.tsx`
- `src/domain/hardRandomGraphCorpus.ts`
- `src/domain/dgStructuralDistinction.ts`
- `src/domain/cp2RandomBenchmark.ts` only if the existing corpus type is generalized instead of adding a separate hard corpus module.
- `src/domain/ilp2RandomBenchmark.ts` only if benchmark reporting is extended to include ILP2+ side-by-side.
- `src/App.tsx` and `src/components/ILP2Model.tsx` only if a real ILP2+ method route is added.
- `src/components/Navigation.tsx`, `src/components/MethodMap.tsx`, and translations only if the ILP2+ route is added.

Test files:

- `src/components/RandomGraphDemoLab.test.tsx`
- `src/components/RoutingUI.test.tsx`
- `src/domain/randomGraphGenerators.test.ts`
- `src/domain/hardRandomGraphCorpus.test.ts`
- `src/domain/dgStructuralDistinction.test.ts`
- `src/domain/ilp2RandomBenchmark.test.ts` only if benchmark reporting changes.

Do not touch `MethodCockpit.tsx` for the layout fix.

## 9. Main Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Fix leaks into shared MethodCockpit pages | High | Use `.random-lab-cockpit-shell ...` selectors only; add regression test on non-random method pages |
| SVG still clipped for n=13 wide layouts | Medium | Use page-local min-height and preserve visible overflow; verify with stress preset |
| Corpus is too large for full all-solver CI | Medium | Enforce solver tier policy; Tier L CP2/CP2+ only |
| D/G validator implies independence guarantees visual distinction | Medium | Wording must say independent streams do not guarantee visual difference |
| Regeneration hides changed seeds | Medium | Display final `seedD`/`seedG` and report attempts |
| ILP2+ shown as runtime winner | High | Counter wording only; no runtime ranking |
| “Open in ILP2+” duplicates ILP2 page logic | Medium | Do not add action until a real shared route/page exists |
| Stress ILP2+ mistakenly runs | High | Reuse `canRunILP2`; test Tier L not-run for ILP2 and ILP2+ |

## 10. Final Decision

Implement H2 in this order:

1. Fix RandomGraphDemoLab clipping with a page-local wrapper around `MethodCockpit`; do not edit `MethodCockpit`.
2. Add `dgStructuralDistinction` and the hard corpus as domain-only deterministic modules.
3. Add ILP2+ as a separate Random Graph Lab row using `solveILP2Plus`, guarded by the same ILP2 safety rule.
4. Do not add “Open in ILP2+” in the first H2 implementation unless a real shared ILP2+ route is added without duplicating ILP2 code.

This is the smallest phase that fixes the visible lab issue, expands the teaching corpus, and integrates ILP2+ truthfully without changing solver semantics.
