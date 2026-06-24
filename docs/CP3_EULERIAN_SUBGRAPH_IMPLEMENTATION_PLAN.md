# CP3 Eulerian Subgraph Implementation Plan

## 1. Scope And Evidence Review

This note prepares CP3 as a future educational bounded method. It does not implement CP3, does not add routes, and does not claim to reproduce a paper formulation beyond what the repository currently supports.

### Repository facts

- `README.md` defines the implemented demo problem as a `(D,G)`-consistent path problem: `D` is a directed acyclic graph, `G` is an undirected graph on the same vertices, and a directed path is feasible when its selected vertices induce a connected subgraph in `G`.
- `README.md`, `src/i18n/translations.ts`, `src/domain/pathAlgorithms.ts`, `src/domain/cpSolver.ts`, `src/domain/cp2Solver.ts`, `src/domain/algoBBPlusPlus.ts`, `src/domain/ilp1Solver.ts`, and `src/domain/ilp2Solver.ts` all align with a bounded small-DAG educational contract and reject cycles in `D`.
- `src/domain/pathAlgorithms.ts` defines deterministic winner selection through `comparePaths`: maximize vertex count, then choose the lexicographically smallest reaction sequence.
- `src/domain/pathAlgorithms.ts` checks genomic feasibility with `isInducedGConnected(path, edgesG)`, where singleton paths are connected and unselected vertices do not contribute to connectivity.
- Existing solver tests compare CP1, CP2, AlgoBB++, ILP1, and ILP2 against the legacy exhaustive solver on DAG cases and assert proof-complete, capped, and cancellation behavior.
- `src/components/StartHere.tsx` defines the educational distinction between walk, trail, and path: a path repeats no vertices, a trail repeats no edges/arcs, and a walk may repeat.
- `src/components/MethodMap.tsx` and `src/components/MethodPlaceholders.tsx` contain CP3 placeholder text in French, English, and Arabic. The English placeholder says CP3 handles trails in cyclic graphs by constructing an Eulerian subgraph in an augmented graph, then extracting a trail. The method map marks CP3 as a paper-reference method, not as an exact implemented small-graph method.
- The method map references a 2025 source named "Constraint programming approaches for finding conserved metabolic and genomic patterns" and a 2022 source named "Improved approaches to solve the One-To-One SkewGraM problem", but the repository does not include the paper text or a formal CP3 model.
- CP4 placeholder text says CP4 is CP3 plus a Walk-and-Cover branching strategy. This implies CP3 and CP4 are related, but the repository does not include enough evidence to define CP4 or to back-port CP4 details into CP3.

### Missing evidence

- No local file defines CP3 variables, constraints, objective, proof obligations, or pseudocode.
- No local file defines the exact augmented graph, artificial closing arc, balance constraints, or extraction rule for CP3.
- No local file explains whether CP3 optimizes selected vertices, selected arcs, trail length, covered reactions, or another objective.
- No local file states whether repeated reaction vertices are allowed for CP3 trails, how often, or whether vertex coverage rather than visit count is optimized.
- No local file states how CP3 preserves One-To-One SkewGraM semantics when `D` contains directed cycles.
- No local file specifies whether genomic connectivity should apply to the set of distinct selected vertices, the visit sequence, or an extracted trail's vertex support.
- No local deterministic cyclic corpus exists for CP3.

## 2. Exact CP3 Objective

Fact: the current implemented application solves the longest simple directed path in a DAG, with genomic induced connectivity and longest-then-lexicographic tie-breaking.

Fact: the local CP3 placeholders say CP3 handles trails in cyclic graphs by constructing an Eulerian subgraph in an augmented graph and extracting a trail.

Inference: CP3 is not intended to be a simple-path-only formulation if it truly supports directed cycles. It is most likely intended to solve a directed trail or a path/trail represented through an Eulerian construction. However, the repository does not provide enough evidence to state the exact CP3 paper objective as fact.

Open question: does CP3 optimize the number of distinct selected reaction vertices, the number of selected arcs in a trail, or a paper-specific conserved-pattern score?

Until the paper formulation is available, CP3 should be described as a candidate educational method for finding a bounded `(D,G)`-consistent directed trail in cyclic `D`, represented through an Eulerian-style augmented subgraph. It should not be described as a reproduced CP3 formulation.

## 3. Mathematical Formulation Candidates

The following formulations are candidates for future design analysis only. They are not confirmed paper CP3.

### Candidate 1: Direct Directed-Trail Enumeration With Connectivity Filter

Object: a directed trail `T = (v_0, a_1, v_1, ..., a_k, v_k)` in `D`, where no directed arc appears more than once. Vertices may repeat unless the final contract restricts them.

Variables:

