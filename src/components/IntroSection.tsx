import React from 'react';

interface IntroSectionProps {
  lang: 'fr' | 'en';
}

export const IntroSection: React.FC<IntroSectionProps> = ({ lang }) => {
  return (
    <section className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--primary)' }}>
        {lang === 'fr' ? 'Introduction au Problème' : 'Problem Introduction'}
      </h2>
      <div style={{ fontSize: '0.95rem', color: 'var(--neutral-medium)' }}>
        {lang === 'fr' ? (
          <>
            <p>
              En biologie des systèmes, la reconstruction de voies métaboliques cohérentes nécessite de croiser
              deux types d'informations : l'ordre des réactions chimiques (données cinétiques/stœchiométriques)
              et la proximité physique des gènes associés sur le chromosome (données génomiques).
            </p>
            <p>
              Cette démo modélise et résout le problème simplifié du <strong>chemin cohérent (D,G)</strong> :
            </p>
            <ul style={{ paddingLeft: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
              <li style={{ marginBottom: 'var(--space-xs)' }}>
                <strong>Graphe D (Réseau métabolique) :</strong> Un graphe orienté sans cycle (DAG) dont les sommets représentent les réactions chimiques. Les flèches indiquent qu'une réaction produit un métabolite consommé directement par la suivante.
              </li>
              <li style={{ marginBottom: 'var(--space-xs)' }}>
                <strong>Graphe G (Proximité génomique) :</strong> Un graphe non orienté sur les mêmes sommets (réactions). Une liaison existe si les gènes codant pour les enzymes de ces deux réactions sont physiquement proches sur le génome.
              </li>
              <li style={{ marginBottom: 'var(--space-xs)' }}>
                <strong>Régle de cohérence (D,G) :</strong> Un chemin dirigé dans le réseau métabolique D est dit <em>cohérent</em> (ou valide) si l'ensemble de ses sommets induit un sous-graphe <strong>connecté</strong> dans le graphe génomique G. C'est-à-dire qu'on peut relier n'importe quel sommet du chemin à un autre via des liaisons génomiques en utilisant uniquement les réactions sélectionnées.
              </li>
            </ul>
            <p style={{ fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              L'objectif est d'identifier le <strong>plus long chemin cohérent</strong>. Comme démontré ci-dessous, le plus long chemin métabolique dans D n'est pas toujours cohérent génomiquement.
            </p>
          </>
        ) : (
          <>
            <p>
              In systems biology, reconstructing coherent metabolic pathways requires integrating two types
              of biological evidence: the succession of chemical reactions (metabolic flow) and the physical
              proximity of the corresponding genes on the chromosome (genomic coregulation).
            </p>
            <p>
              This demo models and solves the simplified <strong>(D,G)-consistent path problem</strong>:
            </p>
            <ul style={{ paddingLeft: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
              <li style={{ marginBottom: 'var(--space-xs)' }}>
                <strong>Graph D (Metabolic network):</strong> A directed acyclic graph (DAG) where vertices represent chemical reactions. Arrows represent possible reaction succession (the output of one reaction is the input of the next).
              </li>
              <li style={{ marginBottom: 'var(--space-xs)' }}>
                <strong>Graph G (Genomic proximity):</strong> An undirected graph on the same reaction vertices. An edge exists if the genes encoding the enzymes for these reactions are adjacent or nearby on the chromosome.
              </li>
              <li style={{ marginBottom: 'var(--space-xs)' }}>
                <strong>(D,G)-Consistency Rule:</strong> A directed metabolic path in D is <em>consistent</em> (valid) if its vertex set induces a <strong>connected</strong> subgraph in the genomic graph G. This means we can traverse between any two vertices in the path using genomic edges restricted only to the path vertices.
              </li>
            </ul>
            <p style={{ fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-md)' }}>
              The goal is to find the <strong>longest consistent path</strong>. As demonstrated below, the longest metabolic path in D is not necessarily genomically coherent.
            </p>
          </>
        )}
      </div>
    </section>
  );
};
