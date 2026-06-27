/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from 'react';
import type { Language } from '../i18n/types';

export function useNavigation() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  return { currentPath, navigate };
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  navigate: (path: string) => void;
}

export const Link: React.FC<LinkProps> = ({ to, navigate, children, style, ...props }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} style={{ cursor: 'pointer', ...style }} {...props}>
      {children}
    </a>
  );
};

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
  lang: Language;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate, lang }) => {
  const labels: Record<Language, { start: string; methods: string; randomLab: string; legacy: string }> = {
    fr: {
      start: 'Commencer Ici',
      methods: 'Carte des Méthodes',
      randomLab: 'Graphes aléatoires',
      legacy: 'Démo Énumération (Legacy)'
    },
    en: {
      start: 'Start Here',
      methods: 'Method Map',
      randomLab: 'Random Graph Lab',
      legacy: 'Enumeration Demo (Legacy)'
    },
    ar: {
      start: 'ابدأ هنا',
      methods: 'خريطة الطرق',
      randomLab: 'مختبر المخططات العشوائية',
      legacy: 'عرض التعداد (القديم)'
    }
  };

  const t = labels[lang];

  const items = [
    { path: '/', label: t.start },
    { path: '/methods', label: t.methods },
    { path: '/methods/random-graph-lab', label: t.randomLab },
    { path: '/legacy', label: t.legacy }
  ];

  const navAriaLabels: Record<Language, string> = {
    fr: "Navigation principale",
    en: "Main navigation",
    ar: "الملاحة الرئيسية"
  };

  return (
    <nav 
      aria-label={navAriaLabels[lang]} 
      style={{
        backgroundColor: 'var(--primary)',
        paddingBlock: 'var(--space-sm)',
        marginBlockEnd: 'var(--space-md)',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}
    >
      {items.map((item) => {
        const isActive = currentPath === item.path
          || (item.path === '/methods' && currentPath.startsWith('/methods') && currentPath !== '/methods/random-graph-lab');
        return (
          <Link
            key={item.path}
            to={item.path}
            navigate={navigate}
            style={{
              color: isActive ? 'var(--accent-gold-bg)' : 'white',
              textDecoration: 'none',
              fontWeight: isActive ? '700' : '500',
              paddingBlock: 'var(--space-xs)',
              paddingInline: 'var(--space-sm)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.95rem',
              borderBottom: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
