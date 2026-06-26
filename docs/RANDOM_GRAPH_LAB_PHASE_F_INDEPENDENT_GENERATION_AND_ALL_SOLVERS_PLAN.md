# Phase F Plan: Independent Random Graph Generation and All Applicable Solvers

Final decision: READY FOR PHASE F IMPLEMENTATION

## 1. Screenshot/UI Defect Audit

Current route: `/methods/random-graph-lab`.

The current preset/family mismatch is local UI state, not a generator issue. `RandomGraphDemoLab` stores `family` and `presetId` separately, but renders every corpus preset in one selector. That means a scale-free preset can be visible while Erdős-Rényi is selected. If the family is changed while `presetId` still points at the previous family, `activePreset` becomes `null`, leaving the selector visually stale while generation follows the selected family and typed form values.

Smallest reliable synchronization rule:

- Filter the preset selector to presets whose `graphFamily` equals the selected family.
- When the family changes, either select the first preset in that family and copy its parameters, or explicitly switch to a local `custom` preset state that preserves the typed values.
- Selecting a preset must atomically set `family`, `presetId`, and form parameters from that preset.
- Generating custom parameters must clear the corpus preset association instead of leaving a stale preset selected.

## 2. Independent D/G Generation

The lab should preserve one shared vertex set and one deterministic topological order, then generate D and G from independent deterministic streams.

Smallest public scenario shape:

```ts
type IndependentRandomGraphScenario =
  | {
      family: 'acyclic-erdos-renyi';
      n: number;
      pD: number;
      pG: number;
      seedOrder: number;
      seedD: number;
      seedG: number;
    }
  | {
      family: 'acyclic-scale-free';
      n: number;
      m: number;
      seedOrder: number;
      seedD: number;
      seedG: number;
    };
```

Use displayed, editable `seedOrder`, `seedD`, and `seedG`. Do not use a hidden master seed. This is more honest for teaching replay: the values shown on screen are the complete deterministic scenario.

Generator evolution:

- Keep `generateAcyclicErdosRenyiGraph(params)` and `generateAcyclicScaleFreeGraph(params)` behavior unchanged for the released benchmark corpus and existing tests.
- Add independent-generation functions, or additive optional independent-seed parameters routed only from the lab. The safer minimal API is explicit new functions, for example `generateIndependentAcyclicErdosRenyiGraph` and `generateIndependentAcyclicScaleFreeGraph`.
- Reuse the existing LCG, topological-order construction, graph result shape, statistics fields, and validation assumptions.
- The new generated graph may include a `seeds` field or parameters containing `seedOrder`, `seedD`, and `seedG`; existing single-seed corpus graph shapes must remain valid.

Expected behavior:

- Same family, parameters, and displayed seeds reproduce the same D and G.
- Changing `seedD` changes only D edges, subject to the shared order and parameters.
- Changing `seedG` changes only G edges, subject to the shared order and parameters.
- Changing `seedOrder` changes the shared topological order and can therefore change both graph projections while preserving shared vertex IDs.

## 3. New Random Scenario

Add a `New random scenario` action that chooses bounded teacher-safe parameters and fresh displayed seeds.

Rules:

- Use browser-safe randomness, preferably `crypto.getRandomValues`, only to choose the next visible scenario values.
- After values are displayed, generation must be purely deterministic from those values.
- No hidden randomness during graph generation or solver execution.
- Keep bounds inside browser teaching limits: `n` in the existing lab range, probabilities in a useful non-degenerate range, and scale-free `m` within `1..min(3, n - 1)`.
- The action should choose a family and mode-aware bounds conservatively, then immediately generate or leave values ready for the teacher to generate, matching the current lab interaction pattern.

## 4. All-Applicable-Solvers Mode

Current safety facts from code and tests:

- Released random benchmark tiers use Small around `n <= 6`, Medium up to `n <= 10`, and Stress/Large around `n = 12..13`.
- Current lab bounds custom graphs at `n <= 13`.
- Current lab gates ILP2 custom runs at `n <= 10`.
- `SUBSET_DP_HARD_MAX_VERTICES` is `15`, but the public lab should use the smaller released Small tier for all-solvers teaching.
- CP2 and CP2+ expose event-cap/proof-completion fields and already run in the current lab.
- ILP2 has no native pre-enumeration guard inside the solver; the UI must keep the existing pre-enumeration safety decision before calling it.

Define one local mode from `n`:

- Small, `n <= 6`: run Legacy, CP1, CP2, CP2+, AlgoBB++, ILP1, ILP2, and Subset DP where acyclicity and local validation pass.
- Medium, `7 <= n <= 10`: run CP2 and CP2+; run ILP2 only when the existing pre-enumeration safety rule allows it. Do not run the heavier educational solvers by default.
- Stress, `11 <= n <= 13`: run CP2 and CP2+ only. ILP2 must display `not-run-preenumeration-risk` when unsafe. Other exact solvers display a truthful not-run status for the public lab size tier.

