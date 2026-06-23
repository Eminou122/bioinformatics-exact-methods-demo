import React from 'react';
import type { Language, TranslationDict } from '../i18n/types';

interface DirectedGraphProps {
  vertices: string[];
  edgesD: { from: string; to: string }[];
  nodePositions: Record<string, { x: number; y: number }>;
  highlightedNodes: Set<string>;
  activePath: string[];
  isFinalResult: boolean;
  isAcceptedStep: boolean;
  lang: Language;
  dict: TranslationDict;
}

export const DirectedGraph: React.FC<DirectedGraphProps> = ({
  vertices,
  edgesD,
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

  // Helper to check if an edge is part of the active path sequence
  const isEdgeInActivePath = (from: string, to: string): boolean => {
    if (activePath.length < 2) return false;
    for (let i = 0; i < activePath.length - 1; i++) {
      if (activePath[i] === from && activePath[i + 1] === to) {
        return true;
      }
    }
    return false;
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
      data-testid="directed-graph-container"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '360px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: 'var(--space-sm) var(--space-md)', borderBlockEnd: '1px solid var(--border-color)' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--neutral-dark)' }}>
          {dict.legendDTitle}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBlockStart: '4px', fontSize: '0.78rem', color: 'var(--neutral-medium)' }}>
          <span>solid arrow = D arc</span>
          <span>thick arrow = current path</span>
          <span>dashed inner ring = start</span>
        </div>
      </div>
      <svg
        viewBox={viewBox}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        data-testid="directed-graph-svg"
        style={{ display: 'block', flex: 1, minHeight: '270px' }}
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>{dict.legendDTitle}</title>
        <desc id={descId}>
          {lang === 'ar'
            ? `الشبكة الاستقلابية D. الرؤوس: ${vertices.join(', ')}. الأسهم تبقى من اليسار إلى اليمين عند اختيار العربية.`
            : (lang === 'fr'
              ? `Réseau métabolique D. Sommets: ${vertices.join(', ')}. Les flèches montrent le sens du flux métabolique.`
              : `Metabolic network D. Vertices: ${vertices.join(', ')}. Arrows show metabolic flow direction.`)}
        </desc>
        <defs>
          {/* Arrow markers for edges */}
          <marker
            id="arrow-default"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--neutral-light)" />
          </marker>
          <marker
            id="arrow-active-primary"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--primary)" />
          </marker>
          <marker
            id="arrow-active-gold"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-gold)" />
          </marker>
          <marker
            id="arrow-active-danger"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--danger)" />
          </marker>
        </defs>

        {/* Draw Edges */}
        {edgesD.map((edge, index) => {
          const fromPos = nodePositions[edge.from];
          const toPos = nodePositions[edge.to];
          if (!fromPos || !toPos) return null;

          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Shorten the line so it stops at the boundary of the node circle
          const padding = radius + 4; // Node radius + small spacing
          const startX = fromPos.x + (dx * radius) / dist;
          const startY = fromPos.y + (dy * radius) / dist;
          const endX = toPos.x - (dx * padding) / dist;
          const endY = toPos.y - (dy * padding) / dist;

          const isActive = isEdgeInActivePath(edge.from, edge.to);
          const color = isActive
            ? getHighlightColor()
            : 'var(--border-color)';
          const strokeWidth = isActive ? 5 : 2.5;
          const markerId = isActive
            ? (isFinalResult ? 'arrow-active-gold' : (isAcceptedStep ? 'arrow-active-primary' : 'arrow-active-danger'))
            : 'arrow-default';

          return (
            <line
              key={`edge-d-${index}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={color}
              strokeWidth={strokeWidth}
              markerEnd={`url(#${markerId})`}
              className="graph-edge"
              data-state={isActive ? 'active-directed-edge' : 'inactive-directed-edge'}
            />
          );
        })}

        {/* Draw Nodes */}
        {vertices.map((v) => {
          const pos = nodePositions[v];
          if (!pos) return null;

          const isNodeInPath = highlightedNodes.has(v);
          const isActiveStart = activePath[0] === v;
          
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
            <g key={`node-d-${v}`} className="graph-node" tabIndex={0} aria-label={`Reaction ${v}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              
              {/* Highlight starting node with a double ring or outline */}
              {isActiveStart && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius - 7}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2}
                  strokeDasharray="4,4"
                />
              )}

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
