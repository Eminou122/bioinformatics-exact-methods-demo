export type Language = 'fr' | 'en' | 'ar';

export interface TranslationDict {
  // Title / Subtitle / Intro
  appTitle: string;
  appSubtitle: string;
  courseTag: string;
  introTitle: string;
  introP1: string;
  introP2: string;
  introDLabel: string;
  introDDesc: string;
  introGLabel: string;
  introGDesc: string;
  introRuleLabel: string;
  introRuleDesc: string;
  introSummary: string;
  
  // Selection
  selectionTitle: string;
  teachingPoint: string;
  btnRun: string;
  btnReset: string;

  // Visualization
  visTitle: string;
  visDescD: string;
  visDescG: string;

  // Results & Stepper
  resultsTitle: string;
  metricLongestD: string;
  metricLongestDG: string;
  metricEvaluated: string;
  metricAccepted: string;
  metricVertices: string;
  metricOptimal: string;
  metricConnectedG: string;
  metricExplored: string;
  
  stepTitle: string;
  stepCounter: string;
  stepFinalResult: string;
  stepPathEvaluated: string;
  stepAcceptedBadge: string;
  stepRejectedBadge: string;
  stepBestBadge: string;
  stepAnalysisTitle: string;
  stepBestSoFar: string;
  stepBestNone: string;
  stepCompletedTitle: string;
  stepCompletedDesc: string;
  stepOptimalSol: string;
  stepNoSol: string;
  btnPrev: string;
  btnNext: string;
  btnEnd: string;
  btnConclusion: string;

  // Legend
  legendTitle: string;
  legendDTitle: string;
  legendGTitle: string;
  legendNodeTitle: string;
  legendDInactive: string;
  legendDActive: string;
  legendGInactive: string;
  legendGActive: string;
  legendNodeInactive: string;
  legendNodeAccepted: string;
  legendNodeRejected: string;
  legendNodeStart: string;
  legendAccessibilityNote: string;

  // Bottom Cards
  bottomBioTitle: string;
  bottomBioDesc: string;
  bottomMethodTitle: string;
  bottomMethodDesc: string;

  // Errors
  errorCycleFound: string;
  errorInvalidNodeD: string;
  errorInvalidNodeG: string;

  // Specific explanations for datasets (Dataset final analysis)
  analysisTitle: string;
  analysisSimpleValideP1: string;
  analysisSimpleValideP2: string;
  analysisSimpleValideP3: string;
  analysisLongestRejectedP1: string;
  analysisLongestRejectedP2: string;
  analysisLongestRejectedP3: string;
  analysisLongestRejectedP4: string;
  analysisMultipleCandidatesP1: string;
  analysisMultipleCandidatesP2: string;
  analysisMultipleCandidatesP3: string;
  analysisMultipleCandidatesP4: string;

  // Reasons
  reasonSingleNode: string;
  reasonConnected: string;
  reasonDisconnected: string;
}
