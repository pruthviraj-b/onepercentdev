'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { submitTypingScore, pingStreak } from '@/lib/taskApi';

// ── Typing snippets (Python & general coding) ────────────────────────────────
const SNIPPETS = [
  { label: 'Python — Variables', code: 'name = "Ravi"\nage = 25\nheight = 5.9\nis_student = True\nprint(name, age, height, is_student)' },
  { label: 'Python — For Loop', code: 'fruits = ["apple", "banana", "mango"]\nfor fruit in fruits:\n    print(f"I like {fruit}")' },
  { label: 'Python — Function', code: 'def greet(name):\n    return f"Hello, {name}!"\n\nresult = greet("Priya")\nprint(result)' },
  { label: 'Python — List Comprehension', code: 'numbers = [1, 2, 3, 4, 5]\nsquares = [n ** 2 for n in numbers]\nprint(squares)' },
  { label: 'Python — Dictionary', code: 'student = {\n    "name": "Ajay",\n    "age": 20,\n    "grade": "A"\n}\nprint(student["name"])' },
  { label: 'Python — Class', code: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n\n    def bark(self):\n        return f"{self.name} says: Woof!"\n\ndog = Dog("Tommy")\nprint(dog.bark())' },
  { label: 'Python — Try Except', code: 'try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print("Cannot divide by zero")\nfinally:\n    print("Done")' },
  { label: 'Python — File I/O', code: 'with open("data.txt", "w") as f:\n    f.write("Hello, World!")\n\nwith open("data.txt", "r") as f:\n    content = f.read()\n    print(content)' },
  { label: 'Python — Lambda', code: 'double = lambda x: x * 2\nsquare = lambda x: x ** 2\n\nnums = [1, 2, 3, 4]\nresult = list(map(double, nums))\nprint(result)' },
  { label: 'Cloud — AWS CLI', code: 'aws s3 ls s3://my-bucket\naws ec2 describe-instances\naws lambda list-functions\naws iam list-users' },
];

interface TypingViewProps {
  onBack: () => void;
}

type GameState = 'idle' | 'running' | 'finished';

interface HistoryEntry {
  wpm: number;
  accuracy: number;
  label: string;
  date: string;
}

const LS_HISTORY = 'opd_typing_history';

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(h: HistoryEntry[]) {
  try { localStorage.setItem(LS_HISTORY, JSON.stringify(h.slice(0, 10))); } catch {}
}

export function TypingView({ onBack }: TypingViewProps) {
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [charStates, setCharStates] = useState<('correct' | 'wrong' | 'pending')[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const snippet = SNIPPETS[snippetIdx];
  const target = snippet.code;

  // Update char states
  useEffect(() => {
    const states = target.split('').map((ch, i) => {
      if (i >= userInput.length) return 'pending';
      return userInput[i] === ch ? 'correct' : 'wrong';
    }) as ('correct' | 'wrong' | 'pending')[];
    setCharStates(states);

    if (userInput.length > 0 && gameState === 'idle') {
      setGameState('running');
      const now = Date.now();
      setStartTime(now);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - now) / 1000));
      }, 200);
    }

    if (userInput.length >= target.length && gameState === 'running') {
      finishGame(userInput);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInput]);

  // Live WPM
  useEffect(() => {
    if (gameState === 'running' && startTime && elapsed > 0) {
      const minutes = elapsed / 60;
      const words = userInput.trim().split(/\s+/).length;
      setWpm(Math.round(words / minutes));
    }
  }, [elapsed, gameState, startTime, userInput]);

  const finishGame = useCallback((input: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const endTime = Date.now();
    const totalSec = startTime ? (endTime - startTime) / 1000 : 1;
    const words = input.trim().split(/\s+/).length;
    const finalWpm = Math.round(words / (totalSec / 60));

    const correct = input.split('').filter((c, i) => c === target[i]).length;
    const finalAccuracy = input.length > 0 ? Math.round((correct / Math.max(input.length, target.length)) * 100) : 0;

    setWpm(finalWpm);
    setAccuracy(finalAccuracy);
    setElapsed(Math.round(totalSec));
    setGameState('finished');

    // Save to history
    const entry: HistoryEntry = {
      wpm: finalWpm,
      accuracy: finalAccuracy,
      label: SNIPPETS[snippetIdx].label,
      date: new Date().toLocaleTimeString(),
    };
    const newHistory = [entry, ...loadHistory()].slice(0, 10);
    saveHistory(newHistory);
    setHistory(newHistory);

    // Sync to backend
    submitTypingScore(finalWpm, finalAccuracy, Math.round(totalSec));
    pingStreak();
  }, [startTime, target, snippetIdx]);

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setUserInput('');
    setGameState('idle');
    setStartTime(null);
    setElapsed(0);
    setWpm(0);
    setAccuracy(100);
    setCharStates([]);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleNextSnippet = () => {
    setSnippetIdx(i => (i + 1) % SNIPPETS.length);
    handleReset();
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const correctChars = charStates.filter(s => s === 'correct').length;
  const wrongChars = charStates.filter(s => s === 'wrong').length;

  return (
    <div style={{
      background: '#f4f1ea',
      backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1.5px, transparent 1.5px)',
      backgroundSize: '16px 16px',
      minHeight: '100vh',
      fontFamily: 'var(--font-ui)',
    }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, height: '54px',
        background: '#f1be3e', borderBottom: '3px solid #000',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', boxShadow: '0 3px 0 #000',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 800, padding: '3px 10px', background: '#000', color: '#f1be3e', border: '2px solid #000' }}>1%</span>
          <span style={{ fontWeight: 800, color: '#000', textTransform: 'uppercase' }}>Dev Academy</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#000', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: '4px' }}>/ Typing Practice</span>
        </div>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#000', color: '#f1be3e', border: '2px solid #000',
          boxShadow: '2px 2px 0 rgba(0,0,0,0.3)', padding: '5px 14px',
          fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.8rem',
          cursor: 'pointer', textTransform: 'uppercase',
        }}>← Home</button>
      </nav>

      <div style={{ padding: '32px 24px', maxWidth: '860px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>⌨️ Typing Practice</h1>
          <p style={{ color: '#555', marginTop: '6px', fontFamily: 'var(--font-content)', fontSize: '0.95rem' }}>
            Type the code snippet below. WPM and accuracy are tracked live.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'WPM', value: wpm, emoji: '🚀' },
            { label: 'Accuracy', value: `${accuracy}%`, emoji: '🎯' },
            { label: 'Time', value: `${elapsed}s`, emoji: '⏱️' },
            { label: 'Errors', value: wrongChars, emoji: '❌' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#ffffff', border: '2px solid #000', padding: '12px 16px',
              boxShadow: '3px 3px 0 #000', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.emoji}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Snippet selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Snippet:</span>
          <select
            value={snippetIdx}
            onChange={e => { setSnippetIdx(Number(e.target.value)); handleReset(); }}
            disabled={gameState === 'running'}
            style={{
              padding: '6px 12px', border: '2px solid #000', background: '#fff',
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.82rem',
              cursor: gameState === 'running' ? 'not-allowed' : 'pointer',
            }}
          >
            {SNIPPETS.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
          </select>
          <button onClick={handleNextSnippet} style={{
            padding: '6px 16px', border: '2px solid #000', background: '#f4f1ea',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase',
          }}>Next →</button>
          <button onClick={handleReset} style={{
            padding: '6px 16px', border: '2px solid #000', background: '#000', color: '#f1be3e',
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase',
            boxShadow: '2px 2px 0 #000',
          }}>↺ Reset</button>
        </div>

        {/* Target text display */}
        <div style={{
          background: '#000', border: '3px solid #000', padding: '20px',
          fontFamily: 'var(--font-mono)', fontSize: '1rem', lineHeight: 2,
          marginBottom: '16px', boxShadow: '5px 5px 0 #000', position: 'relative',
          userSelect: 'none',
        }}>
          {target.split('').map((char, i) => {
            const state = charStates[i] || 'pending';
            const isCursor = i === userInput.length && gameState !== 'finished';
            return (
              <span key={i} style={{
                color: state === 'correct' ? '#00dd88' : state === 'wrong' ? '#ff4444' : '#888888',
                background: isCursor ? '#f1be3e' : 'transparent',
                borderRadius: '2px',
                whiteSpace: char === '\n' ? undefined : 'pre',
              }}>
                {char === '\n' ? '↵\n' : char}
              </span>
            );
          })}
          {gameState === 'finished' && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
            }}>
              <div style={{ fontSize: '2.5rem' }}>🎉</div>
              <div style={{ color: '#f1be3e', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '1.4rem', textTransform: 'uppercase' }}>
                {wpm} WPM — {accuracy}% Accuracy
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleReset} style={{
                  padding: '8px 20px', background: '#f1be3e', border: '2px solid #fff',
                  fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase',
                }}>Try Again</button>
                <button onClick={handleNextSnippet} style={{
                  padding: '8px 20px', background: '#ffffff', border: '2px solid #fff',
                  fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase',
                }}>Next Snippet →</button>
              </div>
            </div>
          )}
        </div>

        {/* Typing area */}
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          disabled={gameState === 'finished'}
          placeholder={gameState === 'idle' ? 'Start typing here to begin...' : ''}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{
            width: '100%', minHeight: '120px', padding: '14px',
            border: '3px solid #000', background: gameState === 'finished' ? '#f4f1ea' : '#ffffff',
            fontFamily: 'var(--font-mono)', fontSize: '1rem', lineHeight: 1.7,
            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            boxShadow: '4px 4px 0 #000',
          }}
        />

        {/* Progress bar */}
        <div style={{ height: '12px', background: '#f4f1ea', border: '2px solid #000', marginTop: '12px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (correctChars / target.length) * 100)}%`,
            background: '#00dd88',
            transition: 'width 100ms linear',
          }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#555', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
          {correctChars}/{target.length} chars
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <div style={{
              background: '#f1be3e', border: '2px solid #000', borderBottom: 'none',
              padding: '8px 16px', fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              📊 Recent Scores
            </div>
            <div style={{ background: '#ffffff', border: '2px solid #000', boxShadow: '4px 4px 0 #000' }}>
              {history.map((h, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                  gap: '12px', alignItems: 'center',
                  padding: '10px 16px',
                  borderBottom: i < history.length - 1 ? '1px solid #e0e0e0' : 'none',
                  background: i === 0 ? '#fffbef' : '#ffffff',
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{h.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#000' }}>{h.wpm} WPM</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: h.accuracy >= 95 ? '#00aa44' : h.accuracy >= 80 ? '#cc8800' : '#cc0000' }}>{h.accuracy}%</span>
                  <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'var(--font-mono)' }}>{h.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
