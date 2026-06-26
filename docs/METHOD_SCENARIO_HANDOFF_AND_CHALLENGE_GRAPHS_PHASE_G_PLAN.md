# Method Scenario Handoff and Challenge Graphs Phase G Plan

Final decision: READY FOR PHASE G IMPLEMENTATION

## 1. Current Limitation

Generated graphs remain isolated in `/methods/random-graph-lab` because the lab owns its generated graph in local React state and immediately runs solver summaries inside that page. It does not publish a scenario object to any shared route, URL parameter, or browser storage.

The individual method pages already call the real solver functions with raw `vertices`, `edgesD`, and `edgesG`, but their UI state is tied to local example selection:

- Legacy uses `App.tsx` state plus `src/data/examples.ts`.
- CP1, CP2, AlgoBB++, ILP1, ILP2, and Subset DP each select from `examples`.
- CP2+ selects from `cp2PlusTeachingExamples`, not from `examples`.
- `MethodCockpit` is a layout component only; it does not manage scenario loading.

So the limitation is page-state wiring, not solver capability. The solvers already accept supplied acyclic simple-path graph inputs.

## 2. Scenario Handoff Design

Use the smallest safe transport:

1. First try a URL-safe serialized scenario for small payloads only.
2. If the encoded payload exceeds a conservative limit, store it in `sessionStorage` and navigate with a visible scenario ID.

Recommended constants:

```ts
const HANDOFF_QUERY_KEY = 'scenario';
const HANDOFF_ID_QUERY_KEY = 'scenarioId';
const HANDOFF_STORAGE_PREFIX = 'method-scenario-handoff:';
const MAX_URL_SCENARIO_CHARS = 1800;
```

Scenario shape:

```ts
interface MethodScenarioHandoff {
  version: 1;
  id: string;
  source: 'random-graph-lab' | 'challenge-library';
  label: string;
  family: string;
  parameters: Record<string, number | string>;
  seedOrder?: number;
  seedD?: number;
  seedG?: number;
  maxEvents: number;
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
}
```

Rules:

- Preserve vertices, D edges, G edges, `maxEvents`, family, parameters, `seedOrder`, `seedD`, and `seedG`.
- Do not use backend, database, API, worker, package, or hidden persistence.
- Store only in the URL or current-tab `sessionStorage`.
- Show the scenario ID visibly on the destination page when storage handoff is used.
- If data is missing, expired, malformed, too large, cyclic in D, or references invalid vertices, fall back to the page default example and show a visible non-fatal message.
- Replaying remains deterministic because the scenario contains either the full graph plus seeds/parameters, or a deterministic named challenge graph ID plus variant.

Ponytail choice: do not build a generic import/export framework. One tiny `methodScenarioHandoff.ts` helper is enough.

## 3. Method-Page Integration

Applicable pages that can accept an acyclic simple-path scenario:

- `/legacy`: exhaustive baseline via `solveConsistentPath`.
- `/methods/cp1`: CP1 via `solveCP1`.
- `/methods/cp2`: CP2 via `solveCP2`.
- `/methods/cp2-plus`: CP2+ via `solveCP2Plus`.
- `/methods/algobb-plus-plus`: AlgoBB++ via `solveAlgoBBPlusPlus`.
- `/methods/ilp1`: ILP1 via `solveILP1`.
- `/methods/ilp2`: ILP2 via `solveILP2`.
- `/methods/subset-dp`: Subset DP via `solveSubsetDP`.

Random Graph Lab buttons:

- Open in Legacy
- Open in CP1
- Open in CP2
- Open in CP2+
- Open in AlgoBB++
- Open in ILP1
- Open in ILP2
- Open in Subset DP

Safety limits:

- Small, `n <= 6`: all listed acyclic exact method pages may open and run.
- Medium, `7 <= n <= 10`: CP2 and CP2+ may open and run; ILP2 may open only when the existing pre-enumeration safety rule permits it. Other method buttons should be disabled or route to an unavailable state with: `Not run - exceeds this solver's educational safety limit.`
- Stress, `11 <= n <= 13`: CP2 and CP2+ may open and run. ILP2 must show `not-run-preenumeration-risk`. Small-only methods must show the educational safety-limit status instead of executing.
- CP3 and CP4 remain not applicable because they are cyclic-trail methods. Do not add handoff buttons for them in Phase G.

Destination page behavior:

- Add a supplied-scenario mode next to the existing example selector.
- Keep existing traces, current-step controls, `GraphPanel`, inspectors, formulas, and explanations.
- Reset step index to not-started when loading a handoff scenario.
- Keep route pages responsible for their own solver call, so traces remain real and method-local.

## 4. Challenge Graph Library

Add deterministic named challenge families with small and medium variants only. Each graph must preserve shared vertices, keep D acyclic, keep G undirected, make D and G structurally distinct, be replayable, and avoid runtime-superiority claims.

Families:

1. Layered branching DAG
   - Purpose: show branching search and upper-bound pruning without random noise.
   - Small: 5-6 vertices, two layers plus sink.
   - Medium: 8-10 vertices, three layers.

2. Diamond merge / lexical ties
   - Purpose: show canonical winner tie-break behavior.
   - Small: one diamond with two same-length valid paths.
   - Medium: chained diamonds with equal-length alternatives.

3. Long spine with decoy branches
   - Purpose: show objective length versus tempting local branches.
   - Small: one main chain and two short decoys.
   - Medium: longer spine with several dead-end branches.

4. Fragmented genomic components
   - Purpose: show D paths rejected because induced G is disconnected.
   - Small: chain in D, two separated G components.
   - Medium: multiple D candidates crossing G components.

5. Repairable future genomic bridge
   - Purpose: show why CP2+ cannot prune a currently disconnected prefix if a future vertex can reconnect it.
   - Small: disconnected prefix repaired by one later vertex.
   - Medium: several possible bridge vertices, only one useful.

6. Dense genomic overhead
   - Purpose: show that dense G can reduce connectivity failures but still produces method-local work.
   - Small: sparse D, near-complete G.
   - Medium: branching D, dense G.

7. Community-style genomic structure
   - Purpose: show paths that stay within or cross genomic communities.
   - Small: two communities with one bridge.
   - Medium: three communities with controlled bridges.

8. Anti-correlated D/G structure
   - Purpose: show D adjacency and G proximity pulling in different directions.
   - Small: D chain order opposite or offset from G links.
   - Medium: layered D with G edges mostly inside non-consecutive groups.

Implementation shape:

```ts
type ChallengeGraphFamilyId =
  | 'layered-branching-dag'
  | 'diamond-merge-lexical-ties'
  | 'long-spine-decoys'
  | 'fragmented-genomic-components'
  | 'repairable-future-genomic-bridge'
  | 'dense-genomic-overhead'
  | 'community-genomic-structure'
  | 'anti-correlated-dg';
```

Use explicit hand-authored graphs, not another random generator. That keeps the library deterministic, small, reviewable, and teachable.

## 5. Teacher Presentation Flow

1. Generate an independent D/G random scenario in Random Graph Lab.
2. Use visible `seedOrder`, `seedD`, and `seedG` to explain replay.
3. Open the same scenario in CP2 and CP2+ to inspect their real traces.
4. For a Small graph, open all applicable methods and compare objective, canonical winner, path validity, and proof status only when every compared run completes.
5. Load a named challenge graph, such as `repairable-future-genomic-bridge`, to show a specific structural property.
6. Explain counters as solver-local: CP-style explored states are not ILP candidate counts and neither is a runtime ranking.

## 6. Scientific Guardrails

- Present structural evidence, not runtime ranking.
- No paper reproduction claim.
- No native MILP claim.
- No new-method claim.
- Incomplete, capped, cancelled, skipped, or unavailable runs cannot support exactness or equality claims.
- Independent D/G generation means independent deterministic edge streams, not a guarantee that D and G will look visually dissimilar for every seed.
- CP3 and CP4 remain cyclic-trail methods and out of scope for acyclic simple-path handoff.

