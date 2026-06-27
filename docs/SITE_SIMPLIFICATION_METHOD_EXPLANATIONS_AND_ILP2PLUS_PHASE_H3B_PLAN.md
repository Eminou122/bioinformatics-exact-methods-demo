# Site Simplification, Method Explanations, and ILP2+ Phase H3B Plan

Read-only UX and architecture audit for the whole website and every method page. This plan creates a standard short educational description block, simplifies site navigation/copy, and designs the future real `/methods/ilp2-plus` route.

- Branch: `feature/site-simplification-method-explanations-ilp2plus-plan`
- Worktree: `C:\Users\Eminou Habiboullah\Projects\bioinformatics-exact-methods-demo-site-simplification-h3b-plan`
- Scope: documentation plan only. No code changes, no package installs, no commit, no push.
- Out of scope: editing or summarizing `docs/SIMPLE_RANDOM_GRAPH_LAB_UX_PHASE_H3A_PLAN.md`.

## 1. Audit scope

Pages and surfaces audited:

- Site shell: `App.tsx`, `Navigation.tsx`, `Header.tsx`, `StartHere.tsx`, `MethodMap.tsx`, `MethodPlaceholders.tsx`.
- Shared method layout: `MethodCockpit.tsx`, `GraphPanel.tsx`, `MethodPlaybackControls.tsx`, scenario handoff banner/hooks.
- Implemented method pages: `/legacy`, `/methods/cp1`, `/methods/cp2`, `/methods/cp2-plus`, `/methods/algobb-plus-plus`, `/methods/ilp1`, `/methods/ilp2`, `/methods/subset-dp`.
- Missing future method page: `/methods/ilp2-plus`.
- Random Lab: `/methods/random-graph-lab`, only for polish and handoff implications.
- Tests: route, cockpit, handoff, Random Lab safety, and method-page tests.
- Solver domains: legacy enumeration, CP1, CP2, CP2+, AlgoBB++, ILP1, ILP2/ILP2+, Subset DP.

## 2. Site-wide simplification findings

The website has enough exact solver functionality; the problem is that explanations are distributed and inconsistent.

- Method pages use different local copy structures. Some have a clear honesty note, others start directly in the cockpit.
- `MethodMap.tsx` mixes implemented exact pages with reference-only placeholders such as CP3, CP4, HNet, enumeration, and conservation. That is useful academically but confusing as primary navigation.
- Top navigation is too crowded for repeated teaching use. It includes many method links plus Random Lab, while Method Map already exists.
- Placeholder pages have short summaries but no standard workflow/output/exactness/limitations block.
- Implemented pages repeat method comparison tables differently. Some compare many solvers, some only explain the page method.
- ILP2+ exists as a solver function and Random Lab row, but no real page/route exists.
- CP2+ has a good comparison lab, but the CP2 vs CP2+ explanation should be repeated in the same standardized form used by other methods.
- ILP pages correctly state they are educational browser implementations, not native MILP engines; this honesty should become a site-wide standard.

Recommendation: add one compact reusable educational description section per method page, then keep page-specific traces/counters below it. Do not build a new abstraction first; duplicate one small block shape until the copy stabilizes.

## 3. Standard method description block

Every method page should start with the same short block:

1. One-sentence purpose.
2. Workflow.
3. Functionality.
4. Output.
5. Exactness.
6. Limitations.

Keep it short, visible above the cockpit, and translated FR/EN/AR. Long derivations stay in details sections or existing traces.

Template:

```text
Purpose: [one sentence]
Workflow: [how it searches or models]
Functionality: [what it proves or checks]
Output: [winner, trace, counters, witness]
Exactness: [when optimality is valid]
Limitations: [bounds, graph class, browser/demo caveat]
```

## 4. Method blocks

### Legacy Enumeration

- Purpose: exhaustive baseline for finding the longest directed D path whose selected vertices induce a connected subgraph in G.
- Workflow: enumerate directed paths in D, test each path against induced-G connectivity, keep the longest canonical winner.
- Functionality: demonstrates the problem definition with step-by-step candidate acceptance/rejection.
- Output: longest D path, longest D/G-consistent path, evaluated candidates, accepted candidates, candidate trace.
- Exactness: exact for valid small DAG examples when enumeration completes without validation error.
- Limitations: educational baseline only; path enumeration grows quickly and is capped by page-level safety when receiving handoff scenarios larger than the small-example limit.