Preserve max-event semantics. A capped run is capped, not complete. A cancelled run is cancelled, not capped. A skipped ILP2 run is never shown as optimal, proof-complete, or capped.

## 5. Comparison UI

Add a separate solver comparison section below generation and graph inspection.

Rows:

- Legacy
- CP1
- CP2
- CP2+
- AlgoBB++
- ILP1
- ILP2
- Subset DP
- CP3
- CP4

Each row should show:

- method name;
- run status;
- canonical path if available;
- validity result if available;
- proof status when the solver exposes or can truthfully derive it;
- solver-local counters grouped by solver family.

Metric grouping:

- CP-style search metrics: explored states, pruned states, emitted trace events, propagation checks where available.
- ILP-style metrics: enumerated candidates, rejected candidates, accepted feasible candidates, witness counters where available.
- Subset-DP metrics: DP-local state or trace counters only if already available from the result shape.
- Legacy metrics: path enumeration counts only if already exposed.

The UI must state that solver-local counters are not directly interchangeable. A candidate count is not a search-state count, and neither should be used as a runtime ranking.

Exact equality fields should appear only when every relevant, applicable solver in the current mode completed. Do not make equality or superiority claims from incomplete, capped, cancelled, skipped, or not-applicable rows.

## 6. CP3 and CP4 Boundary

CP3 and CP4 remain excluded from acyclic path demonstrations because they are cyclic-trail methods.

Display them in the comparison section as:

`not applicable: cyclic-trail method`

Do not run them, adapt them, wrap them, or create fake results for them.

## 7. Scientific Guardrails

- No runtime rankings.
- No paper reproduction claim.
- No native MILP claim.
- No new research-method claim.
- No comparison claim from incomplete, capped, cancelled, skipped, or not-applicable runs.
- ILP2 skipped for pre-enumeration risk must remain `not-run-preenumeration-risk`.
- Preserve CP2, CP2+, ILP1, ILP2, AlgoBB++, Subset DP, CP1, and legacy solver semantics.

## 8. Accessibility, Mobile, and I18n

- Controls remain keyboard-operable native inputs, selects, and buttons.
- Every numeric input and seed input needs a visible label and local validation message.
- Family, preset, mode, generate, reset, and new-random controls must be reachable in tab order.
- Mobile layout should preserve the existing D/G graph tabs and avoid adding wide tables that overflow; use responsive row cards or a horizontally manageable table with labels.
- Add EN, FR, and AR strings for new labels, statuses, and guardrail notes.
- In Arabic, page text follows RTL, while graph IDs, formulas, seeds, canonical paths, and directed arrows remain LTR with local `dir="ltr"` wrappers.
- No emoji in website UI.

## 9. Minimal File List and Test Plan

Smallest implementation file set:

- `src/domain/randomGraphGenerators.ts`
- `src/domain/randomGraphGenerators.test.ts`
- `src/components/RandomGraphDemoLab.tsx`
- `src/components/RandomGraphDemoLab.test.tsx`
- `src/i18n/translations.ts`

Only touch routing files if implementation discovers an existing route/display reference that must change; the current route is already correct.

Tests:

- Independent generator determinism from full scenario state.
- `seedD` changes D while preserving G for fixed family, parameters, and order seed.
- `seedG` changes G while preserving D for fixed family, parameters, and order seed.
- Existing single-seed generator tests continue to pass unchanged.
- Family-specific preset filtering and family-change synchronization.
- New-random scenario displays all random values and replay is deterministic from those values.
- Family-specific controls and validation feedback.
- Small mode runs all listed applicable acyclic exact solvers where safe.
- Medium mode runs CP2/CP2+ and ILP2 only when safe.
- Stress mode runs CP2/CP2+ and displays ILP2 as `not-run-preenumeration-risk` when unsafe.
- CP3 and CP4 display not-applicable cyclic-trail status.
- Completed/capped/cancelled/not-run statuses are visually distinct and truthful.
- Equality/comparison fields appear only after all relevant applicable runs complete.
- EN, FR, and AR strings render; Arabic keeps graph IDs, seeds, paths, and arrows LTR.
- No runtime assertions and no flaky random tests; mock or inject deterministic values for `New random scenario` tests.

## 10. Ponytail Checkpoint

Must not build:

- backend, API, database, worker, CLI, profiler, charting dependency, solver adapter layer, or new package;
- compatibility routes or redirects;
- CP3/CP4 acyclic adaptations;
- hidden random scenario state;
- runtime ranking dashboard;
- generic benchmark framework;
- MILP/native solver claims.

Must reuse:

- existing random generator helpers and LCG;
- existing graph result shapes and graph types;
- `GraphPanel`, `DirectedGraph`, and `GenomicGraph`;
- current `RandomGraphDemoLab` route and page structure;
- existing solver functions and result fields;
- existing ILP2 pre-enumeration safety behavior;
- current translations pattern.

Over-engineering:

- a solver registry;
- a generalized scenario serialization framework;
- a new chart/table library;
- extracting a reusable random-lab architecture before a second page exists;
- changing benchmark corpus definitions to fit the UI.

