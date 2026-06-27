import type { Language } from '../i18n/types';

export type RunnableMethodId =
  | 'legacy'
  | 'cp1'
  | 'cp2'
  | 'cp2-plus'
  | 'algobb-plus-plus'
  | 'ilp1'
  | 'ilp2'
  | 'subset-dp';

type MethodEducationCopy = {
  solves: string;
  works: string;
  returns: string;
  safety: string;
};

const headings = {
  fr: {
    title: 'Aperçu de la méthode',
    solves: 'Ce que cette méthode résout',
    works: 'Fonctionnement',
    returns: 'Ce que la méthode retourne',
    safety: 'Exactitude et sécurité',
  },
  en: {
    title: 'Method overview',
    solves: 'What this method solves',
    works: 'How it works',
    returns: 'What it returns',
    safety: 'Exactness and safety',
  },
  ar: {
    title: 'نظرة عامة على الطريقة',
    solves: 'ما الذي تحله هذه الطريقة',
    works: 'كيف تعمل',
    returns: 'ما الذي ترجعه',
    safety: 'الدقة والسلامة',
  },
} satisfies Record<Language, Record<string, string>>;

const methodEducationCopy = {
  legacy: {
    fr: {
      solves: 'Base exhaustive pour le plus long chemin dirige de D dont les sommets induisent un sous-graphe connecte dans G.',
      works: 'Enumere les chemins diriges de D, teste la connexite induite dans G et garde le gagnant canonique le plus long.',
      returns: 'Chemin D le plus long, chemin coherent D/G le plus long, trace accepte/rejete et compteurs de candidats.',
      safety: 'Exacte pour les petits DAG valides quand l’enumeration se termine; les grands scenarios transmis sont bloques par la limite educative.',
    },
    en: {
      solves: 'Exhaustive baseline for the longest directed path in D whose selected vertices induce a connected subgraph in G.',
      works: 'Enumerates directed paths in D, tests induced-G connectivity, and keeps the canonical longest winner.',
      returns: 'Longest D path, longest D/G-consistent path, accepted/rejected candidate trace, and candidate counts.',
      safety: 'Exact for valid small DAG examples when enumeration completes; larger handoff scenarios are blocked by the page safety limit.',
    },
    ar: {
      solves: 'خط اساس شامل لاطول مسار موجه في D بحيث تشكل الرؤوس المختارة مخططا فرعيا متصلا في G.',
      works: 'تعدد المسارات الموجهة في D، وتختبر الاتصال المستحث في G، ثم تحتفظ بالفائز القانوني الاطول.',
      returns: 'اطول مسار في D، واطول مسار متسق بين D/G، واثر المرشحين المقبولين والمرفوضين، وعدادات المرشحين.',
      safety: 'دقيقة لامثلة DAG الصغيرة الصالحة عند اكتمال التعداد؛ وتمنع السيناريوهات الكبيرة المحالة بحد السلامة التعليمي.',
    },
  },
  cp1: {
    fr: {
      solves: 'Cherche un plus long chemin coherent D/G dans un DAG avec une recherche inspiree de la programmation par contraintes.',
      works: 'Maintient des domaines de successeurs, propage les contraintes de chemin et de connexite, puis explore des prefixes candidats.',
      returns: 'Meilleur chemin, trace des domaines de variables, verification differentielle contre l’enumeration et statut de preuve.',
      safety: 'Exacte seulement quand la recherche bornee du navigateur se termine; ce n’est pas un moteur CP de production ni une methode pour grands scenarios.',
    },
    en: {
      solves: 'Finds a longest D/G-consistent path in a DAG with a constraint-programming style search.',
      works: 'Maintains successor domains, propagates path/connectivity constraints, and searches candidate prefixes.',
      returns: 'Best path, variable-domain trace, differential check against enumeration, and proof status.',
      safety: 'Exact only when the bounded browser search completes; not a production CP engine and not for large random scenarios.',
    },
    ar: {
      solves: 'تبحث عن اطول مسار متسق بين D/G في DAG باستخدام بحث باسلوب البرمجة بالقيود.',
      works: 'تحافظ على نطاقات اللاحقين، وتنشر قيود المسار والاتصال، وتبحث في بادئات مرشحة.',
      returns: 'افضل مسار، واثر نطاقات المتغيرات، وفحص تفاضلي مقابل التعداد، وحالة البرهان.',
      safety: 'دقيقة فقط عند اكتمال بحث المتصفح المحدود؛ ليست محرك CP انتاجيا وليست للسيناريوهات العشوائية الكبيرة.',
    },
  },
  cp2: {
    fr: {
      solves: 'Resout le meme probleme D/G que CP1 en ajoutant une borne dirigee superieure sure.',
      works: 'Explore des prefixes de chemins dans D et coupe une branche seulement si son meilleur suffixe D possible ne peut pas battre l’incumbent.',
      returns: 'Meilleur chemin, decisions de borne superieure, etats explores/elagages, trace et statut de completion.',
      safety: 'Exacte seulement apres preuve complete sans cap ni annulation; une execution cappee est un meilleur-resultat-provisoire, pas un optimum.',
    },
    en: {
      solves: 'Finds the same D/G-consistent path as CP1 while adding a safe directed upper bound.',
      works: 'Searches D-path prefixes and prunes a branch only when its longest possible D suffix cannot beat the incumbent.',
      returns: 'Best path, upper-bound decisions, explored/pruned states, trace, and completion status.',
      safety: 'Exact only after proof-complete with no cap or cancel; a capped run is best-so-far, not optimal.',
    },
    ar: {
      solves: 'تحل مشكلة المسار المتسق نفسها بين D/G كما في CP1 مع اضافة حد علوي موجه امن.',
      works: 'تبحث في بادئات مسارات D وتقص فرعا فقط عندما لا يستطيع اطول لاحق ممكن في D تجاوز افضل حل حالي.',
      returns: 'افضل مسار، وقرارات الحد العلوي، والحالات المستكشفة والمقلمة، والاثر، وحالة الاكتمال.',
      safety: 'دقيقة فقط بعد برهان مكتمل من دون حد او الغاء؛ التشغيل المحدود يعطي افضل نتيجة حتى الان وليس حلا امثل.',
    },
  },
  'cp2-plus': {
    fr: {
      solves: 'Resout le probleme CP2 avec un controle supplementaire de faisabilite genomique.',
      works: 'CP2+ ajoute une propagation sure de faisabilite genomique. Il peut elaguer un chemin partiel seulement quand aucune extension future legale ne peut reparer la connexite genomique. Il ne change ni l’objectif, ni la regle de departage, ni la definition d’un chemin legal.',
      returns: 'Champs gagnants CP2 plus sommets atteignables vers l’avant, composantes de G, controles de propagation genomique et elagages genomiques surs.',
      safety: 'Exacte avec la meme regle de completion que CP2; le controle supplementaire peut etre neutre sur les cas denses ou faciles de G.',
    },
    en: {
      solves: 'Solves the CP2 problem with one extra genomic feasibility check.',
      works: 'CP2+ adds safe genomic-feasibility propagation. It can prune a partial path only when no legal future extension can repair genomic connectivity. It does not change the objective, tie-break rule, or legal path definition.',
      returns: 'CP2 winner fields plus forward-reachable vertices, G components, genomic propagation checks, and safe genomic prunes.',
      safety: 'Exact under the same completion rule as CP2; the extra check can be neutral on dense or easy G cases.',
    },
    ar: {
      solves: 'تحل مسألة CP2 مع فحص اضافي واحد لامكان الاتصال الجينومي.',
      works: 'يضيف CP2+ انتشارا امنا لامكان الاتصال الجينومي. يمكنه تقليم مسار جزئي فقط عندما لا تستطيع اي اضافة قانونية مستقبلية اصلاح الاتصال الجينومي. ولا يغير الهدف، او قاعدة كسر التعادل، او تعريف المسار القانوني.',
      returns: 'حقول الفائز في CP2 مع الرؤوس القابلة للوصول اماميا، ومكونات G، وفحوص الانتشار الجينومي، والتقليم الجينومي الامن.',
      safety: 'دقيقة وفق قاعدة الاكتمال نفسها في CP2؛ وقد يكون الفحص الاضافي محايدا في حالات G الكثيفة او السهلة.',
    },
  },
  'algobb-plus-plus': {
    fr: {
      solves: 'Recherche par branch-and-bound bornee du plus long chemin coherent D/G dans de petits DAG.',
      works: 'Demarre avec des graines singleton ou arc, etend les chemins, applique des bornes sures et valide la connexite genomique finale.',
      returns: 'Incumbent, etats explores/elagages, raisons de borne et de rejet, trace et statut de completion.',
      safety: 'Exacte seulement quand la recherche bornee se termine; c’est une implementation TypeScript educative, pas une reproduction de benchmark d’article.',
    },
    en: {
      solves: 'Bounded branch-and-bound search for the longest D/G-consistent path in small DAG examples.',
      works: 'Starts from singleton/arc seeds, extends paths, applies safe bounds, and validates final genomic connectivity.',
      returns: 'Incumbent path, explored/pruned states, bound and rejection reasons, trace, and completion status.',
      safety: 'Exact only when the bounded search completes; this is an educational TypeScript implementation, not a paper benchmark reproduction.',
    },
    ar: {
      solves: 'بحث تفريع وتقييد محدود لاطول مسار متسق بين D/G في امثلة DAG صغيرة.',
      works: 'يبدا من بذور منفردة او اقواس، ويمدد المسارات، ويطبق حدودا امنة، ويتحقق من الاتصال الجينومي النهائي.',
      returns: 'مسار incumbent، والحالات المستكشفة والمقلمة، واسباب الحدود والرفض، والاثر، وحالة الاكتمال.',
      safety: 'دقيقة فقط عند اكتمال البحث المحدود؛ هذا تنفيذ TypeScript تعليمي وليس اعادة انتاج لمعيار ورقة علمية.',
    },
  },
  ilp1: {
    fr: {
      solves: 'Modele ILP pedagogique pour choisir un chemin dans D avec un temoin de connexite genomique.',
      works: 'Enumere les chemins candidats dans D, derive des decisions binaires x/y/z et verifie les contraintes de chemin et de temoin.',
      returns: 'Meilleur chemin, variables selectionnees, aretes temoins, candidats explores/rejetes, trace et drapeaux de preuve.',
      safety: 'Exacte seulement pour de petites executions navigateur terminees; aucun moteur CPLEX, Gurobi, GLPK, OR-Tools ou MILP natif n’est utilise.',
    },
    en: {
      solves: 'Educational ILP-style model for selecting a D path with a genomic connectivity witness.',
      works: 'Enumerates candidate D paths, derives binary x/y/z decisions, and validates path and witness constraints.',
      returns: 'Best path, selected variables, witness edges, explored/rejected candidates, trace, and proof flags.',
      safety: 'Exact only for small completed browser runs; no CPLEX, Gurobi, GLPK, OR-Tools, or native MILP engine is used.',
    },
    ar: {
      solves: 'نموذج تعليمي باسلوب ILP لاختيار مسار في D مع شاهد اتصال جينومي.',
      works: 'يعدد مسارات D المرشحة، ويشتق قرارات x/y/z الثنائية، ويتحقق من قيود المسار والشاهد.',
      returns: 'افضل مسار، والمتغيرات المختارة، وحواف الشاهد، والمرشحون المستكشفون والمرفوضون، والاثر، واعلام البرهان.',
      safety: 'دقيقة فقط للتشغيلات الصغيرة المكتملة داخل المتصفح؛ لا يستخدم CPLEX او Gurobi او GLPK او OR-Tools او اي محرك MILP اصلي.',
    },
  },
  ilp2: {
    fr: {
      solves: 'Formulation pedagogique a temoin racine-niveaux pour le meme probleme de chemin coherent D/G.',
      works: 'Enumere entierement les chemins diriges candidats, derive les decisions x/y/r/p/level et valide un temoin G enracine.',
      returns: 'Meilleur chemin, racine selectionnee, liens parents, niveaux, variables, compteurs, trace et drapeaux de preuve.',
      safety: 'Dangereuse pour les graphes larges ou de stress, car les chemins candidats sont entierement enumeres avant que le cap protege la creation de liste; exacte seulement apres petites executions terminees.',
    },
    en: {
      solves: 'Educational rooted-level witness formulation for the same D/G-consistent path problem.',
      works: 'Fully enumerates directed candidate paths, derives x/y/r/p/level decisions, and validates a rooted G witness.',
      returns: 'Best path, selected root, parent links, levels, variables, counters, trace, and proof flags.',
      safety: 'Unsafe for large/stress graphs because candidate paths are fully enumerated before the cap can protect candidate-list creation; exact only after completed small runs.',
    },
    ar: {
      solves: 'صياغة تعليمية بشاهد ذي جذر ومستويات للمشكلة نفسها: مسار متسق بين D/G.',
      works: 'تعدد بالكامل المسارات الموجهة المرشحة، وتشتق قرارات x/y/r/p/level، وتتحقق من شاهد G ذي جذر.',
      returns: 'افضل مسار، والجذر المختار، وروابط الاباء، والمستويات، والمتغيرات، والعدادات، والاثر، واعلام البرهان.',
      safety: 'غير امنة للرسوم الكبيرة او رسومات الضغط لان المسارات المرشحة تعدد بالكامل قبل ان يحمي الحد انشاء قائمة المرشحين؛ دقيقة فقط بعد تشغيلات صغيرة مكتملة.',
    },
  },
  'subset-dp': {
    fr: {
      solves: 'Programmation dynamique exacte sur les sous-ensembles selectionnes et le dernier sommet.',
      works: 'Conserve un etat canonique (subset,last), etend par arcs de D, rejette les sous-ensembles deconnectes dans G et garde le meilleur chemin canonique par etat.',
      returns: 'Etats DP retenus, rejets domines/deconnectes, trace des transitions, compteurs, meilleur chemin et drapeaux de preuve.',
      safety: 'Exacte seulement si tous les etats atteignables terminent dans les limites de sommets/evenements; l’espace des sous-ensembles est exponentiel.',
    },
    en: {
      solves: 'Exact dynamic programming over selected vertex subsets and endpoint.',
      works: 'Keeps a canonical (subset,last) state, extends along D arcs, rejects G-disconnected subsets, and keeps the canonical best path per state.',
      returns: 'Retained DP states, dominated/disconnected rejections, transition trace, counters, best path, and proof flags.',
      safety: 'Exact only when all reachable states finish within the small-graph vertex/event limits; subset state space is exponential.',
    },
    ar: {
      solves: 'برمجة ديناميكية دقيقة فوق مجموعات الرؤوس المختارة ونقطة النهاية.',
      works: 'تحافظ على حالة معيارية (subset,last)، وتمتد عبر اقواس D، وترفض مجموعات G غير المتصلة، وتحتفظ بافضل مسار قانوني لكل حالة.',
      returns: 'حالات DP المحتفظ بها، ورفض الحالات المهيمن عليها او غير المتصلة، واثر الانتقالات، والعدادات، وافضل مسار، واعلام البرهان.',
      safety: 'دقيقة فقط عندما تنتهي كل الحالات القابلة للوصول ضمن حدود الرؤوس/الاحداث الصغيرة؛ فضاء حالات المجموعات اسي.',
    },
  },
} satisfies Record<RunnableMethodId, Record<Language, MethodEducationCopy>>;