### CP1

- Purpose: constraint-programming style solver for the longest D/G-consistent path in a DAG.
- Workflow: maintain domains for successor choices, propagate graph validity/connectivity constraints, search candidate prefixes.
- Functionality: teaches how local constraints and propagation reduce the exhaustive search surface.
- Output: selected path, domain snapshots, trace events, explored/pruned states, proof-complete status.
- Exactness: exact for small DAG examples when the CP1 search completes and emits an optimal/no-solution status.
- Limitations: bounded browser implementation, not a production CP engine; unsafe for larger random scenarios.

### CP2

- Purpose: CP1-style search with a safe directed upper bound.
- Workflow: search D-path prefixes, compute the longest possible remaining suffix in the DAG, prune a prefix when it cannot beat the current incumbent.
- Functionality: keeps CP1 semantics while avoiding branches that are provably unable to improve the winner.
- Output: best path, upper-bound pruning trace, explored states, pruned states, proof-complete/cap/cancel flags.
- Exactness: exact when the search completes with `proofCompleteEmitted` and no cap/cancel interruption.
- Limitations: still bounded browser search; the upper bound only reasons about directed reachability and incumbent comparison, not all future genomic structure.

### CP2+

- Purpose: CP2 plus safe genomic propagation.
- Workflow: run CP2's directed upper-bound search, then inspect whether currently selected genomic components can still reconnect using vertices forward-reachable in D.
- Functionality: prunes a prefix only when no future directed continuation can reconnect the selected vertices in G.
- Output: same CP2 winner fields plus genomic propagation checks, genomic propagation prunes, forward-reachable vertices, selected G-components.
- Exactness: exact under the same completion rule as CP2; CP2+ must return the same optimal winner as CP2 on completed runs.
- Limitations: can be neutral or slightly more expensive on dense/easy G cases because the extra propagation check may not prune.

Exact CP2+ vs CP2 explanation:

CP2 prunes by a safe directed upper bound: if the current D-prefix plus the longest possible D suffix cannot beat the incumbent, the branch is impossible to improve. CP2+ keeps that CP2 rule and adds one genomic rule: it looks at the selected vertices' connected components in G and the vertices still reachable forward in D. If those future reachable vertices cannot reconnect the selected G-components, CP2+ safely prunes the prefix. CP2+ does not change the objective, tie-break rule, or legal path definition; it only rejects prefixes that CP2 would still explore.

### AlgoBB++

- Purpose: bounded branch-and-bound search over D paths with G-connectivity validation.
- Workflow: expand candidate paths arc by arc, use incumbent bounds and future connectivity checks to prune, validate candidate paths against G.
- Functionality: demonstrates a branch-and-bound alternative to CP and ILP-style pages.
- Output: incumbent path, explored/pruned states, bound reasons, event trace, completion/cap/cancel status.
- Exactness: exact for small examples when branch-and-bound completes and emits proof-complete/optimal status.
- Limitations: educational TypeScript implementation, not the full published solver stack; bounded for browser safety.

### ILP1

- Purpose: educational integer-linear-programming formulation using binary decisions and a genomic connectivity witness.
- Workflow: enumerate candidate D paths, derive binary `x`, `y`, and `z` decisions, validate path and witness constraints.
- Functionality: shows how path selection and induced-G connectivity can be represented as binary variables and linear-style constraints.
- Output: selected variables, witness edges, candidate trace, explored/rejected candidates, best path, proof flags.
- Exactness: exact for small DAG examples when the bounded browser search completes.
- Limitations: no CPLEX, Gurobi, GLPK, OR-Tools, or native MILP engine is used; path enumeration makes larger graphs unsafe.

### ILP2

- Purpose: educational ILP-style rooted-level connectivity formulation.
- Workflow: enumerate complete directed paths in D, sort candidates canonically, derive `x`, `y`, root `r`, parent-link `p`, and level decisions, then validate rooted G-connectivity constraints.
- Functionality: demonstrates a root/parent/level witness for connected induced subgraphs in G.
- Output: selected path, root, parent links, levels, candidate decisions, counters, trace, proof flags.
- Exactness: exact for small DAG examples when all candidates are evaluated and proof-complete is emitted.
- Limitations: full path enumeration happens before the cap can protect candidate-list creation; therefore ILP2 must be blocked on larger/stress graphs.

### ILP2+

