export interface ExampleDataset {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  teachingPointFr: string;
  teachingPointEn: string;
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
  nodePositions: Record<string, { x: number; y: number }>;
}

export const examples: ExampleDataset[] = [
  {
    id: 'simple-valide',
    titleFr: '1. Exemple simple valide',
    titleEn: '1. Simple valid example',
    descriptionFr: 'Une chaîne linéaire simple où chaque réaction successive est aussi adjacente génomiquement.',
    descriptionEn: 'A simple linear chain where each consecutive reaction is also genomically adjacent.',
    teachingPointFr: 'Chaque réaction dans la chaîne métabolique reste connectée génomiquement.',
    teachingPointEn: 'Every reaction in the metabolic chain remains genomically connected.',
    vertices: ['R1', 'R2', 'R3', 'R4'],
    edgesD: [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R4' },
    ],
    edgesG: [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' },
      { u: 'R3', v: 'R4' },
    ],
    nodePositions: {
      R1: { x: 80, y: 150 },
      R2: { x: 220, y: 150 },
      R3: { x: 360, y: 150 },
      R4: { x: 500, y: 150 },
    },
  },
  {
    id: 'longest-rejected',
    titleFr: '2. Le plus long chemin est rejeté',
    titleEn: '2. The longest path is rejected',
    descriptionFr: 'Le plus long chemin métabolique dans D contient un sommet (R4) qui est isolé génomiquement dans G.',
    descriptionEn: 'The longest metabolic path in D contains a vertex (R4) that is genomically isolated in G.',
    teachingPointFr: 'La plus longue chaîne métabolique n\'est pas nécessairement cohérente génomiquement.',
    teachingPointEn: 'The longest metabolic chain is not necessarily genomically coherent.',
    vertices: ['R1', 'R2', 'R3', 'R4', 'R5'],
    edgesD: [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R4' },
      { from: 'R2', to: 'R5' },
    ],
    edgesG: [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' },
      { u: 'R2', v: 'R5' },
    ],
    nodePositions: {
      R1: { x: 80, y: 150 },
      R2: { x: 220, y: 150 },
      R3: { x: 360, y: 90 },
      R4: { x: 500, y: 90 },
      R5: { x: 360, y: 210 },
    },
  },
  {
    id: 'multiple-candidates',
    titleFr: '3. Plusieurs chemins candidats',
    titleEn: '3. Multiple candidate paths',
    descriptionFr: 'Un graphe avec plusieurs embranchements et fusions de chemins. La méthode exacte trouve le meilleur chemin cohérent.',
    descriptionEn: 'A graph with branching and merging paths. The exact method finds the optimal consistent path.',
    teachingPointFr: 'La méthode vérifie tous les candidats exactement, puis choisit le meilleur valide.',
    teachingPointEn: 'The method checks all candidates exactly, then chooses the best valid one.',
    vertices: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
    edgesD: [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R4' },
      { from: 'R1', to: 'R3' },
      { from: 'R3', to: 'R4' },
      { from: 'R2', to: 'R5' },
      { from: 'R5', to: 'R6' },
    ],
    edgesG: [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R4' },
      { u: 'R1', v: 'R3' },
      { u: 'R3', v: 'R4' },
      { u: 'R2', v: 'R5' },
      { u: 'R5', v: 'R6' },
    ],
    nodePositions: {
      R1: { x: 80, y: 150 },
      R2: { x: 220, y: 90 },
      R3: { x: 220, y: 210 },
      R4: { x: 360, y: 150 },
      R5: { x: 360, y: 50 },
      R6: { x: 500, y: 50 },
    },
  },
];
