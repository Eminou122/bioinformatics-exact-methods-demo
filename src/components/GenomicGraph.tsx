import React from 'react';

interface GenomicGraphProps {
  vertices: string[];
  edgesG: { u: string; v: string }[];
  nodePositions: Record<string, { x: number; y: number }>;
  highlightedNodes: Set<string>;
  activePath: string[];
  isFinalResult: boolean;
  isAcceptedStep: boolean;
  lang: 'fr' | 'en';
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
}) => {
  const radius = 22;

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
    <div style={{ position: 'relative', width: '100%', height: '300px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: '#ffffff', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 600 300"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        aria-label={
          lang === 'fr'
            ? `Graphe de proximité génomique G. Liaisons non-orientées.`
            : `Genomic proximity graph G. Undirected links.`
        }
      >
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
          {lang === 'fr' ? 'Graphe G — Proximité génomique' : 'Graph G — Genomic proximity'}
        </text>

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
          const strokeDasharray = isInduced ? undefined : '3,3';
          const opacity = isInduced ? 1 : 0.4;

          return (
            <line
              key={`edge-g-${index}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              opacity={opacity}
              className="graph-edge"
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
          let strokeWidth = 1.5;

          if (isNodeInPath) {
            stroke = getHighlightColor();
            strokeWidth = 3;
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
