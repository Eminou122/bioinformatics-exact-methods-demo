import React from 'react';
import type { Language } from '../i18n/types';
import { Link } from './Navigation';
import { Icon } from './Icons';

interface MethodMapProps {
  lang: Language;
  navigate: (path: string) => void;
}

type Method = {
  id: string;
  name: string;
  label: string;
  desc: string;
  route: string;
};

type MethodMapCopy = {
  title: string;
  subtitle: string;
  source2025: string;
  source2022: string;
  runnableTitle: string;
  referenceTitle: string;
  runnableBadge: string;
  referenceBadge: string;
  notRunnable: string;
  learnMore: string;
  run: string;
  compare: string;
  runnable: Method[];
  reference: Method[];
};

const content: Record<Language, MethodMapCopy> = {
  fr: {
    title: 'Carte des Méthodes de Recherche',
    subtitle: 'Les démonstrations exécutables sont séparées des méthodes papier qui restent seulement documentées ici.',
    source2025: 'Source 2025 : "Constraint programming approaches for finding conserved metabolic and genomic patterns"',
    source2022: 'Source 2022 : "Improved approaches to solve the One-To-One SkewGraM problem"',
    runnableTitle: 'Runnable demonstrations',
    referenceTitle: 'Reference-only methods',
    runnableBadge: 'Démonstration exécutable',
    referenceBadge: 'Référence seulement',
    notRunnable: 'Non exécutable dans la démonstration acyclique actuelle.',
    learnMore: 'En savoir plus',
    run: 'Ouvrir',
    compare: 'Voir le laboratoire CP2+',
    runnable: [
      { id: 'legacy', name: 'Legacy Enumeration', label: 'Baseline exact', desc: 'Énumération exhaustive exacte des chemins de D avec test de connexité induite dans G.', route: '/legacy' },
      { id: 'cp1', name: 'CP1', label: '2025', desc: 'Programmation par contraintes pour le plus long chemin (D,G)-cohérent dans un DAG.', route: '/methods/cp1' },
      { id: 'cp2', name: 'CP2', label: '2025', desc: 'CP1 avec borne supérieure dirigée sûre pour couper les branches sous-optimales.', route: '/methods/cp2' },
      { id: 'cp2-plus', name: 'CP2+', label: 'Exact integration', desc: 'CP2 avec propagation génomique sûre quand les sommets atteignables ne peuvent plus reconnecter G.', route: '/methods/cp2-plus' },
      { id: 'algobb', name: 'AlgoBB++', label: '2022', desc: 'Branch-and-bound borné avec exploration arc par arc dans D et validation de connexité dans G.', route: '/methods/algobb-plus-plus' },
      { id: 'ilp1', name: 'ILP1', label: '2022', desc: 'Formulation éducative bornée avec variables binaires x/y/z et témoin de connexité génomique.', route: '/methods/ilp1' },
      { id: 'ilp2', name: 'ILP2', label: '2022', desc: 'Formulation éducative avec racine génomique, liens parents et niveaux.', route: '/methods/ilp2' },
      { id: 'subset-dp', name: 'Subset DP', label: 'Méthode exacte pédagogique', desc: 'Programmation dynamique exacte sur sous-ensemble et dernier sommet pour petits graphes.', route: '/methods/subset-dp' },
      { id: 'random-graph-demo-lab', name: 'Laboratoire de graphes aléatoires', label: 'Generated demo', desc: 'Génère des DAG reproductibles et compare les méthodes applicables lorsque c’est sûr.', route: '/methods/random-graph-lab' },
    ],
    reference: [
      { id: 'cp3', name: 'CP3', label: '2025 cyclic trail', desc: 'Méthode de pistes (trails) pour graphes avec cycles; elle ne s’applique pas au laboratoire acyclique de chemins.', route: '/methods/cp3' },
      { id: 'cp4', name: 'CP4', label: '2025 cyclic trail', desc: 'CP3 avec stratégie Walk-and-Cover pour pistes dans graphes cycliques, pas pour la démo acyclique actuelle.', route: '/methods/cp4' },
      { id: 'hnet', name: 'HNet', label: '2022 trail baseline', desc: 'Méthode antérieure de recherche de pistes servant de référence papier.', route: '/methods/hnet' },
      { id: 'enumeration', name: 'Arc-by-Arc & Nogoods Enumeration', label: 'Concept', desc: 'Concept papier d’énumération arc par arc et nogoods; la démo exécutable correspondante est Legacy Enumeration.', route: '/methods/enumeration' },
      { id: 'conservation', name: 'Trail Grouping & Conservation', label: 'Concept', desc: 'Concepts biologiques de regroupement de pistes et de conservation métabolique.', route: '/methods/conservation' },
    ],
  },
  en: {
    title: 'Research Methods Map',
    subtitle: 'Runnable demos are separated from paper methods that are only documented here.',
    source2025: '2025 Source: "Constraint programming approaches for finding conserved metabolic and genomic patterns"',
    source2022: '2022 Source: "Improved approaches to solve the One-To-One SkewGraM problem"',
    runnableTitle: 'Runnable demonstrations',
    referenceTitle: 'Reference-only methods',
    runnableBadge: 'Runnable demo',
    referenceBadge: 'Reference-only',
    notRunnable: 'Not runnable in the current acyclic demonstration.',
    learnMore: 'Learn More',
    run: 'Open',
    compare: 'View CP2+ Comparison Lab',
    runnable: [
      { id: 'legacy', name: 'Legacy Enumeration', label: 'Baseline exact', desc: 'Exact exhaustive enumeration of D paths with induced-G connectivity checks.', route: '/legacy' },
      { id: 'cp1', name: 'CP1', label: '2025', desc: 'Constraint programming for the longest (D,G)-consistent path in a DAG.', route: '/methods/cp1' },
      { id: 'cp2', name: 'CP2', label: '2025', desc: 'CP1 with a safe directed upper bound for pruning sub-optimal branches.', route: '/methods/cp2' },
      { id: 'cp2-plus', name: 'CP2+', label: 'Exact integration', desc: 'CP2 with safe genomic propagation when reachable vertices can no longer reconnect G.', route: '/methods/cp2-plus' },
      { id: 'algobb', name: 'AlgoBB++', label: '2022', desc: 'Bounded branch-and-bound with arc-by-arc exploration in D and connectivity validation in G.', route: '/methods/algobb-plus-plus' },
      { id: 'ilp1', name: 'ILP1', label: '2022', desc: 'Bounded educational formulation with binary x/y/z variables and a genomic connectivity witness.', route: '/methods/ilp1' },
      { id: 'ilp2', name: 'ILP2', label: '2022', desc: 'Educational rooted-level formulation with genomic root, parent links, and levels.', route: '/methods/ilp2' },
      { id: 'subset-dp', name: 'Subset DP', label: 'Educational exact method', desc: 'Exact dynamic programming over subset and endpoint for small graphs.', route: '/methods/subset-dp' },
      { id: 'random-graph-demo-lab', name: 'Random Graph Lab', label: 'Generated demo', desc: 'Generates reproducible DAGs and compares applicable methods when safe.', route: '/methods/random-graph-lab' },
    ],
    reference: [
      { id: 'cp3', name: 'CP3', label: '2025 cyclic trail', desc: 'Trail method for graphs with cycles; it is not applicable to the acyclic path lab.', route: '/methods/cp3' },
      { id: 'cp4', name: 'CP4', label: '2025 cyclic trail', desc: 'CP3 plus Walk-and-Cover for cyclic-graph trails, not the current acyclic path demo.', route: '/methods/cp4' },
      { id: 'hnet', name: 'HNet', label: '2022 trail baseline', desc: 'Prior exact trail-search method used as a paper reference baseline.', route: '/methods/hnet' },
      { id: 'enumeration', name: 'Arc-by-Arc & Nogoods Enumeration', label: 'Concept', desc: 'Paper concept for arc-by-arc enumeration and nogoods; the runnable counterpart is Legacy Enumeration.', route: '/methods/enumeration' },
      { id: 'conservation', name: 'Trail Grouping & Conservation', label: 'Concept', desc: 'Biological concepts for trail grouping and metabolic conservation.', route: '/methods/conservation' },
    ],
  },
  ar: {
    title: 'خريطة طرق البحث العلمي',
    subtitle: 'تُفصل العروض القابلة للتشغيل عن طرق الأوراق العلمية الموثقة فقط هنا.',
    source2025: 'مصدر ٢٠٢٥: "Constraint programming approaches for finding conserved metabolic and genomic patterns"',
    source2022: 'مصدر ٢٠٢٢: "Improved approaches to solve the One-To-One SkewGraM problem"',
    runnableTitle: 'Runnable demonstrations',
    referenceTitle: 'Reference-only methods',
    runnableBadge: 'عرض قابل للتشغيل',
    referenceBadge: 'مرجع فقط',
    notRunnable: 'غير قابلة للتشغيل في العرض الحالي الخالي من الدورات.',
    learnMore: 'اقرأ المزيد',
    run: 'فتح',
    compare: 'عرض مختبر مقارنة CP2+',
    runnable: [
      { id: 'legacy', name: 'Legacy Enumeration', label: 'Baseline exact', desc: 'تعداد شامل دقيق لمسارات D مع فحص اتصال G المستحث.', route: '/legacy' },
      { id: 'cp1', name: 'CP1', label: '2025', desc: 'برمجة بالقيود لإيجاد أطول مسار متسق (D,G) في DAG.', route: '/methods/cp1' },
      { id: 'cp2', name: 'CP2', label: '2025', desc: 'CP1 مع حد أعلى موجه وآمن لتقليم الفروع دون المثلى.', route: '/methods/cp2' },
      { id: 'cp2-plus', name: 'CP2+', label: 'Exact integration', desc: 'CP2 مع انتشار جينومي آمن عندما لا تستطيع الرؤوس القابلة للوصول إعادة وصل G.', route: '/methods/cp2-plus' },
      { id: 'algobb', name: 'AlgoBB++', label: '2022', desc: 'تفريع وتقييد محدود مع استكشاف قوس تلو الآخر في D والتحقق من الاتصال في G.', route: '/methods/algobb-plus-plus' },
      { id: 'ilp1', name: 'ILP1', label: '2022', desc: 'صياغة تعليمية محدودة بمتغيرات x/y/z ثنائية وشاهد اتصال جينومي.', route: '/methods/ilp1' },
      { id: 'ilp2', name: 'ILP2', label: '2022', desc: 'صياغة تعليمية بجذر جينومي وروابط آباء ومستويات.', route: '/methods/ilp2' },
      { id: 'subset-dp', name: 'Subset DP', label: 'Educational exact', desc: 'برمجة ديناميكية دقيقة على subset وآخر رأس للمخططات الصغيرة.', route: '/methods/subset-dp' },
      { id: 'random-graph-demo-lab', name: 'مختبر المخططات العشوائية', label: 'Generated demo', desc: 'ينشئ DAGs قابلة للتكرار ويقارن الطرق القابلة للتطبيق عندما يكون ذلك آمناً.', route: '/methods/random-graph-lab' },
    ],
    reference: [
      { id: 'cp3', name: 'CP3', label: '2025 cyclic trail', desc: 'طريقة آثار (trails) للمخططات التي تحتوي على دورات؛ لا تنطبق على مختبر المسارات الخالي من الدورات.', route: '/methods/cp3' },
      { id: 'cp4', name: 'CP4', label: '2025 cyclic trail', desc: 'CP3 مع Walk-and-Cover لآثار المخططات الدائرية، وليس للعرض الحالي الخالي من الدورات.', route: '/methods/cp4' },
      { id: 'hnet', name: 'HNet', label: '2022 trail baseline', desc: 'طريقة دقيقة سابقة للبحث عن الآثار تستخدم كمرجع في الأوراق العلمية.', route: '/methods/hnet' },
      { id: 'enumeration', name: 'Arc-by-Arc & Nogoods Enumeration', label: 'Concept', desc: 'مفهوم ورقي للتعداد قوساً بقوس وقيود nogoods؛ النظير القابل للتشغيل هو Legacy Enumeration.', route: '/methods/enumeration' },
      { id: 'conservation', name: 'Trail Grouping & Conservation', label: 'Concept', desc: 'مفاهيم بيولوجية لتجميع الآثار والحفظ الاستقلابي.', route: '/methods/conservation' },
    ],
  },
};

