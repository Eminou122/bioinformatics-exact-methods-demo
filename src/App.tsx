import { useState, useMemo, useEffect } from 'react';
import { examples } from './data/examples';
import { solveConsistentPath } from './domain/pathAlgorithms';
import { Header } from './components/Header';
import { IntroSection } from './components/IntroSection';
import { ExampleSelector } from './components/ExampleSelector';
import { GraphPanel } from './components/GraphPanel';
import { ComparisonPanel } from './components/ComparisonPanel';
import { AlgorithmSteps } from './components/AlgorithmSteps';
import { ResultPanel } from './components/ResultPanel';
import { Legend } from './components/Legend';
import type { Language } from './i18n/types';
import { translations } from './i18n/translations';
import { formatTranslation } from './i18n/format';

// New components and custom router
import { useNavigation, Navbar } from './components/Navigation';
import { StartHere } from './components/StartHere';
import { MethodMap } from './components/MethodMap';
import { CP1Model } from './components/CP1Model';
import { CP2Model } from './components/CP2Model';
import { CP2PlusModel } from './components/CP2PlusModel';
import { CP2PlusComparisonLab } from './components/CP2PlusComparisonLab';
import { RandomGraphDemoLab } from './components/RandomGraphDemoLab';
import { ILP1Model } from './components/ILP1Model';
import { ILP2Model } from './components/ILP2Model';
import { AlgoBBPlusPlusModel } from './components/AlgoBBPlusPlusModel';
import { SubsetDpModel } from './components/SubsetDpModel';
import { MethodPlaceholders } from './components/MethodPlaceholders';
import { readScenarioHandoff, scenarioToExample } from './domain/methodScenarioHandoff';
import { ScenarioHandoffBanner } from './components/ScenarioHandoffBanner';

