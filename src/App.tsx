import { useState, useMemo } from 'react';
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

function App() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [selectedExampleId, setSelectedExampleId] = useState<string>('simple-valide');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1: not started

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

  const isRunning = currentStepIndex !== -1;

  // Derive visual state of graphs based on current step
  const graphVisuals = useMemo(() => {
    const totalSteps = solverResult.evaluations.length;
    
    // Initial state: nothing highlighted
    if (currentStepIndex === -1) {
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
    setCurrentStepIndex(0); // Start path stepping
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

  return (
    <>
      <Header lang={lang} setLang={setLang} />

      <main className="container">
        {/* Academic Intro Section */}
        <IntroSection lang={lang} />

        {/* Dataset Selection */}
        <ExampleSelector
          examples={examples}
          selectedId={selectedExampleId}
          onSelect={handleExampleSelect}
          onRun={handleRun}
          onReset={handleReset}
          isRunning={isRunning}
          lang={lang}
        />

        {/* Side-by-side Graph Rendering */}
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
        />

        {/* Solver output, visible only after running */}
        {isRunning && (
          <>
            {/* Global Metrics Cards */}
            <ComparisonPanel
              longestPathD={solverResult.longestPathD}
              longestConsistentPath={solverResult.longestConsistentPath}
              evaluatedPathsCount={solverResult.evaluatedPathsCount}
              acceptedPathsCount={solverResult.acceptedPathsCount}
              lang={lang}
            />

            {/* Stepper controls & Candidate evaluations */}
            <AlgorithmSteps
              evaluations={solverResult.evaluations}
              currentStepIndex={currentStepIndex}
              onStepChange={handleStepChange}
              lang={lang}
            />

            {/* In-depth Analysis (visible on the final result page of the stepper) */}
            {currentStepIndex === solverResult.evaluations.length && (
              <ResultPanel
                exampleId={selectedExampleId}
                longestConsistentPath={solverResult.longestConsistentPath}
                lang={lang}
              />
            )}
          </>
        )}

        {/* Symbols and Accessibility Legend */}
        <Legend lang={lang} />

        {/* Supplementary Academic Cards */}
        <section className="grid grid-2" style={{ marginTop: 'var(--space-xl)' }}>
          {/* Meaning biologically card */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--primary)', marginBottom: 'var(--space-xs)' }}>
              {lang === 'fr' ? 'Signification biologique' : 'Biological meaning'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--neutral-medium)' }}>
              {lang === 'fr' 
                ? 'Nous cherchons une chaîne de réactions qui suit une direction métabolique et dont les gènes associés restent proches dans le génome.'
                : 'We are looking for a chain of reactions that follows a metabolic direction and whose associated genes remain close to each other in the genome.'}
            </p>
          </div>

          {/* Exact-method card */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--primary)', marginBottom: 'var(--space-xs)' }}>
              {lang === 'fr' ? 'Méthode de résolution exacte' : 'Exact resolution method'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--neutral-medium)' }}>
              {lang === 'fr'
                ? 'Pour ces petits exemples, la démo vérifie tous les chemins possibles. La solution finale est donc garantie optimale.'
                : 'For these small examples, the demo verifies all possible paths. The final solution is therefore mathematically guaranteed to be optimal.'}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
