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
  const labels: Record<Language, { start: string; methods: string; cp1: string; cp2: string; cp2Plus: string; subsetDp: string; ilp1: string; ilp2: string; legacy: string }> = {
    fr: {
      start: 'Commencer Ici',
      methods: 'Carte des Méthodes',
      cp1: 'Modèle CP1',
      cp2: 'Modèle CP2',
      cp2Plus: 'Modèle CP2+',
      subsetDp: 'Subset DP',
      ilp1: 'Modèle ILP1',
      ilp2: 'Modèle ILP2',
      legacy: 'Démo Énumération (Legacy)'
    },
    en: {
      start: 'Start Here',
      methods: 'Method Map',
      cp1: 'CP1 Model',
      cp2: 'CP2 Model',
      cp2Plus: 'CP2+ Model',
      subsetDp: 'Subset DP',
      ilp1: 'ILP1 Model',
      ilp2: 'ILP2 Model',
      legacy: 'Enumeration Demo (Legacy)'
    },
    ar: {
      start: 'ابدأ هنا',
      methods: 'خريطة الطرق',
      cp1: 'نموذج CP1',
      cp2: 'نموذج CP2',
      cp2Plus: 'نموذج CP2+',
      subsetDp: 'Subset DP',
      ilp1: 'نموذج ILP1',
      ilp2: 'نموذج ILP2',
      legacy: 'عرض التعداد (القديم)'
    }
  };

  const t = labels[lang];

  const items = [
    { path: '/', label: t.start },
    { path: '/methods', label: t.methods },
    { path: '/methods/cp1', label: t.cp1 },
    { path: '/methods/cp2', label: t.cp2 },
    { path: '/methods/cp2-plus', label: t.cp2Plus },
    { path: '/methods/subset-dp', label: t.subsetDp },
    { path: '/methods/ilp1', label: t.ilp1 },
    { path: '/methods/ilp2', label: t.ilp2 },
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
        const isCP2PlusRoute = currentPath === '/methods/cp2-plus' || currentPath.startsWith('/methods/cp2-plus/');
        const isActive = currentPath === item.path
          || (item.path === '/methods/cp2-plus' && isCP2PlusRoute)
          || (item.path === '/methods' && currentPath.startsWith('/methods') && currentPath !== '/methods/cp1' && currentPath !== '/methods/cp2' && !isCP2PlusRoute && currentPath !== '/methods/subset-dp' && currentPath !== '/methods/ilp1' && currentPath !== '/methods/ilp2');
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
