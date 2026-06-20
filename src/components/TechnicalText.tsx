import React from 'react';

interface TechnicalTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Reusable component to enforce Left-To-Right (LTR) rendering of technical items,
 * such as node IDs, algorithm names (DFS, BFS), or mathematical notation.
 * Integrates Unicode bidi isolation to protect surrounding RTL layout.
 */
export const TechnicalText: React.FC<TechnicalTextProps> = ({ children, style }) => {
  return (
    <span
      dir="ltr"
      style={{
        unicodeBidi: 'isolate',
        display: 'inline-block',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

interface PathTextProps {
  path: string[];
  style?: React.CSSProperties;
}

/**
 * Reusable component to render paths (e.g. R1 → R2 → R3) in LTR format,
 * regardless of the current page direction (LTR or RTL).
 */
export const PathText: React.FC<PathTextProps> = ({ path, style }) => {
  if (path.length === 0) {
    return null;
  }
  return (
    <span
      dir="ltr"
      style={{
        unicodeBidi: 'isolate',
        display: 'inline-block',
        fontFamily: 'var(--font-serif)',
        fontWeight: 700,
        ...style,
      }}
    >
      {path.join(' → ')}
    </span>
  );
};
