import React from 'react';

interface ResultPanelProps {
  exampleId: string;
  longestConsistentPath: string[] | null;
  lang: 'fr' | 'en';
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  exampleId,
  longestConsistentPath,
  lang,
}) => {
  const winner = longestConsistentPath ? longestConsistentPath.join(' → ') : '';

  const renderContent = () => {
    if (exampleId === 'simple-valide') {
      return lang === 'fr' ? (
        <>
          <p>
            Le plus long chemin métabolique dans D est <strong>R1 → R2 → R3 → R4</strong> (longueur 4).
          </p>
          <p>
            Dans ce cas simple, la proximité génomique (graphe G) reflète parfaitement l'ordre des réactions
            métaboliques : il existe des liaisons pour toutes les paires successives (R1—R2, R2—R3, R3—R4). Le sous-graphe
            induit de G est donc parfaitement connexe.
          </p>
          <p>
            <strong>Pourquoi le gagnant est valide :</strong> Le chemin est conservé à la fois sur le plan
            métabolique et génomique. Il permet d'assurer un flux continu tout en bénéficiant d'une proximité physique
            sur le chromosome qui favorise la co-régulation et la co-expression des enzymes impliquées.
          </p>
        </>
      ) : (
        <>
          <p>
            The longest metabolic path in D is <strong>R1 → R2 → R3 → R4</strong> (length 4).
          </p>
          <p>
            In this simple case, the genomic proximity (graph G) perfectly reflects the order of metabolic
            reactions: genomic links exist for all consecutive pairs (R1—R2, R2—R3, R3—R4). The induced genomic subgraph
            is fully connected.
          </p>
          <p>
            <strong>Why the winner is valid:</strong> The path is conserved both metabolically and genomically.
            It ensures a continuous chemical flow while maintaining physical proximity on the chromosome, which supports
            enzymatic coregulation and co-expression.
          </p>
        </>
      );
    }

    if (exampleId === 'longest-rejected') {
      return lang === 'fr' ? (
        <>
          <p>
            Le plus long chemin métabolique dans D est <strong>R1 → R2 → R3 → R4</strong> (longueur 4).
          </p>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>
            Ce chemin est REJETÉ par l'algorithme de cohérence.
          </p>
          <p>
            <strong>Pourquoi R4 rend le chemin invalide :</strong> Dans le graphe génomique G, le sommet <strong>R4</strong> est
            complètement isolé des autres sommets du chemin (R1, R2, R3). Il n'y a aucune liaison génomique active entre R4
            et le reste du groupe dans le sous-graphe induit. La connectivité de G est donc rompue, ce qui rend le chemin
            biologiquement incohérent génomiquement.
          </p>
          <p>
            <strong>Choix du vainqueur :</strong> Les deux plus longs chemins cohérents alternatifs sont <strong>R1 → R2 → R3</strong>
            et <strong>R1 → R2 → R5</strong> (longueur 3). Par notre règle de départage déterministe (ordre lexicographique des IDs),
            l'algorithme choisit le chemin <strong>R1 → R2 → R3</strong>.
          </p>
        </>
      ) : (
        <>
          <p>
            The longest metabolic path in D is <strong>R1 → R2 → R3 → R4</strong> (length 4).
          </p>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>
            This path is REJECTED by the consistency check.
          </p>
          <p>
            <strong>Why R4 makes the path invalid:</strong> In the genomic graph G, vertex <strong>R4</strong> is
            completely isolated from the other vertices in the path (R1, R2, R3). There are no genomic edges in G
            connecting R4 to any of these vertices. The induced genomic subgraph is disconnected.
          </p>
          <p>
            <strong>Winner selection:</strong> The two alternative longest consistent paths are <strong>R1 → R2 → R3</strong>
            and <strong>R1 → R2 → R5</strong> (length 3). Applying our deterministic lexicographical tie-break rule, the algorithm
            selects <strong>R1 → R2 → R3</strong>.
          </p>
        </>
      );
    }

    if (exampleId === 'multiple-candidates') {
      return lang === 'fr' ? (
        <>
          <p>
            Ce graphe contient plusieurs chemins concurrents à évaluer.
          </p>
          <p>
            Les chemins orientés notables dans D sont :
          </p>
          <ul style={{ paddingLeft: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            <li>R1 → R2 → R4 (longueur 3, cohérent car G contient R1—R2 et R2—R4)</li>
            <li>R1 → R3 → R4 (longueur 3, cohérent car G contient R1—R3 et R3—R4)</li>
            <li><strong>R1 → R2 → R5 → R6</strong> (longueur 4, cohérent car G contient R1—R2, R2—R5, R5—R6)</li>
          </ul>
          <p>
            <strong>Pourquoi le gagnant est valide :</strong> L'algorithme exact évalue l'ensemble des chemins et
            sélectionne le plus long chemin cohérent : <strong>{winner}</strong>. Il est entièrement connecté dans G
            car les gènes des enzymes successives sont proches physiquement deux à deux sur le génome.
          </p>
          <p>
            L'exploration exhaustive garantit que nous n'avons pas manqué de meilleure solution.
          </p>
        </>
      ) : (
        <>
          <p>
            This dataset contains multiple competing paths to evaluate.
          </p>
          <p>
            Notable directed paths in D include:
          </p>
          <ul style={{ paddingLeft: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            <li>R1 → R2 → R4 (length 3, consistent since G has R1—R2 and R2—R4)</li>
            <li>R1 → R3 → R4 (length 3, consistent since G has R1—R3 and R3—R4)</li>
            <li><strong>R1 → R2 → R5 → R6</strong> (length 4, consistent since G has R1—R2, R2—R5, R5—R6)</li>
          </ul>
          <p>
            <strong>Why the winner is valid:</strong> The exact algorithm exhaustively checks all paths and selects the
            longest consistent path: <strong>{winner}</strong>. It is fully connected in G because the corresponding genes
            are adjacent or close to one another on the chromosome.
          </p>
          <p>
            The exact exhaustive search guarantees that we found the global mathematical optimum.
          </p>
        </>
      );
    }

    return null;
  };

  return (
    <section 
      className="card" 
      style={{ 
        borderLeft: '4px solid var(--accent-gold-border)',
        backgroundColor: 'var(--bg-card)'
      }}
    >
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--accent-gold)' }}>
        {lang === 'fr' ? 'Analyse Biologique Finale' : 'Final Biological Analysis'}
      </h2>
      
      <div style={{ fontSize: '0.95rem', color: 'var(--neutral-medium)', marginTop: 'var(--space-sm)' }}>
        {renderContent()}
      </div>
    </section>
  );
};
