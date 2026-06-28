import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import type { Language } from './i18n/types';
import { translations } from './i18n/translations';

// New components and custom router
import { useNavigation, Navbar } from './components/Navigation';
import { StartHere } from './components/StartHere';
import { CP2Model } from './components/CP2Model';
import { CP2PlusModel } from './components/CP2PlusModel';
import { CP2PlusComparisonLab } from './components/CP2PlusComparisonLab';
import { RandomGraphDemoLab } from './components/RandomGraphDemoLab';
import { ILP2Model } from './components/ILP2Model';
import { ILP2PlusModel } from './components/ILP2PlusModel';
import { MethodPlaceholders } from './components/MethodPlaceholders';

const LANGUAGE_STORAGE_KEY = 'bioinformatics-demo-language';
const DEPRECATED_ROUTES = ['/legacy', '/methods/cp1', '/methods/algobb-plus-plus', '/methods/ilp1', '/methods/subset-dp', '/methods'];
const supportedLanguages: Language[] = ['fr', 'en', 'ar'];

function readStoredLanguage(): Language {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return supportedLanguages.includes(storedLanguage as Language) ? storedLanguage as Language : 'fr';
  } catch {
    return 'fr';
  }
}

function App() {
  const [lang, setLang] = useState<Language>(readStoredLanguage);
  const { currentPath, navigate } = useNavigation();

  // Fetch translation dictionary
  const dict = useMemo(() => {
    return translations[lang];
  }, [lang]);

  // Synchronize document attributes with selected language (RTL / Title / Meta)
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.title = dict.appTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', dict.introP1);
    }
  }, [lang, dict]);

  useEffect(() => {
    if (DEPRECATED_ROUTES.includes(currentPath)) {
      navigate('/');
    }
  }, [currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Route router logic
  const renderRouteContent = () => {
    if (currentPath === '/') {
      return <StartHere lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/methods') {
      return <StartHere lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/methods/cp1') {
      return <StartHere lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/methods/cp2') {
      return <CP2Model lang={lang} dict={dict} />;
    }
    if (currentPath === '/methods/cp2-plus') {
      return <CP2PlusModel lang={lang} dict={dict} navigate={navigate} />;
    }
    if (currentPath === '/methods/cp2-plus/comparison') {
      return <CP2PlusComparisonLab lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/methods/random-graph-lab') {
      return <RandomGraphDemoLab lang={lang} dict={dict} />;
    }
    if (currentPath === '/methods/ilp1') {
      return <StartHere lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/methods/ilp2') {
      return <ILP2Model lang={lang} dict={dict} />;
    }
    if (currentPath === '/methods/ilp2-plus') {
      return <ILP2PlusModel lang={lang} dict={dict} />;
    }
    if (currentPath === '/methods/algobb-plus-plus') {
      return <StartHere lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/methods/subset-dp') {
      return <StartHere lang={lang} navigate={navigate} />;
    }
    if (currentPath.startsWith('/methods/')) {
      const parts = currentPath.split('/');
      const methodId = parts[parts.length - 1];
      return <MethodPlaceholders methodId={methodId} lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/legacy') {
      return <StartHere lang={lang} navigate={navigate} />;
    }
    
    // Fallback default path
    return <StartHere lang={lang} navigate={navigate} />;
  };

  return (
    <>
      <Header lang={lang} setLang={setLang} dict={dict} />
      
      {/* Navbar navigation bar */}
      <Navbar currentPath={currentPath} navigate={navigate} lang={lang} />

      <main className="container">
        {renderRouteContent()}
      </main>
    </>
  );
}

export default App;
