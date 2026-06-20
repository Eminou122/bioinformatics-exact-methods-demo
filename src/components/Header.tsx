import React from 'react';

interface HeaderProps {
  lang: 'fr' | 'en';
  setLang: (lang: 'fr' | 'en') => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang }) => {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        padding: 'var(--space-md) 0',
        marginBottom: 'var(--space-xl)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 var(--space-md)',
          margin: '0 auto',
        }}
      >
        <div>
          <span
            style={{
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'var(--primary)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {lang === 'fr' ? 'Travaux Pratiques en Bio-informatique' : 'Bioinformatics Lab Course'}
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.6rem',
              fontWeight: 700,
              margin: '2px 0 0 0',
              color: 'var(--neutral-dark)',
            }}
          >
            {lang === 'fr'
              ? 'Démo interactive — Chemins cohérents entre métabolisme et génome'
              : 'Interactive Demo — Consistent paths between metabolism and genome'}
          </h1>
        </div>
        <div>
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
            style={{
              fontWeight: 600,
              padding: '6px 12px',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {lang === 'fr' ? 'English' : 'Français'}
          </button>
        </div>
      </div>
    </header>
  );
};
