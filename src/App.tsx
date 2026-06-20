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

function App() {
  const [lang, setLang] = useState<Language>('fr');
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
    document.title = dict.appTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', dict.introP1);
    }
  }, [lang, dict]);

  // Fetch the active dataset
  const currentExample = useMemo(() => {
    return examples.find((ex) => ex.id === selectedExampleId) || examples[0];
  }, [selectedExampleId]);

  // Run the solver on the active dataset
  const solverResult = useMemo(() => {
    return solveConsistentPath(
      currentExample.vertices,
      currentExample.edgesD,
      currentExample.edgesG
    );
  }, [currentExample]);

  const isRunning = currentStepIndex !== -1 && !solverResult.error;

  // Derive visual state of graphs based on current step
  const graphVisuals = useMemo(() => {
    const totalSteps = solverResult.evaluations.length;
    
    // Initial state or error state: nothing highlighted
    if (currentStepIndex === -1 || solverResult.error) {
      return {
        highlightedNodes: new Set<string>(),
        activePath: [] as string[],
        isFinalResult: false,
        isAcceptedStep: false,
      };
    }

    // Final result screen: highlight winning consistent path
    if (currentStepIndex === totalSteps) {
      const winner = solverResult.longestConsistentPath || [];
      return {
        highlightedNodes: new Set(winner),
        activePath: winner,
        isFinalResult: true,
        isAcceptedStep: true,
      };
    }

    // Stepper screen: highlight candidate path under evaluation
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
    setCurrentStepIndex(-1); // Reset execution state
  };

  const handleRun = () => {
    if (!solverResult.error) {
      setCurrentStepIndex(0); // Start path stepping
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(-1); // Reset
  };

  const handleStepChange = (index: number) => {
    const totalSteps = solverResult.evaluations.length;
    if (index >= 0 && index <= totalSteps) {
      setCurrentStepIndex(index);
    }
  };

  // Build error message if the dataset is invalid
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

  return (
    <>
      <Header lang={lang} setLang={setLang} dict={dict} />

      <main className="container">
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
      </main>
    </>
  );
}

export default App;
