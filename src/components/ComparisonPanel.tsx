import React from 'react';

interface ComparisonPanelProps {
  longestPathD: string[] | null;
  longestConsistentPath: string[] | null;
  evaluatedPathsCount: number;
  acceptedPathsCount: number;
  lang: 'fr' | 'en';
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  longestPathD,
  longestConsistentPath,
  evaluatedPathsCount,
  acceptedPathsCount,
  lang,
}) => {
  const formatPath = (path: string[] | null) => {
    if (!path || path.length === 0) return 'Aucun / None';
    return path.join(' → ');
  };

  return (
    <section className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>
        {lang === 'fr' ? 'Résultats Comparatifs globaux' : 'Global Comparative Results'}
      </h2>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-md)',
        }}
      >
        {/* Card 1: Longest path in D */}
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-medium)', textTransform: 'uppercase' }}>
            {lang === 'fr' ? 'Plus long chemin dans D' : 'Longest path in D'}
          </span>
          <div 
            style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              color: 'var(--neutral-dark)',
              fontFamily: 'var(--font-serif)',
              margin: 'var(--space-xs) 0'
            }}
          >
            {formatPath(longestPathD)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-medium)' }}>
            {longestPathD ? `${longestPathD.length} sommets` : ''}
          </span>
        </div>

        {/* Card 2: Longest consistent path */}
        <div
          style={{
            border: '2px solid var(--accent-gold-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--accent-gold-bg)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
            {lang === 'fr' ? 'Plus long chemin cohérent (D,G)' : 'Longest (D,G)-consistent path'}
          </span>
          <div 
            style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              color: 'var(--accent-gold)',
              fontFamily: 'var(--font-serif)',
              margin: 'var(--space-xs) 0'
            }}
          >
            {formatPath(longestConsistentPath)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 500 }}>
            {longestConsistentPath ? `${longestConsistentPath.length} sommets (Garanti Optimal)` : ''}
          </span>
        </div>

        {/* Card 3: Evaluated paths count */}
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-medium)', textTransform: 'uppercase' }}>
            {lang === 'fr' ? 'Chemins D évalués (Méthode Exacte)' : 'Evaluated paths D (Exact Method)'}
          </span>
          <div 
            style={{ 
              fontSize: '1.8rem', 
              fontWeight: 700, 
              color: 'var(--neutral-dark)',
              margin: 'var(--space-xs) 0'
            }}
          >
            {evaluatedPathsCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-medium)' }}>
            {lang === 'fr' ? '100% de l\'espace des solutions exploré' : '100% of solution space explored'}
          </span>
        </div>

        {/* Card 4: Accepted paths count */}
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-medium)', textTransform: 'uppercase' }}>
            {lang === 'fr' ? 'Chemins cohérents acceptés' : 'Accepted consistent paths'}
          </span>
          <div 
            style={{ 
              fontSize: '1.8rem', 
              fontWeight: 700, 
              color: 'var(--primary)',
              margin: 'var(--space-xs) 0'
            }}
          >
            {acceptedPathsCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-medium)' }}>
            {lang === 'fr' ? 'Sous-graphe induit de G connexe' : 'Induced subgraph G connected'}
          </span>
        </div>
      </div>
    </section>
  );
};
