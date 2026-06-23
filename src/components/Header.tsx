import React from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { Icon } from './Icons';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  dict: TranslationDict;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, dict }) => {
  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
  ];

  return (
    <header
      style={{
        borderBlockEnd: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        paddingBlock: 'var(--space-md)',
        marginBlockEnd: 'var(--space-lg)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          paddingBlock: 0,
        }}
      >
        <div style={{ flex: '1 1 300px' }}>
          <span
            style={{
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'var(--primary)',
              fontFamily: 'var(--font-sans)',
              display: 'block',
            }}
          >
            {dict.courseTag}
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              fontWeight: 700,
              marginBlockStart: '2px',
              marginBlockEnd: 0,
              color: 'var(--neutral-dark)',
            }}
          >
            {dict.appTitle}
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              marginBlockStart: '2px',
              marginBlockEnd: 0,
              color: 'var(--neutral-medium)',
            }}
          >
            {dict.appSubtitle}
          </p>
        </div>

        {/* 3-option Semantic Language Selector */}
        <div 
          className="lang-selector-group" 
          role="group" 
          aria-label={lang === 'ar' ? 'تغيير اللغة' : (lang === 'fr' ? 'Changer de langue' : 'Change language')}
          style={{ flexShrink: 0, alignItems: 'center' }}
        >
          <span aria-hidden="true" style={{ color: 'var(--primary)', paddingInline: 'var(--space-sm)', display: 'inline-flex' }}>
            <Icon name="language" />
          </span>
          {languages.map((l) => (
            <button
              key={l.code}
              className={`lang-btn ${lang === l.code ? 'active' : ''}`}
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              style={{
                paddingInline: 'var(--space-md)',
                fontFamily: l.code === 'ar' ? 'var(--font-sans)' : 'inherit',
                direction: l.code === 'ar' ? 'rtl' : 'ltr',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
