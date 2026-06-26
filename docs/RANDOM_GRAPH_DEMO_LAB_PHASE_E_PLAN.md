# Random Graph Demo Lab Phase E Plan

## 1. Exact Public-Demo Scope

Build one dedicated public route: `/methods/random-graph-lab`.

The page lets a teacher generate deterministic seeded acyclic random `(D,G)` graphs and run the already released educational solvers on the generated graph.

Families:

- Acyclic Erdos-Renyi: `n`, `pD`, `pG`, `seed`.
- Acyclic scale-free-style: `n`, `m`, `seed`.

Controls:

- Family selector.
- Family-specific numeric inputs.
- Deterministic preset buttons.
- Generate action.
- Reset action.

The page must state locally that the same family, parameters, and seed produce the same graph. It must not claim paper-distribution reproduction.

Presets should come from the released generated corpus in `CP2_RANDOM_BENCHMARK_CORPUS` where useful, especially Tier S and M. Tier L presets may be shown only if the UI makes ILP2 pre-enumeration risk explicit.

## 2. Teacher Demonstration Flow

Live flow:

1. Select acyclic Erdos-Renyi or acyclic scale-free-style.
2. Choose a released-corpus preset or enter parameters.
3. Generate the graph.
4. Inspect `D` and `G` with the existing graph panel.
5. Run CP2 and CP2+ on the generated graph.
6. Run ILP2 only when the selected scenario is safe under the existing pre-enumeration rule.
7. Compare canonical path, path validity, solver status, proof-complete status, and local counters.
8. Explain that CP2/CP2+ explored-state counters and ILP2 enumerated-candidate counters describe different search objects and must not be treated as interchangeable.

## 3. Safety Boundaries

Reuse the ILP2 benchmark safety rule from `runILP2RandomBenchmarkCase`: released Tier L random-graph cases are `not-run-preenumeration-risk`.

Smallest honest UI behavior:

- CP2 and CP2+ may run for all UI-bounded generated graphs under `maxEvents`.
- ILP2 runs only for Tier S/M released presets and custom graphs under the same browser teaching bounds used by the page.
- If the selected graph is unsafe for ILP2, show ILP2 as `not-run-preenumeration-risk` with zero ILP2 counters and no equality fields.

Never show skipped ILP2 as capped, optimal, incomplete, or proof-complete. Capped means a solver started and hit `maxEvents`; not-run-preenumeration-risk means ILP2 was deliberately not invoked.

Preserve max-event semantics:

- CP2 uses `solveCP2(..., { maxEvents })`.
- CP2+ uses `solveCP2Plus(..., { maxEvents })`.
- ILP2 uses `solveILP2(..., { maxEvents })` only after the safety gate passes.
- Equality fields are populated only when all relevant solvers complete and emit proof completion.

Input validation:

- Use local form validation before calling generators.
- Show clear local feedback for invalid `n`, `pD`, `pG`, `m`, and `seed`.
- Keep browser teaching bounds small. Start with `n <= 10` for custom ILP2-eligible graphs and allow larger released Tier L display only with ILP2 skipped.

## 4. UI Architecture

One new page component is sufficient: `RandomGraphDemoLab.tsx`.

Reuse:

- `GraphPanel` for generated `D` and `G`.
- `MethodCockpit` for the familiar cockpit layout.
- `MethodPlaybackControls` only if the page exposes a trace-focused selected solver view; otherwise use plain buttons for Generate, Reset, and Run All.
- `Navigation.Link`, `useNavigation`, and existing route switch conventions in `App.tsx`.
- `MethodMap` card pattern for the new route.
- Existing page-local `labels` object pattern from `CP2PlusModel.tsx` and `CP2PlusComparisonLab.tsx` for FR/EN/AR text.

`GraphPanel` can render generated graph data without refactoring if the page supplies deterministic `nodePositions`. Use a tiny local layout helper in the page: topological order left-to-right with alternating rows. No graph-rendering component changes are needed.

A dedicated local result card is enough. Do not create shared solver result cards or a solver adapter layer.

## 5. Data Flow

Generated graph object:

- The exact return object from `generateAcyclicErdosRenyiGraph` or `generateAcyclicScaleFreeGraph`.
- Use `vertices`, `edgesD`, `edgesG`, `statistics`, `topologicalOrder`, `family`, `parameters`, and `seed` directly.

Selected run configuration:

- `family`.
- Parameter object.
- `maxEvents`.
- Preset id when selected.
- Derived safety tier when the selected preset comes from `CP2_RANDOM_BENCHMARK_CORPUS`.

Solver results:

- CP2 result from `solveCP2`.
- CP2+ result from `solveCP2Plus`.
- ILP2 result from `solveILP2`, or a local display-only `not-run-preenumeration-risk` state.

