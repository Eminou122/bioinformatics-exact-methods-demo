import React, { useEffect, useRef, useState } from 'react';
import type { Language } from '../i18n/types';
import { Icon } from './Icons';

interface PlaybackLabels {
  start: string;
  previous: string;
  next: string;
  play: string;
  pause: string;
  reset: string;
  end: string;
  counter: string;
}

const playbackLabels: Record<Language, PlaybackLabels> = {
  fr: {
    start: 'Démarrer la recherche',
    previous: 'Étape précédente',
    next: 'Étape suivante',
    play: 'Lecture',
    pause: 'Pause',
    reset: 'Réinitialiser',
    end: 'Aller à la fin',
    counter: 'Étape',
  },
  en: {
    start: 'Start search',
    previous: 'Previous step',
    next: 'Next step',
    play: 'Play',
    pause: 'Pause',
    reset: 'Reset',
    end: 'Go to end',
    counter: 'Step',
  },
  ar: {
    start: 'بدء البحث',
    previous: 'الخطوة السابقة',
    next: 'الخطوة التالية',
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    reset: 'إعادة تعيين',
    end: 'الانتقال للنهاية',
    counter: 'الخطوة',
  },
};

interface MethodPlaybackControlsProps {
  lang: Language;
  currentStepIndex: number;
  totalSteps: number;
  onStepChange: (index: number) => void;
  onReset: () => void;
  onPlayRequest?: () => void;
  labels?: Partial<PlaybackLabels>;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export const MethodPlaybackControls: React.FC<MethodPlaybackControlsProps> = ({
  lang,
  currentStepIndex,
  totalSteps,
  onStepChange,
  onReset,
  onPlayRequest,
  labels,
}) => {
  const t = { ...playbackLabels[lang], ...labels };
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const hasStarted = currentStepIndex >= 0;
  const atEnd = hasStarted && currentStepIndex >= totalSteps - 1;
  const delayMs = prefersReducedMotion() ? 1600 : 1000;

  const stopPlayback = () => {
    setIsPlaying(false);
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isPlaying || totalSteps <= 0) return;
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      const nextStep = Math.min(totalSteps - 1, Math.max(0, currentStepIndex + 1));
      onStepChange(nextStep);
      if (nextStep >= totalSteps - 1) {
        stopPlayback();
      }
    }, delayMs);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentStepIndex, delayMs, isPlaying, onStepChange, totalSteps]);

  useEffect(() => stopPlayback, []);

  const start = () => {
    onStepChange(0);
  };
  const previous = () => {
    stopPlayback();
    onStepChange(Math.max(0, currentStepIndex - 1));
  };
  const next = () => {
    stopPlayback();
    onStepChange(Math.min(totalSteps - 1, Math.max(0, currentStepIndex + 1)));
  };
  const end = () => {
    stopPlayback();
    onStepChange(totalSteps - 1);
  };
  const reset = () => {
    stopPlayback();
    onReset();
  };
  const play = () => {
    onPlayRequest?.();
    if (!hasStarted) onStepChange(0);
    if (!atEnd && totalSteps > 0) setIsPlaying(true);
  };

  return (
    <div
      className="method-playback-bar"
      data-testid="method-playback-controls"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: 'var(--space-sm)',
        marginBlockEnd: 'var(--space-md)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.96)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}
    >
      {!hasStarted && (
        <button className="btn btn-primary" onClick={start} style={{ width: 'auto', minHeight: 36 }} aria-label={t.start}>
          <span className="icon-label"><Icon name="play" /> {t.start}</span>
        </button>
      )}
      <button className="btn btn-secondary" onClick={previous} disabled={!hasStarted || currentStepIndex <= 0} style={{ width: 'auto', minHeight: 36 }} aria-label={t.previous}>
        <span className="icon-label"><Icon name="step" /> {t.previous}</span>
      </button>
      <button className="btn btn-primary" onClick={next} disabled={!hasStarted || atEnd} style={{ width: 'auto', minHeight: 36 }} aria-label={t.next}>
        <span className="icon-label"><Icon name="step" /> {t.next}</span>
      </button>
      {!isPlaying ? (
        <button className="btn btn-secondary" onClick={play} disabled={totalSteps === 0 || atEnd} style={{ width: 'auto', minHeight: 36 }} aria-label={t.play}>
          <span className="icon-label"><Icon name="play" /> {t.play}</span>
        </button>
      ) : (
        <button className="btn btn-secondary" onClick={stopPlayback} style={{ width: 'auto', minHeight: 36 }} aria-label={t.pause}>
          <span className="icon-label"><Icon name="reset" /> {t.pause}</span>
        </button>
      )}
      <button className="btn btn-secondary" onClick={end} disabled={!hasStarted || atEnd} style={{ width: 'auto', minHeight: 36 }} aria-label={t.end}>
        <span className="icon-label"><Icon name="step" /> {t.end}</span>
      </button>
      <button className="btn btn-secondary" onClick={reset} disabled={!hasStarted && !isPlaying} style={{ width: 'auto', minHeight: 36 }} aria-label={t.reset}>
        <span className="icon-label"><Icon name="reset" /> {t.reset}</span>
      </button>
      <strong style={{ marginInlineStart: 'auto', fontSize: '0.9rem', color: 'var(--neutral-medium)' }}>
        {hasStarted ? `${t.counter}: ${currentStepIndex + 1} / ${totalSteps}` : `${t.counter}: 0 / ${totalSteps}`}
      </strong>
    </div>
  );
};
