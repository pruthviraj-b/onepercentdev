'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { submitTypingScore, pingStreak } from '@/lib/taskApi';

const C = {
  bg: '#080B10',
  bg2: '#0B1018',
  surface: '#0F141C',
  surfaceHi: '#151B25',
  surfaceCard: '#111822',
  surfaceCardHi: '#182234',
  border: '#212B38',
  borderHi: '#2E3B4C',
  text: '#E8EDF4',
  textDim: '#7E8CA0',
  textFaint: '#4B5768',
  neonCyan: '#4CD8E0',
  cyanGlow: 'rgba(76, 216, 224, 0.14)',
  cyanGlow2: 'rgba(76, 216, 224, 0.07)',
  neonGreen: '#3ED598',
  greenGlow: 'rgba(62, 213, 152, 0.14)',
  neonPurple: '#9C8CFF',
  purpleGlow: 'rgba(156, 140, 255, 0.14)',
  neonYellow: '#F5B84C',
  neonRed: '#F0716C',
  onAccent: '#061012',
};

const CURRICULUM = [
  { level: 0, title: 'Foundation: Data, Database & SQL', xp: 100, concept: 'Database is a folder, Table is an Excel sheet inside it.', why: 'Excel breaks at scale. Databases handle billions of rows with rules and speed.', syntax: 'SELECT * FROM students;', table: { headers: ['id','name','city'], rows: [['1','Aarav','BLR'],['2','Sara','MUM']] } },
  { level: 1, title: 'SELECT - Reading Columns', xp: 200, concept: 'SELECT tells WHAT columns you want.', why: 'You rarely need all columns. Selecting only needed columns is faster.', syntax: 'SELECT name, city FROM students;', table: null },
  { level: 2, title: 'WHERE - Filtering Rows', xp: 300, concept: 'WHERE filters rows based on condition.', why: 'Real apps need filtered data - e.g., only Bangalore users.', syntax: "SELECT * FROM students WHERE city = 'Bangalore';", table: null },
  { level: 3, title: 'ORDER BY, LIMIT, DISTINCT', xp: 400, concept: 'Sort, limit and unique values.', why: 'For leaderboards, pagination, deduplication.', syntax: 'SELECT DISTINCT city FROM students ORDER BY city LIMIT 10;', table: null },
  { level: 4, title: 'Functions & Calculations', xp: 500, concept: 'COUNT, SUM, AVG, UPPER, NOW() etc.', why: 'Raw data is useless. Functions transform it.', syntax: 'SELECT COUNT(*) AS total FROM students;', table: null },
  { level: 5, title: 'GROUP BY & HAVING', xp: 600, concept: 'Group rows and filter groups.', why: 'Analytics - revenue per city, users per month.', syntax: 'SELECT city, COUNT(*) FROM students GROUP BY city HAVING COUNT(*) > 1;', table: null },
  { level: 6, title: 'Joins - Combining Tables', xp: 800, concept: 'INNER, LEFT, RIGHT JOIN', why: 'Data is split across tables. Joins connect them.', syntax: 'SELECT s.name, c.course_name FROM students s JOIN enrollments e ON s.id=e.student_id;', table: null },
  { level: 7, title: 'Subqueries & CTEs', xp: 900, concept: 'Query inside query, WITH clause', why: 'Complex logic, readability, performance.', syntax: 'WITH top AS (SELECT * FROM orders ORDER BY amount DESC LIMIT 5) SELECT * FROM top;', table: null },
  { level: 8, title: 'INSERT, UPDATE, DELETE', xp: 1000, concept: 'Modify data safely', why: 'Apps write data, not just read.', syntax: "INSERT INTO students (name, city) VALUES ('Zayn','Delhi');", table: null },
  { level: 9, title: 'Schema Design & Constraints', xp: 1200, concept: 'PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE', why: 'Prevent bad data at database level.', syntax: 'CREATE TABLE students (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL);', table: null },
  { level: 10, title: 'Advanced - Window, Transactions', xp: 1500, concept: 'ROW_NUMBER(), RANK(), Transactions, Indexes', why: 'Elite level - ranking, running totals, ACID', syntax: 'SELECT *, ROW_NUMBER() OVER(PARTITION BY city ORDER BY age DESC) FROM students;', table: null },
];