const LANGUAGE_STORAGE_KEY = 'bioinformatics-demo-language';
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

  // Selected example state (used for legacy demo)
  const [selectedExampleId, setSelectedExampleId] = useState<string>('simple-valide');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1: not started

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

  // Derive legacy solver variables
  const suppliedScenario = useMemo(() => {
    const handoff = readScenarioHandoff();
    if (handoff.scenario && handoff.scenario.vertices.length > 6) {
      return {
        scenario: handoff.scenario,
        error: 'Not run — exceeds this solver’s educational safety limit.',
        example: null,
      };
    }
    return {
      scenario: handoff.scenario,
      error: handoff.error,
      example: handoff.scenario ? scenarioToExample(handoff.scenario) : null,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const currentExample = useMemo(() => {
    if (currentPath === '/legacy' && suppliedScenario.example) return suppliedScenario.example;
    return examples.find((ex) => ex.id === selectedExampleId) || examples[0];
  }, [currentPath, selectedExampleId, suppliedScenario.example]);

  const solverResult = useMemo(() => {
    return solveConsistentPath(
      currentExample.vertices,
      currentExample.edgesD,
      currentExample.edgesG
    );
  }, [currentExample]);

  const isRunning = currentStepIndex !== -1 && !solverResult.error;

  const graphVisuals = useMemo(() => {
    const totalSteps = solverResult.evaluations.length;
    
    if (currentStepIndex === -1 || solverResult.error) {
      return {
        highlightedNodes: new Set<string>(),
        activePath: [] as string[],
        isFinalResult: false,
        isAcceptedStep: false,
      };
    }

    if (currentStepIndex === totalSteps) {
      const winner = solverResult.longestConsistentPath || [];
      return {
        highlightedNodes: new Set(winner),
        activePath: winner,
        isFinalResult: true,
        isAcceptedStep: true,
      };
    }

    const stepEval = solverResult.evaluations[currentStepIndex];
    return {
      highlightedNodes: new Set(stepEval.path),
      activePath: stepEval.path,
      isFinalResult: false,
      isAcceptedStep: stepEval.isAccepted,
    };
  }, [currentStepIndex, solverResult]);

  const handleExampleSelect = (id: string) => {
    setSelectedExampleId(id);
    setCurrentStepIndex(-1);
  };

  const handleRun = () => {
    if (!solverResult.error) {
      setCurrentStepIndex(0);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(-1);
  };

  const handleStepChange = (index: number) => {
    const totalSteps = solverResult.evaluations.length;
    if (index >= 0 && index <= totalSteps) {
      setCurrentStepIndex(index);
    }
  };

  const getErrorMessage = () => {
    if (!solverResult.error) return '';
    const { code, node, message } = solverResult.error;
    if (code === 'CYCLE_DETECTED') {
      return dict.errorCycleFound;
    }
    if (code === 'INVALID_NODE_D') {
      return formatTranslation(dict, 'errorInvalidNodeD', { node: node || '' });
    }
    if (code === 'INVALID_NODE_G') {
      return formatTranslation(dict, 'errorInvalidNodeG', { node: node || '' });
    }
    return message || '';
  };

  // Route router logic
  const renderRouteContent = () => {
    if (currentPath === '/') {
      return <StartHere lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/methods') {
      return <MethodMap lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/methods/cp1') {
      return <CP1Model lang={lang} dict={dict} />;
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
      return <ILP1Model lang={lang} dict={dict} />;
    }
    if (currentPath === '/methods/ilp2') {
      return <ILP2Model lang={lang} dict={dict} />;
    }
    if (currentPath === '/methods/algobb-plus-plus') {
      return <AlgoBBPlusPlusModel lang={lang} dict={dict} />;
    }
    if (currentPath === '/methods/subset-dp') {
      return <SubsetDpModel lang={lang} dict={dict} />;
    }
    if (currentPath.startsWith('/methods/')) {
      const parts = currentPath.split('/');
      const methodId = parts[parts.length - 1];
      return <MethodPlaceholders methodId={methodId} lang={lang} navigate={navigate} />;
    }
    if (currentPath === '/legacy') {
      // Return 100% exact copy of the legacy exhaustive-enumeration demo
      return (
        <>
          <ScenarioHandoffBanner lang={lang} scenario={suppliedScenario.scenario} error={suppliedScenario.error} />
          {/* Exact exhaustive-enumeration baseline notice */}
          <div style={{
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: 'var(--neutral-bg-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            color: 'var(--neutral-dark)',
            marginBlockEnd: 'var(--space-md)',
            fontSize: '1rem',
            textAlign: 'center'
          }}>
            Exact exhaustive-enumeration baseline
          </div>

          {/* Academic Intro Section */}
          <IntroSection dict={dict} />

          {/* Dataset Selection */}
          <ExampleSelector
            examples={examples}
            selectedId={selectedExampleId}
            onSelect={handleExampleSelect}
            onRun={handleRun}
            onReset={handleReset}
            isRunning={currentStepIndex !== -1}
            lang={lang}
            dict={dict}
          />

          {/* Solver Validation / Cycle Errors */}
          {solverResult.error && (
            <div 
              style={{
                padding: 'var(--space-md)',
                backgroundColor: 'var(--danger-bg)',
                border: '2px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontWeight: 600,
                fontSize: '0.95rem',
                marginBlockEnd: 'var(--space-lg)',
                textAlign: 'start'
              }}
            >
              {getErrorMessage()}
            </div>
          )}

          {/* Side-by-side / Stacked Graph Rendering */}
          <GraphPanel
            vertices={currentExample.vertices}
            edgesD={currentExample.edgesD}
            edgesG={currentExample.edgesG}
            nodePositions={currentExample.nodePositions}
            highlightedNodes={graphVisuals.highlightedNodes}
            activePath={graphVisuals.activePath}
            isFinalResult={graphVisuals.isFinalResult}
            isAcceptedStep={graphVisuals.isAcceptedStep}
            lang={lang}
            dict={dict}
          />

          {/* Solver output, visible only after running and no error */}
          {isRunning && (
            <>
              {/* Global Metrics Cards */}
              <ComparisonPanel
                longestPathD={solverResult.longestPathD}
                longestConsistentPath={solverResult.longestConsistentPath}
                evaluatedPathsCount={solverResult.evaluatedPathsCount}
                acceptedPathsCount={solverResult.acceptedPathsCount}
                dict={dict}
              />

              {/* Stepper controls & Candidate evaluations */}
              <AlgorithmSteps
                evaluations={solverResult.evaluations}
                currentStepIndex={currentStepIndex}
                onStepChange={handleStepChange}
                dict={dict}
              />

              {/* In-depth Analysis (visible on the final result page of the stepper) */}
              {currentStepIndex === solverResult.evaluations.length && (
                <ResultPanel
                  exampleId={selectedExampleId}
                  longestConsistentPath={solverResult.longestConsistentPath}
                  dict={dict}
                />
              )}
            </>
          )}

          {/* Symbols and Accessibility Legend */}
          <Legend dict={dict} />

          {/* Supplementary Academic Cards */}
          <section className="grid grid-2" style={{ marginBlockStart: 'var(--space-xl)' }}>
            {/* Meaning biologically card */}
            <div className="card" style={{ margin: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--primary)', marginBlockEnd: 'var(--space-xs)' }}>
                {dict.bottomBioTitle}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--neutral-medium)' }}>
                {dict.bottomBioDesc}
              </p>
            </div>

            {/* Exact-method card */}
            <div className="card" style={{ margin: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--primary)', marginBlockEnd: 'var(--space-xs)' }}>
                {dict.bottomMethodTitle}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--neutral-medium)' }}>
                {dict.bottomMethodDesc}
              </p>
            </div>
          </section>
        </>
      );
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
