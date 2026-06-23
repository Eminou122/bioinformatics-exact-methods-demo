import React from 'react';
import type { Language, TranslationDict } from '../i18n/types';

interface GenomicGraphProps {
  vertices: string[];
  edgesG: { u: string; v: string }[];
  nodePositions: Record<string, { x: number; y: number }>;
  highlightedNodes: Set<string>;
  activePath: string[];
  isFinalResult: boolean;
  isAcceptedStep: boolean;
  lang: Language;
  dict: TranslationDict;
}

export const GenomicGraph: React.FC<GenomicGraphProps> = ({
  vertices,
  edgesG,
  nodePositions,
  highlightedNodes,
  activePath,
  isFinalResult,
  isAcceptedStep,
  lang,
  dict,
}) => {
  const titleId = React.useId();
  const descId = React.useId();
  const radius = 30;
  const boundsPadding = 44;
  const positions = vertices.map((vertex) => nodePositions[vertex]).filter(Boolean);
  const minX = Math.min(...positions.map((pos) => pos.x)) - boundsPadding;
  const maxX = Math.max(...positions.map((pos) => pos.x)) + boundsPadding;
  const minY = Math.min(...positions.map((pos) => pos.y)) - boundsPadding;
  const maxY = Math.max(...positions.map((pos) => pos.y)) + boundsPadding;
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  // An edge is in the induced subgraph if both endpoints are in the highlightedNodes set.
  const isInducedEdge = (u: string, v: string): boolean => {
    return highlightedNodes.has(u) && highlightedNodes.has(v);
  };

  // Determine colors based on state
  const getHighlightColor = () => {
    if (activePath.length === 0) return 'var(--primary)';
    if (isFinalResult) return 'var(--accent-gold)';
    return isAcceptedStep ? 'var(--primary)' : 'var(--danger)';
  };

  return (
    <div 
      dir="ltr" /* Force Left-To-Right direction on container to prevent graph mirroring */
      data-testid="genomic-graph-container"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '220px',
        maxHeight: '340px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '6px var(--space-sm)', borderBlockEnd: '1px solid var(--border-color)' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--neutral-dark)' }}>
          {dict.legendGTitle}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBlockStart: '2px', fontSize: '0.72rem', color: 'var(--neutral-medium)' }}>
          <span>thick solid = selected G link</span>
          <span>dotted = inactive G link</span>
          <span>outlined node = selected reaction</span>
        </div>
      </div>
      <svg
        viewBox={viewBox}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        data-testid="genomic-graph-svg"
        style={{ display: 'block', flex: 1, minHeight: '170px', maxHeight: '270px', aspectRatio: '16 / 7' }}
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>{dict.legendGTitle}</title>
        <desc id={descId}>
          {lang === 'ar'
            ? `مخطط التقارب الجينومي G. الروابط غير موجهة، وتبقى الهندسة غير معكوسة في الواجهة العربية.`
            : (lang === 'fr'
              ? `Graphe de proximité génomique G. Les liens pleins appartiennent au sous-graphe induit sélectionné.`
              : `Genomic proximity graph G. Solid links are selected induced links; dotted links are inactive context.`)}
        </desc>

        {/* Draw Edges */}
        {edgesG.map((edge, index) => {
          const uPos = nodePositions[edge.u];
          const vPos = nodePositions[edge.v];
          if (!uPos || !vPos) return null;

          const dx = vPos.x - uPos.x;
          const dy = vPos.y - uPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Shorten the line to boundary of node circles
          const startX = uPos.x + (dx * radius) / dist;
          const startY = uPos.y + (dy * radius) / dist;
          const endX = vPos.x - (dx * radius) / dist;
          const endY = vPos.y - (dy * radius) / dist;

          const isInduced = isInducedEdge(edge.u, edge.v);
          const color = isInduced
            ? getHighlightColor()
            : 'var(--neutral-light)';
          
          // Induced edges are solid and thick, uninduced edges are light and dashed
          const strokeWidth = isInduced ? 3 : 1;
          const strokeDasharray = isInduced ? undefined : '7,5';
          const opacity = isInduced ? 1 : 0.65;

          return (
            <line
              key={`edge-g-${index}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={color}
              strokeWidth={isInduced ? 5 : Math.max(strokeWidth, 2.25)}
              strokeDasharray={strokeDasharray}
              opacity={opacity}
              className="graph-edge"
              data-state={isInduced ? 'active-genomic-edge' : 'inactive-genomic-edge'}
            />
          );
        })}

        {/* Draw Nodes */}
        {vertices.map((v) => {
          const pos = nodePositions[v];
          if (!pos) return null;

          const isNodeInPath = highlightedNodes.has(v);

          // Determine node styling in G
          let fill = 'var(--bg-card)';
          let stroke = 'var(--neutral-light)';
          let strokeWidth = 2.25;

          if (isNodeInPath) {
            stroke = getHighlightColor();
            strokeWidth = 4;
            fill = isFinalResult
              ? 'var(--accent-gold-bg)'
              : (isAcceptedStep ? 'var(--primary-bg)' : 'var(--danger-bg)');
          }

          return (
            <g key={`node-g-${v}`} className="graph-node" tabIndex={0} aria-label={`Genomic reaction node ${v}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: isNodeInPath ? 700 : 500,
                  fill: isNodeInPath ? 'var(--neutral-dark)' : 'var(--neutral-medium)',
                  userSelect: 'none',
                }}
              >
                {v}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
