import React from 'react';
import type { PathEvaluation } from '../domain/pathAlgorithms';
import type { TranslationDict } from '../i18n/types';
import { formatTranslation } from '../i18n/format';
import { PathText } from './TechnicalText';

interface AlgorithmStepsProps {
  evaluations: PathEvaluation[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  dict: TranslationDict;
}

export const AlgorithmSteps: React.FC<AlgorithmStepsProps> = ({
  evaluations,
  currentStepIndex,
  onStepChange,
  dict,
}) => {
  const totalSteps = evaluations.length;
  const isFinalScreen = currentStepIndex === totalSteps;
  const currentEval = isFinalScreen ? null : evaluations[currentStepIndex];

  // Helper to find the best consistent path up to the current step index
  const getBestPathSoFar = () => {
    let best: string[] | null = null;
    const limit = isFinalScreen ? totalSteps : currentStepIndex + 1;
    
    for (let i = 0; i < limit; i++) {
      if (evaluations[i].isAccepted) {
        if (best === null || evaluations[i].isBestSoFar) {
          best = evaluations[i].path;
        }
      }
    }
    return best;
  };

  const bestSoFar = getBestPathSoFar();

  // Dynamic explanation formatting using unicode isolation for technical tokens
  const getExplanation = (ev: PathEvaluation) => {
    if (ev.reasonCode === 'SINGLE_NODE') {
      return formatTranslation(dict, 'reasonSingleNode');
    }
    
    if (ev.reasonCode === 'CONNECTED') {
      // Enclose in LTR marks for clean display in RTL sentences
      const pathStr = `\u202A${ev.path.join(' → ')}\u202C`;
      return formatTranslation(dict, 'reasonConnected', { path: pathStr });
    }
    
    if (ev.reasonCode === 'DISCONNECTED') {
      const nodesStr = `\u202A${ev.disconnectedVertices.join(', ')}\u202C`;
      return formatTranslation(dict, 'reasonDisconnected', { nodes: nodesStr });
    }
    
    return '';
  };

  return (
    <section className="card" style={{ marginBlockEnd: 'var(--space-xl)' }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 'var(--space-sm)',
          marginBottom: 'var(--space-md)',
          flexWrap: 'wrap',
          gap: 'var(--space-sm)'
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: 0, border: 'none', padding: 0 }}>
          {dict.stepTitle}
        </h2>
        
        {/* Step Indicator */}
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-medium)' }}>
          {isFinalScreen ? (
            <span style={{ color: 'var(--accent-gold)' }}>
              {dict.stepFinalResult}
            </span>
          ) : (
            `${dict.stepCounter} ${currentStepIndex + 1} / ${totalSteps}`
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: 'var(--neutral-bg-hover)', 
          borderRadius: '3px',
          marginBlockEnd: 'var(--space-lg)',
          overflow: 'hidden',
          display: 'flex'
        }}
      >
        <div 
          style={{ 
            width: `${((currentStepIndex + (isFinalScreen ? 1 : 0)) / (totalSteps + 1)) * 100}%`,
            height: '100%', 
            backgroundColor: isFinalScreen ? 'var(--accent-gold)' : 'var(--primary)',
            transition: 'width var(--transition-fast)'
          }}
        />
      </div>

