import type { Language } from '../i18n/types';
import type { MethodScenarioHandoff } from '../domain/methodScenarioHandoff';

const labels = {
  fr: {
    title: 'Scénario personnalisé du laboratoire de graphes aléatoires',
    fallback: 'Le scénario fourni est indisponible ou invalide. L’exemple intégré est chargé.',
    source: 'Source',
    family: 'Famille',
    seeds: 'Graines',
    challenge: 'Graphe défi',
    scenario: 'ID du scénario',
    back: 'Back to Random Graph Lab',
    default: 'Revenir à l’exemple intégré',
  },
  en: {
    title: 'Custom scenario from Random Graph Lab',
    fallback: 'The supplied scenario is unavailable or invalid. The built-in example is loaded.',
    source: 'Source',
    family: 'Family',
    seeds: 'Seeds',
    challenge: 'Challenge graph',
    scenario: 'Scenario ID',
    back: 'Back to Random Graph Lab',
    default: 'Return to built-in example',
  },
  ar: {
    title: 'سيناريو مخصص من مختبر المخططات العشوائية',
    fallback: 'السيناريو المقدم غير متاح أو غير صالح. تم تحميل المثال المدمج.',
    source: 'المصدر',
    family: 'العائلة',
    seeds: 'البذور',
    challenge: 'مخطط التحدي',
    scenario: 'معرف السيناريو',
    back: 'Back to Random Graph Lab',
    default: 'العودة إلى المثال المدمج',
  },
} satisfies Record<Language, Record<string, string>>;

interface ScenarioHandoffBannerProps {
  lang: Language;
  scenario: MethodScenarioHandoff | null;
  returnTo?: string;
  error: string | null;
}

function pushRoute(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('popstate'));
  window.scrollTo(0, 0);
}

export function ScenarioHandoffBanner({ lang, scenario, returnTo, error }: ScenarioHandoffBannerProps) {
  if (!scenario && !error) return null;
  const t = labels[lang];
  return (
    <section
      className="card"
      data-testid={scenario ? 'scenario-handoff-banner' : 'scenario-handoff-fallback'}
      style={{ borderColor: scenario ? 'var(--accent-gold)' : 'var(--danger)', marginBlockEnd: 'var(--space-md)' }}
    >
      <h3 style={{ color: 'var(--primary)' }}>{scenario ? t.title : t.fallback}</h3>
      {scenario && (
        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', gap: 'var(--space-xs) var(--space-sm)' }}>
          <dt>{t.source}</dt><dd dir="ltr">{scenario.source}</dd>
          <dt>{t.family}</dt><dd dir="ltr">{scenario.family}</dd>
          <dt>{t.scenario}</dt><dd dir="ltr">{scenario.scenarioId}</dd>
          <dt>{t.seeds}</dt><dd dir="ltr">{`seedOrder=${scenario.seedOrder}, seedD=${scenario.seedD}, seedG=${scenario.seedG}`}</dd>
          {scenario.challengeGraphId && <><dt>{t.challenge}</dt><dd dir="ltr">{scenario.challengeGraphId}</dd></>}
        </dl>
      )}
      {error && <p role="alert" style={{ color: 'var(--danger)', fontWeight: 800 }}>{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        {scenario && returnTo && (
          <button type="button" className="btn btn-primary" onClick={() => pushRoute(returnTo)} style={{ width: 'auto' }}>
            {t.back}
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={() => pushRoute(window.location.pathname)} style={{ width: 'auto' }}>
          {t.default}
        </button>
      </div>
    </section>
  );
}
