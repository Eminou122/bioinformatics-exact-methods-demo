import React, { useMemo } from 'react';
import { runCP2PlusBenchmark, type BenchmarkFamilyId } from '../domain/cp2PlusBenchmark';
import type { Language } from '../i18n/types';
import { Link } from './Navigation';

interface CP2PlusComparisonLabProps {
  lang: Language;
  navigate: (path: string) => void;
}

const labels = {
  fr: {
    title: 'Laboratoire de comparaison CP2+',
    subtitle: 'Preuves structurelles déterministes comparant CP2 et CP2+.',
    purpose: 'Cette comparaison utilise des cas pédagogiques déterministes et des cas de stress bornés. Elle mesure la structure de recherche, vérifie l’exactitude et produit uniquement des observations propres à ce corpus, sans conclusion chronométrique.',
    primary: 'CP2+ préserve les solutions exactes et peut réduire la recherche lorsque la connectivité génomique rend des continuations dirigées impossibles.',
    summary: 'Résumé du benchmark',
    totalCases: 'Nombre total de cas',
    objectiveMismatch: 'Divergences d’objectif',
    winnerMismatch: 'Divergences de solution gagnante',
    proofMismatch: 'Divergences de statut de preuve',
    validityMismatch: 'Divergences de validité',
    cp2States: 'États explorés par CP2',
    cp2PlusStates: 'États explorés par CP2+',
    stateReduction: 'Réduction d’états',
    cp2Events: 'Événements émis par CP2',
    cp2PlusEvents: 'Événements émis par CP2+',
    eventReduction: 'Réduction d’événements',
    checks: 'Vérifications de propagation génomique',
    prunes: 'Élagages génomiques sûrs',
    stateCases: 'Cas réduits / égaux / augmentés',
    structural: 'Comparaison structurelle',
    states: 'États explorés',
    events: 'Événements émis',
    exactness: 'Exactitude sans divergence',
    families: 'Comparaison par famille',
    cases: 'cas',
    equality: 'Résultat d’égalité',
    equal: 'Toutes les vérifications concordent',
    mismatch: 'Divergence détectée',
    conclusion: 'Conclusion factuelle générée',
    limitation: 'Ces résultats sont propres à ce corpus pédagogique déterministe et de stress borné. Ils n’établissent pas une supériorité universelle en temps d’exécution et ne reproduisent pas un benchmark publié.',
    back: 'Retour à CP2+',
    family: {
      'fragmented-genomic': ['Cas génomiques fragmentés', 'CP2+ peut éliminer des branches génomiquement impossibles.'],
      'dense-genomic': ['Cas génomiques denses', 'CP2+ peut être neutre car peu de branches sont génomiquement impossibles.'],
      'repairable-future-bridge': ['Cas avec pont futur réparable', 'Montre qu’un pont futur atteignable n’est pas élagué à tort.'],
      'small-exhaustive': ['Petits cas exhaustifs', 'Confirme l’égalité avec tous les solveurs pédagogiques exacts disponibles.'],
      'larger-bounded-stress': ['Cas de stress bornés plus grands', 'Comparaison structurelle uniquement, sans conclusion universelle sur le temps d’exécution.'],
    },
  },
  en: {
    title: 'CP2+ Comparison Lab',
    subtitle: 'Deterministic structural evidence comparing CP2 and CP2+.',
    purpose: 'This comparison uses deterministic educational and bounded-stress fixtures. It measures search structure, verifies exactness, and reports corpus-specific observations without runtime conclusions.',
    primary: 'CP2+ preserves exact solutions and can reduce search when genomic connectivity makes directed continuations impossible.',
    summary: 'Benchmark summary',
    totalCases: 'Total cases',
    objectiveMismatch: 'Objective mismatches',
    winnerMismatch: 'Winner mismatches',
    proofMismatch: 'Proof-status mismatches',
    validityMismatch: 'Validity mismatches',
    cp2States: 'CP2 states explored',
    cp2PlusStates: 'CP2+ states explored',
    stateReduction: 'State reduction',
    cp2Events: 'CP2 events emitted',
    cp2PlusEvents: 'CP2+ events emitted',
    eventReduction: 'Event reduction',
    checks: 'Genomic propagation checks',
    prunes: 'Safe genomic prunes',
    stateCases: 'Reduced / equal / increased cases',
    structural: 'Structural comparison',
    states: 'States explored',
    events: 'Events emitted',
    exactness: 'Zero-mismatch exactness',
    families: 'Family-by-family comparison',
    cases: 'cases',
    equality: 'Equality result',
    equal: 'All equality checks match',
    mismatch: 'Mismatch detected',
    conclusion: 'Generated factual conclusion',
    limitation: 'These results are specific to this deterministic educational and bounded-stress corpus. They do not establish universal runtime superiority or reproduce a published benchmark.',
    back: 'Back to CP2+',
    family: {
      'fragmented-genomic': ['Fragmented genomic cases', 'CP2+ may eliminate genomically impossible branches.'],
      'dense-genomic': ['Dense genomic cases', 'CP2+ may be neutral because few branches are genomically impossible.'],
      'repairable-future-bridge': ['Repairable future-bridge cases', 'Demonstrates that a future reachable bridge is not falsely pruned.'],
      'small-exhaustive': ['Small exhaustive cases', 'Confirms equality against all available exact educational solvers.'],
      'larger-bounded-stress': ['Larger bounded stress cases', 'Structural comparison only; no universal runtime conclusion.'],
    },
  },
  ar: {
    title: 'مختبر مقارنة CP2+',
    subtitle: 'أدلة بنيوية حتمية تقارن بين CP2 وCP2+.',
    purpose: 'تستخدم هذه المقارنة حالات تعليمية حتمية وحالات إجهاد محدودة. وهي تقيس بنية البحث وتتحقق من الدقة وتعرض ملاحظات خاصة بهذا المتن دون استنتاجات زمنية.',
    primary: 'يحافظ CP2+ على الحلول الدقيقة ويمكنه تقليل البحث عندما تجعل الاتصالات الجينومية الاستمرارات الموجهة مستحيلة.',
    summary: 'ملخص المعيار',
    totalCases: 'إجمالي الحالات',
    objectiveMismatch: 'اختلافات الهدف',
    winnerMismatch: 'اختلافات الحل الفائز',
    proofMismatch: 'اختلافات حالة البرهان',
    validityMismatch: 'اختلافات الصحة',
    cp2States: 'الحالات التي استكشفها CP2',
    cp2PlusStates: 'الحالات التي استكشفها CP2+',
    stateReduction: 'انخفاض الحالات',
    cp2Events: 'الأحداث الصادرة من CP2',
    cp2PlusEvents: 'الأحداث الصادرة من CP2+',
    eventReduction: 'انخفاض الأحداث',
    checks: 'فحوص الانتشار الجينومي',
    prunes: 'عمليات التقليم الجينومي الآمن',
    stateCases: 'حالات أقل / متساوية / أكثر',
    structural: 'المقارنة البنيوية',
    states: 'الحالات المستكشفة',
    events: 'الأحداث الصادرة',
    exactness: 'دقة بلا اختلافات',
    families: 'المقارنة حسب العائلة',
    cases: 'حالات',
    equality: 'نتيجة المساواة',
    equal: 'جميع فحوص المساواة متطابقة',
    mismatch: 'تم اكتشاف اختلاف',
    conclusion: 'الخلاصة الواقعية المولدة',
    limitation: 'هذه النتائج خاصة بهذا المتن التعليمي الحتمي ومتَن الإجهاد المحدود. ولا تثبت تفوقاً زمنياً شاملاً ولا تعيد إنتاج معيار منشور.',
    back: 'العودة إلى CP2+',
    family: {
      'fragmented-genomic': ['الحالات الجينومية المجزأة', 'قد يزيل CP2+ الفروع المستحيلة جينومياً.'],
      'dense-genomic': ['الحالات الجينومية الكثيفة', 'قد يكون CP2+ محايداً لأن عدداً قليلاً من الفروع مستحيل جينومياً.'],
      'repairable-future-bridge': ['حالات الجسر المستقبلي القابل للإصلاح', 'توضح أن الجسر المستقبلي القابل للوصول لا يُقلّم خطأً.'],
      'small-exhaustive': ['الحالات الشاملة الصغيرة', 'تؤكد التطابق مع جميع المحللات التعليمية الدقيقة المتاحة.'],
      'larger-bounded-stress': ['حالات الإجهاد المحدودة الأكبر', 'مقارنة بنيوية فقط، دون استنتاج شامل عن زمن التنفيذ.'],
    },
  },
} satisfies Record<Language, {
  family: Record<BenchmarkFamilyId, [string, string]>;
  [key: string]: string | Record<BenchmarkFamilyId, [string, string]>;
}>;