const SNIPPETS = [
  { level: 0, category: 'SQL & Database', label: 'Level 0 - Hello World SELECT', code: `SELECT * FROM students;\n` },
  { level: 1, category: 'SQL & Database', label: 'Level 1 - Select Specific Columns', code: `SELECT name, age, city\nFROM students;\n\nSELECT student_id, name\nFROM students\nWHERE city = 'Bangalore';\n` },
  { level: 2, category: 'SQL & Database', label: 'Level 2 - WHERE Filtering Mastery', code: `SELECT * FROM students\nWHERE age >= 20\n AND city IN ('Bangalore', 'Mumbai')\n AND name LIKE 'A%';\n` },
  { level: 3, category: 'SQL & Database', label: 'Level 3 - Sorting & Pagination', code: `SELECT DISTINCT city\nFROM students\nORDER BY city ASC\nLIMIT 10 OFFSET 5;\n` },
  { level: 4, category: 'SQL & Database', label: 'Level 4 - Aggregates', code: `SELECT city, COUNT(*) AS total, AVG(age) AS avg_age\nFROM students\nGROUP BY city;\n` },
  { level: 5, category: 'SQL & Database', label: 'Level 5 - GROUP BY & HAVING', code: `SELECT city, COUNT(*) AS student_count\nFROM students\nGROUP BY city\nHAVING COUNT(*) > 2\nORDER BY student_count DESC;\n` },
  { level: 6, category: 'SQL & Database', label: 'Level 6 - JOINs', code: `SELECT s.name, c.course_name\nFROM students s\nINNER JOIN enrollments e ON s.student_id = e.student_id\nLEFT JOIN courses c ON e.course_id = c.course_id;\n` },
  { level: 7, category: 'SQL & Database', label: 'Level 7 - CTEs', code: `WITH ActiveUsers AS (\n SELECT user_id FROM students WHERE last_login > NOW() - INTERVAL '30 days'\n)\nSELECT * FROM ActiveUsers;\n` },
  { level: 10, category: 'SQL & Database', label: 'Level 10 - Window Functions Elite', code: `WITH MonthlyRevenue AS (\n SELECT DATE_TRUNC('month', order_date) AS mth, customer_id, SUM(total_amount) AS revenue\n FROM orders WHERE status='COMPLETED' GROUP BY 1,2\n)\nSELECT mth, customer_id, revenue,\n ROW_NUMBER() OVER(PARTITION BY mth ORDER BY revenue DESC) AS rn\nFROM MonthlyRevenue;\n` },
  { level: 10, category: 'SQL & Database', label: 'PostgreSQL - Recursive Org Chart', code: `WITH RECURSIVE org_chart AS (\n SELECT employee_id, manager_id, name, title, 1 AS depth\n FROM employees WHERE manager_id IS NULL\n UNION ALL\n SELECT e.employee_id, e.manager_id, e.name, e.title, oc.depth + 1\n FROM employees e JOIN org_chart oc ON e.manager_id = oc.employee_id\n)\nSELECT * FROM org_chart ORDER BY depth;\n` },
  { category: 'Python', label: 'Python - Asyncio Engine', code: `import asyncio, aiohttp\nasync def fetch_endpoint(session, url):\n async with session.get(url) as r:\n return await r.json()\n` },
  { category: 'DevOps', label: 'Terraform - VPC Topology', code: `resource "aws_vpc" "production_core" {\n cidr_block = "10.100.0.0/16"\n enable_dns_hostnames = true\n}\n` },
];

interface Props { onBack: () => void; }
type GameState = 'idle' | 'running' | 'finished' | 'lesson';
type CategoryFilter = 'All' | 'SQL & Database' | 'Python' | 'DevOps' | 'By Level';
interface HistoryEntry { wpm: number; accuracy: number; label: string; category: string; date: string; level: number; errors: number; }

