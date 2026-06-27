import React from 'react';
import type { Language } from '../i18n/types';
import { Link } from './Navigation';

interface MethodPlaceholdersProps {
  methodId: string;
  lang: Language;
  navigate: (path: string) => void;
}

export const MethodPlaceholders: React.FC<MethodPlaceholdersProps> = ({ methodId, lang, navigate }) => {
  const isAr = lang === 'ar';
  const referenceOnlyNote: Record<Language, string> = {
    fr: 'Référence seulement : non exécutable dans la démonstration acyclique actuelle.',
    en: 'Reference-only: not runnable in the current acyclic demonstration.',
    ar: 'مرجع فقط: غير قابل للتشغيل في العرض الحالي الخالي من الدورات.'
  };

  const explanations: Record<string, Record<Language, { title: string; badge: string; text: string; linkText: string }>> = {
    cp2: {
      fr: {
        title: 'CP2 — Programmation par Contraintes avec Borne Supérieure',
        badge: 'Méthode de référence papier',
        text: 'CP2 étend CP1 en ajoutant une contrainte de borne supérieure. Puisque D est acyclique, le plus long chemin restant possible peut être calculé efficacement, permettant au solveur d\'élaguer les branches qui ne peuvent pas battre la meilleure solution actuelle.',
        linkText: 'Retour aux méthodes'
      },
      en: {
        title: 'CP2 — Constraint Programming with Upper Bound',
        badge: 'Paper-reference method',
        text: 'CP2 extends CP1 by adding an upper-bound constraint. Since D is acyclic, the longest possible remaining path can be calculated efficiently, allowing the solver to prune branches that cannot beat the current best solution.',
        linkText: 'Back to methods'
      },
      ar: {
        title: 'CP2 — البرمجة بالقيود مع حد أعلى',
        badge: 'طريقة مرجعية من الأوراق العلمية',
        text: 'يوسع CP2 نموذج CP1 بإضافة قيد الحد الأعلى. نظراً لأن D موجه وخال من الدورات، يمكن حساب أطول مسار متبقٍ ممكن بكفاءة، مما يسمح للمحلل بتقليم الفروع التي لا يمكنها التغلب على الحل الأفضل الحالي.',
        linkText: 'العودة إلى خريطة الطرق'
      }
    },
    cp3: {
      fr: {
        title: 'CP3 — Recherche de Pistes (Trails) avec Cycles',
        badge: 'Référence seulement',
        text: 'CP3 gère les pistes (trails) dans les graphes pouvant contenir des cycles. Elle construit un sous-graphe eulérien dans un graphe augmenté, puis en extrait une piste valide. Cette distinction de piste cyclique ne s’applique pas au laboratoire acyclique de chemins.',
        linkText: 'Retour aux méthodes'
      },
      en: {
        title: 'CP3 — Trail Search in Cyclic Graphs',
        badge: 'Reference-only',
        text: 'CP3 handles trails in graphs that may contain cycles. It constructs an Eulerian subgraph in an augmented graph, then extracts a trail. This cyclic-trail distinction is not applicable to the acyclic path lab.',
        linkText: 'Back to methods'
      },
      ar: {
        title: 'CP3 — البحث عن أثر (Trails) في المخططات الدائرية',
        badge: 'مرجع فقط',
        text: 'يتعامل CP3 مع الآثار في المخططات التي قد تحتوي على دورات. حيث يقوم بإنشاء مخطط فرعي أويلري في مخطط مضاف، ثم يستخرج منه أثراً صالحاً. هذا الفرق الخاص بالأثر في المخططات الدائرية لا ينطبق على مختبر المسارات الخالي من الدورات.',
        linkText: 'العودة إلى خريطة الطرق'
      }
    },
    cp4: {
      fr: {
        title: 'CP4 — CP3 avec Stratégie Walk & Cover',
        badge: 'Référence seulement',
        text: 'CP4 représente la méthode CP3 enrichie de la stratégie d\'embranchement Walk-and-Cover, qui privilégie le déplacement et l\'expansion vers des sommets non encore couverts. Comme CP3, elle concerne les pistes dans des graphes cycliques, pas la démonstration acyclique actuelle.',
        linkText: 'Retour aux méthodes'
      },
      en: {
        title: 'CP4 — CP3 with Walk & Cover Strategy',
        badge: 'Reference-only',
        text: 'CP4 is CP3 plus the walk-and-cover branching strategy, which prefers expanding toward uncovered vertices. Like CP3, it is for cyclic-graph trails, not the current acyclic path demonstration.',
        linkText: 'Back to methods'
      },
      ar: {
        title: 'CP4 — نموذج CP3 مع استراتيجية Walk & Cover',
        badge: 'مرجع فقط',
        text: 'CP4 هو عبارة عن CP3 بالإضافة إلى استراتيجية التفريع Walk-and-Cover، والتي تفضل التوسع نحو الرؤوس غير المغطاة بالمسار. ومثل CP3، فهو خاص بآثار المخططات الدائرية وليس بعرض المسارات الحالي الخالي من الدورات.',
        linkText: 'العودة إلى خريطة الطرق'
      }
    },
    algobb: {
      fr: {
        title: 'AlgoBB++ — Séparation et Évaluation Améliorée',
        badge: 'Méthode de référence papier',
        text: 'AlgoBB++ est une version hautement optimisée de l\'algorithme de Branch-and-Bound (évaluation et séparation) développée spécifiquement pour le problème One-To-One SkewGraM en 2022.',
        linkText: 'Retour aux méthodes'
      },
      en: {
        title: 'AlgoBB++ — Improved Branch-and-Bound',
        badge: 'Paper-reference method',
        text: 'AlgoBB++ is an improved branch-and-bound exact algorithm developed for solving the One-To-One SkewGraM problem.',
        linkText: 'Back to methods'
      },
      ar: {
        title: 'AlgoBB++ — خوارزمية التفريع والتقييد المحسنة',
        badge: 'طريقة مرجعية من الأوراق العلمية',
        text: 'AlgoBB++ هو خوارزمية تفريع وتقييد دقيقة ومحسنة تم تطويرها لحل مشكلة One-To-One SkewGraM في ورقة عام ٢٠٢٢.',
        linkText: 'العودة إلى خريطة الطرق'
      }
    },
    ilp1: {
      fr: {
        title: 'ILP1 — Programmation Linéaire en Nombres Entiers',
        badge: 'Méthode de référence papier',
        text: 'ILP1 est une méthode exacte formulée sous forme de programmation linéaire en nombres entiers. Elle utilise une formulation classique de connectivité réseau pour garantir la connexité du sous-graphe dans G.',
        linkText: 'Retour aux méthodes'
      },
      en: {
        title: 'ILP1 — Integer Linear Programming (Formulation 1)',
        badge: 'Paper-reference method',
        text: 'ILP1 is an integer linear programming formulation for solving the problem exactly using a single connectivity formulation.',
        linkText: 'Back to methods'
      },
      ar: {
        title: 'ILP1 — البرمجة الخطية الصحيحة (الصيغة الأولى)',
        badge: 'طريقة مرجعية من الأوراق العلمية',
        text: 'ILP1 هي صياغة برمجة خطية صحيحة لحل المشكلة بدقة باستخدام تمثيل اتصال شبكي واحد للتحقق من اتصال الجينوم.',
        linkText: 'العودة إلى خريطة الطرق'
      }
    },
    ilp2: {
      fr: {
        title: 'ILP2 — PLNE avec Formulation de Connectivité Alternative',
        badge: 'Méthode de référence papier',
        text: 'ILP2 est une alternative à ILP1. Elle modélise la contrainte de connectivité génomique via une formulation de flux de réseau différente, optimisant le nombre de variables pour certaines topologies.',
        linkText: 'Retour aux méthodes'
      },
      en: {
        title: 'ILP2 — Alternate Integer Linear Programming',
        badge: 'Paper-reference method',
        text: 'ILP2 is an alternate integer linear programming connectivity formulation designed to compare with ILP1 efficiency.',
        linkText: 'Back to methods'
      },
      ar: {
        title: 'ILP2 — صياغة برمجة خطية صحيحة بديلة',
        badge: 'طريقة مرجعية من الأوراق العلمية',
        text: 'ILP2 هي صياغة برمجة خطية صحيحة بديلة مصممة لتقييم كفاءة اتصال التدفق ومقارنتها بـ ILP1.',
        linkText: 'العودة إلى خريطة الطرق'
      }
    },
    hnet: {
      fr: {
        title: 'HNet — Algorithme de Recherche d\'Ancêtres Communs',
        badge: 'Méthode de référence papier',
        text: 'HNet est une méthode exacte de recherche de pistes (trails) utilisée historiquement comme référence de comparaison dans la littérature scientifique pour évaluer les gains des nouveaux modèles.',
        linkText: 'Retour aux méthodes'
      },
      en: {
        title: 'HNet — Reference Trail Method',
        badge: 'Paper-reference method',
        text: 'HNet is a prior exact trail search method used as a comparison baseline in scientific papers.',
        linkText: 'Back to methods'
      },
      ar: {
        title: 'HNet — طريقة الأثر المرجعية القديمة',
        badge: 'طريقة مرجعية من الأوراق العلمية',
        text: 'HNet هي طريقة دقيقة سابقة للبحث عن الأثر تستخدم كخط أساس للمقارنة والتقييم في الأوراق العلمية.',
        linkText: 'العودة إلى خريطة الطرق'
      }
    },
    enumeration: {
      fr: {
        title: 'Énumération Arc-par-Arc & Nogoods',
        badge: 'Simulation pédagogique',
        text: 'Ce concept d\'énumération explore récursivement chaque arc métabolique individuel dans D tout en générant des contraintes "nogoods" (combinaisons impossibles) pour élaguer l\'espace des solutions. La démo d\'énumération exacte correspondante est disponible sous la route /legacy.',
        linkText: 'Retour aux méthodes'
      },
      en: {
        title: 'Arc-by-Arc & Nogoods Enumeration',
        badge: 'Educational simulation',
        text: 'This enumeration concept recursively explores each metabolic arc in D while generating "nogoods" (no-good assignments) to prune the search space. The actual executable legacy simulation is preserved under the /legacy route.',
        linkText: 'Back to methods'
      },
      ar: {
        title: 'التعداد التفصيلي للقوس تلو الآخر و Nogoods',
        badge: 'محاكاة تعليمية',
        text: 'يستكشف مفهوم التعداد هذا كل قوس استقلابي في D بشكل تكراري مع توليد قيود "nogoods" لتقليم مساحة البحث. يتوفر نموذج العرض الفعلي المشابه لهذه الفئة تحت الرابط /legacy.',
        linkText: 'العودة إلى خريطة الطرق'
      }
    },
    conservation: {
      fr: {
        title: 'Regroupement de Pistes & Conservation',
        badge: 'Méthode de référence papier',
        text: 'Cette approche analyse l\'interprétation biologique de la conservation des gènes en regroupant les pistes selon des contraintes de conservation strictes, reliant directement la topologie des réseaux au contexte évolutionnaire.',
        linkText: 'Retour aux méthodes'
      },
      en: {
        title: 'Trail Grouping & Conservation Analysis',
        badge: 'Paper-reference method',
        text: 'This approach details the biological interpretation of gene conservation through strict trail grouping, directly linking metabolic network topologies to evolutionary contexts.',
        linkText: 'Back to methods'
      },
      ar: {
        title: 'تجميع المسارات وتحليل الحفظ الجيني',
        badge: 'طريقة مرجعية من الأوراق العلمية',
        text: 'يفصل هذا النهج التفسير البيولوجي للحفظ الجيني من خلال تجميع المسارات الصارم، وربط طوبولوجيا شبكة الاستقلاب بالسياقات التطورية.',
        linkText: 'العودة إلى خريطة الطرق'
      }
    }
  };

  const currentMethod = explanations[methodId] || explanations['cp2'];
  const t = currentMethod[lang];

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <div className="card" style={{ padding: 'var(--space-xl)', marginBlockEnd: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--neutral-dark)', border: 'none', margin: 0, padding: 0 }}>
            {t.title}
          </h2>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--neutral-medium)',
            backgroundColor: 'var(--neutral-bg-hover)',
            paddingBlock: 'var(--space-xs)',
            paddingInline: 'var(--space-sm)',
            borderRadius: 'var(--radius-sm)'
          }}>
            {t.badge}
          </span>
        </div>

        <p style={{ fontSize: '1.05rem', color: 'var(--neutral-medium)', marginBlockEnd: 'var(--space-xl)' }}>
          {t.text}
        </p>
        <p style={{ fontWeight: 800, color: 'var(--primary)', marginBlockEnd: 'var(--space-xl)' }}>
          {referenceOnlyNote[lang]}
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <Link 
            to="/methods" 
            navigate={navigate}
            className="btn btn-secondary"
            style={{ width: 'auto' }}
          >
            {t.linkText}
          </Link>
          {methodId === 'enumeration' && (
            <Link 
              to="/legacy" 
              navigate={navigate}
              className="btn btn-primary"
              style={{ width: 'auto' }}
            >
              {lang === 'fr' ? 'Lancer la démo énumération' : (lang === 'en' ? 'Launch legacy demo' : 'تشغيل العرض القديم')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
