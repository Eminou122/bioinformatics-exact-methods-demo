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
  const headingId = React.useId();

  return (
    <section className="card graph-panel-container" aria-labelledby={headingId} style={{ marginBlockEnd: 'var(--space-md)', padding: 'var(--space-sm)' }}>
      <h2 id={headingId} style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', marginBlockEnd: '4px' }}>
        {dict.visTitle}
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--neutral-medium)', marginBlockEnd: 'var(--space-sm)' }}>
        {lang === 'ar'
          ? 'لوحة مقارنة بصرية: D يحافظ على اتجاه الأسهم، وG يوضح روابط التقارب الجينومي النشطة وغير النشطة.'
          : lang === 'fr'
            ? 'Panneau de comparaison visuelle : D conserve le sens des flèches, G distingue les liens génomiques actifs et inactifs.'
            : 'Visual comparison panel: D preserves arrow direction, while G separates active and inactive genomic links.'}
      </p>

      <div className="grid grid-2 graph-workspace-grid" style={{ gap: 'var(--space-sm)', alignItems: 'stretch' }}>
        {/* Metabolic Graph D */}
        <div 
          className={mobileActiveTab === 'G' ? 'mobile-hide-graph' : ''} 
          aria-hidden={mobileActiveTab === 'G' ? 'true' : 'false'}
          style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}
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
          <p style={{ fontSize: '0.82rem', marginBlockStart: 'var(--space-sm)', marginBlockEnd: 0, textAlign: 'center', color: 'var(--neutral-medium)' }}>
            {dict.visDescD}
          </p>
        </div>

        {/* Genomic Graph G */}
        <div 
          className={mobileActiveTab === 'D' ? 'mobile-hide-graph' : ''} 
          aria-hidden={mobileActiveTab === 'D' ? 'true' : 'false'}
          style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}
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
          <p style={{ fontSize: '0.82rem', marginBlockStart: 'var(--space-sm)', marginBlockEnd: 0, textAlign: 'center', color: 'var(--neutral-medium)' }}>
            {dict.visDescG}
          </p>
        </div>
      </div>

      <style>{`
        .graph-panel-container {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .graph-workspace-grid {
          flex: 1;
          min-height: 0;
        }

        .graph-workspace-grid [data-testid="directed-graph-container"],
        .graph-workspace-grid [data-testid="genomic-graph-container"] {
          flex: 1;
        }

        @media (max-width: 767px) {
          .graph-workspace-grid {
            grid-template-columns: 1fr;
            flex: initial;
          }
          .mobile-hide-graph {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
};
