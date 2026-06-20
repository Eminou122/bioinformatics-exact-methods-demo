import React from 'react';
import type { TranslationDict } from '../i18n/types';

interface LegendProps {
  dict: TranslationDict;
}

export const Legend: React.FC<LegendProps> = ({ dict }) => {
  return (
    <section className="card" style={{ marginBlockEnd: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBlockEnd: 'var(--space-md)' }}>
        {dict.legendTitle}
      </h2>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-md)',
          fontSize: '0.85rem',
          color: 'var(--neutral-medium)'
        }}
      >
        {/* Graph D Legend */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--neutral-dark)', marginBlockEnd: 'var(--space-xs)' }}>
            {dict.legendDTitle}
          </h3>
          <ul style={{ listStyle: 'none', paddingInlineStart: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="12" style={{ flexShrink: 0 }}>
                <line x1="0" y1="6" x2="20" y2="6" stroke="var(--border-color)" strokeWidth="1.5" />
                <polygon points="16,3 22,6 16,9" fill="var(--neutral-light)" />
              </svg>
              <span>{dict.legendDInactive}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="12" style={{ flexShrink: 0 }}>
                <line x1="0" y1="6" x2="20" y2="6" stroke="var(--primary)" strokeWidth="3" />
                <polygon points="15,2 22,6 15,10" fill="var(--primary)" />
              </svg>
              <span>{dict.legendDActive}</span>
            </li>
          </ul>
        </div>

        {/* Graph G Legend */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--neutral-dark)', marginBlockEnd: 'var(--space-xs)' }}>
            {dict.legendGTitle}
          </h3>
          <ul style={{ listStyle: 'none', paddingInlineStart: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="12" style={{ flexShrink: 0 }}>
                <line x1="0" y1="6" x2="24" y2="6" stroke="var(--neutral-light)" strokeWidth="1" strokeDasharray="3,3" />
              </svg>
              <span>{dict.legendGInactive}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="12" style={{ flexShrink: 0 }}>
                <line x1="0" y1="6" x2="24" y2="6" stroke="var(--primary)" strokeWidth="3" />
              </svg>
              <span>{dict.legendGActive}</span>
            </li>
          </ul>
        </div>

        {/* Node states Legend */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--neutral-dark)', marginBlockEnd: 'var(--space-xs)' }}>
            {dict.legendNodeTitle}
          </h3>
          <ul style={{ listStyle: 'none', paddingInlineStart: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  border: '1.5px solid var(--neutral-light)', 
                  backgroundColor: 'var(--bg-card)',
                  flexShrink: 0
                }} 
              />
              <span>{dict.legendNodeInactive}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  border: '3px solid var(--primary)', 
                  backgroundColor: 'var(--primary-bg)',
                  flexShrink: 0
                }} 
              />
              <span>{dict.legendNodeAccepted}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  border: '3px solid var(--danger)', 
                  backgroundColor: 'var(--danger-bg)',
                  flexShrink: 0
                }} 
              />
              <span>{dict.legendNodeRejected}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  border: '3px solid var(--primary)', 
                  backgroundColor: 'var(--primary-bg)',
                  position: 'relative',
                  flexShrink: 0
                }} 
              >
                <span style={{ display: 'block', margin: '2px', width: '6px', height: '6px', borderRadius: '50%', border: '1px dashed var(--primary)' }} />
              </span>
              <span>{dict.legendNodeStart}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <p style={{ marginBlockStart: 'var(--space-md)', marginBlockEnd: 0, fontSize: '0.8rem', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-sm)' }}>
        {dict.legendAccessibilityNote}
      </p>
    </section>
  );
};
