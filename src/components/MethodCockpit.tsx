import React from 'react';

interface MethodCockpitProps {
  cockpitRef?: React.RefObject<HTMLElement | null>;
  controls: React.ReactNode;
  graph: React.ReactNode;
  state: React.ReactNode;
  constraints: React.ReactNode;
  trace: React.ReactNode;
}

export const MethodCockpit: React.FC<MethodCockpitProps> = ({
  cockpitRef,
  controls,
  graph,
  state,
  constraints,
  trace,
}) => {
  return (
    <section ref={cockpitRef} className="method-cockpit" data-testid="method-cockpit" aria-label="Method cockpit">
      <div className="method-cockpit__controls">{controls}</div>
      <div className="method-cockpit__body" data-testid="method-cockpit-grid">
        <div className="method-cockpit__panel method-cockpit__graph" data-testid="method-cockpit-graph">
          {graph}
        </div>
        <div className="method-cockpit__panel method-cockpit__state" data-testid="method-cockpit-state">
          {state}
        </div>
        <div className="method-cockpit__panel method-cockpit__constraints" data-testid="method-cockpit-constraints">
          {constraints}
        </div>
        <div className="method-cockpit__panel method-cockpit__trace" data-testid="method-cockpit-trace">
          {trace}
        </div>
      </div>

      <style>{`
        .method-cockpit {
          margin-block-end: var(--space-md);
        }

        .method-cockpit__controls {
          position: relative;
          z-index: 6;
          flex: 0 0 auto;
        }

        .method-cockpit__body {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(300px, 0.82fr);
          grid-template-rows: minmax(250px, 1fr) minmax(220px, 0.82fr);
          gap: var(--space-md);
          align-items: stretch;
        }

        .method-cockpit__panel {
          min-width: 0;
          min-height: 0;
        }

        .method-cockpit__panel > .card,
        .method-cockpit__graph > .graph-panel-container {
          height: 100%;
          margin-block-end: 0 !important;
          overflow: auto;
        }

        .method-cockpit__graph > .graph-panel-container {
          overflow: hidden;
        }

        .method-cockpit__trace > .card {
          display: flex;
          flex-direction: column;
        }

        .method-cockpit .method-playback-bar {
          position: static !important;
          margin-block-end: var(--space-sm) !important;
        }

        .method-cockpit__active-row {
          background: var(--primary-bg) !important;
          box-shadow: inset 3px 0 0 var(--accent-gold);
        }

        @media (min-width: 1024px) {
          .method-cockpit {
            height: calc(100vh - 138px);
            min-height: 620px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .method-cockpit__body {
            flex: 1;
            overflow: hidden;
          }
        }

        @media (max-width: 1023px) {
          .method-cockpit {
            overflow: visible;
          }

          .method-cockpit__body {
            display: flex;
            flex-direction: column;
          }

          .method-cockpit__panel > .card,
          .method-cockpit__graph > .graph-panel-container {
            height: auto;
            overflow: visible;
          }
        }
      `}</style>
    </section>
  );
};
