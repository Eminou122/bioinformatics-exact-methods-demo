import React, { useState } from 'react';
import type { Language } from '../i18n/types';
import { Icon } from './Icons';

interface StartHereProps {
  lang: Language;
  navigate: (path: string) => void;
}

interface ChapterData {
  title: string;
  explanation: string;
  metaphor: string;
  biology: string;
  formal: string;
  diagram: React.ReactNode;
  example: {
    interactiveText: string;
    actionLabel: string;
    onAction: () => string;
  };
  question: string;
  options: string[];
  correctIndex: number;
  explanationAns: string;
}

export const StartHere: React.FC<StartHereProps> = ({ lang, navigate }) => {
  const isAr = lang === 'ar';
  const [activeChapter, setActiveChapter] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showAnswerFeedback, setShowAnswerFeedback] = useState<Record<number, boolean>>({});
  
  // Custom states for interactive examples
  const [exampleStates, setExampleStates] = useState<Record<number, string | boolean>>({
    0: false, // chapter 1 toggle
    2: false, // chapter 3 toggle
    3: false, // chapter 4 toggle
    11: false, // chapter 12 toggle
    12: false, // chapter 13 toggle
  });

  const translations = {
    fr: {
      chapter: 'Chapitre',
      progress: 'Progression de l\'apprentissage',
      btnPrev: 'Précédent',
      btnNext: 'Suivant',
      btnStartCP1: 'Lancer l\'application CP1',
      checkpoint: 'Question de contrôle',
      btnSubmit: 'Vérifier la réponse',
      correct: 'Correct !',
      incorrect: 'Incorrect. Réessayez.',
      metaphorTitle: 'Métaphore (Livreur)',
      biologyTitle: 'Mapping Biologique',
      formalTitle: 'Définition Scientifique Formelle',
      interactiveTitle: 'Exemple Interactif',
      warningLabel: 'Avertissement d\'honnêteté scientifique : La métaphore routière n\'est qu\'une aide pédagogique. Les routes ne représentent pas la cinétique métabolique réelle et les gènes ne sont pas de simples arrêts de livraison.',
      chaptersTitle: 'Index du cours',
    },
    en: {
      chapter: 'Chapter',
      progress: 'Learning Progress',
      btnPrev: 'Previous',
      btnNext: 'Next',
      btnStartCP1: 'Launch CP1 App',
      checkpoint: 'Checkpoint Question',
      btnSubmit: 'Check Answer',
      correct: 'Correct!',
      incorrect: 'Incorrect. Try again.',
      metaphorTitle: 'Delivery Metaphor',
      biologyTitle: 'Biological Mapping',
      formalTitle: 'Formal Scientific Definition',
      interactiveTitle: 'Interactive Example',
      warningLabel: 'Scientific Honesty Disclaimer: The road metaphor is an educational aid only. Roads do not represent actual metabolic kinetics, and genes are not simple delivery stops.',
      chaptersTitle: 'Course Index',
    },
    ar: {
      chapter: 'الفصل',
      progress: 'تقدم التعلم',
      btnPrev: 'السابق',
      btnNext: 'التالي',
      btnStartCP1: 'تشغيل نموذج CP1',
      checkpoint: 'سؤال التحقق',
      btnSubmit: 'تحقق من الإجابة',
      correct: 'إجابة صحيحة!',
      incorrect: 'إجابة خاطئة. حاول مجدداً.',
      metaphorTitle: 'مجاز التوصيل والطرق',
      biologyTitle: 'الإسقاط الحيوي (البيولوجي)',
      formalTitle: 'التعريف العلمي الرسمي',
      interactiveTitle: 'مثال تفاعلي',
      warningLabel: 'تنبيه الأمانة العلمية: المجاز المرتبط بالطرق هو وسيلة تعليمية مساعدة فقط. فالطرق لا تمثل حركية الاستقلاب الحقيقية، والجينات ليست مجرد محطات لتسليم الطلبات.',
      chaptersTitle: 'فهرس الفصول',
    }
  };

  const t = translations[lang];

  // Helper to build 18 chapters content
  const chapters: Record<Language, ChapterData[]> = {
    fr: [
      {
        title: '1. Qu\'est-ce qu\'un graphe ?',
        explanation: 'Un graphe est une structure mathématique composée d\'un ensemble de points appelés sommets, reliés par des liaisons.',
        metaphor: 'Un plan général contenant des arrêts de livraison de colis reliés par des routes.',
        biology: 'Un réseau décrivant des entités biologiques (réactions, enzymes) et leurs interdépendances.',
        formal: 'Un graphe H = (V, E) est défini par un ensemble de sommets V et un ensemble d\'arêtes/arcs E.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }} aria-label="Simple graph diagram">
            <circle cx="40" cy="50" r="15" fill="var(--primary)" />
            <text cx="40" cy="50" x="35" y="55" fill="white" fontWeight="bold">A</text>
            <circle cx="160" cy="50" r="15" fill="var(--primary)" />
            <text cx="160" cy="50" x="155" y="55" fill="white" fontWeight="bold">B</text>
            <line x1="55" y1="50" x2="145" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" />
          </svg>
        ),
        example: {
          interactiveText: 'Basculez pour simuler l\'ajout d\'un sommet C connecté à B.',
          actionLabel: 'Ajouter/Enlever Sommet C',
          onAction: () => 'Sommet C ajouté et connecté à B.'
        },
        question: 'Quelle est la composition fondamentale d\'un graphe ?',
        options: ['Des sommets et des liaisons', 'Uniquement des flèches', 'Une liste d\'équations linéaires'],
        correctIndex: 0,
        explanationAns: 'Un graphe est mathématiquement modélisé comme un couple composé de sommets (vertices) et de liaisons (arêtes/arcs).'
      },
      {
        title: '2. Qu\'est-ce qu\'un sommet (vertex) ?',
        explanation: 'Un sommet (ou nœud) est l\'unité élémentaire ou point d\'intersection au sein d\'un graphe.',
        metaphor: 'Un arrêt précis (comme un entrepôt ou une boutique) où le livreur doit s\'arrêter.',
        biology: 'Une réaction chimique spécifique convertissant des réactifs en produits.',
        formal: 'Un élément v appartenant à l\'ensemble fini V des sommets.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="100" cy="50" r="20" fill="var(--primary)" stroke="var(--neutral-dark)" strokeWidth="2" />
            <text x="92" y="56" fill="white" fontWeight="bold">R1</text>
          </svg>
        ),
        example: {
          interactiveText: 'Un sommet stocke des propriétés scientifiques.',
          actionLabel: 'Inspecter Sommet',
          onAction: () => 'Sommet R1 : Réaction chimique active.'
        },
        question: 'En bio-informatique métabolique, que représente généralement un sommet ?',
        options: ['Un métabolite isolé', 'Une réaction métabolique catalysée', 'Le chromosome complet'],
        correctIndex: 1,
        explanationAns: 'Dans nos graphes D et G, chaque sommet modélise une réaction métabolique catalysée par une enzyme.'
      },
      {
        title: '3. Qu\'est-ce qu\'un arc orienté (arc) ?',
        explanation: 'Un arc orienté relie un sommet de départ à un sommet d\'arrivée dans un sens unique.',
        metaphor: 'Une route à sens unique légal. On peut aller de A vers B mais pas l\'inverse.',
        biology: 'Une flèche indiquant la succession métabolique directe (le produit de R1 est le substrat de R2).',
        formal: 'Un couple ordonné (u, v) ∈ E_D représentant une transition dirigée de u vers v.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--neutral-dark)" />
              </marker>
            </defs>
            <circle cx="40" cy="50" r="15" fill="var(--primary)" />
            <circle cx="160" cy="50" r="15" fill="var(--primary)" />
            <line x1="55" y1="50" x2="160" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" markerEnd="url(#arrow)" />
          </svg>
        ),
        example: {
          interactiveText: 'Basculez le sens de la flèche virtuelle.',
          actionLabel: 'Inverser le flux',
          onAction: () => 'Le flux est maintenant dirigé de droite à gauche.'
        },
        question: 'Si un arc existe de R1 vers R2, peut-on retourner en arrière métaboliquement ?',
        options: ['Oui, les arcs sont toujours bidirectionnels', 'Non, un arc possède une direction unique', 'Seulement si G est connecté'],
        correctIndex: 1,
        explanationAns: 'Un arc orienté impose un sens strict de circulation, représentant le flux métabolique unidirectionnel.'
      },
      {
        title: '4. Qu\'est-ce qu\'une arête non orientée ?',
        explanation: 'Une arête non orientée relie deux sommets sans notion de direction. Elle représente une relation symétrique.',
        metaphor: 'Une liaison de voisinage. Si la boutique A est proche de la boutique B, alors B est proche de A.',
        biology: 'Une proximité physique entre les gènes codant pour les enzymes sur le chromosome.',
        formal: 'Une paire non ordonnée {u, v} ∈ E_G représentant une relation mutuelle entre u et v.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="40" cy="50" r="15" fill="var(--primary)" />
            <circle cx="160" cy="50" r="15" fill="var(--primary)" />
            <line x1="55" y1="50" x2="145" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" strokeDasharray="4" />
          </svg>
        ),
        example: {
          interactiveText: 'Basculez le type de liaison.',
          actionLabel: 'Basculer type',
          onAction: () => 'Liaison génomique bidirectionnelle active.'
        },
        question: 'Quelle est la principale différence entre un arc et une arête ?',
        options: ['L\'arc a une orientation unique, l\'arête est bidirectionnelle/symétrique', 'L\'arête est rouge et l\'arc est vert', 'Les arcs n\'apparaissent que dans le génome'],
        correctIndex: 0,
        explanationAns: 'L\'arc possède une origine et une destination, tandis que l\'arête est une relation symétrique simple.'
      },
      {
        title: '5. Différence entre marche (walk), chemin (path) et piste (trail)',
        explanation: 'Ces termes désignent des parcours de sommets et de liaisons, avec différentes restrictions d\'unicité.',
        metaphor: 'Marche : n\'importe quel trajet. Chemin : sans repasser par les mêmes arrêts. Piste : sans repasser par les mêmes rues.',
        biology: 'Modélise différents types de flux bio-chimiques selon les contraintes de répétition.',
        formal: 'Un chemin ne répète aucun sommet. Une piste ne répète aucune liaison. Une marche autorise toutes les répétitions.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', fontFamily: 'monospace' }}>
            {"Walk: R1 → R2 → R1 | Trail: R1 → R2 → R3 | Path: R1 → R2 → R3 (sans cycle)"}
          </div>
        ),
        example: {
          interactiveText: 'Vérifier la validité de [R1, R2, R1].',
          actionLabel: 'Tester R1-R2-R1',
          onAction: () => 'Contient un sommet répété : c\'est une marche, pas un chemin.'
        },
        question: 'Un chemin dans un graphe peut-il repasser par un même sommet ?',
        options: ['Non, un chemin n\'autorise aucune répétition de sommets', 'Oui, s\'il est très long', 'Uniquement s\'il y a un cycle dans D'],
        correctIndex: 0,
        explanationAns: 'Par définition mathématique stricte, un chemin (path) est une suite de sommets distincts.'
      },
      {
        title: '6. Qu\'est-ce qu\'une réaction métabolique ?',
        explanation: 'Processus biochimique de transformation de molécules catalysé par une protéine appelée enzyme.',
        metaphor: 'Une machine spécifique présente au niveau d\'un arrêt de livraison.',
        biology: 'Une étape élémentaire de notre réseau métabolique. Par exemple, la transformation du glucose.',
        formal: 'Sommet v ∈ V associé à une formule chimique et à une enzyme de catalyse.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
            {"Réactifs ──[ Enzyme ]──> Produits"}
          </div>
        ),
        example: {
          interactiveText: 'Déclencher la transformation.',
          actionLabel: 'Activer la réaction',
          onAction: () => 'Transformation de A en B accomplie.'
        },
        question: 'Quel composant biologique catalyse la réaction métabolique ?',
        options: ['L\'ADN polymérase', 'Une enzyme codée par un gène', 'Un glucide passif'],
        correctIndex: 1,
        explanationAns: 'Chaque réaction métabolique nécessite une enzyme spécifique pour pouvoir se dérouler efficacement.'
      },
      {
        title: '7. Qu\'est-ce qu\'un gène ?',
        explanation: 'Une séquence d\'ADN contenant les instructions nécessaires à la synthèse d\'une enzyme.',
        metaphor: 'La notice technique de fabrication de la machine de l\'entrepôt.',
        biology: 'L\'unité chromosomique codante qui gouverne l\'activité d\'une réaction.',
        formal: 'Une coordonnée physique sur le chromosome associée à un gène codant.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
            {"ADN: [ Gène 1 ] ===== [ Gène 2 ] ===== [ Gène 3 ]"}
          </div>
        ),
        example: {
          interactiveText: 'Activer la transcription.',
          actionLabel: 'Transcrire gène',
          onAction: () => 'ARNm généré et traduit en enzyme fonctionnelle.'
        },
        question: 'Quel est le lien direct entre un gène et une réaction métabolique ?',
        options: ['Le gène produit l\'enzyme qui permet la réaction', 'Il n\'y a aucun rapport physique', 'Le gène consomme les métabolites finaux'],
        correctIndex: 0,
        explanationAns: 'Le gène code pour la protéine/enzyme, qui agit ensuite comme catalyseur de la réaction correspondante.'
      },
      {
        title: '8. Qu\'est-ce que la proximité génomique ?',
        explanation: 'Le fait que deux gènes soient physiquement proches l\'un de l\'autre sur le brin d\'ADN.',
        metaphor: 'Deux entrepôts situés sur la même rue ou dans le même quartier.',
        biology: 'L\'opéron ou la colocalisation chromosomique facilitant la co-régulation et la co-expression.',
        formal: 'Une liaison ou arête dans le graphe G reliant deux réactions dont les gènes sont adjacents.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            {"Gène A ──(Distance < seuil)── Gène B"}
          </div>
        ),
        example: {
          interactiveText: 'Mesurer la distance génomique.',
          actionLabel: 'Calculer distance',
          onAction: () => 'Distance = 150 paires de bases (colocalisés).'
        },
        question: 'Pourquoi la proximité génomique de deux gènes est-elle importante en biologie ?',
        options: ['Elle favorise une régulation et transcription conjointe', 'Elle empêche la réplication de l\'ADN', 'Elle augmente le métabolisme des sucres'],
        correctIndex: 0,
        explanationAns: 'La colocalisation chromosomique permet souvent la co-régulation et co-expression coordonnée des gènes.'
      },
      {
        title: '9. Qu\'est-ce que le graphe D (Réseau Métabolique) ?',
        explanation: 'Le graphe représentant le flux chimique possible entre les différentes réactions.',
        metaphor: 'La carte routière montrant uniquement les voies rapides à sens unique pour le livreur.',
        biology: 'Le réseau métabolique modélisé comme un DAG (graphe dirigé sans cycle).',
        formal: 'D = (V, E_D) où les couples (u, v) ∈ E_D décrivent des liens stœchiométriques dirigés.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="50" r="12" fill="var(--primary)" />
            <circle cx="100" cy="50" r="12" fill="var(--primary)" />
            <circle cx="170" cy="50" r="12" fill="var(--primary)" />
            <line x1="42" y1="50" x2="88" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" markerEnd="url(#arrow)" />
            <line x1="112" y1="50" x2="158" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" markerEnd="url(#arrow)" />
          </svg>
        ),
        example: {
          interactiveText: 'Visualiser la structure de D.',
          actionLabel: 'Décrire D',
          onAction: () => 'Graphe D : 3 sommets, 2 arcs orientés.'
        },
        question: 'Le graphe D dans notre modèle supporte-t-il les cycles ?',
        options: ['Non, il doit s\'agir d\'un graphe dirigé acyclique (DAG)', 'Oui, toutes les boucles sont autorisées', 'Seulement en présence de glucose'],
        correctIndex: 0,
        explanationAns: 'Le graphe métabolique D est restreint aux DAGs (Directed Acyclic Graphs) pour des raisons de modélisation exacte et d\'acyclicité de la voie.'
      },
      {
        title: '10. Qu\'est-ce que le graphe G (Proximité Génomique) ?',
        explanation: 'Le graphe représentant les contiguïtés génomiques sur le même ensemble de sommets.',
        metaphor: 'La carte des relations de bon voisinage entre toutes nos boutiques.',
        biology: 'Le réseau de contiguïté chromosomique des gènes codant pour les enzymes.',
        formal: 'G = (V, E_G) où {u, v} ∈ E_G représente une arête non orientée de proximité.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="50" r="12" fill="var(--primary)" />
            <circle cx="100" cy="50" r="12" fill="var(--primary)" />
            <circle cx="170" cy="50" r="12" fill="var(--primary)" />
            <line x1="42" y1="50" x2="158" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" strokeDasharray="3" />
          </svg>
        ),
        example: {
          interactiveText: 'Visualiser les liaisons de G.',
          actionLabel: 'Décrire G',
          onAction: () => 'Graphe G : 3 sommets, 1 liaison non-orientée.'
        },
        question: 'Les liaisons dans le graphe G sont-elles dirigées ?',
        options: ['Non, elles sont non orientées et symétriques', 'Oui, elles indiquent le sens de réplication', 'Seulement en arabe et en hébreu'],
        correctIndex: 0,
        explanationAns: 'Le graphe génomique G est un graphe non orienté représentant la proximité physique mutuelle.'
      },
      {
        title: '11. Pourquoi D et G partagent le même ensemble de sommets ?',
        explanation: 'Car chaque point d\'intérêt est à la fois une réaction chimique et est régi par un gène.',
        metaphor: 'Chaque entrepôt a une adresse routière ET une position de voisinage.',
        biology: 'Chaque sommet modélise un couple (Réaction, Gène associé). On étudie leurs différentes relations.',
        formal: 'V(D) = V(G) = V. Seuls les ensembles de liaisons E_D et E_G diffèrent.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            {"Sommet R1 = Réaction R1 (dans D) ── Gène de R1 (dans G)"}
          </div>
        ),
        example: {
          interactiveText: 'Basculez pour voir le double statut d\'un nœud.',
          actionLabel: 'Analyser statut',
          onAction: () => 'R1 : Rôle métabolique et Rôle génomique.'
        },
        question: 'Qu\'est-ce qui est partagé de manière identique entre les graphes D et G ?',
        options: ['Les sommets uniquement', 'Les arêtes et arcs', 'Le sens de lecture uniquement LTR'],
        correctIndex: 0,
        explanationAns: 'Les deux graphes décrivent les mêmes objets biologiques (sommets), mais sous deux angles relationnels distincts.'
      },
      {
        title: '12. Qu\'est-ce qu\'un sous-graphe induit ?',
        explanation: 'Un sous-graphe formé par un sous-ensemble de sommets et TOUTES les liaisons du graphe d\'origine reliant ces sommets.',
        metaphor: 'Sélectionner trois boutiques et ne regarder que les routes de quartier qui les relient directement entre elles.',
        biology: 'La structure génomique isolée et restreinte uniquement aux enzymes sélectionnées dans notre chemin.',
        formal: 'G[S] = (S, { {u, v} ∈ E_G | u, v ∈ S }) où S ⊆ V.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="50" r="12" fill="var(--primary)" />
            <circle cx="100" cy="50" r="12" fill="var(--primary)" />
            <circle cx="170" cy="50" r="12" fill="var(--neutral-light)" />
            <line x1="42" y1="50" x2="88" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" />
          </svg>
        ),
        example: {
          interactiveText: 'Cliquez pour enlever le nœud de droite du sous-graphe.',
          actionLabel: 'Isoler',
          onAction: () => 'Sous-graphe induit restreint aux nœuds actifs de gauche.'
        },
        question: 'Dans un sous-graphe induit, peut-on inclure des liaisons vers des sommets non sélectionnés ?',
        options: ['Non, seules les liaisons reliant des sommets du sous-ensemble sont conservées', 'Oui, on garde tout le graphe', 'Uniquement s\'il y a du glucose'],
        correctIndex: 0,
        explanationAns: 'Un sous-graphe induit filtre strictement les sommets ET les liaisons pour ne garder que ceux du sous-ensemble choisi.'
      },
      {
        title: '13. Qu\'est-ce que la connectivité ?',
        explanation: 'La propriété d\'un graphe où il existe toujours un chemin pour aller de n\'importe quel sommet à n\'importe quel autre.',
        metaphor: 'Dans le quartier sélectionné, on peut circuler entre tous nos entrepôts de livraison sans sortir du quartier.',
        biology: 'La cohérence physique des gènes sur le chromosome : ils forment un seul bloc de co-expression.',
        formal: 'Pour tout couple (u, v) dans le sous-graphe induit, il existe une chaîne les reliant.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="30" r="10" fill="var(--primary)" />
            <circle cx="100" cy="30" r="10" fill="var(--primary)" />
            <circle cx="170" cy="50" r="10" fill="var(--neutral-light)" />
            <line x1="40" y1="30" x2="90" y2="30" stroke="var(--neutral-dark)" strokeWidth="2" />
          </svg>
        ),
        example: {
          interactiveText: 'Vérifier la connectivité.',
          actionLabel: 'Tester',
          onAction: () => 'Les nœuds verts sont connectés. Le nœud gris est isolé.'
        },
        question: 'Comment caractériser la connectivité d\'un ensemble de sommets dans G ?',
        options: ['Il n\'y a aucun sommet isolé dans le sous-graphe induit de G', 'Tous les sommets possèdent des arcs métaboliques', 'Ils sont classés par ordre croissant d\'identifiant'],
        correctIndex: 0,
        explanationAns: 'La connectivité garantit qu\'aucun groupe de sommets n\'est coupé du reste dans le sous-graphe induit.'
      },
      {
        title: '14. Qu\'est-ce qu\'un chemin (D,G)-cohérent ?',
        explanation: 'Un chemin orienté dans le réseau métabolique D dont les sommets forment un sous-graphe connecté dans le réseau génomique G.',
        metaphor: 'Un itinéraire de livraison légal (D) dont tous les points d\'arrêt se trouvent dans un seul quartier connecté (G).',
        biology: 'Une chaîne de réactions métaboliques valide dont les gènes régulateurs sont regroupés chromosomiquement.',
        formal: 'Un chemin P dans D tel que le sous-graphe induit G[V(P)] est connecté.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            {"Chemin métabolique: R1 → R2 → R3 | Connectivité génomique: R1 ── R2 et R2 ── R3 (Valide)"}
          </div>
        ),
        example: {
          interactiveText: 'Valider R1->R2->R3.',
          actionLabel: 'Valider chemin',
          onAction: () => 'Chemin (D,G)-cohérent détecté et accepté !'
        },
        question: 'Quelles sont les deux contraintes d\'un chemin (D,G)-cohérent ?',
        options: ['Dirigé dans D et connecté induit dans G', 'Circulaire dans D et acyclique dans G', 'Écrit en français et en arabe uniquement'],
        correctIndex: 0,
        explanationAns: 'Le chemin doit être biologiquement valide métaboliquement (dirigé dans D) et cohérent génomiquement (connecté dans G).'
      },
      {
        title: '15. Pourquoi le plus long chemin métabolique dans D peut être rejeté ?',
        explanation: 'Le plus long chemin chimique peut impliquer une réaction éloignée dont le gène n\'a aucun lien chromosomique avec le reste.',
        metaphor: 'Le plus long trajet de livraison possible vous oblige à visiter un entrepôt isolé à 100 km des autres boutiques.',
        biology: 'Une des enzymes clés de la chaîne est codée sur un autre chromosome ou locus isolé, rompant la co-régulation globale.',
        formal: 'Le plus long chemin P_max dans D n\'induit pas un sous-graphe connexe dans G (G[V(P_max)] est déconnecté).',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--danger)' }}>
            {"R1 → R2 → R3 → R4 (R4 isolé génomiquement de {R1,R2,R3} : REJETÉ)"}
          </div>
        ),
        example: {
          interactiveText: 'Tester l\'isolement.',
          actionLabel: 'Analyser R4',
          onAction: () => 'R4 n\'a aucune liaison dans G. Le chemin complet de longueur 4 est rejeté.'
        },
        question: 'Si le plus long chemin métabolique dans D est rejeté, que fait l\'algorithme ?',
        options: ['Il cherche un chemin plus court mais cohérent dans G', 'Il s\'arrête avec une erreur fatale', 'Il ignore le graphe G'],
        correctIndex: 0,
        explanationAns: 'L\'algorithme recherche le meilleur compromis : le plus long chemin métabolique parmi ceux qui satisfont la connectivité dans G.'
      },
      {
        title: '16. Qu\'est-ce qu\'une "méthode exacte" ?',
        explanation: 'Une méthode de résolution mathématique qui garantit de trouver la solution optimale globale sans approximation.',
        metaphor: 'Le livreur vérifie et calcule mathématiquement tous les itinéraires possibles pour être 100% sûr de son choix.',
        biology: 'Une garantie de ne manquer aucun chemin métabolique majeur conservé au cours de l\'évolution.',
        formal: 'Un algorithme qui résout le problème d\'optimisation en retournant la solution globale optimale garantie.',
        diagram: (
          <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent-gold)' }}>
            {"Optimum mathématique global garanti (100% de l'espace exploré)"}
          </div>
        ),
        example: {
          interactiveText: 'Lancer l\'évaluation exacte.',
          actionLabel: 'Garantir',
          onAction: () => 'Optimalité prouvée mathématiquement.'
        },
        question: 'Quel est l\'avantage d\'une méthode exacte par rapport à une heuristique ?',
        options: ['Elle garantit l\'optimalité globale de la solution', 'Elle s\'exécute toujours plus rapidement sur de grands réseaux', 'Elle ne nécessite aucun ordinateur'],
        correctIndex: 0,
        explanationAns: 'Contrairement aux heuristiques, les méthodes exactes prouvent mathématiquement qu\'aucune meilleure solution n\'existe.'
      },
      {
        title: '17. Qu\'est-ce qu\'un problème NP-difficile (NP-hard) ?',
        explanation: 'Un problème complexe pour lequel il n\'existe aucun algorithme connu capable de le résoudre efficacement en temps polynomial sur toutes les instances.',
        metaphor: 'Plus la ville s\'agrandit, plus le nombre de routes explose de manière exponentielle, rendant le calcul complet infaisable pour de grandes villes.',
        biology: 'Limite fondamentale de calcul : on ne peut pas résoudre exactement des génomes entiers en quelques secondes sans techniques avancées.',
        formal: 'Un problème de décision ou d\'optimisation au moins aussi difficile que les problèmes de la classe NP.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            {"Taille du graphe (N) ──> Complexité en O(2^N)"}
          </div>
        ),
        example: {
          interactiveText: 'Simuler l\'explosion de l\'espace de recherche.',
          actionLabel: 'Simuler N=20 sommets',
          onAction: () => 'Espace de recherche = 1 048 576 combinaisons à explorer !'
        },
        question: 'Qu\'indique la mention NP-difficile pour le problème du chemin cohérent ?',
        options: ['Il n\'existe pas d\'algorithme polynomial connu résolvant toutes les instances efficacement', 'Le problème est impossible à résoudre sur petit graphe', 'Il a été résolu en une seconde par Choco'],
        correctIndex: 0,
        explanationAns: 'La complexité NP-difficile signifie que la résolution exacte nécessite des approches optimisées (comme le CP ou l\'ILP) pour limiter l\'explosion combinatoire.'
      },
      {
        title: '18. Limites du modèle de démonstration éducatif',
        explanation: 'Cette démo navigateur est limitée aux petits graphes pédagogiques pour rester fluide et réactive.',
        metaphor: 'Cette mini-carte de livraison ne gère que 8 arrêts maximum pour rester lisible et instantanée sur votre écran.',
        biology: 'CP1 original utilise Choco Solver en Java sur des réseaux génomiques massifs. Ce modèle navigateur est uniquement à but éducatif.',
        formal: 'Capped solver : N ≤ 8, arcs ≤ 14. Exact uniquement pour les exemples DAG bornés.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 600 }}>
            “CP1-inspired browser educational model — exact only for bounded small DAG examples.”
          </div>
        ),
        example: {
          interactiveText: 'Vérifier la limite de la démo.',
          actionLabel: 'Tester limites',
          onAction: () => 'Limite OK : Graphe dans les bornes autorisées.'
        },
        question: 'Cette application dans le navigateur est-elle adaptée pour de grands réseaux biologiques réels ?',
        options: ['Non, elle est conçue uniquement pour la démonstration pédagogique de petits graphes bornés', 'Oui, elle remplace totalement le solver Java Choco de recherche', 'Oui, elle valide des découvertes sur le génome humain'],
        correctIndex: 0,
        explanationAns: 'Conformément aux exigences de rigueur scientifique, ce modèle éducatif en JS ne gère que des petits exemples.'
      }
    ],
    en: [
      {
        title: '1. What is a graph?',
        explanation: 'A graph is a mathematical structure consisting of a set of points called vertices, connected by lines.',
        metaphor: 'A general map containing delivery package stops connected by roads.',
        biology: 'A network describing biological entities (reactions, enzymes) and their dependencies.',
        formal: 'A graph H = (V, E) is defined by a set of vertices V and a set of edges/arcs E.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }} aria-label="Simple graph diagram">
            <circle cx="40" cy="50" r="15" fill="var(--primary)" />
            <text cx="40" cy="50" x="35" y="55" fill="white" fontWeight="bold">A</text>
            <circle cx="160" cy="50" r="15" fill="var(--primary)" />
            <text cx="160" cy="50" x="155" y="55" fill="white" fontWeight="bold">B</text>
            <line x1="55" y1="50" x2="145" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" />
          </svg>
        ),
        example: {
          interactiveText: 'Toggle to simulate adding a vertex C connected to B.',
          actionLabel: 'Add/Remove Vertex C',
          onAction: () => 'Vertex C added and connected to B.'
        },
        question: 'What is the fundamental composition of a graph?',
        options: ['Vertices and edges/links', 'Arrows only', 'A list of linear equations'],
        correctIndex: 0,
        explanationAns: 'A graph is mathematically modeled as a pair of vertices and links connecting them.'
      },
      {
        title: '2. What is a vertex?',
        explanation: 'A vertex (or node) is the elementary unit or intersection point within a graph.',
        metaphor: 'A specific stop (like a warehouse or storefront) where the delivery person must stop.',
        biology: 'A specific chemical reaction converting reactants to products.',
        formal: 'An element v belonging to the finite set V of vertices.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="100" cy="50" r="20" fill="var(--primary)" stroke="var(--neutral-dark)" strokeWidth="2" />
            <text x="92" y="56" fill="white" fontWeight="bold">R1</text>
          </svg>
        ),
        example: {
          interactiveText: 'A vertex stores scientific properties.',
          actionLabel: 'Inspect Node',
          onAction: () => 'Node R1: Active chemical reaction.'
        },
        question: 'In metabolic bioinformatics, what does a vertex usually represent?',
        options: ['An isolated metabolite', 'A catalyzed metabolic reaction', 'An entire chromosome'],
        correctIndex: 1,
        explanationAns: 'In our D and G graphs, each vertex represents a single enzyme-catalyzed metabolic reaction.'
      },
      // Equivalent instructional content is available in French, English, and Arabic.
      {
        title: '3. What is a directed arc?',
        explanation: 'A directed arc connects a starting vertex to an ending vertex in a single direction.',
        metaphor: 'A one-way street. You can travel from A to B, but not B to A.',
        biology: 'An arrow showing metabolic succession (R1 product is R2 substrate).',
        formal: 'An ordered pair (u, v) ∈ E_D representing a directed transition.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="40" cy="50" r="15" fill="var(--primary)" />
            <circle cx="160" cy="50" r="15" fill="var(--primary)" />
            <line x1="55" y1="50" x2="160" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" markerEnd="url(#arrow)" />
          </svg>
        ),
        example: {
          interactiveText: 'Toggle the virtual flow direction.',
          actionLabel: 'Reverse flow',
          onAction: () => 'The flow is now directed from right to left.'
        },
        question: 'If a directed arc goes from R1 to R2, can metabolic flow move from R2 to R1?',
        options: ['Yes, metabolic links are always bidirectional', 'No, a directed arc has a single direction', 'Only if G is connected'],
        correctIndex: 1,
        explanationAns: 'A directed arc restricts circulation to a single direction.'
      },
      {
        title: '4. What is an undirected edge?',
        explanation: 'An undirected edge connects two vertices symmetrically without direction.',
        metaphor: 'A neighborhood relation. If store A is close to B, B is close to A.',
        biology: 'Physical proximity of corresponding genes on the chromosome.',
        formal: 'An unordered pair {u, v} ∈ E_G representing mutual relation.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="40" cy="50" r="15" fill="var(--primary)" />
            <circle cx="160" cy="50" r="15" fill="var(--primary)" />
            <line x1="55" y1="50" x2="145" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" strokeDasharray="4" />
          </svg>
        ),
        example: {
          interactiveText: 'Toggle relation type.',
          actionLabel: 'Toggle relation',
          onAction: () => 'Genomic relation toggled.'
        },
        question: 'Is a genomic proximity edge directed?',
        options: ['No, it is undirected/symmetrical', 'Yes, it always points LTR', 'Only for circular genomes'],
        correctIndex: 0,
        explanationAns: 'Genomic physical proximity is modeled as an undirected relation.'
      },
      {
        title: '5. Difference between walk, path, and trail',
        explanation: 'Different definitions of routes depending on uniqueness criteria.',
        metaphor: 'Walk: any route. Path: unique stops. Trail: unique roads.',
        biology: 'Represents metabolic paths avoiding cycles or repeats.',
        formal: 'A path repeats no vertices. A trail repeats no edges/arcs.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', fontFamily: 'monospace' }}>
            {"Walk: R1-R2-R1 | Trail: R1-R2-R3 | Path: R1-R2-R3"}
          </div>
        ),
        example: {
          interactiveText: 'Verify [R1, R2, R1].',
          actionLabel: 'Test R1-R2-R1',
          onAction: () => 'Contains repeated vertex. Walk only, not a path.'
        },
        question: 'Does a path allow repeating the same node?',
        options: ['No, all vertices must be unique', 'Yes, if no cycle is found', 'Only in cyclical graphs'],
        correctIndex: 0,
        explanationAns: 'By definition, a path consists of unique vertices.'
      },
      {
        title: '6. What is a metabolic reaction?',
        explanation: 'A chemical process converting substrates to products, facilitated by enzymes.',
        metaphor: 'A conversion processing unit located at a stop.',
        biology: 'The basic node of metabolic flow.',
        formal: 'A vertex representing chemical reactant conversion.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
            {"Substrates ──[ Enzyme ]──> Products"}
          </div>
        ),
        example: {
          interactiveText: 'Run chemical conversion.',
          actionLabel: 'Catalyze',
          onAction: () => 'Reactants transformed.'
        },
        question: 'What facilitates a metabolic reaction in a cell?',
        options: ['A carbohydrate', 'An enzyme', 'An RNA primer'],
        correctIndex: 1,
        explanationAns: 'Enzymes act as catalysts for metabolic reactions.'
      },
      {
        title: '7. What is a gene?',
        explanation: 'A chromosomal sequence coding for the catalytic enzyme.',
        metaphor: 'The blueprint copy to build a specific machine at a stop.',
        biology: 'The genetic origin of enzymes.',
        formal: 'A physical gene coordinate associated with the vertex.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
            DNA: [ Gene 1 ] === [ Gene 2 ]
          </div>
        ),
        example: {
          interactiveText: 'Simulate gene expression.',
          actionLabel: 'Express',
          onAction: () => 'Protein enzyme synthesized.'
        },
        question: 'What does a gene code for in this context?',
        options: ['The metabolic enzyme', 'The reaction substrate', 'Nothing'],
        correctIndex: 0,
        explanationAns: 'Genes code for proteins, which act as enzymes.'
      },
      {
        title: '8. What is genomic proximity?',
        explanation: 'How close genes are situated to each other on the chromosome.',
        metaphor: 'Two storefronts located on the same street block.',
        biology: 'Physical adjacency supporting transcriptional operons or coregulation.',
        formal: 'A G-edge connecting two nodes with chromosome distance below threshold.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            {"Gene A ──(< threshold)── Gene B"}
          </div>
        ),
        example: {
          interactiveText: 'Measure distance.',
          actionLabel: 'Measure',
          onAction: () => 'Adjacent on chromosome.'
        },
        question: 'What biological benefit does gene proximity offer?',
        options: ['Joint regulation/coregulation', 'Stops translation', 'Promotes mutations'],
        correctIndex: 0,
        explanationAns: 'Proximity supports synchronized regulation of enzyme expression.'
      },
      {
        title: '9. What is Graph D?',
        explanation: 'The directed metabolic succession network.',
        metaphor: 'The road map showing legal one-way delivery paths.',
        biology: 'The metabolic network modeled as a DAG.',
        formal: 'D = (V, E_D) where edges represent metabolic flow.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="50" r="12" fill="var(--primary)" />
            <circle cx="100" cy="50" r="12" fill="var(--primary)" />
            <line x1="42" y1="50" x2="88" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" markerEnd="url(#arrow)" />
          </svg>
        ),
        example: {
          interactiveText: 'Check D properties.',
          actionLabel: 'Inspect D',
          onAction: () => 'Directed acyclic network.'
        },
        question: 'Graph D represents what kind of biological flow?',
        options: ['Metabolic reaction succession', 'Genomic chromosome proximity', 'Protein folding pathways'],
        correctIndex: 0,
        explanationAns: 'Graph D models metabolic chemical flow.'
      },
      {
        title: '10. What is Graph G?',
        explanation: 'The undirected genomic colocalisation network.',
        metaphor: 'The map showing neighborhood close connections.',
        biology: 'The genomic proximity network.',
        formal: 'G = (V, E_G) representing physical proximity links.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="50" r="12" fill="var(--primary)" />
            <circle cx="100" cy="50" r="12" fill="var(--primary)" />
            <line x1="42" y1="50" x2="88" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" strokeDasharray="3" />
          </svg>
        ),
        example: {
          interactiveText: 'Inspect G.',
          actionLabel: 'Inspect G',
          onAction: () => 'Undirected network.'
        },
        question: 'Is Graph G directed or undirected?',
        options: ['Undirected', 'Directed', 'Cyclical only'],
        correctIndex: 0,
        explanationAns: 'Graph G is undirected, showing genomic proximity.'
      },
      {
        title: '11. Why D and G share the same reaction vertices',
        explanation: 'Because every node represents a reaction which is governed by a chromosomal gene.',
        metaphor: 'Every warehouse has both a street address and neighborhood coordinates.',
        biology: 'Identical reactions analyzed from chemical and genetic angles.',
        formal: 'V(D) = V(G).',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            {"Reaction R1 (Metabolism) <==> Gene R1 (Genome)"}
          </div>
        ),
        example: {
          interactiveText: 'Analyze shared node.',
          actionLabel: 'Verify',
          onAction: () => 'Shared node represents same reaction.'
        },
        question: 'What connects the nodes of D and G?',
        options: ['They represent the exact same reactions/genes', 'They are completely separate biological entities', 'Nothing'],
        correctIndex: 0,
        explanationAns: 'D and G share nodes, allowing metabolic and genomic data integration.'
      },
      {
        title: '12. What is an induced subgraph?',
        explanation: 'A subset of vertices and all corresponding edges of the parent graph.',
        metaphor: 'Taking a subset of stores and looking ONLY at their direct neighborhood roads.',
        biology: 'Chromosome connections restricted to genes in the pathway.',
        formal: 'G[S] contains edges of G with both endpoints in S.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="50" r="12" fill="var(--primary)" />
            <circle cx="100" cy="50" r="12" fill="var(--primary)" />
            <line x1="42" y1="50" x2="88" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" />
          </svg>
        ),
        example: {
          interactiveText: 'Restrict graph.',
          actionLabel: 'Induce',
          onAction: () => 'Sub-graph induced.'
        },
        question: 'An induced subgraph of G on path vertices includes:',
        options: ['Only G-edges connecting vertices of that path', 'All edges from Graph G', 'No edges'],
        correctIndex: 0,
        explanationAns: 'The induced subgraph retains only the edges whose endpoints are in the selected vertex set.'
      },
      {
        title: '13. What is connectivity?',
        explanation: 'Every vertex is reachable from any other within the subgraph.',
        metaphor: 'All chosen delivery stops remain in a single connected street zone.',
        biology: 'A single chromosome neighborhood representing shared regulation.',
        formal: 'For all u, v in S, a path exists in G[S].',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="30" r="10" fill="var(--primary)" />
            <circle cx="100" cy="30" r="10" fill="var(--primary)" />
            <line x1="40" y1="30" x2="90" y2="30" stroke="var(--neutral-dark)" strokeWidth="2" />
          </svg>
        ),
        example: {
          interactiveText: 'Test connectivity.',
          actionLabel: 'Verify G',
          onAction: () => 'Graph is connected.'
        },
        question: 'When is a genomic subgraph connected?',
        options: ['When we can reach any node from any other using only path vertices', 'When all nodes are isolated', 'When there are no nodes'],
        correctIndex: 0,
        explanationAns: 'Connectivity means there are no disconnected/isolated partitions in the induced subgraph.'
      },
      {
        title: '14. What is a (D,G)-consistent path?',
        explanation: 'A metabolic path whose nodes induce a connected subgraph in G.',
        metaphor: 'A delivery route that doesn\'t visit disconnected neighborhoods.',
        biology: 'A functional pathway with co-localized genes.',
        formal: 'Path P in D where G[V(P)] is connected.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            P is directed path in D & G[V(P)] is connected.
          </div>
        ),
        example: {
          interactiveText: 'Test R1-R2-R3.',
          actionLabel: 'Verify path',
          onAction: () => 'Consistent path.'
        },
        question: 'A path is (D,G)-consistent if:',
        options: ['It is a directed path in D and its nodes are connected in G', 'It is circular', 'It has no genes'],
        correctIndex: 0,
        explanationAns: 'Consistency integrates the metabolic sequence (D) and genomic linkage (G).'
      },
      {
        title: '15. Why the longest path in D can be rejected',
        explanation: 'The longest metabolic chain might require a reaction whose gene is physically isolated.',
        metaphor: 'The longest delivery route visits a store located in a disconnected neighborhood.',
        biology: 'Longest path is rejected because one enzyme lacks chromosomal co-localization.',
        formal: 'G[V(longest D path)] is disconnected.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--danger)' }}>
            R1-R2-R3-R4 (R4 is isolated in G: REJECTED)
          </div>
        ),
        example: {
          interactiveText: 'Evaluate R4.',
          actionLabel: 'Analyze R4',
          onAction: () => 'R4 isolated. Path rejected.'
        },
        question: 'Why would the longest path in D be rejected?',
        options: ['Because its vertices are disconnected in G', 'Because it has too many steps', 'Because D has cycles'],
        correctIndex: 0,
        explanationAns: 'The longest pathway is invalid if it violates genomic proximity constraints.'
      },
      {
        title: '16. What "exact method" means',
        explanation: 'An algorithm proving mathematical global optimality without approximations.',
        metaphor: 'Exhaustively analyzing all possible routes to select the mathematically best one.',
        biology: 'Guarantees finding the absolute longest conserved pathway.',
        formal: 'Returns global optimal solution.',
        diagram: (
          <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent-gold)' }}>
            100% mathematical global optimum guaranteed.
          </div>
        ),
        example: {
          interactiveText: 'Prove optimality.',
          actionLabel: 'Prove',
          onAction: () => 'Optimal solution proved.'
        },
        question: 'An exact method guarantees:',
        options: ['Finding the globally optimal solution', 'A fast execution speed for massive graphs', 'Nothing'],
        correctIndex: 0,
        explanationAns: 'Exact methods mathematically guarantee global optimality.'
      },
      {
        title: '17. What NP-hard means',
        explanation: 'No known polynomial-time algorithm solves every possible instance efficiently.',
        metaphor: 'Calculating routes gets exponentially harder as the number of stops increases.',
        biology: 'Explains why we need solvers like CP1 or ILP instead of simple brute-force on massive networks.',
        formal: 'NP-hard complexity class.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            Computational time grows exponentially O(2^N).
          </div>
        ),
        example: {
          interactiveText: 'Scale instance.',
          actionLabel: 'Scale N=20',
          onAction: () => 'Exploration space: 1,048,576 nodes.'
        },
        question: 'What does NP-hard mean in plain language?',
        options: ['No known polynomial-time algorithm solves every instance efficiently', 'It is impossible to solve', 'It is solved instantly by JS'],
        correctIndex: 0,
        explanationAns: 'NP-hard indicates that computation time grows exponentially in the worst case.'
      },
      {
        title: '18. Limits of the browser educational demo',
        explanation: 'Bounded to small DAGs to remain lightweight and instant.',
        metaphor: 'Our map contains a maximum of 8 stops to fit on a browser.',
        biology: 'CP1 in papers uses Java Choco Solver. This is a lightweight browser demo.',
        formal: 'CP1-inspired browser educational model — exact only for bounded small DAG examples.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 600 }}>
            “CP1-inspired browser educational model — exact only for bounded small DAG examples.”
          </div>
        ),
        example: {
          interactiveText: 'Verify boundaries.',
          actionLabel: 'Test boundaries',
          onAction: () => 'DAG bounds valid.'
        },
        question: 'Can this browser demo be used for genome-scale biological discovery?',
        options: ['No, it is an educational tool for bounded small DAG examples', 'Yes, it replaces research solvers', 'Yes, for human genome'],
        correctIndex: 0,
        explanationAns: 'The browser demo is for pedagogy and small bounded examples only.'
      }
    ],
    ar: [
      {
        title: '١. ما هو المخطط (Graph)؟',
        explanation: 'المخطط هو بنية رياضية تتكون من مجموعة من النقاط تسمى الرؤوس، متصلة بواسطة روابط.',
        metaphor: 'خريطة عامة تحتوي على نقاط تسليم طرود متصلة بطرق.',
        biology: 'شبكة تصف الكيانات البيولوجية (التفاعلات، الإنزيمات) وعلاقات الترابط بينها.',
        formal: 'المخطط H = (V, E) يتم تعريفه بمجموعة الرؤوس V ومجموعة الحواف/الأقواس E.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }} aria-label="Simple graph diagram">
            <circle cx="40" cy="50" r="15" fill="var(--primary)" />
            <text cx="40" cy="50" x="35" y="55" fill="white" fontWeight="bold">A</text>
            <circle cx="160" cy="50" r="15" fill="var(--primary)" />
            <text cx="160" cy="50" x="155" y="55" fill="white" fontWeight="bold">B</text>
            <line x1="55" y1="50" x2="145" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" />
          </svg>
        ),
        example: {
          interactiveText: 'قم بالتبديل لمحاكاة إضافة رأس C متصل بـ B.',
          actionLabel: 'إضافة/إزالة الرأس C',
          onAction: () => 'تم إضافة الرأس C وتوصيله بالرأس B.'
        },
        question: 'ما هو التكوين الأساسي للمخطط؟',
        options: ['رؤوس وروابط', 'أسهم فقط', 'قائمة من المعادلات الخطية'],
        correctIndex: 0,
        explanationAns: 'يتم تمثيل المخطط رياضياً كمجموعة من الرؤوس والروابط التي تربط بينها.'
      },
      // Equivalent instructional content is available in French, English, and Arabic.
      {
        title: '٢. ما هو الرأس (Vertex)؟',
        explanation: 'الرأس (أو العقدة) هو الوحدة الأساسية أو نقطة التقاطع في المخطط.',
        metaphor: 'محطة توصيل محددة (مثل مستودع أو متجر) حيث يجب على عامل التوصيل التوقف عنده.',
        biology: 'تفاعل كيميائي محدد يحول المواد المتفاعلة إلى نواتج.',
        formal: 'عنصر v ينتمي إلى مجموعة الرؤوس المنتهية V.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="100" cy="50" r="20" fill="var(--primary)" stroke="var(--neutral-dark)" strokeWidth="2" />
            <text x="92" y="56" fill="white" fontWeight="bold">R1</text>
          </svg>
        ),
        example: {
          interactiveText: 'يخزن الرأس الخصائص العلمية.',
          actionLabel: 'فحص الرأس',
          onAction: () => 'الرأس R1: تفاعل كيميائي نشط.'
        },
        question: 'في المعلوماتية الحيوية، ماذا يمثل الرأس عادة؟',
        options: ['مادة استقلابية معزولة', 'تفاعل استقلابي محفز بالإنزيم', 'كروموسوم كامل'],
        correctIndex: 1,
        explanationAns: 'يمثل كل رأس في نموذجا تفاعلاً استقلابياً محفزاً بإنزيم معين.'
      },
      {
        title: '٣. ما هو القوس الموجه؟',
        explanation: 'يربط القوس الموجه رأس البداية برأس النهاية في اتجاه واحد فقط.',
        metaphor: 'شارع ذو اتجاه واحد. يمكنك الانتقال من A إلى B ولكن ليس العكس.',
        biology: 'سهم يوضح تتابع التفاعل (ناتج التفاعل R1 هو مادة متفاعلة لـ R2).',
        formal: 'زوج مرتب (u, v) ∈ E_D يمثل انتقالاً موجهاً.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="40" cy="50" r="15" fill="var(--primary)" />
            <circle cx="160" cy="50" r="15" fill="var(--primary)" />
            <line x1="55" y1="50" x2="160" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" markerEnd="url(#arrow)" />
          </svg>
        ),
        example: {
          interactiveText: 'قم بتغيير اتجاه التدفق الافتراضي.',
          actionLabel: 'عكس التدفق',
          onAction: () => 'الاتجاه الآن من اليمين إلى اليسار.'
        },
        question: 'إذا كان هناك قوس موجه من R1 إلى R2، هل يمكن للتدفق الاستقلابي التحرك من R2 إلى R1؟',
        options: ['نعم، الروابط الاستقلابية دائماً ثنائية الاتجاه', 'لا، القوس الموجه له اتجاه واحد فقط', 'فقط إذا كان G متصلاً'],
        correctIndex: 1,
        explanationAns: 'يقيد القوس الموجه حركة التدفق الاستقلابي باتجاه واحد.'
      },
      {
        title: '٤. ما هي الحافة غير الموجهة؟',
        explanation: 'تربط الحافة غير الموجهة بين رأسين بشكل متماثل ودون اتجاه محدد.',
        metaphor: 'علاقة جوار. إذا كان المتجر A قريباً من B، فإن B قريب من A.',
        biology: 'التقارب الفيزيائي للجينات المقابلة على الكروموسوم.',
        formal: 'زوج غير مرتب {u, v} ∈ E_G يمثل علاقة جوار متبادلة.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="40" cy="50" r="15" fill="var(--primary)" />
            <circle cx="160" cy="50" r="15" fill="var(--primary)" />
            <line x1="55" y1="50" x2="145" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" strokeDasharray="4" />
          </svg>
        ),
        example: {
          interactiveText: 'تبديل نوع الاتصال الجيني.',
          actionLabel: 'تبديل الاتصال',
          onAction: () => 'تم تبديل حالة الاتصال الجيني.'
        },
        question: 'هل حافة التقارب الجيني موجهة؟',
        options: ['لا، هي غير موجهة ومتماثلة', 'نعم، تشير دائماً من اليسار إلى اليمين', 'فقط في الجينومات الدائرية'],
        correctIndex: 0,
        explanationAns: 'يتم تمثيل التقارب الفيزيائي الجيني كعلاقة غير موجهة.'
      },
      {
        title: '٥. الفرق بين المشي والمسار والأثر',
        explanation: 'تعاريف مختلفة للمسارات بحسب شروط التكرار للرؤوس أو الحواف.',
        metaphor: 'المشي: أي مسار. المسار: رؤوس فريدة. الأثر: شوارع وحواف فريدة.',
        biology: 'يمثل تدفقاً استقلابياً يمنع التكرار والدورات.',
        formal: 'المسار (path) لا يكرر الرؤوس، والأثر (trail) لا يكرر الحواف.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', fontFamily: 'monospace' }}>
            {"Walk: R1-R2-R1 | Trail: R1-R2-R3 | Path: R1-R2-R3"}
          </div>
        ),
        example: {
          interactiveText: 'تحقق من [R1, R2, R1].',
          actionLabel: 'فحص R1-R2-R1',
          onAction: () => 'يحتوي على رأس مكرر: هو مشي وليس مساراً.'
        },
        question: 'هل يسمح المسار بتكرار نفس العقدة؟',
        options: ['لا، يجب أن تكون جميع الرؤوس فريدة', 'نعم، إذا لم يتم العثور على دورة', 'فقط في المخططات الدائرية'],
        correctIndex: 0,
        explanationAns: 'بحسب التعريف الرياضي للمسار، يجب أن تكون جميع الرؤوس فريدة.'
      },
      {
        title: '٦. ما هو التفاعل الاستقلابي؟',
        explanation: 'عملية كيميائية حيوية تحول مواد متفاعلة إلى نواتج بمساعدة الإنزيمات.',
        metaphor: 'وحدة معالجة وتحويل تقع في محطة تسليم.',
        biology: 'العقدة الأساسية للتدفق الاستقلابي.',
        formal: 'رأس يمثل تحولاً كيميائياً للمواد.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
            {"المتفاعلات ──[ الإنزيم ]──> النواتج"}
          </div>
        ),
        example: {
          interactiveText: 'تشغيل التحول الكيميائي.',
          actionLabel: 'تحفيز التفاعل',
          onAction: () => 'تم تحويل المتفاعلات.'
        },
        question: 'ما الذي يحفز التفاعل الاستقلابي في الخلية؟',
        options: ['الكربوهيدرات', 'الإنزيم', 'الحمض النووي الريبي المبدئي'],
        correctIndex: 1,
        explanationAns: 'تعمل الإنزيمات كعوامل حفازة للتفاعلات الاستقلابية.'
      },
      {
        title: '٧. ما هو الجين؟',
        explanation: 'تسلسل من الحمض النووي (DNA) يحتوي على تعليمات تصنيع الإنزيم.',
        metaphor: 'المخطط أو التعليمات اللازمة لبناء الآلة في المحطة.',
        biology: 'المنشأ الجيني للإنزيمات.',
        formal: 'إحداثي فيزيائي للجين مرتبط بالرأس.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
            DNA: [ Gene 1 ] === [ Gene 2 ]
          </div>
        ),
        example: {
          interactiveText: 'محاكاة التعبير الجيني.',
          actionLabel: 'تعبير جيني',
          onAction: () => 'تم تصنيع الإنزيم البروتيني.'
        },
        question: 'ماذا يرمز الجين في هذا السياق؟',
        options: ['الإنزيم الاستقلابي', 'المادة المتفاعلة', 'لا شيء'],
        correctIndex: 0,
        explanationAns: 'ترمز الجينات للبروتينات التي تعمل كإنزيمات.'
      },
      {
        title: '٨. ما هو التقارب الجيني؟',
        explanation: 'مدى قرب الجينات من بعضها البعض على الكروموسوم.',
        metaphor: 'مستودعان يقعان في نفس الشارع.',
        biology: 'التجاور الفيزيائي يدعم التنظيم والتعبير المشترك.',
        formal: 'حافة في G تربط رأسين مسافة الجينات بينهما أقل من العتبة.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            {"Gene A ──(المسافة < عتبة)── Gene B"}
          </div>
        ),
        example: {
          interactiveText: 'قياس المسافة الجينية.',
          actionLabel: 'قياس',
          onAction: () => 'الجينات متجاورة على الكروموسوم.'
        },
        question: 'ما الفائدة البيولوجية من تقارب الجينات؟',
        options: ['التنظيم والتعبير الجيني المشترك', 'إيقاف الترجمة', 'زيادة الطفرات'],
        correctIndex: 0,
        explanationAns: 'يدعم التقارب الجيني التنظيم والتعبير المتزامن للتعبير الإنزيمي.'
      },
      {
        title: '٩. ما هو المخطط D؟',
        explanation: 'شبكة التتابع الاستقلابي الموجهة.',
        metaphor: 'خريطة الطرق التي توضح مسارات التوصيل ذات الاتجاه الواحد.',
        biology: 'شبكة الاستقلاب الممثلة كمخطط موجه خالي من الدورات (DAG).',
        formal: 'D = (V, E_D) حيث تمثل الحواف التدفق الاستقلابي.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="50" r="12" fill="var(--primary)" />
            <circle cx="100" cy="50" r="12" fill="var(--primary)" />
            <line x1="42" y1="50" x2="88" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" markerEnd="url(#arrow)" />
          </svg>
        ),
        example: {
          interactiveText: 'تحقق من خصائص D.',
          actionLabel: 'فحص D',
          onAction: () => 'مخطط موجه خالي من الدورات.'
        },
        question: 'ماذا يمثل التدفق في المخطط D بيولوجياً؟',
        options: ['تتابع التفاعلات الاستقلابية', 'تقارب الكروموسومات الجينية', 'مسارات طي البروتين'],
        correctIndex: 0,
        explanationAns: 'يمثل المخطط D التدفق الكيميائي الاستقلابي.'
      },
      {
        title: '١٠. ما هو المخطط G؟',
        explanation: 'شبكة التقارب الجيني غير الموجهة.',
        metaphor: 'خريطة توضح اتصالات الجوار المباشرة.',
        biology: 'شبكة تقارب الجينات chromosomically.',
        formal: 'G = (V, E_G) حيث تمثل الحواف روابط التقارب الفيزيائي.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="50" r="12" fill="var(--primary)" />
            <circle cx="100" cy="50" r="12" fill="var(--primary)" />
            <line x1="42" y1="50" x2="88" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" strokeDasharray="3" />
          </svg>
        ),
        example: {
          interactiveText: 'فحص G.',
          actionLabel: 'فحص G',
          onAction: () => 'مخطط غير موجه.'
        },
        question: 'هل المخطط G موجه أم غير موجه؟',
        options: ['غير موجه', 'موجه', 'دائري فقط'],
        correctIndex: 0,
        explanationAns: 'المخطط G هو مخطط غير موجه يمثل التقارب الجيني.'
      },
      {
        title: '١١. لماذا يشترك D و G في نفس الرؤوس؟',
        explanation: 'لأن كل عقدة تمثل تفاعلاً استقلابياً يرمز له بجين على الكروموسوم.',
        metaphor: 'كل مستودع له عنوان طريق وإحداثيات جوار في الحي.',
        biology: 'دراسة نفس التفاعلات الكيميائية من منظور التدفق والوراثة.',
        formal: 'V(D) = V(G).',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            {"التفاعل R1 (استقلاب) <==> الجين R1 (جينوم)"}
          </div>
        ),
        example: {
          interactiveText: 'تحليل العقدة المشتركة.',
          actionLabel: 'تحقق',
          onAction: () => 'تم التحقق من تطابق العقدة.'
        },
        question: 'ما الذي يربط بين عقد المخططين D و G؟',
        options: ['تمثل نفس التفاعلات/الجينات تماماً', 'هي كيانات بيولوجية منفصلة تماماً', 'لا شيء'],
        correctIndex: 0,
        explanationAns: 'يشترك المخططان D و G في العقد، مما يتيح دمج البيانات الاستقلابية والجينية.'
      },
      {
        title: '١٢. ما هو المخطط الفرعي المستحث (Induced Subgraph)؟',
        explanation: 'مجموعة فرعية من الرؤوس وجميع الحواف المقابلة لها من المخطط الأصلي.',
        metaphor: 'اختيار مجموعة من المتاجر والنظر فقط إلى طرق الجوار التي تربط بينها مباشرة.',
        biology: 'روابط الكروموسوم المقتصرة فقط على جينات المسار المحدد.',
        formal: 'G[S] يحتوي على حواف G التي تقع نهايتاها في المجموعة S.',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="50" r="12" fill="var(--primary)" />
            <circle cx="100" cy="50" r="12" fill="var(--primary)" />
            <line x1="42" y1="50" x2="88" y2="50" stroke="var(--neutral-dark)" strokeWidth="2" />
          </svg>
        ),
        example: {
          interactiveText: 'تحديد المخطط الفرعي.',
          actionLabel: 'استحثاث',
          onAction: () => 'تم إنشاء المخطط الفرعي المستحث.'
        },
        question: 'يحتوي المخطط الفرعي المستحث لـ G على رؤوس المسار على:',
        options: ['فقط حواف G التي تربط بين رؤوس ذلك المسار', 'جميع الحواف من المخطط G', 'لا توجد حواف'],
        correctIndex: 0,
        explanationAns: 'يحتفظ المخطط الفرعي المستحث فقط بالحواف التي تقع نهايتها ضمن مجموعة الرؤوس المحددة.'
      },
      {
        title: '١٣. ما هو الاتصال (Connectivity)؟',
        explanation: 'إمكانية الوصول من أي رأس إلى أي رأس آخر في المخطط الفرعي.',
        metaphor: 'تظل جميع محطات التوصيل المختارة في منطقة شارع واحدة متصلة.',
        biology: 'منطقة كروموسومية واحدة متصلة تمثل تنظيماً مشتركاً.',
        formal: 'لكل u, v في S، يوجد مسار في G[S].',
        diagram: (
          <svg width="200" height="100" style={{ display: 'block', margin: 'auto' }}>
            <circle cx="30" cy="30" r="10" fill="var(--primary)" />
            <circle cx="100" cy="30" r="10" fill="var(--primary)" />
            <line x1="40" y1="30" x2="90" y2="30" stroke="var(--neutral-dark)" strokeWidth="2" />
          </svg>
        ),
        example: {
          interactiveText: 'فحص الاتصال.',
          actionLabel: 'تحقق من G',
          onAction: () => 'المخطط متصل.'
        },
        question: 'متى يكون المخطط الفرعي الجيني متصلاً؟',
        options: ['عندما يمكننا الوصول من أي عقدة إلى أخرى باستخدام عقد المسار فقط', 'عندما تكون جميع العقد معزولة', 'عندما لا توجد عقد'],
        correctIndex: 0,
        explanationAns: 'يعني الاتصال عدم وجود أجزاء معزولة أو منفصلة في المخطط الفرعي المستحث.'
      },
      {
        title: '١٤. ما هو المسار المتسق (D,G)؟',
        explanation: 'مسار استقلابي موجه في D تشكل عقده مخططاً فرعياً متصلاً في G.',
        metaphor: 'مسار توصيل لا يمر عبر مناطق معزولة غير متصلة جغرافياً.',
        biology: 'مسار وظيفي ذو جينات متجاورة في الكروموسوم.',
        formal: 'المسار P في D حيث G[V(P)] متصل.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            P مسار موجه في D و G[V(P)] متصل.
          </div>
        ),
        example: {
          interactiveText: 'فحص R1-R2-R3.',
          actionLabel: 'تحقق من المسار',
          onAction: () => 'مسار متسق وصالح.'
        },
        question: 'يكون المسار متسقاً (D,G) إذا كان:',
        options: ['مساراً موجهاً في D وعقده متصلة في G', 'دائرياً', 'لا يحتوي على جينات'],
        correctIndex: 0,
        explanationAns: 'يجمع الاتساق بين التتابع الاستقلابي (D) والروابط الجينية (G).'
      },
      {
        title: '١٥. لماذا يمكن رفض أطول مسار في D؟',
        explanation: 'قد يتطلب أطول مسار كيميائي تفاعلاً يقع جينه في مكان معزول على الكروموسوم.',
        metaphor: 'أطول مسار توصيل ممكن يمر بمستودع يقع في حي معزول.',
        biology: 'يتم رفض أطول مسار لأن أحد إنزيماته يفتقد للتقارب الجيني المشترك.',
        formal: 'G[V(longest D path)] غير متصل.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--danger)' }}>
            R1-R2-R3-R4 (العقدة R4 معزولة في G: تم الرفض)
          </div>
        ),
        example: {
          interactiveText: 'فحص العقدة R4.',
          actionLabel: 'تحليل R4',
          onAction: () => 'العقدة R4 معزولة. تم رفض المسار.'
        },
        question: 'لماذا يتم رفض أطول مسار في D؟',
        options: ['لأن عقده معزولة وغير متصلة في G', 'لأن خطواته كثيرة جداً', 'لأن D يحتوي على دورات'],
        correctIndex: 0,
        explanationAns: 'يكون المسار الأطول غير صالح إذا انتهك قيود التقارب الجيني.'
      },
      {
        title: '١٦. ماذا تعني "الطريقة الدقيقة"؟',
        explanation: 'خوارزمية تضمن إيجاد الحل الأمثل رياضياً دون تقديرات أو تقريبات.',
        metaphor: 'يقوم عامل التوصيل بفحص جميع الطرق الممكنة رياضياً للتأكد من اختيار الأفضل بنسبة ١٠٠٪.',
        biology: 'تضمن العثور على أطول مسار استقلابي محفوظ فعلياً.',
        formal: 'تضمن إرجاع الحل الأمثل الكلي.',
        diagram: (
          <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent-gold)' }}>
            الحل الأمثل الكلي مضمون رياضياً بنسبة ١٠٠٪.
          </div>
        ),
        example: {
          interactiveText: 'إثبات الحل الأمثل.',
          actionLabel: 'إثبات',
          onAction: () => 'تم إثبات الحل الأمثل.'
        },
        question: 'ما الذي تضمنه الطريقة الدقيقة؟',
        options: ['إيجاد الحل الأمثل الكلي رياضياً', 'سرعة تشغيل فائقة للمخططات الضخمة', 'لا شيء'],
        correctIndex: 0,
        explanationAns: 'تضمن الطرق الدقيقة رياضياً أنه لا يوجد حل أفضل من الحل المختار.'
      },
      {
        title: '١٧. ماذا يعني NP-hard (صعب حوسبياً)؟',
        explanation: 'لا توجد خوارزمية معروفة قادرة على حل جميع الحالات بكفاءة في وقت متعدد الحدود.',
        metaphor: 'يزداد حساب المسارات صعوبة بشكل كبير (أسياً) مع زيادة عدد محطات التوقف.',
        biology: 'يفسر سبب حاجتنا لمحللات متطورة مثل CP1 بدلاً من البحث العشوائي في الشبكات الكبيرة.',
        formal: 'فئة تعقيد NP-hard.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            زمن الحساب ينمو أسياً O(2^N).
          </div>
        ),
        example: {
          interactiveText: 'محاكاة نمو العقد.',
          actionLabel: 'محاكاة N=20',
          onAction: () => 'مساحة البحث: ١,٠٤٨,٥٧٦ عقدة.'
        },
        question: 'ماذا يعني NP-hard بلغة أكاديمية؟',
        options: ['لا توجد خوارزمية معروفة تحله بكفاءة في وقت متعدد الحدود لجميع الحالات', 'مستحيل الحل تماماً', 'يتم حله فورياً بواسطة المتصفح دائماً'],
        correctIndex: 0,
        explanationAns: 'يشير NP-hard إلى أن زمن الحساب ينمو أسياً في أسوأ الحالات.'
      },
      {
        title: '١٨. حدود نموذج العرض التعليمي الحالي',
        explanation: 'مقتصر على المخططات الموجهة خالية الدورات (DAG) الصغيرة لضمان الخفة والاستجابة الفورية.',
        metaphor: 'خريطتنا تحتوي على ٨ محطات كحد أقصى لتناسب حجم شاشة المتصفح.',
        biology: 'يستخدم CP1 الأصلي في الأوراق البحثية Choco Solver المكتوب بجافا. هذا نموذج متصفح خفيف فقط.',
        formal: 'CP1-inspired browser educational model — exact only for bounded small DAG examples.',
        diagram: (
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 600 }}>
            “CP1-inspired browser educational model — exact only for bounded small DAG examples.”
          </div>
        ),
        example: {
          interactiveText: 'التحقق من الحدود.',
          actionLabel: 'فحص الحدود',
          onAction: () => 'الحدود صالحة.'
        },
        question: 'هل يمكن استخدام هذا النموذج البرمجي البسيط في الأبحاث الجينية الحقيقية واسعة النطاق؟',
        options: ['لا، هو مصمم كأداة تعليمية فقط للمخططات الصغيرة المحدودة', 'نعم، يحل محل محللات الأبحاث تماماً', 'نعم، للجينوم البشري الكامل'],
        correctIndex: 0,
        explanationAns: 'تم تصميم هذا النموذج للمتصفح لأغراض التدريس والمخططات الصغيرة فقط.'
      }
    ]
  };

  const currentChapters = chapters[lang];
  const activeChapterData = currentChapters[activeChapter];

  const handleAnswerSelect = (optIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [activeChapter]: optIndex
    });
    setShowAnswerFeedback({
      ...showAnswerFeedback,
      [activeChapter]: true
    });
  };

  const runExampleAction = (idx: number) => {
    const msg = activeChapterData.example.onAction();
    setExampleStates({
      ...exampleStates,
      [idx]: msg
    });
  };

  // Skip to main navigation helper for accessibility
  const handleSkipNav = (e: React.MouseEvent) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-course-content');
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
    }
  };

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <a href="#main-course-content" onClick={handleSkipNav} className="skip-link">
        {lang === 'fr' ? 'Aller directement au contenu' : (lang === 'en' ? 'Skip to main content' : 'الانتقال إلى المحتوى مباشرة')}
      </a>

      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .sr-only:focus-visible {
          position: fixed;
          top: 10px;
          left: 10px;
          width: auto;
          height: auto;
          overflow: visible;
          clip: auto;
          white-space: normal;
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-lg);
        }
        .start-diagram-panel svg {
          width: min(100%, 360px);
          height: auto;
        }
      `}</style>

      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>
          {lang === 'fr' ? 'Module d\'Apprentissage Pas-à-Pas' : (lang === 'en' ? 'Step-by-Step Learning Course' : 'وحدة التعلم التدريجي خطوة بخطوة')}
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--neutral-medium)' }}>
          {lang === 'fr' ? 'Apprenez les bases de la théorie des graphes et de la cohérence métabolique.' : (lang === 'en' ? 'Learn the foundations of graph theory and metabolic consistency.' : 'تعلم أسس نظرية المخططات والاتساق الاستقلابي الجيني.')}
        </p>
      </header>

      {/* Progress tracker */}
      <div className="card" style={{ padding: 'var(--space-md)', marginBlockEnd: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '1rem', marginBlockEnd: 'var(--space-xs)' }}>{t.progress}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--neutral-bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${((Object.keys(selectedAnswers).length / currentChapters.length) * 100).toFixed(0)}%`,
              height: '100%',
              backgroundColor: 'var(--primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
            {((Object.keys(selectedAnswers).length / currentChapters.length) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        {/* Chapters Left Sidebar */}
        <aside style={{ flex: '1 1 250px', maxHeight: '600px', overflowY: 'auto' }} className="card">
          <h3 style={{ fontSize: '1.05rem', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-xs)', marginBlockEnd: 'var(--space-sm)' }}>
            {t.chaptersTitle}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {currentChapters.map((ch, idx) => {
              const isCompleted = selectedAnswers[idx] !== undefined;
              const isActive = idx === activeChapter;
              return (
                <li key={idx} style={{ marginBlockEnd: '4px' }}>
                  <button
                    onClick={() => {
                      setActiveChapter(idx);
                      // Scroll target logic for focus restoration
                      const element = document.getElementById('main-course-content');
                      if (element) element.focus();
                    }}
                    style={{
                      width: '100%',
                      textAlign: isAr ? 'right' : 'left',
                      background: isActive ? 'var(--primary-bg)' : 'transparent',
                      border: 'none',
                      borderLeft: !isAr && isActive ? '3px solid var(--primary)' : 'none',
                      borderRight: isAr && isActive ? '3px solid var(--primary)' : 'none',
                      paddingBlock: 'var(--space-xs)',
                      paddingInline: 'var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--primary)' : 'var(--neutral-medium)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{ch.title}</span>
                    {isCompleted && (
                      <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}><Icon name="check" size={14} /></span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Chapters Main Content Area */}
        <section id="main-course-content" style={{ flex: '2 1 500px', outline: 'none' }} className="card" tabIndex={0}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-sm)', marginBlockEnd: 'var(--space-md)' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary)' }}>
              {t.chapter} {activeChapter + 1} / {currentChapters.length}
            </span>
            <h3 style={{ fontSize: '1.25rem', border: 'none', padding: 0, margin: 0 }}>
              {activeChapterData.title}
            </h3>
          </div>

          {/* Graphical/Diagram component */}
          <div className="start-diagram-panel" style={{
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            marginBlockEnd: 'var(--space-md)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '150px'
          }}>
            {activeChapterData.diagram}
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--neutral-dark)' }}>
            {activeChapterData.explanation}
          </p>

          {/* Delivery Metaphor Block */}
          <div style={{
            backgroundColor: 'var(--accent-gold-bg)',
            borderLeft: isAr ? 'none' : '4px solid var(--accent-gold)',
            borderRight: isAr ? '4px solid var(--accent-gold)' : 'none',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-sm)',
            marginBlockEnd: 'var(--space-sm)',
          }}>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--accent-gold)', textTransform: 'uppercase', marginBlockEnd: '2px' }}>
              {t.metaphorTitle}
            </strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--neutral-dark)', margin: 0 }}>
              {activeChapterData.metaphor}
            </p>
          </div>

          {/* Biological Mapping Block */}
          <div style={{
            backgroundColor: 'var(--primary-bg)',
            borderLeft: isAr ? 'none' : '4px solid var(--primary)',
            borderRight: isAr ? '4px solid var(--primary)' : 'none',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-sm)',
            marginBlockEnd: 'var(--space-sm)',
          }}>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBlockEnd: '2px' }}>
              {t.biologyTitle}
            </strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--neutral-dark)', margin: 0 }}>
              {activeChapterData.biology}
            </p>
          </div>

          {/* Formal Scientific Block */}
          <div style={{
            backgroundColor: 'var(--neutral-bg-hover)',
            borderLeft: isAr ? 'none' : '4px solid var(--neutral-medium)',
            borderRight: isAr ? '4px solid var(--neutral-medium)' : 'none',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-sm)',
            marginBlockEnd: 'var(--space-md)',
          }}>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--neutral-medium)', textTransform: 'uppercase', marginBlockEnd: '2px' }}>
              {t.formalTitle}
            </strong>
            <code style={{ fontSize: '0.85rem', color: 'var(--neutral-dark)', display: 'block', fontFamily: 'monospace' }}>
              {activeChapterData.formal}
            </code>
          </div>

          {/* Scientific Disclaimer Warning */}
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--neutral-medium)',
            fontStyle: 'italic',
            borderTop: '1px solid var(--border-color)',
            paddingTop: 'var(--space-xs)',
            marginBlockEnd: 'var(--space-md)'
          }}>
            <span className="icon-label"><Icon name="alert" size={15} /> {t.warningLabel}</span>
          </div>

          {/* Interactive Example Block */}
          <div className="card" style={{ padding: 'var(--space-md)', backgroundColor: 'var(--bg-app)', borderStyle: 'dashed' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', marginBlockEnd: 'var(--space-xs)' }}>{t.interactiveTitle}</h4>
            <p style={{ fontSize: '0.85rem', marginBlockEnd: 'var(--space-sm)' }}>{activeChapterData.example.interactiveText}</p>
            <button
              onClick={() => runExampleAction(activeChapter)}
              className="btn btn-secondary"
              style={{ minHeight: '36px', fontSize: '0.85rem', width: 'auto', paddingBlock: '4px', paddingInline: 'var(--space-md)' }}
            >
              {activeChapterData.example.actionLabel}
            </button>
            {exampleStates[activeChapter] && (
              <div style={{ marginBlockStart: 'var(--space-xs)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                {exampleStates[activeChapter]}
              </div>
            )}
          </div>

          {/* Checkpoint Question Block */}
          <div style={{
            backgroundColor: 'var(--neutral-bg-hover)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            marginBlockStart: 'var(--space-md)',
            marginBlockEnd: 'var(--space-md)'
          }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--neutral-dark)', marginBlockEnd: 'var(--space-sm)' }}>
              <span className="icon-label"><Icon name="help" /> {t.checkpoint}</span>
            </h4>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--neutral-dark)', marginBlockEnd: 'var(--space-md)' }}>
              {activeChapterData.question}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {activeChapterData.options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[activeChapter] === oIdx;
                const isCorrect = oIdx === activeChapterData.correctIndex;
                const showFeedback = showAnswerFeedback[activeChapter];

                let borderStyle = '1px solid var(--border-color)';
                let bgStyle = 'var(--bg-card)';
                if (showFeedback) {
                  if (isSelected) {
                    borderStyle = isCorrect ? '2px solid var(--primary)' : '2px solid var(--danger)';
                    bgStyle = isCorrect ? 'var(--primary-bg)' : 'var(--danger-bg)';
                  } else if (isCorrect) {
                    borderStyle = '2px solid var(--primary)';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleAnswerSelect(oIdx)}
                    style={{
                      width: '100%',
                      textAlign: isAr ? 'right' : 'left',
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      border: borderStyle,
                      backgroundColor: bgStyle,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? 600 : 500,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {showAnswerFeedback[activeChapter] && (
              <div style={{
                marginBlockStart: 'var(--space-md)',
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: selectedAnswers[activeChapter] === activeChapterData.correctIndex ? 'var(--primary-bg)' : 'var(--danger-bg)',
                border: selectedAnswers[activeChapter] === activeChapterData.correctIndex ? '1px solid var(--primary)' : '1px solid var(--danger-border)',
                color: selectedAnswers[activeChapter] === activeChapterData.correctIndex ? 'var(--primary)' : 'var(--danger)',
                fontSize: '0.9rem'
              }}>
                <strong>
                  {selectedAnswers[activeChapter] === activeChapterData.correctIndex ? t.correct : t.incorrect}
                </strong>
                <p style={{ margin: 0, marginBlockStart: '4px', fontSize: '0.85rem', color: 'var(--neutral-dark)' }}>
                  {activeChapterData.explanationAns}
                </p>
              </div>
            )}
          </div>

          {/* Bottom navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBlockStart: 'var(--space-lg)' }}>
            <button
              onClick={() => {
                if (activeChapter > 0) setActiveChapter(activeChapter - 1);
              }}
              disabled={activeChapter === 0}
              className="btn btn-secondary"
              style={{ width: 'auto' }}
            >
              {t.btnPrev}
            </button>

            {activeChapter === currentChapters.length - 1 ? (
              <button
                onClick={() => navigate('/methods/cp1')}
                className="btn btn-primary"
                style={{ width: 'auto', backgroundColor: 'var(--accent-gold)' }}
              >
                {t.btnStartCP1}
              </button>
            ) : (
              <button
                onClick={() => setActiveChapter(activeChapter + 1)}
                className="btn btn-primary"
                style={{ width: 'auto' }}
              >
                {t.btnNext}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