Serializable shareable scenario state:

- Feasible without dependencies by encoding family and parameters in `URLSearchParams`.
- Keep it optional for Phase E: read initial state from query string if present, update it on Generate using `window.history.replaceState`.
- Do not add a routing/query abstraction.

Deterministic presets:

- Reuse `CP2_RANDOM_BENCHMARK_CORPUS` entries as presets.
- Label them by `caseId`, family, tier, and parameters.
- Prefer Tier S/M for live solver runs.

## 6. Presentation Rules

Visibly distinguish:

- CP2 explored-state metrics: `exploredStates`, `prunedStates`, trace length, proof flags.
- CP2+ explored-state metrics: `counters.statesExplored`, `directedBoundPrunes`, `genomicPropagationChecks`, `genomicPropagationPrunes`, events emitted.
- ILP2 candidate metrics: `exploredCandidates`, `enumeratedCandidates`, disconnected genomic rejects, witness rejects, accepted feasible candidates.

Statuses:

- `completed`: solver completed and proof-complete event was emitted.
- `capped`: solver ran and hit `maxEvents` before proof completion.
- `cancelled`: solver ran and cancellation was requested.
- `not-run-preenumeration-risk`: ILP2 was skipped before execution.

Exact equality fields:

- Show objective equality, winner equality, validity equality, and proof-complete equality only when all relevant solvers complete.
- Otherwise render equality as not available, not false.

## 7. Accessibility And Responsive Requirements

Controls must be keyboard-operable native form controls and buttons.

Every input needs:

- A visible label.
- A validation message location.
- `aria-invalid` when invalid.

Mobile:

- Stack form, graph, and result panels.
- Keep the existing D/G mobile tab pattern.
- Avoid horizontal overflow in metrics and paths.

Arabic:

- Page text follows RTL.
- Graph workspaces stay `dir="ltr"`.
- Graph IDs, formulas, counters, paths, and directed arrows remain LTR using `dir="ltr"` and `unicode-bidi: isolate`.

No emoji in the website UI.

## 8. Test Plan

Add the smallest UI tests around the new route:

- Deterministic graph generation from UI state: same family, parameters, and seed produce the same rendered summary/path inputs.
- Family-specific controls: Erdos-Renyi shows `n`, `pD`, `pG`, `seed`; scale-free-style shows `n`, `m`, `seed`.
- Input validation: invalid numbers block generation and show local messages.
- Solver-run truthfulness: CP2/CP2+/ILP2 status, proof-complete, capped, cancelled, and not-run labels match result flags.
- ILP2 safe/not-run behavior: Tier L preset skips ILP2 as `not-run-preenumeration-risk` and does not show optimal/capped/proof-complete.
- Route and navigation coverage: route renders, navbar link works, Method Map card links to the lab.
- FR/EN/AR labels render; Arabic shell is RTL while graph containers and path text remain LTR.
- No runtime assertions in production UI.
- No flaky random tests: use fixed seeds and corpus presets only.

Existing generator and benchmark tests already cover deterministic generation, acyclicity, serialization, corpus metadata, ILP2 skip behavior, and forbidden scientific claims. Do not duplicate them in broad UI tests.

## 9. Minimal File List

Proposed implementation files:

- `src/components/RandomGraphDemoLab.tsx`
- `src/components/RandomGraphDemoLab.test.tsx`
- `src/App.tsx`
- `src/components/Navigation.tsx`
- `src/components/MethodMap.tsx`

Avoid changing `src/i18n/translations.ts` unless a shared translation key is actually needed. Existing method pages keep page-specific labels locally.

## 10. Ponytail Checkpoint

Must not be built:

- Packages.
- Backend, API, database, worker, CLI, profiler, deployment changes.
- Native MILP.
- Solver adapter layer.
- Generic charting or benchmark framework.
- New graph generator semantics.
- New benchmark corpus definitions.
- Solver semantic changes.
- CP2+, ILP2, or random-generator rewrites.

Existing components/utilities to reuse:

- `generateAcyclicErdosRenyiGraph`.
- `generateAcyclicScaleFreeGraph`.
- `CP2_RANDOM_BENCHMARK_CORPUS`.
- `solveCP2`.
- `solveCP2Plus`.
- `solveILP2`.
- `isInducedGConnected` only for local path-valid display if needed.
- `GraphPanel`.
- `MethodCockpit`.
- Navigation and Method Map route patterns.
- Existing FR/EN/AR page-local label pattern.

Over-engineering would be:

- A solver adapter interface.
- Shared result-card framework.
- Charting package.
- Query-state library.
- Workerized solver execution.
- Runtime benchmark dashboard.
- New corpus builder.
- New graph visualization layer.

## 11. Final Decision

READY FOR PHASE E IMPLEMENTATION
