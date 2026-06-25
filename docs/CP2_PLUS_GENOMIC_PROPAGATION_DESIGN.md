# CP2+ — CP2 with Safe Genomic-Feasibility Propagation

## Scope and evidence

CP2+ keeps the repository's exact problem unchanged: on an acyclic directed graph `D = (V,A)` and an undirected genomic graph `G = (V,E)`, find a longest simple directed path whose selected vertices induce a connected subgraph of `G`, with the existing lexicographic path tie-break.

This design is based only on the repository implementation and tests, especially `src/domain/cp2Solver.ts`, `src/domain/algoBBPlusPlus.ts`, `src/domain/pathAlgorithms.ts`, and their tests, plus the local 2025 paper *Constraint programming approaches for finding conserved metabolic and genomic patterns*. The paper defines CP2 as the path CP model strengthened by a longest-path upper-bound constraint on acyclic `D`. It describes AlgoBB++ only at summary level as an earlier branch-and-bound method using upper and lower bounds. It does not provide a `CoverSet` formulation in the inspected text. Therefore this document uses `CoverSet` only for comparison with the repository's implemented relaxed reconnection concept and makes no claim that the local implementation reproduces the paper algorithm.

## 1. Current CP2 behavior

### State and search

The implemented `solveCP2` performs depth-first enumeration of one-ended directed path prefixes.

- The root state is the empty path.
- Start vertices are tried in lexicographic order.
- From a non-empty path `P`, the solver branches only to lexicographically sorted outgoing neighbors of `last(P)` that are not in the visited set.
- Every recursive state is therefore a directed simple path.
- Every non-empty prefix is evaluated as a candidate; a path need not be maximal in `D` before it can become the incumbent.
- Candidate comparison is longest first and lexicographically smallest second through `comparePaths`.
- A capped or cancelled search returns `incomplete` and does not claim proof completion.

### Existing directed upper bound

For a non-empty current path `P`, let `last` be its endpoint and let `S_D(last,P)` be the maximum number of vertices in a directed suffix that:

1. starts at `last`;
2. follows arcs of `D`; and
3. uses no other vertex already in `P`.

The implementation computes this value exactly by `longestSuffixFrom` and uses

`UB_D(P) = |P| - 1 + S_D(last,P)`.

The subtraction avoids counting `last` twice. At the root, it takes the maximum suffix length over every possible start vertex. Because `D` is validated as acyclic, the recursive suffix computation terminates and gives the exact longest remaining directed suffix under the visited-set restriction.

The branch is pruned when this bound cannot improve the incumbent. If the bound equals the incumbent length, `prefixCanStillBeatIncumbent` additionally prunes only when the fixed prefix is already lexicographically worse. This is a directed objective/tie prune; it contains no genomic length information.

### Current genomic checking

After the directed bound check, every non-empty prefix is tested by `isInducedGConnected(P, edgesG)`.

- If connected, it may update the incumbent.
- If disconnected, it emits a genomic rejection for that candidate.
- The solver still expands the disconnected prefix unless the separate directed bound prunes it.

Thus current CP2 validates genomic connectivity for each current candidate but does not use genomic impossibility to prune future right-extensions. In particular, it does not ask whether any vertex reachable from the current endpoint could reconnect the selected genomic components.

## 2. Existing AlgoBB++ behavior

The repository's `solveAlgoBBPlusPlus` is a separate educational exact search, not CP2.

### Search geometry and directed bound

AlgoBB++ seeds both singleton paths and directed arcs. A state can then be extended:

- left through an unused incoming neighbor of the first path vertex; or
- right through an unused outgoing neighbor of the last path vertex.

Its directed upper bound is correspondingly two-ended:

`UB_BB(P) = |P| + longestBackward(first(P)) + longestForward(last(P))`,

with the current path blocked from both extensions.

### Relaxed genomic reconnection

The implemented `canStillBecomeGConnected` function:

1. collects unused vertices backward-reachable from the left endpoint;
2. collects unused vertices forward-reachable from the right endpoint;
3. forms a relaxed possible set from those vertices and the current path;
4. builds `G` induced by that possible set; and
5. prunes if the current path vertices are not all in one connected component of this relaxed genomic graph.

