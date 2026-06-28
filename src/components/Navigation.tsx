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
  const labels: Record<Language, { start: string; cp2: string; cp2Plus: string; randomLab: string; ilp2: string; ilp2Plus: string }> = {
    fr: {
      start: 'Commencer Ici',
      cp2: 'Modèle CP2',
      cp2Plus: 'Modèle CP2+',
      randomLab: 'Graphes aléatoires',
      ilp2: 'Modèle ILP2',
      ilp2Plus: 'Modèle ILP2+',
    },
    en: {
      start: 'Start Here',
      cp2: 'CP2 Model',
      cp2Plus: 'CP2+ Model',
      randomLab: 'Random Graphs',
      ilp2: 'ILP2 Model',
      ilp2Plus: 'ILP2+ Model',
    },
    ar: {
      start: 'ابدأ هنا',
      cp2: 'نموذج CP2',
      cp2Plus: 'نموذج CP2+',
      randomLab: 'مخططات عشوائية',
      ilp2: 'نموذج ILP2',
      ilp2Plus: 'نموذج ILP2+',
    }
  };

  const t = labels[lang];

  const items = [
    { path: '/', label: t.start },
    { path: '/methods/cp2', label: t.cp2 },
    { path: '/methods/cp2-plus', label: t.cp2Plus },
    { path: '/methods/random-graph-lab', label: t.randomLab },
    { path: '/methods/ilp2', label: t.ilp2 },
    { path: '/methods/ilp2-plus', label: t.ilp2Plus },
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
        const isCP2PlusRoute = currentPath === '/methods/cp2-plus' || currentPath.startsWith('/methods/cp2-plus/');
        const isActive = currentPath === item.path
          || (item.path === '/methods/cp2-plus' && isCP2PlusRoute);
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
