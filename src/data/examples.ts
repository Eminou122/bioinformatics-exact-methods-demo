export interface ExampleDataset {
  id: string;
  titleFr: string;
  titleEn: string;
  titleAr: string;
  descriptionFr: string;
  descriptionEn: string;
  descriptionAr: string;
  teachingPointFr: string;
  teachingPointEn: string;
  teachingPointAr: string;
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
    titleAr: '١. مثال بسيط صالح',
    descriptionFr: 'Une chaîne linéaire simple où chaque réaction successive est aussi adjacente génomiquement.',
    descriptionEn: 'A simple linear chain where each consecutive reaction is also genomically adjacent.',
    descriptionAr: 'سلسلة خطية بسيطة حيث يكون كل تفاعل متتال متجاوراً جينومياً أيضاً.',
    teachingPointFr: 'Chaque réaction dans la chaîne métabolique reste connectée génomiquement.',
    teachingPointEn: 'Every reaction in the metabolic chain remains genomically connected.',
    teachingPointAr: 'كل تفاعل في السلسلة الاستقلابية يظل متصلاً جينومياً.',
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
    titleAr: '٢. رفض أطول مسار غير متسق',
    descriptionFr: 'Le plus long chemin métabolique dans D contient un sommet (R4) qui est isolé génomiquement dans G.',
    descriptionEn: 'The longest metabolic path in D contains a vertex (R4) that is genomically isolated in G.',
    descriptionAr: 'يحتوي أطول مسار استقلابي في D على رأس (R4) معزول جينومياً في G.',
    teachingPointFr: 'La plus longue chaîne métabolique n\'est pas nécessairement cohérente génomiquement.',
    teachingPointEn: 'The longest metabolic chain is not necessarily genomically coherent.',
    teachingPointAr: 'أطول سلسلة استقلابية ليست بالضرورة متسقة جينومياً.',
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
    titleAr: '٣. مسارات متعددة مرشحة',
    descriptionFr: 'Un graphe avec plusieurs embranchements et fusions de chemins. La méthode exacte trouve le meilleur chemin cohérent.',
    descriptionEn: 'A graph with branching and merging paths. The exact method finds the optimal consistent path.',
    descriptionAr: 'مخطط ذو مسارات متفرعة ومندمجة. تجد الطريقة الدقيقة المسار المتسق الأمثل.',
    teachingPointFr: 'La méthode vérifie tous les candidats exactement, puis choisit le meilleur valide.',
    teachingPointEn: 'The method checks all candidates exactly, then chooses the best valid one.',
    teachingPointAr: 'تتحقق الطريقة من كل المرشحين بدقة، ثم تختار أفضل مسار صالح.',
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
  {
    id: 'cp1-disconnected-g',
    titleFr: '4. Élagage précoce CP1 dans G',
    titleEn: '4. Early CP1 pruning in G',
    titleAr: '٤. تقليم مبكر في G باستخدام CP1',
    descriptionFr: 'Un cas où le solveur CP1 peut élaguer une branche tôt car les sommets du chemin ne peuvent plus rester connectés dans G.',
    descriptionEn: 'A case where the CP1 solver can prune a branch early because the path vertices can no longer remain connected in G.',
    descriptionAr: 'حالة يمكن فيها لمحلل CP1 تقليم فرع مبكراً لأن رؤوس المسار لا يمكن أن تظل متصلة في G.',
    teachingPointFr: 'L\'élagage précoce de connectivité évite d\'explorer des branches vouées à l\'échec.',
    teachingPointEn: 'Early connectivity pruning avoids exploring branches destined to fail.',
    teachingPointAr: 'التقليم المبكر للاتصال يتجنب استكشاف الفروع المحكوم عليها بالفشل.',
    vertices: ['R1', 'R2', 'R3', 'R4'],
    edgesD: [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R4' },
    ],
    edgesG: [
      { u: 'R1', v: 'R2' },
      { u: 'R3', v: 'R4' },
    ],
    nodePositions: {
      R1: { x: 80, y: 150 },
      R2: { x: 220, y: 150 },
      R3: { x: 360, y: 150 },
      R4: { x: 500, y: 150 },
    },
  },
];

