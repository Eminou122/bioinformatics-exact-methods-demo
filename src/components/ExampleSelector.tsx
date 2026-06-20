import React from 'react';
import type { ExampleDataset } from '../data/examples';
import type { Language, TranslationDict } from '../i18n/types';

interface ExampleSelectorProps {
  examples: ExampleDataset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  lang: Language;
  dict: TranslationDict;
}

export const ExampleSelector: React.FC<ExampleSelectorProps> = ({
  examples,
  selectedId,
  onSelect,
  onRun,
  onReset,
  isRunning,
  lang,
  dict,
}) => {
  const currentExample = examples.find((ex) => ex.id === selectedId);

  const getExampleTitle = (ex: ExampleDataset) => {
    if (lang === 'ar') return ex.titleAr;
    if (lang === 'en') return ex.titleEn;
    return ex.titleFr;
  };

  const getExampleDesc = (ex: ExampleDataset) => {
    if (lang === 'ar') return ex.descriptionAr;
    if (lang === 'en') return ex.descriptionEn;
    return ex.descriptionFr;
  };

  const getExampleTeachingPoint = (ex: ExampleDataset) => {
    if (lang === 'ar') return ex.teachingPointAr;
    if (lang === 'en') return ex.teachingPointEn;
    return ex.teachingPointFr;
  };

  return (
    <section className="card" style={{ marginBlockEnd: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBlockEnd: 'var(--space-md)' }}>
        {dict.selectionTitle}
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
              aria-pressed={selectedId === ex.id}
              style={{
                borderColor: selectedId === ex.id ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: selectedId === ex.id ? 'var(--primary-bg)' : 'transparent',
                color: selectedId === ex.id ? 'var(--primary)' : 'var(--neutral-dark)',
                fontWeight: selectedId === ex.id ? '600' : 'normal',
                opacity: isRunning ? 0.6 : 1,
                minHeight: '44px',
                flex: '1 1 180px',
              }}
            >
              {getExampleTitle(ex)}
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
              borderInlineStart: '4px solid var(--primary)',
              fontSize: '0.9rem'
            }}
          >
            <p style={{ marginBlockEnd: 0, fontWeight: 500, color: 'var(--neutral-dark)' }}>
              {getExampleDesc(currentExample)}
            </p>
            <p style={{ marginBlockStart: 'var(--space-xs)', marginBlockEnd: 0, fontSize: '0.85rem', color: 'var(--neutral-medium)' }}>
              <strong>{dict.teachingPoint}</strong>
              {getExampleTeachingPoint(currentExample)}
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBlockStart: 'var(--space-xs)' }}>
          <button
            className="btn btn-primary"
            onClick={onRun}
            disabled={isRunning}
            style={{
              paddingBlock: '10px',
              paddingInline: '20px',
              fontWeight: '600',
              fontFamily: 'var(--font-sans)',
              flex: '1 1 180px',
            }}
          >
            {dict.btnRun}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={onReset}
            disabled={!isRunning}
            style={{
              paddingBlock: '10px',
              paddingInline: '20px',
              fontFamily: 'var(--font-sans)',
              flex: '1 1 100px',
            }}
          >
            {dict.btnReset}
          </button>
        </div>
      </div>
    </section>
  );
};
