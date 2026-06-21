import React from 'react';
import { DirectedGraph } from './DirectedGraph';
import { GenomicGraph } from './GenomicGraph';
import type { Language, TranslationDict } from '../i18n/types';

interface GraphPanelProps {
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
  nodePositions: Record<string, { x: number; y: number }>;
  highlightedNodes: Set<string>;
  activePath: string[];
  isFinalResult: boolean;
  isAcceptedStep: boolean;
  lang: Language;
  dict: TranslationDict;
  mobileActiveTab?: 'D' | 'G';
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
  dict,
  mobileActiveTab,
}) => {
  return (
    <section className="card" style={{ marginBlockEnd: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBlockEnd: 'var(--space-md)' }}>
        {dict.visTitle}
      </h2>

      <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
        {/* Metabolic Graph D */}
        <div 
          className={mobileActiveTab === 'G' ? 'mobile-hide-graph' : ''} 
          aria-hidden={mobileActiveTab === 'G' ? 'true' : 'false'}
        >
          <DirectedGraph
            vertices={vertices}
            edgesD={edgesD}
            nodePositions={nodePositions}
            highlightedNodes={highlightedNodes}
            activePath={activePath}
            isFinalResult={isFinalResult}
            isAcceptedStep={isAcceptedStep}
            lang={lang}
            dict={dict}
          />
          <p style={{ fontSize: '0.8rem', marginBlockStart: 'var(--space-sm)', textAlign: 'center', color: 'var(--neutral-medium)' }}>
            {dict.visDescD}
          </p>
        </div>

        {/* Genomic Graph G */}
        <div 
          className={mobileActiveTab === 'D' ? 'mobile-hide-graph' : ''} 
          aria-hidden={mobileActiveTab === 'D' ? 'true' : 'false'}
        >
          <GenomicGraph
            vertices={vertices}
            edgesG={edgesG}
            nodePositions={nodePositions}
            highlightedNodes={highlightedNodes}
            activePath={activePath}
            isFinalResult={isFinalResult}
            isAcceptedStep={isAcceptedStep}
            lang={lang}
            dict={dict}
          />
          <p style={{ fontSize: '0.8rem', marginBlockStart: 'var(--space-sm)', textAlign: 'center', color: 'var(--neutral-medium)' }}>
            {dict.visDescG}
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .mobile-hide-graph {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
};