- `x_v in {0,1}` for each `v in V(D)`: vertex `v` is visited at least once.
- `y_a in {0,1}` for each directed arc `a = (u,v) in A(D)`: arc `a` is used by the trail.
- Optional start variables `s_v in {0,1}` and end variables `t_v in {0,1}`.
- Optional position variables `p_{i,a}` for bounded educational enumeration, where `i` is a step index and arc `a` is used at position `i`.

Degree and flow-balance constraints:

- For every `v`, `out_y(v) - in_y(v) = s_v - t_v`.
- `sum_v s_v = 1`, `sum_v t_v = 1`.
- If closed trails are allowed, start and end may be the same and all balances become zero, but this would diverge from path-like semantics unless explicitly justified.
- `x_v >= y_{(v,u)}` and `x_v >= y_{(u,v)}` for incident selected arcs.
- Singleton case: allow exactly one `x_v = 1` with no selected arcs.

Connectivity in `D`:

- Balance constraints alone are insufficient. Add a directed reachability witness from the selected start to every selected arc/vertex in the selected support, or use bounded trail-position variables that force a single sequential trail.
- With position variables, each selected arc appears in exactly one position and consecutive positions must match head-to-tail.

Genomic connectivity in `G`:

- Apply the existing semantics to distinct selected vertices: the subgraph of `G` induced by `{v | x_v = 1}` must be connected.
- Educational witness options: reuse ILP1-style selected `z` edges forming an undirected tree on selected vertices, or ILP2-style root plus parent links and levels.

Prevention of disconnected selected components:

- Position variables prevent disconnected directed trail components because the output is a single sequence.
- If only `y` and balance constraints are used, disconnected directed cycles can satisfy balance and must be excluded by reachability/subtour-elimination constraints.

Repeated vertices/arcs:

- Repeated arcs are forbidden by `y_a in {0,1}`.
- Repeated vertices are allowed if the final object is a trail, but the objective must count distinct vertices or visits explicitly.

Relationship to original One-To-One path objective:

- Directly comparable only on DAG/simple-path instances if vertex repetition is disallowed or cannot occur.
- On cyclic instances, it changes the object from simple path to trail, so differential comparison to Legacy is not semantically valid except on acyclic cases.

Tie-breaking:

- If optimizing distinct selected vertices, first maximize `sum_v x_v`.
- If tied, select the lexicographically smallest extracted trail sequence.
- If multiple trails have the same selected support, the extraction order must be deterministic and part of the contract.

### Candidate 2: Augmented Eulerian Subgraph With Artificial Closing Arc

Object: an open directed trail from `r` to `q` represented as a closed Eulerian subgraph after adding an artificial closing arc `(q,r)`.

Variables:

- `x_v in {0,1}` for selected vertices.
- `y_a in {0,1}` for original directed arcs in `A(D)`.
- `c_{q,r} in {0,1}` for one artificial closing arc from chosen end `q` to chosen start `r`, or `c_{u,v}` over candidate ordered pairs with exactly one selected.
- `s_v in {0,1}` and `t_v in {0,1}` for start and end.
- Optional genomic witness variables `z_e`, `root_v`, `parent_{u,v}`, and `level_v`.

Degree and flow-balance constraints:

- In the augmented graph, for every selected vertex `v`, `in_y(v) + in_c(v) = out_y(v) + out_c(v)`.
- Exactly one artificial closing arc is selected for non-singleton open trails.
- The artificial arc enters the start and leaves the end under the chosen convention: if the real trail is `s -> ... -> t`, add `(t,s)`.
- On original arcs alone, `out_y(s) = in_y(s) + 1`, `in_y(t) = out_y(t) + 1`, and all other selected vertices are balanced.

Connectivity in `D`:

- Require the selected augmented support to be weakly connected or rooted-reachable from `s`.
- Stronger: require every selected original arc to lie on one Euler tour after adding the closing arc. Euler balance plus weak connectivity over selected nonzero-degree vertices is the standard graph-theoretic condition for an Eulerian directed multigraph when each selected edge belongs to one connected support, but this must be verified against the paper's intended model.

Genomic connectivity in `G`:

- Same selected distinct vertex support `{v | x_v = 1}` must induce a connected `G` subgraph, likely via an ILP1/ILP2 witness in an educational bounded implementation.

Prevention of disconnected selected components:

- Balance constraints do not prevent disconnected cycles. Add a rooted connectivity witness over selected arcs or vertices in the augmented directed support.
- Also reject selected vertices with no original selected incident arc except singleton cases.

Repeated vertices/arcs:

- Original arcs appear at most once if `y_a` is binary.
- Vertices may repeat in the extracted Euler tour/trail.
- If the paper uses a multigraph, binary `y_a` may be wrong; the repository has no evidence on multiplicity.

Relationship to original One-To-One path objective:

