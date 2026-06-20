import React from 'react';
import type { ExampleDataset } from '../data/examples';

interface ExampleSelectorProps {
  examples: ExampleDataset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  lang: 'fr' | 'en';
}

export const ExampleSelector: React.FC<ExampleSelectorProps> = ({
  examples,
  selectedId,
  onSelect,
  onRun,
  onReset,
  isRunning,
  lang,
}) => {
  const currentExample = examples.find((ex) => ex.id === selectedId);

  return (
    <section className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>
        {lang === 'fr' ? 'Sélection du Jeu de Données' : 'Dataset Selection'}
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Buttons for choosing datasets */}
        <div 
          style={{ 
            display: 'flex', 
            gap: 'var(--space-sm)', 
            flexWrap: 'wrap' 
          }}
        >
          {examples.map((ex) => (
            <button
              key={ex.id}
              className="btn btn-secondary"
              onClick={() => onSelect(ex.id)}
              disabled={isRunning}
              style={{
                borderColor: selectedId === ex.id ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: selectedId === ex.id ? 'var(--primary-bg)' : 'transparent',
                color: selectedId === ex.id ? 'var(--primary)' : 'var(--neutral-dark)',
                fontWeight: selectedId === ex.id ? '600' : 'normal',
                opacity: isRunning ? 0.6 : 1,
              }}
            >
              {lang === 'fr' ? ex.titleFr : ex.titleEn}
            </button>
          ))}
        </div>

        {/* Description of the selected dataset */}
        {currentExample && (
          <div 
            style={{ 
              padding: 'var(--space-md)', 
              backgroundColor: 'var(--bg-app)', 
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid var(--primary)',
              fontSize: '0.9rem'
            }}
          >
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--neutral-dark)' }}>
              {lang === 'fr' ? currentExample.descriptionFr : currentExample.descriptionEn}
            </p>
            <p style={{ margin: 'var(--space-xs) 0 0 0', fontStyle: 'italic', fontSize: '0.85rem' }}>
              <strong>{lang === 'fr' ? 'Point d\'enseignement : ' : 'Teaching point: '}</strong>
              {lang === 'fr' ? currentExample.teachingPointFr : currentExample.teachingPointEn}
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xs)' }}>
          <button
            className="btn btn-primary"
            onClick={onRun}
            disabled={isRunning}
            style={{
              padding: '10px 20px',
              fontWeight: '600',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {lang === 'fr' ? 'Lancer la Méthode Exacte' : 'Run Exact Method'}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={onReset}
            disabled={!isRunning}
            style={{
              padding: '10px 20px',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
          </button>
        </div>
      </div>
    </section>
  );
};