- Purpose: ILP2 with canonical early termination after the first feasible winner.
- Workflow: fully enumerate and canonically sort all D paths exactly as ILP2 does, evaluate candidates in that order, and stop after the first feasible candidate because no later candidate can outrank it.
- Functionality: preserves ILP2's objective and witness model while skipping later candidate evaluation after the canonical winner is found.
- Output: same ILP2 witness and trace fields plus `earlyTermination` and `candidatesSkippedAfterWinner`.
- Exactness: exact when proof-complete is emitted; the first feasible canonical candidate is a proven winner because the sorted order encodes objective and tie-break priority.
- Limitations: does not skip path enumeration or sorting; it is unsafe for the same large/stress cases as ILP2.

Exact ILP2+ vs ILP2 explanation:

"ILP2+ fully enumerates and canonically sorts paths first. It may skip later candidate evaluation after the first feasible canonical winner. It does not skip path enumeration."

Expanded explanation: ILP2 evaluates every canonical candidate path and records all feasible/rejected candidates. ILP2+ uses the same candidate list, same sorting comparator, same rooted-level witness, and same feasibility rules. Its only optimization is after the first feasible candidate is found: because later candidates cannot outrank that candidate under the canonical comparator, ILP2+ stops evaluating later candidates. This can reduce candidate evaluation, but it does not make large pre-enumeration safe.

### Subset DP

- Purpose: exact dynamic programming over selected vertex subsets and endpoint.
- Workflow: represent each retained state by a subset mask and last vertex, extend along D arcs, reject disconnected induced-G subsets, and keep the canonical best path per state.
- Functionality: teaches exact subset-state search and dominance over duplicate states.
- Output: retained states, discarded dominated states, transition trace, counters, best path, proof/cap/cancel flags.
- Exactness: exact only when the DP finishes within its small-graph vertex and event limits.
- Limitations: exponential subset state space; hard small-graph limit is intentional and should stay visible.

## 5. Future `/methods/ilp2-plus` route design

Build a real page, not a placeholder.

Route and registry:

- Add `ILP2PlusModel` component.
- Add route branch in `App.tsx`: `/methods/ilp2-plus`.
- Add Method Map entry next to ILP2 in all languages.
- Add Navigation label only if the navbar remains method-link-heavy; otherwise prefer Method Map access to reduce nav clutter.
- Add Random Lab handoff action "Open in ILP2+" only after the route exists and only when `canRunILP2` would allow ILP2.

Component design:

- Reuse `ILP2Model` page structure as the base.
- Call `solveILP2Plus`, not `solveILP2`.
- Reuse graph visualization, MethodCockpit, scenario handoff, playback controls, and rooted-level witness inspector.
- Add a top method block using the ILP2+ text above.
- Show counters: `enumeratedCandidates`, `acceptedFeasibleCandidates`, `candidateEvaluationEvents`, `earlyTermination`, `candidatesSkippedAfterWinner`, `witnessParentLinksAssigned`, `witnessLevelsAssigned`.
- Show proof message for early termination and the exact ILP2+ sentence.
- Do not claim runtime superiority, native MILP solving, or paper benchmark reproduction.

Tests:

- Routing renders `/methods/ilp2-plus`.
- Method Map links to `/methods/ilp2-plus`.
- Scenario handoff works from Random Lab to ILP2+ for safe small/medium scenarios.
- Stress/Large scenarios keep ILP2+ disabled as `not-run-preenumeration-risk`.
- ILP2 and ILP2+ complete runs return the same winner.
- ILP2+ page includes the exact "does not skip path enumeration" sentence.

## 6. Site-wide simplification plan

- Keep top nav short: Start, Method Map, Random Graphs, Legacy. Let Method Map own individual solver links. If a full nav is kept, hide lower-priority method links behind a simple menu.
- Split Method Map into two groups: "Runnable demos" and "Reference-only paper methods". CP3, CP4, HNet, enumeration concept, and conservation should not look equivalent to implemented exact pages.
- Add the standard method block to every runnable page.
- Move long comparison tables below the cockpit in details sections.
- Keep one honesty sentence on ILP pages: educational browser implementation, not native MILP.
- Normalize exactness labels: complete/proof-complete, capped, cancelled, not-run safety limit, not-run pre-enumeration risk.
- Do not introduce a site-wide method metadata framework in H3B. A small local helper or repeated block is cheaper until copy stabilizes.

## 7. Random Lab polish only

