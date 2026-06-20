import React from 'react';
import type { TranslationDict } from '../i18n/types';
import { PathText } from './TechnicalText';

interface ResultPanelProps {
  exampleId: string;
  longestConsistentPath: string[] | null;
  dict: TranslationDict;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  exampleId,
  longestConsistentPath,
  dict,
}) => {
  const renderContent = () => {
    if (exampleId === 'simple-valide') {
      return (
        <>
          <p>{dict.analysisSimpleValideP1}</p>
          <p>{dict.analysisSimpleValideP2}</p>
          <p>
            <strong>{dict.analysisSimpleValideP3.split(':')[0]} :</strong>
            {dict.analysisSimpleValideP3.split(':')[1]}
          </p>
        </>
      );
    }

    if (exampleId === 'longest-rejected') {
      return (
        <>
          <p>{dict.analysisLongestRejectedP1}</p>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>
            {dict.analysisLongestRejectedP2}
          </p>
          <p>
            <strong>{dict.analysisLongestRejectedP3.split(':')[0]} :</strong>
            {dict.analysisLongestRejectedP3.split(':')[1]}
          </p>
          <p>
            <strong>{dict.analysisLongestRejectedP4.split(':')[0]} :</strong>
            {dict.analysisLongestRejectedP4.split(':')[1]}
          </p>
        </>
      );
    }

    if (exampleId === 'multiple-candidates') {
      // Split by {winner} placeholder to insert PathText safely
      const template = dict.analysisMultipleCandidatesP3;
      const parts = template.split('{winner}');

      return (
        <>
          <p>{dict.analysisMultipleCandidatesP1}</p>
          <p>{dict.analysisMultipleCandidatesP2}</p>
          <ul style={{ marginBlockEnd: 'var(--space-md)' }}>
            <li>
              R1 → R2 → R4 (longueur 3 / length 3)
            </li>
            <li>
              R1 → R3 → R4 (longueur 3 / length 3)
            </li>
            <li>
              <strong>R1 → R2 → R5 → R6</strong> (longueur 4 / length 4)
            </li>
          </ul>
          <p>
            {parts[0]}
            {longestConsistentPath ? (
              <PathText path={longestConsistentPath} style={{ color: 'var(--accent-gold)' }} />
            ) : (
              '—'
            )}
            {parts[1]}
          </p>
          <p>{dict.analysisMultipleCandidatesP4}</p>
        </>
      );
    }

    return null;
  };

  return (
    <section 
      className="card" 
      style={{ 
        borderInlineStart: '4px solid var(--accent-gold-border)',
        backgroundColor: 'var(--bg-card)'
      }}
    >
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--accent-gold)' }}>
        {dict.analysisTitle}
      </h2>
      
      <div style={{ fontSize: '0.95rem', color: 'var(--neutral-medium)', marginBlockStart: 'var(--space-sm)' }}>
        {renderContent()}
      </div>
    </section>
  );
};