- For DAGs, the selected balanced-plus-closing construction can represent a simple directed path if disconnected cycles are excluded and repeated vertices are disallowed by acyclicity.
- For cyclic graphs, a selected Eulerian support can correspond to a valid directed trail, but not necessarily to a simple path.

Tie-breaking:

- Primary objective must be explicitly chosen: maximize distinct selected vertices, original selected arcs, or extracted trail length.
- Deterministic extraction from an Eulerian subgraph must be fixed, for example Hierholzer with sorted outgoing arcs and sorted start/end choices, then compare complete sequences lexicographically.
- If objective is distinct vertices, two different Eulerian supports may cover the same vertices but produce different trail lengths. The plan must decide whether that is acceptable.

### Candidate 3: Path Represented Through Eulerian Construction But Vertex-Simple

Object: a simple directed path in possibly cyclic `D`, using Eulerian augmentation only as a modeling trick.

Variables:

- `x_v in {0,1}` for selected vertices.
- `y_a in {0,1}` for selected original arcs.
- `s_v`, `t_v`, and one artificial closing arc variable as in Candidate 2.
- Optional order variables `ord_v` to prevent repeated vertices and subtours.

Degree and flow-balance constraints:

- Same open-path balances on original arcs and Eulerian balances after adding the artificial closing arc.
- For every `v`, `in_y(v) <= 1` and `out_y(v) <= 1`.
- If `x_v = 1`, then selected incident degree must match singleton/start/end/internal role.

Connectivity in `D`:

- Add order constraints or rooted connectivity constraints to prevent disconnected cycles and branches.

Genomic connectivity in `G`:

- Same induced connectivity on selected vertices.

Prevention of disconnected selected components:

- Degree constraints remove branching but do not alone remove disconnected cycles; connectivity/order constraints are still required.

Repeated vertices/arcs:

- Repeated vertices and repeated arcs are forbidden.

Relationship to original One-To-One path objective:

- This is directly comparable with Legacy even on cyclic `D`, because it still solves a simple-path object.
- However, it conflicts with local CP3 placeholder wording that says "trail" rather than "path".

Tie-breaking:

- Preserve existing `comparePaths`: maximize vertex count, then lexicographically smallest vertex sequence.

## 4. Soundness Risks

- An Eulerian selected subgraph can satisfy degree balance while not corresponding to one intended valid path or trail.
- Disconnected directed cycles can satisfy Eulerian balance and inflate the objective unless a connectivity witness excludes them.
- Branching selected supports can have an Euler tour but may not represent the biological or One-To-One path object currently taught by the app.
- Multiple Euler tours may exist for the same selected subgraph; without deterministic extraction, tie-breaking is unstable.
- A trail may revisit a reaction vertex, while current Legacy/CP1/CP2/AlgoBB++/ILP1/ILP2 semantics use simple paths with no repeated vertices.
- Counting selected vertices can diverge from counting trail visits or selected arcs.
- Genomic support can be disconnected even when the directed support is Eulerian; `G` connectivity must remain an independent constraint.
- Event caps can create a false "optimal" status unless proof completion is emitted only after all candidates/branches have been exhausted.
- Cancellation must return `incomplete`, retain the incumbent, and avoid proof-complete traces.
- Direct differential comparison to Legacy is valid only on acyclic simple-path cases unless the CP3 object is restricted to simple paths.
- The local placeholder may be an imprecise summary of a paper method; implementing from it alone risks overstating paper reproduction.

## 5. Recommended CP3 Bounded Contract

Decision basis: local evidence supports only the high-level idea "trail in cyclic graphs via Eulerian subgraph", not the formal paper model. Therefore the safest future educational contract is intentionally bounded and explicitly non-paper-reproductive.

Recommended contract:

- CP3 solves a bounded educational directed-trail problem in cyclic `D`, represented by a candidate Eulerian augmented-subgraph construction with an artificial closing arc.
- The exact solved object is: find one directed trail using original arcs of `D` at most once, with selected distinct vertices inducing a connected subgraph in `G`.
- The recommended primary objective is to maximize the number of distinct selected vertices, because that is closest to the existing Legacy objective. The secondary tie-breaker is the lexicographically smallest extracted trail sequence under a deterministic extraction rule.
- The implementation remains directly comparable with Legacy only on DAG/simple-path instances. On cyclic instances, CP3 must be reported as solving a related but different trail-support problem.
- The deterministic corpus must add cyclic examples and must label them as CP3-only rather than Legacy-equivalent.
- Supported graph classes: small directed graphs with cycles, no duplicate original arcs, no malformed vertices, and bounded enough for browser educational enumeration.
- Explicitly out of scope until paper evidence is available: multiarc Eulerian formulations, weighted biological scoring, large-scale CP/MILP solving, CP4 Walk-and-Cover behavior, and claims of exact paper reproduction.
- Self-loops should be rejected initially unless the paper explicitly allows them. A self-loop is a trail arc but creates ambiguous educational value for vertex coverage and Eulerian balance.
- Proof-complete behavior: return `optimal` or `no-solution` only after all bounded candidates have been exhausted and a final `proof-complete` trace has been recorded.
- Capped behavior: if the event cap is reached before proof completion, return `incomplete`, preserve the incumbent, mark cap reached, and do not emit proof-complete.
- Cancelled behavior: if cancellation is signaled before proof completion, return `incomplete`, preserve the incumbent, mark cancelled, and do not emit proof-complete.

