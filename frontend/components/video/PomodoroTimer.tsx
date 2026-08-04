'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { startPomodoroSession, completePomodoroSession } from '@/services/readerService';

interface PomodoroTimerProps {
  courseId?: string;
  partId?: number;
  onSessionComplete?: (type: 'work' | 'break') => void;
}

type Phase = 'work' | 'break';

const LS_KEY = 'opd_pomodoro_state';

interface PersistedState {
  phase: Phase;
  remaining: number;
  running: boolean;
  savedAt: number;
  workMins: number;
  breakMins: number;
  sessionId: number | null;
}

function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const s: PersistedState = JSON.parse(raw);
    if (s.running) {
      const elapsed = Math.floor((Date.now() - s.savedAt) / 1000);
      s.remaining = Math.max(0, s.remaining - elapsed);
    }
    return s;
  } catch { return null; }
}

export function PomodoroTimer({ courseId, partId, onSessionComplete }: PomodoroTimerProps) {
  const persisted = loadPersistedState();

  const [phase, setPhase] = useState<Phase>(persisted?.phase ?? 'work');
  const [workMins, setWorkMins] = useState(persisted?.workMins ?? 25);
  const [breakMins, setBreakMins] = useState(persisted?.breakMins ?? 5);
  const [remaining, setRemaining] = useState(persisted?.remaining ?? (persisted?.workMins ?? 25) * 60);
  const [running, setRunning] = useState(false); // never auto-resume on mount
  const [sessionId, setSessionId] = useState<number | null>(persisted?.sessionId ?? null);
  const [showSettings, setShowSettings] = useState(false);
  const [todaySessions, setTodaySessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef(false);

  const totalSecs = phase === 'work' ? workMins * 60 : breakMins * 60;
  const progress = totalSecs > 0 ? ((totalSecs - remaining) / totalSecs) * 100 : 0;
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');

  // Persist state to localStorage
  useEffect(() => {
    try {
      const s: PersistedState = { phase, remaining, running, savedAt: Date.now(), workMins, breakMins, sessionId };
      localStorage.setItem(LS_KEY, JSON.stringify(s));
    } catch {}
  }, [phase, remaining, running, workMins, breakMins, sessionId]);

  // Tick
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current!); intervalRef.current = null; return; }
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current!); intervalRef.current = null;
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  // Completion
  useEffect(() => {
    if (remaining === 0 && !notifiedRef.current) {
      notifiedRef.current = true;
      setRunning(false);
      handleSessionEnd(false);
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(phase === 'work' ? '🍅 Pomodoro complete! Time for a break.' : '⏰ Break over! Ready to focus?');
      }
      onSessionComplete?.(phase);
    }
  }, [remaining]);

  const handleSessionEnd = useCallback(async (interrupted: boolean) => {
    if (sessionId) { await completePomodoroSession(sessionId, interrupted); }
    if (phase === 'work') setTodaySessions(s => s + 1);
  }, [sessionId, phase]);

  const handleStart = useCallback(async () => {
    notifiedRef.current = false;
    const id = await startPomodoroSession(courseId || null, partId || null, phase, phase === 'work' ? workMins : breakMins);
    setSessionId(id);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setRunning(true);
  }, [courseId, partId, phase, workMins, breakMins]);

  const handlePause = useCallback(() => setRunning(false), []);

  const handleReset = useCallback(async () => {
    if (running) await handleSessionEnd(true);
    setRunning(false);
    setSessionId(null);
    notifiedRef.current = false;
    setRemaining(phase === 'work' ? workMins * 60 : breakMins * 60);
  }, [running, phase, workMins, breakMins, handleSessionEnd]);

  const switchPhase = useCallback(async (newPhase: Phase) => {
    if (running) await handleSessionEnd(true);
    setRunning(false);
    setSessionId(null);
    notifiedRef.current = false;
    setPhase(newPhase);
    setRemaining(newPhase === 'work' ? workMins * 60 : breakMins * 60);
  }, [running, workMins, breakMins, handleSessionEnd]);

  const circumference = 2 * Math.PI * 40;

  return (
    <div style={{
      background: 'transparent',
      border: '2px solid rgba(0,0,0,0.12)',
      color: '#1F2937',
      padding: '16px', minWidth: '220px', fontFamily: 'var(--font-ui)',
    }}>
      {/* Phase toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['work', 'break'] as Phase[]).map(p => (
          <button key={p} onClick={() => switchPhase(p)}
            style={{
              flex: 1, padding: '4px 8px', border: '2px solid',
              borderColor: phase === p ? '#1F2937' : 'rgba(0,0,0,0.2)',
              background: phase === p ? '#1F2937' : 'transparent',
              color: phase === p ? '#F59E0B' : '#6B7280',
              fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.7rem',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
            {p === 'work' ? '🍅 Focus' : '☕ Break'}
          </button>
        ))}
      </div>

      {/* SVG ring timer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
          <circle cx="50" cy="50" r="40" fill="none"
            stroke={phase === 'work' ? '#F59E0B' : '#22C55E'} strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          <text x="50" y="46" textAnchor="middle" fill="#1F2937"
            fontSize="18" fontWeight="900" fontFamily="var(--font-ui)">
            {mins}:{secs}
          </text>
          <text x="50" y="62" textAnchor="middle" fill="#6B7280"
            fontSize="8" fontFamily="var(--font-ui)">
            {phase === 'work' ? 'FOCUS' : 'BREAK'}
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {!running ? (
          <button onClick={handleStart}
            style={{ flex: 1, padding: '8px', background: '#1F2937', color: '#F59E0B', border: '2px solid #1F2937', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase' }}>
            ▶ Start
          </button>
        ) : (
          <button onClick={handlePause}
            style={{ flex: 1, padding: '8px', background: 'transparent', color: '#1F2937', border: '2px solid #1F2937', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase' }}>
            ⏸ Pause
          </button>
        )}
        <button onClick={handleReset}
          style={{ padding: '8px 12px', background: 'transparent', color: '#6B7280', border: '2px solid rgba(0,0,0,0.2)', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
          ↺
        </button>
        <button onClick={() => setShowSettings(s => !s)}
          style={{ padding: '8px 12px', background: 'transparent', color: '#6B7280', border: '2px solid rgba(0,0,0,0.2)', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
          ⚙
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Focus (min)', val: workMins, set: (v: number) => { setWorkMins(v); if (phase === 'work' && !running) setRemaining(v * 60); } },
            { label: 'Break (min)', val: breakMins, set: (v: number) => { setBreakMins(v); if (phase === 'break' && !running) setRemaining(v * 60); } },
          ].map(({ label, val, set }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => set(Math.max(1, val - 5))}
                  style={{ width: 24, height: 24, background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', color: '#1F2937', cursor: 'pointer', fontSize: '0.9rem' }}>−</button>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: 24, textAlign: 'center', color: '#1F2937' }}>{val}</span>
                <button onClick={() => set(Math.min(90, val + 5))}
                  style={{ width: 24, height: 24, background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', color: '#1F2937', cursor: 'pointer', fontSize: '0.9rem' }}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {todaySessions > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 8, fontSize: '0.7rem', color: '#6B7280', textAlign: 'center' }}>
          🍅 {todaySessions} session{todaySessions > 1 ? 's' : ''} today
        </div>
      )}
    </div>
  );
}
