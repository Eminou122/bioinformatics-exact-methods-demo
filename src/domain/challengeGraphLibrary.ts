import type { Language } from '../i18n/types';
import type { MethodScenarioHandoff } from './methodScenarioHandoff';

export type ChallengeVariant = 'small' | 'medium';

export interface ChallengeGraph {
  id: string;
  familyId: string;
  variant: ChallengeVariant;
  title: Record<Language, string>;
  purpose: Record<Language, string>;
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
}

function g(u: string, v: string) {
  return u < v ? { u, v } : { u: v, v: u };
}

function graph(
  familyId: string,
  variant: ChallengeVariant,
  title: Record<Language, string>,
  purpose: Record<Language, string>,
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
): ChallengeGraph {
  return {
    id: `${familyId}-${variant}`,
    familyId,
    variant,
    title: {
      fr: `${title.fr} (${variant})`,
      en: `${title.en} (${variant})`,
      ar: `${title.ar} (${variant})`,
    },
    purpose,
    vertices,
    edgesD,
    edgesG,
  };
}

const families = [
  ['layered-branching-dag', { fr: 'DAG à couches ramifiées', en: 'Layered branching DAG', ar: 'DAG طبقي متفرع' }, { fr: 'Nombreuses continuations dirigées légales.', en: 'Many legal directed continuations.', ar: 'استمرارات موجهة قانونية كثيرة.' }],
  ['diamond-merge-lexical-ties', { fr: 'Losange avec fusions et égalités lexicales', en: 'Diamond merge / lexical ties', ar: 'اندماج ماسي وتعادلات معجمية' }, { fr: 'Candidats de même longueur et départage canonique.', en: 'Equal-length candidates and canonical tie-breaking.', ar: 'مرشحون بالطول نفسه وكسر تعادل قانوني.' }],
  ['long-spine-decoys', { fr: 'Longue colonne avec branches leurres', en: 'Long spine with decoy branches', ar: 'مسار طويل مع فروع خادعة' }, { fr: 'Comportement de borne supérieure dirigée.', en: 'Directed upper-bound behavior.', ar: 'سلوك الحد الأعلى الموجه.' }],
  ['fragmented-genomic-components', { fr: 'Composants génomiques fragmentés', en: 'Fragmented genomic components', ar: 'مكونات جينومية مجزأة' }, { fr: 'Élagage CP2+ sûr par impossibilité génomique.', en: 'Safe CP2+ genomic impossibility pruning.', ar: 'تقليم CP2+ آمن بسبب استحالة جينومية.' }],
  ['repairable-future-genomic-bridge', { fr: 'Pont génomique futur réparable', en: 'Repairable future genomic bridge', ar: 'جسر جينومي مستقبلي قابل للإصلاح' }, { fr: 'CP2+ ne doit pas élaguer les chemins réparables.', en: 'CP2+ must not prune repairable paths.', ar: 'يجب ألا يقلم CP2+ المسارات القابلة للإصلاح.' }],
  ['dense-genomic-overhead', { fr: 'Surcharge génomique dense', en: 'Dense genomic overhead', ar: 'عبء جينومي كثيف' }, { fr: 'Les vérifications sûres peuvent être neutres ou ajouter un coût structurel.', en: 'Safe checks may be neutral or add structural overhead.', ar: 'قد تكون الفحوص الآمنة محايدة أو تضيف عبئاً بنيوياً.' }],
  ['community-style-genomic', { fr: 'Structure génomique en communautés', en: 'Community-style genomic structure', ar: 'بنية جينومية على شكل مجتمعات' }, { fr: 'Topologies D et G clairement distinctes.', en: 'Clearly distinct D and G topology.', ar: 'طوبولوجيا D وG متميزة بوضوح.' }],
  ['anti-correlated-dg', { fr: 'Structure D/G anti-corrélée', en: 'Anti-correlated D/G structure', ar: 'بنية D/G عكسية الترابط' }, { fr: 'Les longs candidats dirigés échouent souvent la faisabilité génomique.', en: 'Long directed candidates frequently fail genomic feasibility.', ar: 'تفشل المرشحات الموجهة الطويلة غالباً في الجدوى الجينومية.' }],
] as const;

const small = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
const medium = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'];

export const CHALLENGE_GRAPHS: ChallengeGraph[] = families.flatMap(([id, title, purpose]) => [
  buildChallenge(id, 'small', title, purpose, small),
  buildChallenge(id, 'medium', title, purpose, medium),
]);