export const MethodMap: React.FC<MethodMapProps> = ({ lang, navigate }) => {
  const isAr = lang === 'ar';
  const t = content[lang];

  const renderMethod = (method: Method, runnable: boolean) => (
    <article key={method.id} className="card" data-testid={`method-map-${method.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 'var(--space-sm)', marginBlockEnd: 'var(--space-sm)' }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: runnable ? 'var(--primary)' : 'var(--neutral-medium)',
          backgroundColor: runnable ? 'var(--primary-bg)' : 'var(--neutral-bg-hover)',
          paddingBlock: 'var(--space-xs)',
          paddingInline: 'var(--space-sm)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <span className="icon-label">
            <Icon name={runnable ? 'check' : 'info'} size={15} />
            {runnable ? t.runnableBadge : t.referenceBadge}
          </span>
        </span>
        <span dir="ltr" style={{ fontSize: '0.8rem', color: 'var(--neutral-light)', fontWeight: 700 }}>
          {method.label}
        </span>
      </div>

      <h3 dir="ltr" style={{ fontSize: '1.15rem', color: 'var(--neutral-dark)', marginBlockEnd: 'var(--space-xs)' }}>
        <span className="icon-label">
          <Icon name={method.id === 'algobb' ? 'route' : method.id === 'cp1' ? 'network' : 'book'} size={18} />
          {method.name}
        </span>
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--neutral-medium)', marginBlockEnd: 'var(--space-sm)' }}>
        {method.desc}
      </p>
      {!runnable && (
        <p style={{ fontWeight: 800, color: 'var(--primary)', marginBlockEnd: 'var(--space-md)' }}>
          {t.notRunnable}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <Link
          to={method.route}
          navigate={navigate}
          className={runnable ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ minHeight: 38, fontSize: '0.85rem', width: 'auto', paddingBlock: 4, paddingInline: 'var(--space-md)' }}
        >
          {runnable ? t.run : t.learnMore}
        </Link>
        {method.id === 'cp2-plus' && (
          <Link
            to="/methods/cp2-plus/comparison"
            navigate={navigate}
            className="btn btn-secondary"
            style={{ minHeight: 38, fontSize: '0.85rem', width: 'auto', paddingBlock: 4, paddingInline: 'var(--space-md)' }}
          >
            {t.compare}
          </Link>
        )}
      </div>
    </article>
  );

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <header style={{ marginBlockEnd: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.75rem', color: 'var(--primary)' }}>{t.title}</h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--neutral-medium)' }}>{t.subtitle}</p>
        <div style={{
          padding: 'var(--space-md)',
          backgroundColor: 'var(--primary-bg)',
          borderLeft: isAr ? 'none' : '4px solid var(--primary)',
          borderRight: isAr ? '4px solid var(--primary)' : 'none',
          borderRadius: 'var(--radius-sm)',
          marginBlockStart: 'var(--space-md)',
          fontSize: '0.9rem',
          fontStyle: 'italic',
          color: 'var(--primary)'
        }}>
          <div dir="ltr">{t.source2025}</div>
          <div dir="ltr" style={{ marginBlockStart: 'var(--space-xs)' }}>{t.source2022}</div>
        </div>
      </header>

      <section aria-labelledby="method-map-runnable" style={{ marginBlockEnd: 'var(--space-xl)' }}>
        <h3 id="method-map-runnable" style={{ color: 'var(--primary)', fontSize: '1.35rem' }}>{t.runnableTitle}</h3>
        <div className="grid grid-2">
          {t.runnable.map((method) => renderMethod(method, true))}
        </div>
      </section>

      <section aria-labelledby="method-map-reference" style={{ marginBlockEnd: 'var(--space-xl)' }}>
        <h3 id="method-map-reference" style={{ color: 'var(--primary)', fontSize: '1.35rem' }}>{t.referenceTitle}</h3>
        <div className="grid grid-2">
          {t.reference.map((method) => renderMethod(method, false))}
        </div>
      </section>
    </div>
  );
};