const metricStyle: React.CSSProperties = {
  minWidth: 0,
  padding: 'var(--space-sm)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-card)',
};

export const CP2PlusComparisonLab: React.FC<CP2PlusComparisonLabProps> = ({ lang, navigate }) => {
  const t = labels[lang];
  const isAr = lang === 'ar';
  const report = useMemo(() => runCP2PlusBenchmark(), []);
  const { results, summary } = report;
  const stateReduction = summary.cp2.statesExplored - summary.cp2Plus.statesExplored;
  const eventReduction = summary.cp2.eventsEmitted - summary.cp2Plus.eventsEmitted;
  const mismatchTotal = Object.values(summary.equalityMismatches).reduce((total, count) => total + count, 0);
  const summaryMetrics = [
    ['total-cases', t.totalCases, summary.totalCaseCount],
    ['objective-mismatches', t.objectiveMismatch, summary.equalityMismatches.objective],
    ['winner-mismatches', t.winnerMismatch, summary.equalityMismatches.winner],
    ['proof-mismatches', t.proofMismatch, summary.equalityMismatches.proofStatus],
    ['validity-mismatches', t.validityMismatch, summary.equalityMismatches.validity],
    ['cp2-states', t.cp2States, summary.cp2.statesExplored],
    ['cp2-plus-states', t.cp2PlusStates, summary.cp2Plus.statesExplored],
    ['state-reduction', t.stateReduction, stateReduction],
    ['cp2-events', t.cp2Events, summary.cp2.eventsEmitted],
    ['cp2-plus-events', t.cp2PlusEvents, summary.cp2Plus.eventsEmitted],
    ['event-reduction', t.eventReduction, eventReduction],
    ['genomic-checks', t.checks, summary.cp2Plus.genomicPropagationChecks],
    ['genomic-prunes', t.prunes, summary.cp2Plus.genomicPropagationPrunes],
    ['state-case-counts', t.stateCases, `${summary.reducedStateCases} / ${summary.equalStateCases} / ${summary.increasedStateCases}`],
  ] as const;

  return (
    <div data-testid="cp2-plus-comparison-lab" style={{ direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left', minWidth: 0, maxWidth: '100%' }}>
      <header style={{ marginBlockEnd: 'var(--space-lg)' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.8rem' }}>{t.title}</h2>
        <p style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t.subtitle}</p>
        <p>{t.purpose}</p>
        <p style={{ padding: 'var(--space-sm)', borderInlineStart: '5px solid var(--accent-gold)', background: 'var(--primary-bg)', fontWeight: 800 }}>{t.primary}</p>
        <Link to="/methods/cp2-plus" navigate={navigate} className="btn btn-secondary" style={{ display: 'inline-flex', width: 'auto' }}>
          {t.back}
        </Link>
      </header>

      <section className="card" aria-labelledby="benchmark-summary-title">
        <h3 id="benchmark-summary-title">{t.summary}</h3>
        <div className="cp2-comparison-summary">
          {summaryMetrics.map(([key, label, value]) => (
            <div key={key} data-testid={`comparison-metric-${key}`} style={metricStyle}>
              <div style={{ color: 'var(--neutral-medium)', fontSize: '0.8rem', fontWeight: 700 }}>{label}</div>
              <strong dir="ltr" style={{ display: 'block', unicodeBidi: 'isolate', fontSize: '1.25rem', color: 'var(--primary)', overflowWrap: 'anywhere' }}>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="structural-comparison-title">
        <h3 id="structural-comparison-title">{t.structural}</h3>
        {[
          [t.states, summary.cp2.statesExplored, summary.cp2Plus.statesExplored],
          [t.events, summary.cp2.eventsEmitted, summary.cp2Plus.eventsEmitted],
        ].map(([label, cp2, cp2Plus]) => (
          <div key={label} style={{ marginBlockEnd: 'var(--space-md)', minWidth: 0 }}>
            <strong>{label}</strong>
            <label style={{ display: 'grid', gridTemplateColumns: '4rem minmax(0, 1fr) auto', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <span dir="ltr">CP2</span>
              <progress value={cp2} max={Math.max(Number(cp2), Number(cp2Plus))} style={{ width: '100%', maxWidth: '100%' }} />
              <span dir="ltr">{cp2}</span>
            </label>
            <label style={{ display: 'grid', gridTemplateColumns: '4rem minmax(0, 1fr) auto', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <span dir="ltr">CP2+</span>
              <progress value={cp2Plus} max={Math.max(Number(cp2), Number(cp2Plus))} style={{ width: '100%', maxWidth: '100%' }} />
              <span dir="ltr">{cp2Plus}</span>
            </label>
          </div>
        ))}
        <div className="cp2-comparison-highlight-grid">
          <div style={metricStyle}>
            <strong>{t.prunes}</strong>
            <div dir="ltr" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{summary.totalGenomicPropagationPrunes}</div>
          </div>
          <div style={metricStyle}>
            <strong>{t.exactness}</strong>
            <div dir="ltr" style={{ fontSize: '2rem', fontWeight: 900, color: mismatchTotal === 0 ? 'var(--primary)' : 'var(--danger)' }}>{mismatchTotal}</div>
          </div>
        </div>
      </section>

      <section aria-labelledby="family-comparison-title">
        <h3 id="family-comparison-title">{t.families}</h3>
        <div className="cp2-comparison-families">
          {summary.perFamily.map((family) => {
            const familyResults = results.filter((result) => result.familyId === family.familyId);
            const cp2Events = familyResults.reduce((total, result) => total + result.cp2.eventsEmitted, 0);
            const cp2PlusEvents = familyResults.reduce((total, result) => total + result.cp2Plus.eventsEmitted, 0);
            const equality = familyResults.every((result) => Object.values(result.exactness).every(Boolean));
            const [name, interpretation] = t.family[family.familyId];
            return (
              <article key={family.familyId} className="card" data-family-id={family.familyId} style={{ minWidth: 0, margin: 0 }}>
                <h4 style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>{name}</h4>
                <dl className="cp2-comparison-family-metrics">
                  <dt>{t.cases}</dt><dd dir="ltr">{family.caseCount}</dd>
                  <dt>{t.cp2States}</dt><dd dir="ltr">{family.cp2StatesExplored}</dd>
                  <dt>{t.cp2PlusStates}</dt><dd dir="ltr">{family.cp2PlusStatesExplored}</dd>
                  <dt>{t.cp2Events}</dt><dd dir="ltr">{cp2Events}</dd>
                  <dt>{t.cp2PlusEvents}</dt><dd dir="ltr">{cp2PlusEvents}</dd>
                  <dt>{t.prunes}</dt><dd dir="ltr">{family.genomicPropagationPrunes}</dd>
                  <dt>{t.equality}</dt><dd>{equality ? t.equal : t.mismatch}</dd>
                </dl>
                <p style={{ marginBlockEnd: 0, fontWeight: 700 }}>{interpretation}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card" data-testid="cp2-plus-generated-conclusion">
        <h3>{t.conclusion}</h3>
        <p lang="en" dir="ltr" style={{ unicodeBidi: 'isolate' }}>{summary.conclusion}</p>
        <p data-testid="cp2-plus-limitation-note" style={{ marginBlockEnd: 0, padding: 'var(--space-sm)', border: '1px solid var(--accent-gold)', borderRadius: 'var(--radius-sm)', fontWeight: 800 }}>
          {t.limitation}
        </p>
      </section>

      <style>{`
        .cp2-comparison-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-sm);
        }
        .cp2-comparison-highlight-grid,
        .cp2-comparison-families {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-sm);
        }
        .cp2-comparison-family-metrics {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: var(--space-xs) var(--space-sm);
        }
        .cp2-comparison-family-metrics dd {
          margin: 0;
          unicode-bidi: isolate;
        }
        @media (max-width: 767px) {
          .cp2-comparison-summary,
          .cp2-comparison-highlight-grid,
          .cp2-comparison-families {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
