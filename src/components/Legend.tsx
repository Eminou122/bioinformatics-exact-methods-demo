import React from 'react';

interface LegendProps {
  lang: 'fr' | 'en';
}

export const Legend: React.FC<LegendProps> = ({ lang }) => {
  return (
    <section className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>
        {lang === 'fr' ? 'Légende des Graphiques' : 'Graph Legend'}
      </h2>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-md)',
          fontSize: '0.85rem',
          color: 'var(--neutral-medium)'
        }}
      >
        {/* Graph D Legend */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--neutral-dark)', marginBottom: 'var(--space-xs)' }}>
            {lang === 'fr' ? 'Graphe D — Flux métabolique' : 'Graph D — Metabolic flow'}
          </h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="12">
                <line x1="0" y1="6" x2="20" y2="6" stroke="var(--border-color)" strokeWidth="1.5" />
                <polygon points="16,3 22,6 16,9" fill="var(--neutral-light)" />
              </svg>
              <span>{lang === 'fr' ? 'Transition métabolique inactive' : 'Inactive metabolic transition'}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="12">
                <line x1="0" y1="6" x2="20" y2="6" stroke="var(--primary)" strokeWidth="3" />
                <polygon points="15,2 22,6 15,10" fill="var(--primary)" />
              </svg>
              <span>{lang === 'fr' ? 'Transition active dans le chemin courant' : 'Active transition in current path'}</span>
            </li>
          </ul>
        </div>

        {/* Graph G Legend */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--neutral-dark)', marginBottom: 'var(--space-xs)' }}>
            {lang === 'fr' ? 'Graphe G — Proximité génomique' : 'Graph G — Genomic proximity'}
          </h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="12">
                <line x1="0" y1="6" x2="24" y2="6" stroke="var(--neutral-light)" strokeWidth="1" strokeDasharray="3,3" />
              </svg>
              <span>{lang === 'fr' ? 'Liaison génomique inactive (hors chemin)' : 'Inactive genomic edge (outside path)'}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="12">
                <line x1="0" y1="6" x2="24" y2="6" stroke="var(--primary)" strokeWidth="3" />
              </svg>
              <span>{lang === 'fr' ? 'Liaison induite active dans le chemin' : 'Active induced edge in path'}</span>
            </li>
          </ul>
        </div>

        {/* Node states Legend */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--neutral-dark)', marginBottom: 'var(--space-xs)' }}>
            {lang === 'fr' ? 'Sommets / Réactions' : 'Nodes / Reactions'}
          </h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  border: '1.5px solid var(--neutral-light)', 
                  backgroundColor: 'var(--bg-card)' 
                }} 
              />
              <span>{lang === 'fr' ? 'Sommet inactif (non sélectionné)' : 'Inactive node (unselected)'}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  border: '3px solid var(--primary)', 
                  backgroundColor: 'var(--primary-bg)',
                  position: 'relative'
                }} 
              />
              <span>{lang === 'fr' ? 'Sommet dans le chemin (Cohérent / Accepté)' : 'Node in path (Consistent / Accepted)'}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  border: '3px solid var(--danger)', 
                  backgroundColor: 'var(--danger-bg)' 
                }} 
              />
              <span>{lang === 'fr' ? 'Sommet dans le chemin déconnecté (Rejeté)' : 'Disconnected node in path (Rejected)'}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  border: '3px solid var(--primary)', 
                  backgroundColor: 'var(--primary-bg)' 
                }} 
              >
                <span style={{ display: 'block', margin: '2px', width: '6px', height: '6px', borderRadius: '50%', border: '1px dashed var(--primary)' }} />
              </span>
              <span>{lang === 'fr' ? 'Point de départ du chemin (Double anneau)' : 'Start node of the path (Double ring)'}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <p style={{ margin: 'var(--space-md) 0 0 0', fontSize: '0.8rem', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-sm)' }}>
        {lang === 'fr' 
          ? 'Note d\'accessibilité : Les sommets actifs ou rejetés se distinguent par l\'épaisseur de leurs traits, des anneaux internes pointillés et des motifs de liaisons (pleins vs pointillés) en plus des couleurs.'
          : 'Accessibility note: Active or rejected nodes are distinguished by line thickness, internal dashed rings, and edge styles (solid vs dashed) in addition to color.'}
      </p>
    </section>
  );
};
