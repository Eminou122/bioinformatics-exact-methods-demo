import React from 'react';

interface DirectedGraphProps {
  vertices: string[];
  edgesD: { from: string; to: string }[];
  nodePositions: Record<string, { x: number; y: number }>;
  highlightedNodes: Set<string>;
  activePath: string[];
  isFinalResult: boolean;
  isAcceptedStep: boolean;
  lang: 'fr' | 'en';
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
}) => {
  const radius = 22;

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
    <div style={{ position: 'relative', width: '100%', height: '300px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 600 300"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        aria-label={
          lang === 'fr'
            ? `Réseau métabolique D. Sommets: ${vertices.join(', ')}.`
            : `Metabolic network D. Vertices: ${vertices.join(', ')}.`
        }
      >
        <defs>
          {/* Arrow markers for edges */}
          <marker
            id="arrow-default"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--neutral-light)" />
          </marker>
          <marker
            id="arrow-active-primary"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--primary)" />
          </marker>
          <marker
            id="arrow-active-gold"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-gold)" />
          </marker>
          <marker
            id="arrow-active-danger"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--danger)" />
          </marker>
        </defs>

        <text
          x="15"
          y="25"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '0.85rem',
            fontWeight: 600,
            fill: 'var(--neutral-medium)',
          }}
        >
          {lang === 'fr' ? 'Graphe D — Réseau métabolique' : 'Graph D — Metabolic network'}
        </text>

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
          const strokeWidth = isActive ? 3 : 1.5;
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
          let strokeWidth = 1.5;

          if (isNodeInPath) {
            stroke = getHighlightColor();
            strokeWidth = 3;
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
                  r={radius - 4}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
              )}

              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
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
