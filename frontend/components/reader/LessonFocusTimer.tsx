'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
  const initialSeconds = useMemo(() => Math.max(60, Math.round(defaultMinutes * 60)), [defaultMinutes]);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [state, setState] = useState<'ready' | 'running' | 'paused' | 'done'>('ready');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(initialSeconds);
    setState('ready');
    deadlineRef.current = null;
    onFocusModeChange(false);
  }, [initialSeconds, lessonTitle, onFocusModeChange]);

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
    setRemaining(initialSeconds);
    setState('ready');
    onFocusModeChange(false);
  };
  const pause = () => {
    deadlineRef.current = null;
    setState('paused');
    onFocusModeChange(false);
  };

  const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const progress = initialSeconds ? ((initialSeconds - remaining) / initialSeconds) * 100 : 0;

  return <section className="rd-focus-timer rd-focus-timer--header" aria-label="Lesson focus timer">
    <div className="rd-focus-timer__heading"><span>LESSON FOCUS</span><b>{state === 'running' ? 'ACTIVE' : state === 'done' ? 'COMPLETE' : 'READY'}</b></div>
    <div className="rd-focus-timer__notify" role="status" aria-live="polite">
      {state === 'ready' && <button type="button" onClick={start}>Click Start to begin focus</button>}
      {state === 'running' && <button type="button" onClick={pause}><span>Focus started</span><strong>{hours}:{minutes}:{seconds}</strong></button>}
      {state === 'paused' && <button type="button" onClick={start}><span>Focus paused · Resume</span><strong>{hours}:{minutes}:{seconds}</strong></button>}
      {state === 'done' && <button type="button" onClick={reset}>Focus completed · Start again</button>}
    </div>
    <div className="rd-focus-timer__track"><i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
    <label className="rd-focus-timer__sound"><input type="checkbox" checked={soundEnabled} onChange={event => setSoundEnabled(event.target.checked)} /> Completion sound</label>
  </section>;
}