This is a two-ended necessary-condition test. It is permissive because the union may contain vertices that cannot all coexist in one simple two-ended completion. That relaxation is safe for an impossibility prune: adding impossible combinations can hide pruning opportunities, but cannot create a false impossibility.

There is no literal `CoverSet` type or preprocessing structure in the repository solver. The UI explicitly presents `CoverSet` preprocessing as a paper-reference concept only. The implemented analogue is the reachable-vertex reconnection set above.

### Difference from CP2 and copying risk

Current CP2 is a one-ended prefix search and can only append after `last`. AlgoBB++ is a two-ended search and may prepend before `first` or append after `last`. Copying its possible set into CP2 unchanged would count backward-reachable vertices that CP2 can never select after the current prefix. That could make the relaxed genomic graph appear connected and suppress valid pruning. More importantly, any later attempt to turn that two-ended set into a stronger certificate or bound could reason about completions outside CP2's actual state space.

CP2+ must therefore use only the unused vertices reachable by a right-extension from the current endpoint. It may reuse the general relaxed-connectivity idea, but not AlgoBB++'s two-ended frontier.

## 3. Proposed CP2+ propagation rule

Define a one-ended CP2 state:

`(P, last, U)`,

where:

- `P = (v_1,...,v_k)` is the current directed simple path;
- `last = v_k` is its endpoint; and
- `U = V \ V(P)` is the unused vertex set.

For a non-empty `P`, define:

`F(P,last) = {x in U | there is a directed path last -> ... -> x in D whose internal vertices are in U}`.

Equivalently, `F(P,last)` is directed reachability from `last` in the graph induced by `{last} ∪ U`, excluding `last` itself.

Define the relaxed genomic graph:

`H(P,last) = G[V(P) ∪ F(P,last)]`.

Proposed exact prune:

> If the vertices of `P` are not all in one connected component of `H(P,last)`, prune the branch.

This test is intentionally not order-aware. `F(P,last)` may contain mutually incompatible alternatives from different directed branches. Including all of them is a relaxation and can only make connectivity easier. The rule therefore detects impossibility but does not certify that a genomic repair is realizable.

The rule is unnecessary at the empty root and always passes for a singleton path.

## 4. Formal soundness theorem

### Assumptions

1. `D` and `G` share the validated finite vertex set `V`.
2. `D` is acyclic, as required by current CP2.
3. `P` is the exact current directed simple path and `U = V \ V(P)`.
4. A descendant of the state is produced only by repeatedly appending an unused outgoing neighbor of the current endpoint.
5. Final genomic validity means connectivity of the induced graph on exactly the selected path vertices.
6. `F(P,last)` is computed over `{last} ∪ U`; no previously selected vertex other than `last` is allowed as an internal reachability vertex.

### Theorem

If the vertices in `P` are not all connected in `H(P,last)`, then no valid right-extension of `P` can be a `(D,G)`-consistent path.

### Proof sketch

Let `Q = P · (w_1,...,w_r)` be any directed simple right-extension generated below the state, including the possibility `r = 0`.

For every added vertex `w_i`, the sequence

`last -> w_1 -> ... -> w_i`

is a directed path. Every internal vertex in that sequence is one of the newly added vertices and was unused at state `(P,last,U)`. The endpoint `w_i` is also unused. Therefore `w_i ∈ F(P,last)`. Hence every valid right-extension uses only vertices in `F(P,last)`, and:

`V(Q) ⊆ V(P) ∪ F(P,last)`.

If `Q` were genomically connected, `G[V(Q)]` would contain a genomic path between every pair of vertices already in `P`. Since `G[V(Q)]` is a subgraph of `H(P,last)`, those same vertices would be connected in `H(P,last)`. This contradicts the prune condition. Therefore no right-extension can be genomically connected, so pruning is sound.

### Implementation invariants

Phase 2 must preserve:

- one-ended right-extension semantics;
- the exact used/unused partition;
- endpoint-relative directed reachability;
- blocking of all selected vertices except `last` during reachability;
- inclusion of all reachable unused vertices, not only a heuristic subset;
- an undirected connectivity test in `G` over `V(P) ∪ F(P,last)`;
- pruning only when selected path vertices remain disconnected in that relaxed graph;
- final `isInducedGConnected` candidate validation;
- existing validation, lexical tie behavior, caps, cancellation, and proof-complete rules.

