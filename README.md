# Interactive Exact Consistent-Path Bioinformatics Demo

An interactive educational web application designed to demonstrate the resolution of the simplified **(D,G)-consistent path** problem in systems biology.

## 🔬 Academic Problem Context

In systems biology, reconstructing metabolic pathways requires integrating two distinct biological data sources:
1. **Metabolic pathways (flow constraint)**: the sequence in which chemical reactions must occur to synthesize a target molecule.
2. **Genomic localization (coregulation constraint)**: the physical proximity of genes encoding the enzymes that catalyze these reactions on the chromosome (operons, gene clusters).

By finding pathways that satisfy both metabolic succession and genomic proximity constraints, researchers can identify biologically coherent pathways that are more likely to be co-expressed and coordinated.

### Definitions:

- **Graph $D$ (Directed Metabolic Graph):** A directed acyclic graph (DAG) where vertices represent reactions and directed edges represent the direct succession of reactions (product of one reaction is the substrate of the next).
- **Graph $G$ (Undirected Genomic Proximity Graph):** An undirected graph using the same set of reaction vertices. An edge exists between two reactions if the genes coding for their enzymes are physically close to each other on the genome.
- **$(D,G)$-Consistent Path:** A directed path $P$ in $D$ is consistent if its selected reaction vertices induce a **connected** subgraph in the undirected genomic graph $G$.

---

## 🌐 Multilingual and RTL Interface Support

The application is built with a typed internationalization layer that supports:
- **Languages:** French, English, and Arabic.
- **Genuine RTL Support:** Selecting Arabic automatically applies `dir="rtl"` and `lang="ar"` on the document, aligning text and layout naturally for RTL readers.
- **Directional Preservation:** Technical notation (reaction IDs like `R1`, `R2`, algorithm names like `DFS`, `BFS`, mathematical notation) and metabolic graph paths (like `R1 → R2 → R3`) remain strictly Left-To-Right (LTR) even when Arabic is selected, preventing visual or semantic corruption.
- **SVG Protection:** SVG graph renders are protected from browser mirroring so that coordinates, directed edge arrows, node positions, and arrowheads remain geometrically and logically identical across all languages.

---

## 📱 Mobile-Friendly Responsive Design

The application supports responsive scaling across different viewports (tested at 1440px, 1024px, 768px, 390px, and 320px):
- **Desktop:** Graphe D and Graphe G are displayed side-by-side.
- **Mobile/Tablet:** The layouts stack vertically on narrow viewports without horizontal scrolling, and touch target sizes are configured to be at least `44px` for ease of use.
- **Logical CSS Properties:** Spacings and alignments are implemented using logical CSS properties (`margin-inline`, `padding-inline`, `text-align: start`), enabling clean layout flipping without layout breaks.

---

## 🛠️ Exact Resolution Method & Cycle Validation

This application uses an **exact exhaustive enumeration** algorithm:
1. **Validation & Cycle Rejection:** The solver validates the graph structure before enumeration. The demo **supports DAG inputs only**; if a cycle is found in the metabolic graph $D$, the solver stops safely and rejects the dataset with a structured cycle detection error instead of silently loop-falling or utilizing repeated-vertex checks. Duplicate edges in $D$ or $G$ are also rejected during initial validation.
2. **Path Enumeration:** It starts a depth-first search (DFS) from every vertex in $D$ to find all simple directed paths, including single-node paths.
3. **Induced Subgraph Connectivity Check:** For each path candidate, it constructs the induced subgraph in the genomic graph $G$ (restricted only to the path vertices) and runs a Breadth-First Search (BFS) to verify if the subgraph is connected.
4. **Deterministic Tie-Breaking:** Among all consistent paths, it selects the longest one (greatest number of vertices). If there is a tie, it selects the lexicographically smallest sequence of reaction IDs.

Because it searches the entire search space, the demo mathematically guarantees that the selected solution is the global optimum.

---

## ⚠️ Limitations & Scope

This is a small educational exact-enumeration demo for small graphs. It is designed to illustrate the core concepts of the $(D,G)$-consistent path problem and is **not intended as a scalable production biological-analysis engine** for large real-world biological networks or genome-scale reconstructions.

---

## 📂 Included Biological Datasets

The demo includes three pre-loaded educational scenarios:

1. **Exemple simple valide (Simple valid example):** A linear chain where all consecutive reactions are adjacent on the genome, representing a perfect operon structure.
2. **Le plus long chemin est rejeté (The longest path is rejected):** A branching metabolic graph where the longest metabolic path is invalid because one reaction's enzyme gene is isolated genomically.
3. **Plusieurs chemins candidats (Multiple candidate paths):** A complex branching/merging DAG topology demonstrating how the exact method checks all possibilities and selects the optimal path.

---

## 🚀 Installation & Local Run

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Setup
Install all project dependencies:
```bash
npm install
```

### Local Dev Server
Launch the local development server:
```bash
npm run dev
```

---

## 🧪 Validation & Test Commands

To run unit tests, check formatting/style, type validity, and build the production bundle:

### Run Unit Tests (Vitest)
```bash
npm test
```

### Linting (ESLint)
```bash
npm run lint
```

### Static Type Check (TypeScript)
```bash
npx tsc --noEmit
```

### Production Build
```bash
npm run build
```