interface MethodEducationBlockProps {
  methodId: RunnableMethodId;
  lang: Language;
}

export function MethodEducationBlock({ methodId, lang }: MethodEducationBlockProps) {
  const h = headings[lang];
  const copy = methodEducationCopy[methodId][lang];
  const isAr = lang === 'ar';
  const titleId = `method-education-${methodId}`;
  const items = [
    [h.solves, copy.solves],
    [h.works, copy.works],
    [h.returns, copy.returns],
    [h.safety, copy.safety],
  ];

  return (
    <section
      className="card method-education-block"
      data-testid="method-education-block"
      data-method-id={methodId}
      aria-labelledby={titleId}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ marginBlockEnd: 'var(--space-md)' }}
    >
      <h3 id={titleId} style={{ color: 'var(--primary)', fontSize: '1.05rem', marginBlockEnd: 'var(--space-sm)' }}>
        {h.title}
      </h3>
      <div className="method-education-block__grid">
        {items.map(([heading, body]) => (
          <div key={heading} className="method-education-block__item">
            <h4 style={{ color: 'var(--primary)', fontSize: '0.86rem', marginBlock: '0 var(--space-xs)' }}>{heading}</h4>
            <p style={{ margin: 0, color: 'var(--neutral-dark)', fontSize: '0.88rem', lineHeight: 1.45 }}>{body}</p>
          </div>
        ))}
      </div>
      <style>{`
        .method-education-block__grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-sm);
        }
        .method-education-block__item {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: var(--neutral-bg-hover);
          padding: var(--space-sm);
        }
        @media (max-width: 1023px) {
          .method-education-block__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 520px) {
          .method-education-block__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
