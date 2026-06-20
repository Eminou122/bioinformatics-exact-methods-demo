import React from 'react';
import type { TranslationDict } from '../i18n/types';
import { TechnicalText } from './TechnicalText';

interface IntroSectionProps {
  dict: TranslationDict;
}

export const IntroSection: React.FC<IntroSectionProps> = ({ dict }) => {
  return (
    <section className="card" style={{ marginBlockEnd: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--primary)' }}>
        {dict.introTitle}
      </h2>
      <div style={{ fontSize: '0.95rem', color: 'var(--neutral-medium)' }}>
        <p>{dict.introP1}</p>
        <p>
          {dict.introP2}{' '}
          <TechnicalText style={{ fontWeight: 600 }}>(D,G)</TechnicalText> :
        </p>
        <ul style={{ marginBlockEnd: 'var(--space-md)' }}>
          <li style={{ marginBlockEnd: 'var(--space-xs)' }}>
            <strong>
              {dict.introDLabel}{' '}
              <TechnicalText style={{ fontWeight: 600 }}>D</TechnicalText> :
            </strong>{' '}
            {dict.introDDesc}
          </li>
          <li style={{ marginBlockEnd: 'var(--space-xs)' }}>
            <strong>
              {dict.introGLabel}{' '}
              <TechnicalText style={{ fontWeight: 600 }}>G</TechnicalText> :
            </strong>{' '}
            {dict.introGDesc}
          </li>
          <li style={{ marginBlockEnd: 'var(--space-xs)' }}>
            <strong>{dict.introRuleLabel}</strong> {dict.introRuleDesc}
          </li>
        </ul>
        <p style={{ fontStyle: 'italic', borderInlineStart: '3px solid var(--primary)', paddingInlineStart: 'var(--space-md)' }}>
          {dict.introSummary}
        </p>
      </div>
    </section>
  );
};
