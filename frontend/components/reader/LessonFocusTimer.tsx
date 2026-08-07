'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const PRESETS = [10, 15, 20, 25] as const;

function nearestPreset(minutes: number) {
  return PRESETS.reduce((best, value) => Math.abs(value - minutes) < Math.abs(best - minutes) ? value : best, PRESETS[0]);
}

function playCompletionSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    [659, 784, 988].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + index * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.16 + 0.42);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + index * 0.16);
      oscillator.stop(context.currentTime + index * 0.16 + 0.45);
    });
    window.setTimeout(() => context.close().catch(() => undefined), 1200);
  } catch { /* Audio is optional and may be blocked by the browser. */ }
}

export function LessonFocusTimer({
  lessonTitle,
  defaultMinutes,
  onFocusModeChange,
}: {
  lessonTitle: string;
  defaultMinutes: number;
  onFocusModeChange: (active: boolean) => void;
}) {
  const initialMinutes = useMemo(() => nearestPreset(defaultMinutes), [defaultMinutes]);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(initialMinutes);
  const [remaining, setRemaining] = useState(initialMinutes * 60);
  const [state, setState] = useState<'ready' | 'confirm' | 'running' | 'paused' | 'done'>('ready');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedMinutes(initialMinutes);
    setRemaining(initialMinutes * 60);
    setState('ready');
    deadlineRef.current = null;
    onFocusModeChange(false);
  }, [initialMinutes, lessonTitle, onFocusModeChange]);

  useEffect(() => {
    if (state !== 'running') return;
    const tick = () => {
      const deadline = deadlineRef.current || Date.now();
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setState('done');
        deadlineRef.current = null;
        onFocusModeChange(false);
        if (soundEnabled) playCompletionSound();
        if ('Notification' in window && Notification.permission === 'granted') new Notification('Focus session complete', { body: `${lessonTitle} session finished.` });
      }
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [lessonTitle, onFocusModeChange, soundEnabled, state]);

  const start = () => {
    deadlineRef.current = Date.now() + remaining * 1000;
    setState('running');
    onFocusModeChange(true);
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => undefined);
  };
  const reset = () => {
    deadlineRef.current = null;
    setRemaining(selectedMinutes * 60);
    setState('ready');
    onFocusModeChange(false);
  };
  const selectMinutes = (minutes: number) => {
    if (state === 'running') return;
    setSelectedMinutes(minutes);
    setRemaining(minutes * 60);
    setState('ready');
  };

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const progress = selectedMinutes * 60 ? ((selectedMinutes * 60 - remaining) / (selectedMinutes * 60)) * 100 : 0;

  return <section className="rd-focus-timer" aria-label="Lesson focus timer">
    <div className="rd-focus-timer__heading"><span>LESSON FOCUS</span><b>{state === 'running' ? 'ACTIVE' : state === 'done' ? 'COMPLETE' : 'READY'}</b></div>
    <p className="rd-focus-timer__lesson">{lessonTitle}</p>
    <div className="rd-focus-timer__clock" aria-live="polite"><strong>{minutes}:{seconds}</strong><span>{state === 'running' ? 'Stay focused' : state === 'paused' ? 'Paused' : 'Deep work session'}</span></div>
    <div className="rd-focus-timer__track"><i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
    <div className="rd-focus-timer__presets">{PRESETS.map(minutesValue => <button key={minutesValue} type="button" onClick={() => selectMinutes(minutesValue)} className={selectedMinutes === minutesValue ? 'is-selected' : ''} disabled={state === 'running'}>{minutesValue}m</button>)}</div>
    {state === 'confirm' && <div className="rd-focus-timer__warning" role="alert"><strong>Start focused lesson mode?</strong><span>Navigation and the home button will be hidden until you pause, reset, or finish.</span><div><button type="button" onClick={start}>Start session</button><button type="button" onClick={() => setState('ready')}>Cancel</button></div></div>}
    {state !== 'confirm' && <div className="rd-focus-timer__actions">{state === 'running' ? <button type="button" className="primary" onClick={() => { setState('paused'); deadlineRef.current = null; onFocusModeChange(false); }}>Pause</button> : state === 'done' ? <button type="button" className="primary" onClick={reset}>Start again</button> : <button type="button" className="primary" onClick={() => setState('confirm')}>{state === 'paused' ? 'Resume focus' : 'Start focus'}</button>}{state !== 'ready' && state !== 'done' && <button type="button" onClick={reset}>Reset</button>}</div>}
    <label className="rd-focus-timer__sound"><input type="checkbox" checked={soundEnabled} onChange={event => setSoundEnabled(event.target.checked)} /> Completion sound</label>
    <small className="rd-focus-timer__hint">Default is based on this lesson’s reading time. Choose 10, 15, 20, or 25 minutes.</small>
  </section>;
}
