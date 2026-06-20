import React from 'react';
import type { TranslationDict } from '../i18n/types';
import { PathText } from './TechnicalText';

interface ComparisonPanelProps {
  longestPathD: string[] | null;
  longestConsistentPath: string[] | null;
  evaluatedPathsCount: number;
  acceptedPathsCount: number;
  dict: TranslationDict;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  longestPathD,
  longestConsistentPath,
  evaluatedPathsCount,
  acceptedPathsCount,
  dict,
}) => {
  return (
    <section className="card" style={{ marginBlockEnd: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBlockEnd: 'var(--space-md)' }}>
        {dict.resultsTitle}
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
            {dict.metricLongestD}
          </span>
          <div 
            style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              color: 'var(--neutral-dark)',
              marginBlockStart: 'var(--space-xs)',
              marginBlockEnd: 'var(--space-xs)',
            }}
          >
            {longestPathD ? <PathText path={longestPathD} /> : '—'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-medium)' }}>
            {longestPathD ? `${longestPathD.length} ${dict.metricVertices}` : ''}
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
            {dict.metricLongestDG}
          </span>
          <div 
            style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              color: 'var(--accent-gold)',
              marginBlockStart: 'var(--space-xs)',
              marginBlockEnd: 'var(--space-xs)',
            }}
          >
            {longestConsistentPath ? <PathText path={longestConsistentPath} /> : '—'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 500 }}>
            {longestConsistentPath ? `${longestConsistentPath.length} ${dict.metricVertices} (${dict.metricOptimal})` : ''}
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
            {dict.metricEvaluated}
          </span>
          <div 
            style={{ 
              fontSize: '1.8rem', 
              fontWeight: 700, 
              color: 'var(--neutral-dark)',
              marginBlockStart: 'var(--space-xs)',
              marginBlockEnd: 'var(--space-xs)',
            }}
          >
            {evaluatedPathsCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-medium)' }}>
            {dict.metricExplored}
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
            {dict.metricAccepted}
          </span>
          <div 
            style={{ 
              fontSize: '1.8rem', 
              fontWeight: 700, 
              color: 'var(--primary)',
              marginBlockStart: 'var(--space-xs)',
              marginBlockEnd: 'var(--space-xs)',
            }}
          >
            {acceptedPathsCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-medium)' }}>
            {dict.metricConnectedG}
          </span>
        </div>
      </div>
    </section>
  );
};
