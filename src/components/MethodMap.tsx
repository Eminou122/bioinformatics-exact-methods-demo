import React from 'react';
import type { Language } from '../i18n/types';
import { Link } from './Navigation';
import { Icon } from './Icons';

interface MethodMapProps {
  lang: Language;
  navigate: (path: string) => void;
}

export const MethodMap: React.FC<MethodMapProps> = ({ lang, navigate }) => {
  const isAr = lang === 'ar';
  
  const content: Record<Language, {
    title: string;
    subtitle: string;
    source2025: string;
    source2022: string;
    badgeExact: string;
    badgeSimulation: string;
    badgeReference: string;
    learnMore: string;
      runCP1: string;
      runCP2: string;
      runCP2Comparison: string;
      runSubsetDp: string;
      runILP1: string;
      runILP2: string;
      runLegacy: string;
    methods: {
      id: string;
      name: string;
      paper?: string;
      sourceLabel?: string;
      badge: 'exact' | 'simulation' | 'reference';
      desc: string;
      route?: string;
    }[];
  }> = {
    fr: {
      title: 'Carte des Méthodes de Recherche',
      subtitle: 'Classification des approches exactes pour la cohérence métabolisme-génome issue des publications de 2022 et 2025.',
      source2025: 'Source 2025 : "Constraint programming approaches for finding conserved metabolic and genomic patterns"',
      source2022: 'Source 2022 : "Improved approaches to solve the One-To-One SkewGraM problem"',
      badgeExact: 'Implémentation graphe borné exact',
      badgeSimulation: 'Simulation pédagogique',
      badgeReference: 'Méthode de référence papier',
      learnMore: 'En savoir plus',
      runCP1: 'Lancer l\'application CP1',
      runCP2: 'Lancer l\'application CP2',
      runCP2Comparison: 'Voir le laboratoire CP2+',
      runSubsetDp: 'Lancer Subset DP',
      runILP1: 'Lancer l\'application ILP1',
      runILP2: 'Lancer l\'application ILP2',
      runLegacy: 'Lancer la démo énumération',
      methods: [
        {
          id: 'cp1',
          name: 'CP1 (Constraint Programming 1)',
          paper: '2025',
          badge: 'exact',
          desc: 'Méthode de programmation par contraintes pour trouver le plus long chemin (D,G)-cohérent dans un DAG.',
          route: '/methods/cp1'
        },
        {
          id: 'cp2',
          name: 'CP2 (CP avec borne supérieure)',
          paper: '2025',
          badge: 'exact',
          desc: 'Implémentation exacte pour petits DAG : CP1 avec borne supérieure sûre pour élaguer des branches sous-optimales.',
          route: '/methods/cp2'
        },
        {
          id: 'cp2-plus',
          name: 'CP2+ (propagation génomique sûre)',
          sourceLabel: 'Intégration éducative exacte',
          badge: 'exact',
          desc: 'CP2 avec un élagage précoce sûr lorsque les sommets atteignables vers l’avant ne peuvent plus reconnecter le chemin dans G.',
          route: '/methods/cp2-plus'
        },
        {
          id: 'subset-dp',
          name: 'Exact Subset Dynamic Programming',
          sourceLabel: 'Méthode exacte pédagogique',
          badge: 'exact',
          desc: 'Programmation dynamique exacte sur subset et dernier sommet; exacte seulement pour petits graphes quand la recherche se termine.',
          route: '/methods/subset-dp'
        },
        {
          id: 'cp3',
          name: 'CP3 (Trail Solver dans les cycles)',
          paper: '2025',
          badge: 'reference',
          desc: 'Gère les pistes (trails) dans les graphes cycliques en construisant un sous-graphe eulérien.',
          route: '/methods/cp3'
        },
        {
          id: 'cp4',
          name: 'CP4 (CP3 avec Walk & Cover)',
          paper: '2025',
          badge: 'reference',
          desc: 'CP3 augmenté de la stratégie d\'embranchement Walk-and-Cover pour privilégier les sommets non couverts.',
          route: '/methods/cp4'
        },
        {
          id: 'algobb',
          name: 'AlgoBB++',
          paper: '2022',
          badge: 'exact',
          desc: 'Implémentation exacte pour petits graphes : branch-and-bound borné avec exploration arc par arc dans D et validation de connexité dans G.',
          route: '/methods/algobb-plus-plus'
        },
        {
          id: 'ilp1',
          name: 'ILP1 (Integer Linear Programming 1)',
          paper: '2022',
          badge: 'exact',
          desc: 'Formulation éducative bornée exacte pour petits DAG : variables binaires x/y/z et témoin de connexité génomique.',
          route: '/methods/ilp1'
        },
        {
          id: 'ilp2',
          name: 'ILP2 (Racine et niveaux)',
          paper: '2022',
          badge: 'exact',
          desc: 'Implémentation exacte pour petits DAG : formulation éducative avec racine génomique, liens parents et niveaux.',
          route: '/methods/ilp2'
        },
        {
          id: 'hnet',
          name: 'HNet',
          paper: '2022',
          badge: 'reference',
          desc: 'Méthode exacte antérieure de recherche de pistes (trails) servant de référence de comparaison.',
          route: '/methods/hnet'
        },
        {
          id: 'enumeration',
          name: 'Énumération Arc-par-Arc & Nogoods',
          paper: '2022/2025',
          badge: 'simulation',
          desc: 'Recherche exhaustive de chemins dans D. (La démo historique est préservée sous /legacy).',
          route: '/methods/enumeration'
        },
        {
          id: 'conservation',
          name: 'Regroupement de Pistes & Conservation',
          paper: '2022/2025',
          badge: 'reference',
          desc: 'Concepts de regroupement de pistes biologiques strictes pour interpréter la conservation métabolique.',
          route: '/methods/conservation'
        }
      ]
    },
    en: {
      title: 'Research Methods Map',
      subtitle: 'Classification of exact approaches for metabolic-genomic consistency from the 2022 and 2025 publications.',
      source2025: '2025 Source: "Constraint programming approaches for finding conserved metabolic and genomic patterns"',
      source2022: '2022 Source: "Improved approaches to solve the One-To-One SkewGraM problem"',
      badgeExact: 'Exact small-graph implementation',
      badgeSimulation: 'Educational simulation',
      badgeReference: 'Paper-reference method',
      learnMore: 'Learn More',
      runCP1: 'Launch CP1 Solver App',
      runCP2: 'Launch CP2 Solver App',
      runCP2Comparison: 'View CP2+ Comparison Lab',
      runSubsetDp: 'Launch Subset DP',
      runILP1: 'Launch ILP1 Solver App',
      runILP2: 'Launch ILP2 Solver App',
      runLegacy: 'Launch Legacy Enumeration',
      methods: [
        {
          id: 'cp1',
          name: 'CP1 (Constraint Programming 1)',
          paper: '2025',
          badge: 'exact',
          desc: 'Constraint programming method for finding the longest (D,G)-consistent path in a DAG.',
          route: '/methods/cp1'
        },
        {
          id: 'cp2',
          name: 'CP2 (CP with Upper Bound)',
          paper: '2025',
          badge: 'exact',
          desc: 'Exact small-DAG implementation: CP1 with a safe upper bound for pruning sub-optimal branches.',
          route: '/methods/cp2'
        },
        {
          id: 'cp2-plus',
          name: 'CP2+ (Safe Genomic Propagation)',
          sourceLabel: 'Educational exact integration',
          badge: 'exact',
          desc: 'CP2 with a safe early prune when forward-reachable vertices can no longer reconnect the path in G.',
          route: '/methods/cp2-plus'
        },
        {
          id: 'subset-dp',
          name: 'Exact Subset Dynamic Programming',
          sourceLabel: 'Educational exact method',
          badge: 'exact',
          desc: 'Exact dynamic programming over subset and endpoint; exact only for small graphs when the search completes.',
          route: '/methods/subset-dp'
        },
        {
          id: 'cp3',
          name: 'CP3 (Trail Solver in Cycles)',
          paper: '2025',
          badge: 'reference',
          desc: 'Handles trails in graphs containing cycles by constructing an Eulerian subgraph.',
          route: '/methods/cp3'
        },
        {
          id: 'cp4',
          name: 'CP4 (CP3 with Walk & Cover)',
          paper: '2025',
          badge: 'reference',
          desc: 'CP3 augmented with the Walk-and-Cover branching strategy to prefer uncovered vertices.',
          route: '/methods/cp4'
        },
        {
          id: 'algobb',
          name: 'AlgoBB++',
          paper: '2022',
          badge: 'exact',
          desc: 'Exact small-graph implementation: bounded branch-and-bound with arc-by-arc exploration in D and connectivity validation in G.',
          route: '/methods/algobb-plus-plus'
        },
        {
          id: 'ilp1',
          name: 'ILP1 (Integer Linear Programming 1)',
          paper: '2022',
          badge: 'exact',
          desc: 'Exact bounded educational formulation for small DAGs: binary x/y/z variables and a genomic connectivity witness.',
          route: '/methods/ilp1'
        },
        {
          id: 'ilp2',
          name: 'ILP2 (Rooted Levels)',
          paper: '2022',
          badge: 'exact',
          desc: 'Exact small-DAG implementation: educational root, parent-link, and level formulation for genomic connectivity.',
          route: '/methods/ilp2'
        },
        {
          id: 'hnet',
          name: 'HNet',
          paper: '2022',
          badge: 'reference',
          desc: 'Prior exact trail search method used as a comparison baseline.',
          route: '/methods/hnet'
        },
        {
          id: 'enumeration',
          name: 'Arc-by-Arc & Nogoods Enumeration',
          paper: '2022/2025',
          badge: 'simulation',
          desc: 'Exhaustive path search in D. (Legacy exact explorer is preserved under /legacy).',
          route: '/methods/enumeration'
        },
        {
          id: 'conservation',
          name: 'Trail Grouping & Conservation',
          paper: '2022/2025',
          badge: 'reference',
          desc: 'Biological interpretation concepts utilizing strict trail grouping and conservation patterns.',
          route: '/methods/conservation'
        }
      ]
    },
    ar: {
      title: 'خريطة طرق البحث العلمي',
      subtitle: 'تصنيف الأساليب الدقيقة للاتساق بين الاستقلاب والجينوم من منشورات عامي ٢٠٢٢ و ٢٠٢٥.',
      source2025: 'مصدر ٢٠٢٥: "Constraint programming approaches for finding conserved metabolic and genomic patterns"',
      source2022: 'مصدر ٢٠٢٢: "Improved approaches to solve the One-To-One SkewGraM problem"',
      badgeExact: 'تطبيق عملي دقيق للمخططات المحدودة',
      badgeSimulation: 'محاكاة تعليمية',
      badgeReference: 'طريقة مرجعية من الأوراق العلمية',
      learnMore: 'اقرأ المزيد',
      runCP1: 'تشغيل نموذج CP1',
      runCP2: 'تشغيل نموذج CP2',
      runCP2Comparison: 'عرض مختبر مقارنة CP2+',
      runSubsetDp: 'تشغيل Subset DP',
      runILP1: 'تشغيل نموذج ILP1',
      runILP2: 'تشغيل نموذج ILP2',
      runLegacy: 'تشغيل محاكاة التعداد القديمة',
      methods: [
        {
          id: 'cp1',
          name: 'CP1 (البرمجة بالقيود ١)',
          paper: '2025',
          badge: 'exact',
          desc: 'أسلوب البرمجة بالقيود للعثور على أطول مسار متسق (D,G) في مخطط موجه خالي من الدورات (DAG).',
          route: '/methods/cp1'
        },
        {
          id: 'cp2',
          name: 'CP2 (البرمجة بالقيود مع حد أعلى)',
          paper: '2025',
          badge: 'exact',
          desc: 'تطبيق دقيق لمخططات DAG الصغيرة: CP1 مع حد أعلى آمن لتقليم الفروع دون المثلى.',
          route: '/methods/cp2'
        },
        {
          id: 'cp2-plus',
          name: 'CP2+ (انتشار جينومي آمن)',
          sourceLabel: 'دمج تعليمي دقيق',
          badge: 'exact',
          desc: 'CP2 مع تقليم مبكر آمن عندما تعجز الرؤوس القابلة للوصول إلى الأمام عن إعادة وصل المسار في G.',
          route: '/methods/cp2-plus'
        },
        {
          id: 'subset-dp',
          name: 'Exact Subset Dynamic Programming',
          sourceLabel: 'طريقة تعليمية دقيقة',
          badge: 'exact',
          desc: 'برمجة ديناميكية دقيقة على subset وآخر رأس؛ دقيقة فقط للرسوم الصغيرة عند اكتمال البحث.',
          route: '/methods/subset-dp'
        },
        {
          id: 'cp3',
          name: 'CP3 (محلل الأثر في الدورات)',
          paper: '2025',
          badge: 'reference',
          desc: 'يتعامل مع الآثار (trails) في المخططات التي قد تحتوي على دورات عن طريق بناء مخطط فرعي أويلري.',
          route: '/methods/cp3'
        },
        {
          id: 'cp4',
          name: 'CP4 (CP3 مع Walk & Cover)',
          paper: '2025',
          badge: 'reference',
          desc: 'CP3 معززاً باستراتيجية التفريع Walk-and-Cover لتفضيل التوسع نحو الرؤوس غير المغطاة.',
          route: '/methods/cp4'
        },
        {
          id: 'algobb',
          name: 'AlgoBB++',
          paper: '2022',
          badge: 'exact',
          desc: 'تطبيق دقيق للمخططات الصغيرة: تفريع وتقييد محدود مع استكشاف قوس تلو الآخر في D والتحقق من الاتصال في G.',
          route: '/methods/algobb-plus-plus'
        },
        {
          id: 'ilp1',
          name: 'ILP1 (البرمجة الخطية الصحيحة ١)',
          paper: '2022',
          badge: 'exact',
          desc: 'صياغة تعليمية دقيقة ومحدودة لمخططات DAG الصغيرة: متغيرات x/y/z ثنائية وشاهد اتصال جينومي.',
          route: '/methods/ilp1'
        },
        {
          id: 'ilp2',
          name: 'ILP2 (الجذر والمستويات)',
          paper: '2022',
          badge: 'exact',
          desc: 'تطبيق دقيق لمخططات DAG الصغيرة: صياغة تعليمية بجذر جينومي وروابط آباء ومستويات.',
          route: '/methods/ilp2'
        },
        {
          id: 'hnet',
          name: 'HNet',
          paper: '2022',
          badge: 'reference',
          desc: 'طريقة دقيقة سابقة للبحث عن الأثر تستخدم كمعيار للمقارنة.',
          route: '/methods/hnet'
        },
        {
          id: 'enumeration',
          name: 'التعداد التفصيلي للقوس تلو الآخر',
          paper: '2022/2025',
          badge: 'simulation',
          desc: 'البحث الشامل لجميع المسارات في D. (تم الاحتفاظ بالبرنامج القديم تحت الرابط /legacy).',
          route: '/methods/enumeration'
        },
        {
          id: 'conservation',
          name: 'تجميع المسارات وحفظها',
          paper: '2022/2025',
          badge: 'reference',
          desc: 'مفاهيم تجميع الأثر البيولوجي الدقيق لتفسير الحفظ الاستقلابي.',
          route: '/methods/conservation'
        }
      ]
    }
  };

  const t = content[lang];

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
          <div>{t.source2025}</div>
          <div style={{ marginBlockStart: 'var(--space-xs)' }}>{t.source2022}</div>
        </div>
      </header>

      <div className="grid grid-2" style={{ marginBlockEnd: 'var(--space-xl)' }}>
        {t.methods.map((method) => {
          let badgeText = t.badgeReference;
          let badgeColor = 'var(--neutral-medium)';
          let badgeBg = 'var(--neutral-bg-hover)';

          if (method.badge === 'exact') {
            badgeText = t.badgeExact;
            badgeColor = 'var(--primary)';
            badgeBg = 'var(--primary-bg)';
          } else if (method.badge === 'simulation') {
            badgeText = t.badgeSimulation;
            badgeColor = 'var(--accent-gold)';
            badgeBg = 'var(--accent-gold-bg)';
          }

          return (
            <div key={method.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: 'var(--space-sm)' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: badgeColor,
                    backgroundColor: badgeBg,
                    paddingBlock: 'var(--space-xs)',
                    paddingInline: 'var(--space-sm)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <span className="icon-label">
                      <Icon name={method.badge === 'exact' ? 'check' : method.badge === 'simulation' ? 'route' : 'info'} size={15} />
                      {badgeText}
                    </span>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--neutral-light)', fontWeight: 600 }}>
                    {method.sourceLabel ?? `${method.paper} Paper`}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.2rem', color: 'var(--neutral-dark)', marginBlockEnd: 'var(--space-xs)' }}>
                  <span className="icon-label">
                    <Icon name={method.id === 'algobb' ? 'route' : method.id === 'cp1' ? 'network' : 'book'} size={18} />
                    {method.name}
                  </span>
                </h3>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--neutral-medium)', marginBlockEnd: 'var(--space-md)' }}>
                  {method.desc}
                </p>
              </div>

              {method.route && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                  <Link 
                    to={method.route} 
                    navigate={navigate}
                    className="btn btn-primary"
                    style={{ 
                      minHeight: '38px',
                      fontSize: '0.85rem',
                      width: 'auto',
                      paddingBlock: '4px',
                      paddingInline: 'var(--space-md)'
                    }}
                  >
                    {method.id === 'cp1' ? t.runCP1 : method.id === 'cp2' ? t.runCP2 : method.id === 'subset-dp' ? t.runSubsetDp : method.id === 'ilp1' ? t.runILP1 : method.id === 'ilp2' ? t.runILP2 : t.learnMore}
                  </Link>
                  {method.id === 'cp2-plus' && (
                    <Link
                      to="/methods/cp2-plus/comparison"
                      navigate={navigate}
                      className="btn btn-secondary"
                      style={{ minHeight: '38px', fontSize: '0.85rem', width: 'auto', paddingBlock: 4, paddingInline: 'var(--space-md)' }}
                    >
                      {t.runCP2Comparison}
                    </Link>
                  )}
                  {method.id === 'enumeration' && (
                    <Link 
                      to="/legacy" 
                      navigate={navigate}
                      className="btn btn-secondary"
                      style={{ 
                        minHeight: '38px',
                        fontSize: '0.85rem',
                        width: 'auto',
                        paddingBlock: '4px',
                        paddingInline: 'var(--space-md)'
                      }}
                    >
                      {t.runLegacy}
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