This contract should be revised if the CP3 paper formulation becomes available.

## 6. Proposed Future Architecture

Future files and responsibilities:

- `src/domain/cp3Solver.ts`: bounded educational CP3 solver, validation, candidate construction, Eulerian-support checks, deterministic extraction, trace events, proof/cap/cancel status.
- `src/domain/cp3Solver.test.ts`: unit tests for graph validation, cyclic support, disconnected-cycle rejection, deterministic extraction, cap/cancel proof integrity, and DAG differential comparison.
- `src/components/CP3Model.tsx`: CP3 educational view, MethodCockpit integration, graph panels, formula explanation, trace playback, incumbent and proof status.
- `src/components/MethodMap.tsx`: future badge/description adjustment from paper-reference placeholder to bounded educational implementation only when CP3 exists.
- `src/components/MethodPlaceholders.tsx`: future removal or replacement for `/methods/cp3` only when a real CP3 model route is added.
- `src/App.tsx`: future route registration for CP3.
- `src/components/RoutingUI.test.tsx`: future route assertions for the CP3 page.
- `src/data/examples.ts`: future deterministic CP3 examples, clearly separated from current DAG examples if cyclic graphs are added.
- `src/data/examples.test.ts`: future validation of CP3 cyclic corpus and compatibility with existing DAG examples.
- `src/domain/graph.ts`: future validation decision for self-loops and cyclic graphs if current global helpers remain DAG-oriented.
- `src/components/MethodCockpit.tsx`: likely no new behavior, but CP3 trace event labels may require display mapping.

No future files are created by this plan.

## 7. Test Matrix

Singleton:

- `V = {A}`, no arcs, no `G` edges. Expect optimal support `{A}`, extracted trail `[A]`, proof-complete.

Acyclic path:

- `A -> B -> C`, `G` connected on `{A,B,C}`. Expect CP3 to match Legacy sequence and objective.

Directed cycle:

- `A -> B -> C -> A`, `G` connected. Expect CP3 to support a trail using cycle arcs if the contract allows repeated final/start vertex in the extracted sequence, while counting distinct vertices once.

Self-loop policy:

- `A -> A`. Initial expected result: validation error or unsupported self-loop. If later allowed by paper evidence, add a separate accepted case.

Directed trail with cycle:

- `A -> B -> C -> B -> D` using distinct arcs and repeated vertex `B`. Expect valid trail if all selected vertices are connected in `G`.

Disconnected cycles:

- Cycle `A -> B -> A` and cycle `C -> D -> C`, all balanced, `G` connected or disconnected in variants. Expect rejection as one CP3 solution if directed selected support is disconnected.

Branching:

- `A -> B`, `A -> C`, `B -> D`, `C -> D`. Ensure candidate construction does not select both outgoing branches unless the extracted object is still one valid directed trail.

Genomic disconnect:

- Directed trail support is valid in `D`, but selected vertices induce disconnected `G`. Expect rejection.

Valid genomic support:

- Directed trail support is valid in `D`, selected vertices induce a connected but non-path-shaped `G` tree. Expect acceptance.

Deterministic tie:

- Two trails have the same distinct vertex count. Expect the lexicographically smallest extracted trail sequence under the declared extraction rule.

Cap boundary:

- Run the same graph with caps at zero, before first incumbent, after first incumbent but before proof, exactly at proof length, and above proof length. Expect incomplete before proof and optimal/no-solution only at or after proof-complete emission.

Cancellation:

- Immediate cancellation and mid-search cancellation. Expect incomplete, cancellation flag, no proof-complete, incumbent preserved if discovered.

Differential comparison strategy:

- On DAG/simple-path cases, compare CP3 best path support and sequence against Legacy, CP1, CP2, AlgoBB++, ILP1, and ILP2.
- On cyclic CP3-only cases, compare against independent brute-force directed-trail enumeration for small graphs, not against Legacy.
- Track objective mismatches, winner mismatches, validity mismatches, and uncapped incomplete runs.

## 8. Go / No-Go

BLOCKED: PAPER FORMULATION REQUIRED
