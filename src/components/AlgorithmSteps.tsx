import React from 'react';
import type { PathEvaluation } from '../domain/pathAlgorithms';

interface AlgorithmStepsProps {
  evaluations: PathEvaluation[];
  currentStepIndex: number; // 0 to evaluations.length
  onStepChange: (index: number) => void;
  lang: 'fr' | 'en';
}

export const AlgorithmSteps: React.FC<AlgorithmStepsProps> = ({
  evaluations,
  currentStepIndex,
  onStepChange,
  lang,
}) => {
  const totalSteps = evaluations.length;
  
  // Checks if we are showing the final result screen (which is index === totalSteps)
  const isFinalScreen = currentStepIndex === totalSteps;
  const currentEval = isFinalScreen ? null : evaluations[currentStepIndex];

  // Helper to find the best consistent path up to the current step index
  const getBestPathSoFar = () => {
    let best: string[] | null = null;
    const limit = isFinalScreen ? totalSteps : currentStepIndex + 1;
    
    // We can import comparePaths or since we already calculated isBestSoFar in solverResult,
    // we can just trace the evaluations.
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

  return (
    <section className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 'var(--space-sm)',
          marginBottom: 'var(--space-md)'
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: 0, border: 'none', padding: 0 }}>
          {lang === 'fr' ? 'Exécution pas-à-pas de l\'algorithme' : 'Step-by-step algorithm execution'}
        </h2>
        
        {/* Step Indicator */}
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-medium)' }}>
          {isFinalScreen ? (
            <span style={{ color: 'var(--accent-gold)' }}>
              {lang === 'fr' ? 'Résultat Final' : 'Final Result'}
            </span>
          ) : (
            `${lang === 'fr' ? 'Candidat' : 'Candidate'} ${currentStepIndex + 1} / ${totalSteps}`
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
          marginBottom: 'var(--space-lg)',
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
              {lang === 'fr' ? 'Chemin métabolique évalué :' : 'Metabolic path evaluated:'}
            </span>
            <div 
              style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: '1.2rem', 
                fontWeight: 700, 
                backgroundColor: 'var(--bg-app)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                color: 'var(--neutral-dark)'
              }}
            >
              {currentEval.path.join(' → ')}
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
                    padding: '3px 8px', 
                    borderRadius: '12px' 
                  }}
                >
                  {lang === 'fr' ? 'Accepté (Cohérent)' : 'Accepted (Consistent)'}
                </span>
              ) : (
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    backgroundColor: 'var(--danger-bg)', 
                    color: 'var(--danger)', 
                    border: '1px solid var(--danger)', 
                    padding: '3px 8px', 
                    borderRadius: '12px' 
                  }}
                >
                  {lang === 'fr' ? 'Rejeté (Incohérent)' : 'Rejected (Inconsistent)'}
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
                    padding: '3px 8px', 
                    borderRadius: '12px' 
                  }}
                >
                  {lang === 'fr' ? 'Meilleur à ce stade' : 'Best so far'}
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
              color: 'var(--neutral-dark)'
            }}
          >
            <strong>{lang === 'fr' ? 'Analyse de connectivité génomique :' : 'Genomic connectivity analysis:'}</strong>
            <p style={{ margin: 'var(--space-xs) 0 0 0', color: 'var(--neutral-dark)' }}>
              {lang === 'fr' ? currentEval.reason : currentEval.reasonEn}
            </p>
          </div>

          {/* Best Path So Far Info */}
          <div style={{ fontSize: '0.85rem', color: 'var(--neutral-medium)' }}>
            <strong>{lang === 'fr' ? 'Meilleur chemin cohérent à ce stade : ' : 'Best consistent path at this stage: '}</strong>
            <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: 600 }}>
              {bestSoFar ? bestSoFar.join(' → ') : (lang === 'fr' ? 'Aucun pour l\'instant' : 'None yet')}
            </span>
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
              fontSize: '0.95rem'
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', marginBottom: 'var(--space-xs)' }}>
              {lang === 'fr' ? 'Résolution complète terminée !' : 'Full resolution completed!'}
            </h3>
            <p style={{ margin: 0, color: 'var(--neutral-dark)' }}>
              {lang === 'fr' 
                ? `L'algorithme exact a passé en revue les ${totalSteps} chemins possibles dans D et a identifié le plus long chemin (D,G)-cohérent.`
                : `The exact algorithm reviewed all ${totalSteps} possible paths in D and identified the longest (D,G)-consistent path.`}
            </p>
          </div>

          <div style={{ fontSize: '0.9rem', color: 'var(--neutral-medium)' }}>
            <strong>{lang === 'fr' ? 'Solution finale optimale : ' : 'Final optimal solution: '}</strong>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
              {bestSoFar ? bestSoFar.join(' → ') : (lang === 'fr' ? 'Aucune solution' : 'No solution')}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: 'var(--space-lg)',
          borderTop: '1px solid var(--border-color)',
          paddingTop: 'var(--space-md)'
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={() => onStepChange(currentStepIndex - 1)}
          disabled={currentStepIndex === 0}
          style={{ padding: '6px 16px' }}
        >
          {lang === 'fr' ? 'Précédent' : 'Previous'}
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {!isFinalScreen && (
            <button
              className="btn btn-secondary"
              onClick={() => onStepChange(totalSteps)}
              style={{ padding: '6px 16px', color: 'var(--accent-gold)' }}
            >
              {lang === 'fr' ? 'Résultat Final' : 'Final Result'}
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={() => onStepChange(currentStepIndex + 1)}
            disabled={isFinalScreen}
            style={{ 
              padding: '6px 16px',
              backgroundColor: isFinalScreen ? 'var(--neutral-light)' : 'var(--primary)',
            }}
          >
            {isFinalScreen 
              ? (lang === 'fr' ? 'Fin' : 'End') 
              : (currentStepIndex === totalSteps - 1 ? (lang === 'fr' ? 'Voir Conclusion' : 'See Conclusion') : (lang === 'fr' ? 'Suivant' : 'Next'))
            }
          </button>
        </div>
      </div>
    </section>
  );
};