Any smaller or heuristic frontier could omit a feasible bridge and make the prune unsound.

## 5. Interaction with the CP2 directed bound

The existing directed suffix bound remains unchanged:

`UB_D(P) = |P| - 1 + S_D(last,P)`.

The genomic propagation is a separate necessary-condition prune:

- the directed bound proves that a branch cannot improve the objective or lexical winner;
- the genomic rule proves that no descendant can satisfy final genomic connectivity.

Both are sound independently, so applying either order is sound together. Phase 2 may choose the cheaper order empirically, but event accounting must make that order explicit.

CP2+ introduces no genomic-aware length upper bound. Connectivity of `H(P,last)` does not imply a feasible directed completion and must not be converted into an objective bound without a separate theorem.

## 6. Explicit non-goals

CP2+ does not introduce:

- an order-aware bridge certificate;
- a heuristic or heuristic frontier;
- a hidden solver that enumerates full completions inside propagation;
- CP3 or CP4 trail semantics, repeated vertices, repeated-arc reasoning, or cyclic-`D` support;
- a claim of novelty over AlgoBB++, `CoverSet`, the 2025 paper, or other literature;
- a claim that the prune improves performance on every graph;
- a new genomic-aware length upper bound;
- state dominance, memoization, or a changed lexical policy.

It is an implementation integration of the existing CP2 one-ended longest-path search with a safe relaxed genomic-feasibility prune.

## 7. Phase 2 test plan

### Targeted correctness cases

1. **Pruned by CP2+ but not CP2:** a disconnected prefix whose genomic components cannot connect through any endpoint-reachable unused vertex.
2. **Disconnected now, repairable later:** a prefix rejected as a current candidate but connected after a later right-extension; CP2+ must not prune it.
3. **Directed-reachable genomic bridge:** one or more vertices in `F(P,last)` connect all selected components in `H`; the branch remains.
4. **Unreachable genomic bridge:** full `G` contains a bridge vertex, but it is not reachable from `last`; the branch is pruned.
5. **Fork relaxation:** alternative reachable branches collectively connect `H` although no one directed path can use all of them; CP2+ may retain the branch but must not falsely certify feasibility.
6. **Already connected and singleton prefixes:** propagation passes without changing results.
7. **Sparse and dense `G`:** exercise disconnected frontiers, hubs, and near-complete genomic graphs.
8. **Sparse and dense `D`:** exercise small frontiers and large relaxed frontiers.
9. **Lexical ties:** exact longest-then-lexicographic winner remains unchanged, including equal directed bounds.
10. **Caps:** every cap boundary remains `incomplete` unless the proof-complete event fits; genomic events count toward total events consistently.
11. **Cancellation:** cancellation before, during, and after propagation never emits proof completion.

### Differential corpus

Run the same valid bounded DAG corpus through:

- Legacy;
- CP1;
- current CP2;
- CP2+;
- AlgoBB++;
- ILP1;
- ILP2; and
- Subset DP.

For every uncapped valid case, assert equality of:

- result status;
- optimal path length;
- exact lexicographic winning path; and
- final path validity in both `D` and `G`.

Retain malformed-input and cyclic-`D` boundary cases to confirm unchanged rejection behavior. Include exhaustive small DAG/`G` combinations and deterministic randomized cases across sparse/dense regimes. Any mismatch must be reduced to a minimal counterexample before implementation is accepted.

### Required metrics

Record per run:

- explored states;
- directed-bound prunes;
- genomic-propagation prunes;
- total trace events; and
- result equality against every oracle solver.

Keep current candidate genomic rejections separate from genomic-propagation branch prunes. A disconnected prefix that remains repairable is a candidate rejection, not a propagation prune.

## 8. Final decision

**READY FOR IMPLEMENTATION**

The proposed rule is a sound, implementation-level necessary-condition prune for the current one-ended CP2 search. Its proof does not depend on a heuristic, a performance assumption, or a new length bound. The implementation must retain the relaxed full endpoint-reachable frontier and must not import AlgoBB++'s two-ended frontier unchanged.