Small H3B touch only, not a Random Lab redesign:

- Ensure Random Lab's ILP2+ row links conceptually to the future `/methods/ilp2-plus` page once it exists.
- Keep the exact ILP2+ sentence unchanged.
- Keep method handoff buttons truthful: ILP2+ appears only when the real route exists and safety allows it.
- Do not move Random Lab controls, change generators, or implement Huge work in H3B.

## 8. Phased implementation

### H3B.1 — Standard method block copy

Files:

- `src/components/CP1Model.tsx`
- `src/components/CP2Model.tsx`
- `src/components/CP2PlusModel.tsx`
- `src/components/AlgoBBPlusPlusModel.tsx`
- `src/components/ILP1Model.tsx`
- `src/components/ILP2Model.tsx`
- `src/components/SubsetDpModel.tsx`
- `src/App.tsx` legacy section, or a small `LegacyModel` extraction only if it reduces code

Work:

- Add the standard short method block to each runnable page.
- Preserve existing trace/cockpit behavior.
- Keep FR/EN/AR labels.

### H3B.2 — Method Map and placeholder simplification

Files:

- `src/components/MethodMap.tsx`
- `src/components/MethodPlaceholders.tsx`
- `src/components/RoutingUI.test.tsx`

Work:

- Separate runnable demos from reference-only methods.
- Give placeholders the same block shape, but clearly mark "reference-only".
- Keep `/legacy` as the executable Legacy Enumeration page.

### H3B.3 — CP2+ explanation cleanup

Files:

- `src/components/CP2PlusModel.tsx`
- `src/components/CP2PlusComparisonLab.tsx`
- `src/domain/cp2PlusSolver.ts` only if labels/counter names need exported descriptions
- tests for CP2+ copy and exactness

Work:

- Add the exact CP2+ vs CP2 explanation.
- Keep comparison lab corpus-specific and non-runtime.
- Preserve CP2/CP2+ equality claims only on completed runs.

### H3B.4 — ILP2+ route

Files:

- `src/components/ILP2PlusModel.tsx`
- `src/App.tsx`
- `src/components/MethodMap.tsx`
- `src/components/Navigation.tsx` only if top nav keeps individual solver links
- `src/components/RoutingUI.test.tsx`
- `src/domain/ilp2Solver.test.ts`

Work:

- Implement `/methods/ilp2-plus`.
- Reuse ILP2 layout and `solveILP2Plus`.
- Add exact ILP2+ explanation and counters.
- Test route, Method Map, winner equality, and exact wording.

### H3B.5 — Scenario handoff integration

Files:

- `src/components/RandomGraphDemoLab.tsx`
- `src/components/RandomGraphDemoLab.test.tsx`
- `src/domain/methodScenarioHandoff.test.ts`

Work:

- Add "Open in ILP2+" from Random Lab only after H3B.4.
- Gate it with the same ILP2 safety rule.
- Preserve URL/session storage handoff and visible scenario ID.

### H3B.6 — Final site audit and regression pass

Files:

- route/method tests only unless bugs are found
- optional docs update for final checklist

Work:

- Verify FR/EN/AR copy.
- Verify RTL prose and LTR seeds/paths/counters.
- Verify all method routes render.
- Verify no method page claims optimality after cap/cancel/not-run.
- Verify no ILP page claims native MILP engine use.
- Verify top-level navigation is shorter or Method Map grouping is clear.

## 9. Main risks

- Copy drift: local labels across many pages can diverge. Mitigation: standard block shape and tests for key exact sentences.
- Over-building metadata: a full method registry abstraction is tempting but not needed for H3B.
- ILP2+ overclaiming: must never say it skips enumeration or makes Huge safe.
- CP2+ overclaiming: must say "can reduce search", not "always faster".
- Route clutter: adding ILP2+ to top nav may worsen the existing navigation density.
- Handoff safety regression: Random Lab must not open ILP2+ for stress cases.
- Translation gaps: adding EN-only method blocks would regress FR/AR.

## 10. Final decision

Proceed with H3B as a site simplification and method-explanation phase, not a solver phase. Add a consistent short educational block to every method page, separate runnable demos from reference placeholders, implement a real ILP2+ page in its own subphase, and keep Random Lab changes limited to truthful ILP2+ handoff polish after the route exists.

Skipped: H3A document, Random Lab redesign, generator changes, package installs, commits, pushes, merges, deployment.
