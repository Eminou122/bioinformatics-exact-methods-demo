import React from 'react';
import { DirectedGraph } from './DirectedGraph';
import { GenomicGraph } from './GenomicGraph';

interface GraphPanelProps {
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
  nodePositions: Record<string, { x: number; y: number }>;
  highlightedNodes: Set<string>;
  activePath: string[];
  isFinalResult: boolean;
  isAcceptedStep: boolean;
  lang: 'fr' | 'en';
}

export const GraphPanel: React.FC<GraphPanelProps> = ({
  vertices,
  edgesD,
  edgesG,
  nodePositions,
  highlightedNodes,
  activePath,
  isFinalResult,
  isAcceptedStep,
  lang,
}) => {
  return (
    <section className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>
        {lang === 'fr' ? 'Visualisation des Graphes' : 'Graph Visualization'}
      </h2>

      <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
        {/* Metabolic Graph D */}
        <div>
          <DirectedGraph
            vertices={vertices}
            edgesD={edgesD}
            nodePositions={nodePositions}
            highlightedNodes={highlightedNodes}
            activePath={activePath}
            isFinalResult={isFinalResult}
            isAcceptedStep={isAcceptedStep}
            lang={lang}
          />
          <p style={{ fontSize: '0.8rem', marginTop: 'var(--space-sm)', textAlign: 'center', color: 'var(--neutral-medium)' }}>
            {lang === 'fr' 
              ? 'Le graphe orienté D représente l\'écoulement métabolique (flèches).' 
              : 'Directed graph D represents the metabolic flow (arrows).'}
          </p>
        </div>

        {/* Genomic Graph G */}
        <div>
          <GenomicGraph
            vertices={vertices}
            edgesG={edgesG}
            nodePositions={nodePositions}
            highlightedNodes={highlightedNodes}
            activePath={activePath}
            isFinalResult={isFinalResult}
            isAcceptedStep={isAcceptedStep}
            lang={lang}
          />
          <p style={{ fontSize: '0.8rem', marginTop: 'var(--space-sm)', textAlign: 'center', color: 'var(--neutral-medium)' }}>
            {lang === 'fr' 
              ? 'Le graphe non-orienté G représente la contiguïté génomique (traits pleins si induits, pointillés si inactifs).' 
              : 'Undirected graph G represents genomic proximity (solid if induced, dashed if inactive).'}
          </p>
        </div>
      </div>
    </section>
  );
};