      {!isFinalScreen && currentEval ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Candidate Path display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--neutral-medium)' }}>
              {dict.stepPathEvaluated}
            </span>
            <div 
              style={{ 
                backgroundColor: 'var(--bg-app)',
                paddingBlock: '4px',
                paddingInline: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <PathText path={currentEval.path} />
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              {currentEval.isAccepted ? (
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    backgroundColor: 'var(--primary-bg)', 
                    color: 'var(--primary)', 
                    border: '1px solid var(--primary)', 
                    paddingBlock: '3px', 
                    paddingInline: '8px', 
                    borderRadius: '12px' 
                  }}
                >
                  {dict.stepAcceptedBadge}
                </span>
              ) : (
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    backgroundColor: 'var(--danger-bg)', 
                    color: 'var(--danger)', 
                    border: '1px solid var(--danger)', 
                    paddingBlock: '3px', 
                    paddingInline: '8px', 
                    borderRadius: '12px' 
                  }}
                >
                  {dict.stepRejectedBadge}
                </span>
              )}

              {currentEval.isBestSoFar && currentEval.isAccepted && (
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    backgroundColor: 'var(--accent-gold-bg)', 
                    color: 'var(--accent-gold)', 
                    border: '1px solid var(--accent-gold-border)', 
                    paddingBlock: '3px', 
                    paddingInline: '8px', 
                    borderRadius: '12px' 
                  }}
                >
                  {dict.stepBestBadge}
                </span>
              )}
            </div>
          </div>

          {/* Explanation Box */}
          <div 
            style={{ 
              padding: 'var(--space-md)', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: currentEval.isAccepted ? 'var(--primary-bg)' : 'var(--danger-bg)',
              border: `1px solid ${currentEval.isAccepted ? 'var(--primary)' : 'var(--danger)'}`,
              fontSize: '0.9rem',
              color: 'var(--neutral-dark)',
              textAlign: 'start',
            }}
          >
            <strong>{dict.stepAnalysisTitle}</strong>
            <p style={{ marginBlockStart: 'var(--space-xs)', marginBlockEnd: 0, color: 'var(--neutral-dark)' }}>
              {getExplanation(currentEval)}
            </p>
          </div>

          {/* Best Path So Far Info */}
          <div style={{ fontSize: '0.85rem', color: 'var(--neutral-medium)', textAlign: 'start' }}>
            <strong>{dict.stepBestSoFar}</strong>
            {bestSoFar ? (
              <PathText path={bestSoFar} style={{ color: 'var(--accent-gold)' }} />
            ) : (
              <span style={{ color: 'var(--neutral-light)' }}>{dict.stepBestNone}</span>
            )}
          </div>
        </div>
      ) : (
        /* Final Result summary screen inside the stepper */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div 
            style={{ 
              padding: 'var(--space-md)', 
              backgroundColor: 'var(--accent-gold-bg)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-gold-border)',
              color: 'var(--neutral-dark)',
              fontSize: '0.95rem',
              textAlign: 'start',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', marginBlockEnd: 'var(--space-xs)' }}>
              {dict.stepCompletedTitle}
            </h3>
            <p style={{ margin: 0, color: 'var(--neutral-dark)' }}>
              {dict.stepCompletedDesc}
            </p>
          </div>

          <div style={{ fontSize: '0.9rem', color: 'var(--neutral-medium)', textAlign: 'start' }}>
            <strong>{dict.stepOptimalSol}</strong>
            {bestSoFar ? (
              <PathText path={bestSoFar} style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }} />
            ) : (
              <span style={{ color: 'var(--neutral-light)' }}>{dict.stepNoSol}</span>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBlockStart: 'var(--space-lg)',
          borderTop: '1px solid var(--border-color)',
          paddingTop: 'var(--space-md)',
          flexWrap: 'wrap',
          gap: 'var(--space-sm)'
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={() => onStepChange(currentStepIndex - 1)}
          disabled={currentStepIndex === 0}
          style={{ paddingBlock: '6px', paddingInline: '16px', flex: '1 1 100px', minHeight: '44px' }}
        >
          {dict.btnPrev}
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', flex: '1 1 200px', flexWrap: 'wrap' }}>
          {!isFinalScreen && (
            <button
              className="btn btn-secondary"
              onClick={() => onStepChange(totalSteps)}
              style={{ paddingBlock: '6px', paddingInline: '16px', color: 'var(--accent-gold)', flex: '1 1 100px', minHeight: '44px' }}
            >
              {dict.stepFinalResult}
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={() => onStepChange(currentStepIndex + 1)}
            disabled={isFinalScreen}
            style={{ 
              paddingBlock: '6px',
              paddingInline: '16px',
              backgroundColor: isFinalScreen ? 'var(--neutral-light)' : 'var(--primary)',
              flex: '1 1 100px',
              minHeight: '44px'
            }}
          >
            {isFinalScreen 
              ? dict.btnEnd 
              : (currentStepIndex === totalSteps - 1 ? dict.btnConclusion : dict.btnNext)
            }
          </button>
        </div>
      </div>
    </section>
  );
};