function buildChallenge(familyId: string, variant: ChallengeVariant, title: Record<Language, string>, purpose: Record<Language, string>, vertices: string[]): ChallengeGraph {
  const [a, b, c, d, e, f, h = 'R7', i = 'R8', j = 'R9'] = vertices;
  switch (familyId) {
    case 'layered-branching-dag':
      return graph(familyId, variant, title, purpose, vertices,
        [{ from: a, to: b }, { from: a, to: c }, { from: b, to: d }, { from: c, to: d }, { from: b, to: e }, { from: c, to: f }, ...(variant === 'medium' ? [{ from: d, to: h }, { from: e, to: i }, { from: f, to: j }] : [])],
        [g(a, b), g(b, d), g(c, f), g(e, f), ...(variant === 'medium' ? [g(d, h), g(h, i), g(i, j)] : [])]);
    case 'diamond-merge-lexical-ties':
      return graph(familyId, variant, title, purpose, vertices,
        [{ from: a, to: b }, { from: a, to: c }, { from: b, to: d }, { from: c, to: d }, { from: d, to: e }, { from: d, to: f }, ...(variant === 'medium' ? [{ from: e, to: h }, { from: f, to: h }, { from: h, to: i }] : [])],
        [g(a, b), g(b, d), g(a, c), g(c, d), g(e, f), ...(variant === 'medium' ? [g(h, i), g(h, j), g(i, j)] : [])]);
    case 'long-spine-decoys':
      return graph(familyId, variant, title, purpose, vertices,
        [{ from: a, to: b }, { from: b, to: c }, { from: c, to: d }, { from: d, to: e }, { from: b, to: f }, ...(variant === 'medium' ? [{ from: e, to: h }, { from: h, to: i }, { from: c, to: j }] : [])],
        [g(a, b), g(b, c), g(c, d), g(f, e), ...(variant === 'medium' ? [g(e, h), g(h, i), g(j, f)] : [])]);
    case 'fragmented-genomic-components':
      return graph(familyId, variant, title, purpose, vertices,
        [{ from: a, to: b }, { from: b, to: c }, { from: c, to: d }, { from: d, to: e }, { from: e, to: f }, ...(variant === 'medium' ? [{ from: f, to: h }, { from: h, to: i }, { from: i, to: j }] : [])],
        [g(a, b), g(c, d), g(e, f), ...(variant === 'medium' ? [g(h, i), g(i, j)] : [])]);
    case 'repairable-future-genomic-bridge':
      return graph(familyId, variant, title, purpose, vertices,
        [{ from: a, to: b }, { from: b, to: c }, { from: c, to: d }, { from: d, to: e }, { from: e, to: f }, ...(variant === 'medium' ? [{ from: f, to: h }, { from: h, to: i }, { from: i, to: j }] : [])],
        [g(a, c), g(c, e), g(e, f), g(b, d), g(d, f), ...(variant === 'medium' ? [g(f, h), g(h, i), g(i, j)] : [])]);
    case 'dense-genomic-overhead':
      return graph(familyId, variant, title, purpose, vertices,
        [{ from: a, to: b }, { from: a, to: c }, { from: b, to: d }, { from: c, to: e }, { from: d, to: f }, ...(variant === 'medium' ? [{ from: e, to: h }, { from: f, to: i }, { from: h, to: j }] : [])],
        vertices.flatMap((u, idx) => vertices.slice(idx + 1, idx + 4).map((v) => g(u, v))));
    case 'community-style-genomic':
      return graph(familyId, variant, title, purpose, vertices,
        [{ from: a, to: d }, { from: b, to: e }, { from: c, to: f }, { from: a, to: e }, { from: d, to: f }, ...(variant === 'medium' ? [{ from: e, to: h }, { from: f, to: i }, { from: h, to: j }] : [])],
        [g(a, b), g(b, c), g(d, e), g(e, f), ...(variant === 'medium' ? [g(h, i), g(i, j), g(c, h)] : [])]);
    case 'anti-correlated-dg':
      return graph(familyId, variant, title, purpose, vertices,
        [{ from: a, to: b }, { from: b, to: c }, { from: c, to: d }, { from: d, to: e }, { from: e, to: f }, ...(variant === 'medium' ? [{ from: f, to: h }, { from: h, to: i }, { from: i, to: j }] : [])],
        [g(a, f), g(b, e), g(c, d), ...(variant === 'medium' ? [g(a, j), g(b, i), g(c, h)] : [])]);
    default:
      throw new Error(`Unknown challenge graph family: ${familyId}`);
  }
}

export function getChallengeGraph(id: string): ChallengeGraph | undefined {
  return CHALLENGE_GRAPHS.find((candidate) => candidate.id === id);
}

export function challengeToScenario(challenge: ChallengeGraph, scenarioId: string): MethodScenarioHandoff {
  return {
    scenarioId,
    source: 'challenge-graph',
    vertices: challenge.vertices,
    edgesD: challenge.edgesD,
    edgesG: challenge.edgesG,
    maxEvents: 200000,
    family: 'challenge-graph',
    parameters: { challengeGraphId: challenge.id, variant: challenge.variant },
    seedOrder: 0,
    seedD: 0,
    seedG: 0,
    challengeGraphId: challenge.id,
  };
}
