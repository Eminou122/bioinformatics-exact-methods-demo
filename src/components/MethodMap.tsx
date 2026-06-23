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
    runLegacy: string;
    methods: {
      id: string;
      name: string;
      paper: string;
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
          badge: 'reference',
          desc: 'Étend CP1 en ajoutant une borne supérieure pour élaguer efficacement les branches sous-optimales.',
          route: '/methods/cp2'
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
          badge: 'reference',
          desc: 'Formulation PLNE (Programmation Linéaire en Nombres Entiers) avec une première modélisation de la connexité.',
          route: '/methods/ilp1'
        },
        {
          id: 'ilp2',
          name: 'ILP2 (Formulation PLNE alternative)',
          paper: '2022',
          badge: 'reference',
          desc: 'Formulation alternative PLNE optimisant les flux de connectivité génomique.',
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
          badge: 'reference',
          desc: 'Extends CP1 by adding an upper-bound constraint to efficiently prune sub-optimal branches.',
          route: '/methods/cp2'
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
          badge: 'reference',
          desc: 'ILP formulation using a single network connectivity formulation.',
          route: '/methods/ilp1'
        },
        {
          id: 'ilp2',
          name: 'ILP2 (Alternate ILP)',
          paper: '2022',
          badge: 'reference',
          desc: 'Alternative ILP formulation with optimized flow connectivity constraints.',
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
          badge: 'reference',
          desc: 'يوسع CP1 بإضافة قيد الحد الأعلى لتقليم الفروع غير المثيرة للاهتمام بكفاءة.',
          route: '/methods/cp2'
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
          badge: 'reference',
          desc: 'صياغة البرمجة الخطية الصحيحة مع تمثيل واحد للاتصال الجيني.',
          route: '/methods/ilp1'
        },
        {
          id: 'ilp2',
          name: 'ILP2 (صياغة برمجة خطية بديلة)',
          paper: '2022',
          badge: 'reference',
          desc: 'صياغة برمجة خطية صحيحة بديلة مع قيود اتصال محسنة للتدفق.',
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
                    {method.paper} Paper
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
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
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
                    {method.id === 'cp1' ? t.runCP1 : t.learnMore}
                  </Link>
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