## 7. Accessibility and FR/EN/AR

- Handoff buttons must be native buttons or links with visible labels in FR, EN, and AR.
- Destination pages must show a visible scenario banner with source, scenario ID, graph size, and fallback/error state.
- Missing-data fallback must be announced with `role="alert"` or equivalent existing alert pattern.
- Arabic prose remains RTL.
- Scenario IDs, seeds, vertex IDs, paths, formulas, arrows, and numeric parameters remain LTR with local `dir="ltr"` wrappers.
- Keyboard users must be able to generate, select a challenge, open a method, reset to built-in example, and run playback without pointer-only controls.
- Mobile layouts keep graph tabs usable and avoid wide unwrapped tables.
- No mixed-language labels and no emoji in UI.

## 8. Minimal File List

Expected implementation files:

- `src/domain/methodScenarioHandoff.ts`
- `src/domain/challengeGraphLibrary.ts`
- `src/domain/challengeGraphLibrary.test.ts`
- `src/components/RandomGraphDemoLab.tsx`
- `src/components/RandomGraphDemoLab.test.tsx`
- `src/components/CP1Model.tsx`
- `src/components/CP2Model.tsx`
- `src/components/CP2PlusModel.tsx`
- `src/components/AlgoBBPlusPlusModel.tsx`
- `src/components/ILP1Model.tsx`
- `src/components/ILP2Model.tsx`
- `src/components/SubsetDpModel.tsx`
- `src/App.tsx`
- `src/i18n/translations.ts`
- relevant route and method tests

Avoid unless forced:

- no new package;
- no backend/API/database;
- no solver adapter layer;
- no generic scenario framework;
- no CP3/CP4 integration.

## 9. Test Plan

Focused tests:

- Random Graph Lab creates a handoff scenario preserving vertices, D, G, maxEvents, family, parameters, and seeds.
- URL handoff is used only under the size limit.
- Session storage handoff uses a visible scenario ID and survives navigation within the tab.
- Missing/invalid/expired handoff falls back to default example with visible warning.
- Legacy, CP1, CP2, CP2+, AlgoBB++, ILP1, ILP2, and Subset DP load the same supplied Small scenario and render their real trace UI.
- Medium scenario enables CP2 and CP2+, allows ILP2 only when safe, and blocks small-only pages truthfully.
- Stress scenario enables CP2 and CP2+, shows ILP2 as `not-run-preenumeration-risk`, and blocks small-only pages truthfully.
- CP3/CP4 have no handoff action and remain not applicable.
- Each challenge family has small and medium variants, D is acyclic, G is undirected, vertex sets match, and graph output is deterministic.
- Exactness comparison appears only after complete comparable runs.
- FR/EN/AR strings render; Arabic keeps scenario IDs, seeds, paths, and vertex IDs LTR.
- Mobile graph tabs and handoff controls remain keyboard-operable.

Verification:

```powershell
npm test
npm test -- --fileParallelism=false
npm run lint
npx tsc --noEmit
npm run build
git diff --check
git status -sb
```

## 10. Main Risks

- URL payload growth can break navigation or copy/paste reliability; enforce the size cap and fall back to `sessionStorage`.
- `sessionStorage` can be missing after refresh, new tab, or browser privacy cleanup; the visible scenario ID and fallback warning are required.
- Page-specific example state can accidentally hide the supplied scenario; each method page needs one small resolver that chooses handoff scenario or built-in example.
- CP2+ currently uses a separate teaching-example source; it must accept the same supplied scenario shape without losing its trace explanation UI.
- ILP2 and exhaustive methods can become expensive; keep existing safety gates before solver execution.
- Challenge graphs can accidentally imply performance claims; label them by structural teaching purpose only.

## 11. Final Decision

READY FOR PHASE G IMPLEMENTATION