const LS_HISTORY = 'opd_hyper_typing_history_v4';
const LS_PROGRESS = 'opd_sql_progress_v4';

function loadHistory(): HistoryEntry[] { try { const raw = localStorage.getItem(LS_HISTORY); return raw? JSON.parse(raw) : []; } catch { return []; } }
function saveHistory(h: HistoryEntry[]) { try { localStorage.setItem(LS_HISTORY, JSON.stringify(h.slice(0, 50))); } catch {} }
function loadProgress(): Record<number, boolean> { try { const raw = localStorage.getItem(LS_PROGRESS); return raw? JSON.parse(raw) : {}; } catch { return {}; } }

export function TypingView({ onBack }: Props) {
  const [level, setLevel] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('By Level');
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [gameState, setGameState] = useState<GameState>('lesson');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [progress, setProgress] = useState<Record<number, boolean>>(loadProgress);
  const [charStates, setCharStates] = useState<('correct' | 'wrong' | 'pending')[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [weakKeys, setWeakKeys] = useState<Record<string, number>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<number | null>(null);

  const filteredSnippets = useMemo(() => {
    if (selectedCategory === 'By Level') return SNIPPETS.filter(s => (s as any).level === level);
    if (selectedCategory === 'All') return SNIPPETS;
    return SNIPPETS.filter(s => s.category === selectedCategory);
  }, [selectedCategory, level]);

  const activeSnippet = filteredSnippets[snippetIdx] || filteredSnippets[0] || SNIPPETS[0];
  const target = activeSnippet.code;
  const currentLesson = CURRICULUM[level] || CURRICULUM[0];

  useEffect(() => {
    const states = target.split('').map((ch, i) => {
      if (i >= userInput.length) return 'pending' as const;
      return userInput[i] === ch? 'correct' as const : 'wrong' as const;
    });
    setCharStates(states);
    if (userInput.length > 0 && gameState === 'lesson') setGameState('idle');
    if (userInput.length > 0 && gameState === 'idle') {
      setGameState('running');
      const now = Date.now();
      setStartTime(now);
      timerRef.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - now) / 1000)), 100);
    }
    if (userInput.length >= target.length && gameState === 'running') finishGame(userInput);
  }, [userInput, target]);

  useEffect(() => {
    if (gameState === 'running' && startTime && elapsed > 0) {
      const minutes = elapsed / 60;
      const words = userInput.length / 5;
      setWpm(Math.round(words / minutes));
      const correct = charStates.filter(s => s === 'correct').length;
      setAccuracy(userInput.length? Math.round((correct / userInput.length) * 100) : 100);
    }
  }, [elapsed, gameState, charStates, userInput]);

  const finishGame = useCallback((input: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const endTime = Date.now();
    const totalSec = startTime? (endTime - startTime) / 1000 : 1;
    const finalWpm = Math.max(0, Math.round((input.length / 5) / (totalSec / 60)));
    const correct = input.split('').filter((c, i) => c === target[i]).length;
    const wrong = input.length - correct;
    const finalAccuracy = input.length? Math.round((correct / Math.max(input.length, target.length)) * 100) : 0;
    const wk: Record<string, number> = {};
    input.split('').forEach((c, i) => { if (c!== target[i]) wk[target[i] || c] = (wk[target[i] || c] || 0) + 1; });
    setWeakKeys(wk);
    setWpm(finalWpm);
    setAccuracy(finalAccuracy);
    setElapsed(Math.round(totalSec));
    setGameState('finished');
    const entry: HistoryEntry = { wpm: finalWpm, accuracy: finalAccuracy, label: activeSnippet.label, category: activeSnippet.category, date: new Date().toLocaleTimeString(), level, errors: wrong };
    const newHistory = [entry,...loadHistory()].slice(0, 50);
    saveHistory(newHistory);
    setHistory(newHistory);
    const newProgress = {...loadProgress(), [level]: finalAccuracy >= 85 };
    localStorage.setItem(LS_PROGRESS, JSON.stringify(newProgress));
    setProgress(newProgress);
    submitTypingScore(finalWpm, finalAccuracy, Math.round(totalSec));
    pingStreak();
  }, [startTime, target, activeSnippet, level]);

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setUserInput(''); setGameState(level === 0? 'lesson' : 'idle'); setStartTime(null); setElapsed(0); setWpm(0); setAccuracy(100); setCharStates([]); setWeakKeys({});
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleNext = () => {
    if (snippetIdx + 1 < filteredSnippets.length) setSnippetIdx(i => i + 1);
    else if (level < 10) { setLevel(l => l + 1); setSnippetIdx(0); }
    handleReset();
  };

  const handleLevelChange = (newLevel: number) => { setLevel(newLevel); setSnippetIdx(0); handleReset(); };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const correctChars = charStates.filter(s => s === 'correct').length;
  const wrongChars = charStates.filter(s => s === 'wrong').length;
  const progressPercent = Math.min(100, (correctChars / Math.max(1, target.length)) * 100);

  // FIXED STYLE - NO SHORTHAND + LONGHAND MIX
  return (
    <div className="typing-page" style={{ background: `radial-gradient(900px at 18% -10%, ${C.cyanGlow}, transparent), ${C.bg}`, minHeight: '100vh', color: C.text, fontFamily: "'Google Sans Flex', sans-serif" }}>
      <nav className="typing-nav" style={{ position: 'sticky', top: 0, zIndex: 100, height: 64, background: 'rgba(5,10,20,0.9)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 800, padding: '7px 12px', background: C.surfaceHi, color: C.neonCyan, border: `1px solid ${C.borderHi}`, borderRadius: 7, fontSize: '0.72rem', letterSpacing: '0.08em' }}>TYPING LAB</div>
          <span style={{ fontSize: '0.78rem', color: C.textDim }}>Level {level} / 10</span>
        </div>
        <button onClick={onBack} style={{ background: C.surfaceHi, color: C.neonCyan, border: `1px solid ${C.borderHi}`, borderRadius: 8, padding: '7px 16px', fontWeight: 800, cursor: 'pointer' }}>← Dashboard</button>
      </nav>

      <div className="typing-layout" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', maxWidth: 1400, margin: '0 auto' }}>
        <aside className="typing-sidebar" style={{ borderRight: `1px solid ${C.border}`, background: C.surface, padding: 16, position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: C.textFaint, letterSpacing: '0.14em', marginBottom: 14 }}>CURRICULUM PATH</div>
          {CURRICULUM.map(l => {
            const isActive = level === l.level;
            const isDone = progress[l.level];
            const activeBorderColor = isActive? C.neonCyan : 'transparent';
            const leftBorderColor = isDone? C.neonGreen : isActive? C.neonCyan : C.border;
            return (
              <button
                key={l.level}
                onClick={() => handleLevelChange(l.level)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: isActive? `linear-gradient(90deg, ${C.cyanGlow2}, transparent)` : 'transparent',
                  // FIXED: Using individual borders instead of border + borderLeft
                  borderTop: `1px solid ${activeBorderColor}`,
                  borderRight: `1px solid ${activeBorderColor}`,
                  borderBottom: `1px solid ${activeBorderColor}`,
                  borderLeft: `3px solid ${leftBorderColor}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive? C.text : C.textDim }}>L{l.level}: {l.title.split(':')[0]}</span>
                  <span style={{ fontSize: '0.68rem', color: isDone? C.neonGreen : C.textFaint }}>{isDone? '✓ DONE' : `${l.xp}XP`}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: C.textFaint, marginTop: 5 }}>{l.title}</div>
              </button>
            );
          })}
        </aside>

        <main className="typing-main" style={{ padding: 24, maxWidth: 1020 }}>
          {gameState === 'lesson' && (
            <div style={{ background: `linear-gradient(180deg, ${C.surfaceCardHi}, ${C.surfaceCard})`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}># Level {currentLesson.level} - {currentLesson.title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div><div style={{ fontSize: '0.7rem', color: C.neonCyan, fontWeight: 800 }}>CONCEPT</div><div style={{ color: C.textDim, fontSize: '0.9rem', marginTop: 6 }}>{currentLesson.concept}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: C.neonGreen, fontWeight: 800 }}>WHY IT EXISTS</div><div style={{ color: C.textDim, fontSize: '0.9rem', marginTop: 6 }}>{currentLesson.why}</div></div>
              </div>
              <div style={{ marginTop: 16, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                <code style={{ fontFamily: 'monospace', color: C.neonCyan }}>{currentLesson.syntax}</code>
              </div>
              <button onClick={() => setGameState('idle')} style={{ marginTop: 18, width: '100%', padding: 12, background: C.neonCyan, color: C.onAccent, border: `1px solid ${C.neonCyan}`, borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Start practice →</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
            {[
              { k: 'WPM', v: wpm, c: C.neonCyan },
              { k: 'ACC', v: `${accuracy}%`, c: C.neonGreen },
              { k: 'TIME', v: `${elapsed}s`, c: C.neonPurple },
              { k: 'ERR', v: wrongChars, c: C.neonRed },
            ].map(s => (
              <div key={s.k} style={{ background: C.surfaceCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: '0.65rem', color: C.textFaint, fontWeight: 800 }}>{s.k}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, color: s.c as string }}>{s.v as any}</div>
              </div>
            ))}
          </div>

          <div style={{ background: C.surfaceCard, border: `1px solid ${isFocused? C.neonCyan : C.border}`, borderRadius: 14, padding: 20, fontFamily: 'monospace', fontSize: '0.92rem', lineHeight: 1.85, position: 'relative' }}>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {target.split('').map((ch, i) => {
                const st = charStates[i] || 'pending'; const cursor = i === userInput.length;
                let col = C.textFaint; if (st === 'correct') col = C.text; if (st === 'wrong') col = C.neonRed;
                return <span key={i} style={{ color: col, background: cursor? C.cyanGlow : 'transparent', borderBottom: cursor? `2px solid ${C.neonCyan}` : 'none' }}>{ch}</span>;
              })}
            </div>
            {gameState === 'finished' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,4,10,0.92)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 14 }}>
                <div style={{ fontSize: '3rem' }}>🏆</div>
                <div style={{ fontWeight: 900, fontSize: '1.4rem', color: C.neonCyan }}>{wpm} WPM • {accuracy}%</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={handleReset} style={{ padding: '10px 20px', background: C.neonCyan, color: C.onAccent, border: 'none', borderRadius: 8, fontWeight: 900, cursor: 'pointer' }}>Replay</button>
                  <button onClick={handleNext} style={{ padding: '10px 20px', background: C.surfaceHi, color: C.text, border: `1px solid ${C.borderHi}`, borderRadius: 8, cursor: 'pointer' }}>Next →</button>
                </div>
              </div>
            )}
          </div>

          <textarea aria-label="Typing practice input" ref={textareaRef} value={userInput} onChange={e => setUserInput(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} disabled={gameState === 'finished'} placeholder="Start typing..." autoComplete="off" spellCheck={false} style={{ width: '100%', minHeight: 140, padding: 16, marginTop: 16, border: `1px solid ${isFocused? C.neonCyan : C.border}`, background: C.surfaceCard, color: C.text, fontFamily: 'monospace', outline: 'none', borderRadius: 12, resize: 'vertical' }} />

          <div style={{ height: 8, background: C.surface, borderRadius: 6, marginTop: 14, overflow: 'hidden', border: `1px solid ${C.border}` }}><div style={{ height: '100%', width: `${Math.min(100, (correctChars / Math.max(1, target.length)) * 100)}%`, background: C.neonCyan }} /></div>
        </main>
      </div>
    </div>
  );
}
