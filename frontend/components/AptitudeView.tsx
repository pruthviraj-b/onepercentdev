'use client';

import React, { useState, useEffect, useRef } from 'react';
import { submitAptitudeScore, pingStreak } from '@/lib/taskApi';

interface Question {
  id: number;
  category: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  { id:1, category:'Logic', q:'If all roses are flowers and some flowers fade quickly, which must be true?', options:['All roses fade quickly','Some roses may fade quickly','No roses fade quickly','All flowers are roses'], answer:1, explanation:'We know all roses are flowers. Some flowers fade quickly. So some roses (being flowers) may fade quickly — but not necessarily all.' },
  { id:2, category:'Numbers', q:'What comes next: 2, 6, 12, 20, 30, ?', options:['40','42','44','46'], answer:1, explanation:'Differences: 4,6,8,10,12. Next term: 30+12=42.' },
  { id:3, category:'Python', q:'What is the output of: print(type(3/2))?', options:['<class int>','<class float>','<class number>','Error'], answer:1, explanation:'In Python 3, / always returns float. 3/2 = 1.5, which is a float.' },
  { id:4, category:'Cloud', q:'Which AWS service is used to store static files like images and HTML?', options:['EC2','RDS','S3','Lambda'], answer:2, explanation:'Amazon S3 (Simple Storage Service) is designed for object storage — ideal for static files, backups, and media.' },
  { id:5, category:'Logic', q:'A is taller than B. B is taller than C. Who is the shortest?', options:['A','B','C','Cannot determine'], answer:2, explanation:'A > B > C, so C is shortest.' },
  { id:6, category:'Numbers', q:'If 5 workers build a wall in 12 days, how many days for 3 workers?', options:['15','18','20','25'], answer:2, explanation:'Total work = 5×12=60 worker-days. 3 workers: 60/3=20 days.' },
  { id:7, category:'Python', q:'What does len([1, [2, 3], 4]) return?', options:['4','3','2','Error'], answer:1, explanation:'The list has 3 top-level elements: 1, [2,3], 4. len() counts top-level items only.' },
  { id:8, category:'Cloud', q:'What is the main purpose of a Load Balancer?', options:['Store data','Distribute traffic across servers','Run serverless functions','Monitor CPU usage'], answer:1, explanation:'A load balancer distributes incoming network traffic across multiple servers to ensure no single server is overwhelmed.' },
  { id:9, category:'Logic', q:'Some managers are engineers. All engineers are graduates. Therefore:', options:['All managers are graduates','Some managers are graduates','No managers are graduates','All graduates are managers'], answer:1, explanation:'Since some managers are engineers, and all engineers are graduates, those manager-engineers are also graduates — so some managers are graduates.' },
  { id:10, category:'Numbers', q:'What is 15% of 240?', options:['30','32','36','40'], answer:2, explanation:'15% of 240 = (15/100) × 240 = 0.15 × 240 = 36.' },
  { id:11, category:'Python', q:'What is the result of "hello"[1:4]?', options:['"hello"','"ell"','"hel"','"ello"'], answer:1, explanation:'Slicing [1:4] starts at index 1 (e) and stops before index 4 (o). Result: "ell".' },
  { id:12, category:'Cloud', q:'What does "IaaS" stand for?', options:['Internet as a Service','Infrastructure as a Service','Integration as a Service','Intelligence as a Service'], answer:1, explanation:'IaaS = Infrastructure as a Service. It provides virtualized computing resources over the internet (servers, storage, networking).' },
  { id:13, category:'Logic', q:'BCEF : DFGI :: JKNO : ?', options:['LMPQ','LMOP','LNPQ','MNOP'], answer:0, explanation:'Pattern: each letter moves +2,+2,+1,+2. Apply to JKNO: L,M,P,Q = LMPQ.' },
  { id:14, category:'Numbers', q:'Train travels 360km in 4 hours. Speed in m/s?', options:['20','25','30','22'], answer:1, explanation:'Speed = 360/4 = 90 km/h. Convert: 90 × (1000/3600) = 25 m/s.' },
  { id:15, category:'Python', q:'Which of these creates a set?', options:['set = [1,2,3]','set = (1,2,3)','set = {1,2,3}','set = <1,2,3>'], answer:2, explanation:'{1,2,3} creates a set literal in Python. [] is a list, () is a tuple.' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Logic: '#6c5ce7', Numbers: '#00b894', Python: '#f1be3e', Cloud: '#0984e3',
};

interface AptitudeViewProps { onBack: () => void; }
type Phase = 'menu' | 'quiz' | 'results';

export function AptitudeView({ onBack }: AptitudeViewProps) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [category, setCategory] = useState<string>('All');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const categories = ['All', ...Array.from(new Set(QUESTIONS.map(q => q.category)))];

  const startQuiz = () => {
    const pool = category === 'All' ? QUESTIONS : QUESTIONS.filter(q => q.category === category);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setAnswers(new Array(shuffled.length).fill(null));
    setCurrent(0);
    setSelected(null);
    setTimeLeft(shuffled.length * 30);
    startTimeRef.current = Date.now();
    setPhase('quiz');
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); finishQuiz(shuffled, []);  return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const finishQuiz = (qs: Question[], ans: (number | null)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const score = qs.filter((q, i) => ans[i] === q.answer).length;
    setTotalTime(timeTaken);
    submitAptitudeScore(category, score, qs.length, timeTaken);
    pingStreak();
    setPhase('results');
  };

  const handleSelect = (optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    const newAnswers = [...answers];
    newAnswers[current] = optIdx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(answers[current + 1] ?? null);
    } else {
      finishQuiz(questions, answers);
    }
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  // ── NAV BAR ──
  const NavBar = () => (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100, height: '54px',
      background: '#f1be3e', borderBottom: '3px solid #000',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', boxShadow: '0 3px 0 #000',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: 800, padding: '3px 10px', background: '#000', color: '#f1be3e', border: '2px solid #000' }}>1%</span>
        <span style={{ fontWeight: 800, color: '#000', textTransform: 'uppercase' }}>Dev Academy</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#000', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: '4px' }}>/ Aptitude Tests</span>
      </div>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: '6px', background: '#000', color: '#f1be3e',
        border: '2px solid #000', boxShadow: '2px 2px 0 rgba(0,0,0,0.3)', padding: '5px 14px',
        fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase',
      }}>← Home</button>
    </nav>
  );

  const wrap = (children: React.ReactNode) => (
    <div style={{ background: '#f4f1ea', backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1.5px, transparent 1.5px)', backgroundSize: '16px 16px', minHeight: '100vh', fontFamily: 'var(--font-ui)' }}>
      <NavBar />
      <div style={{ padding: '32px 24px', maxWidth: '780px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {children}
      </div>
    </div>
  );

  // ── MENU ──
  if (phase === 'menu') return wrap(
    <>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 8px' }}>🧠 Aptitude Tests</h1>
      <p style={{ color: '#555', fontFamily: 'var(--font-content)', fontSize: '0.95rem', marginBottom: '28px' }}>
        Test your logical reasoning, numerical ability, Python knowledge, and cloud concepts.
      </p>
      <div style={{ background: '#fff', border: '3px solid #000', boxShadow: '6px 6px 0 #000', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ background: '#f1be3e', borderBottom: '2px solid #000', padding: '12px 20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Choose Category
        </div>
        <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '10px 20px', border: '2px solid #000', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem',
              background: category === cat ? '#000' : '#ffffff',
              color: category === cat ? '#f1be3e' : '#000',
              boxShadow: category === cat ? 'none' : '3px 3px 0 #000',
              transform: category === cat ? 'translate(3px,3px)' : 'none',
              textTransform: 'uppercase',
            }}>{cat}</button>
          ))}
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ background: '#f4f1ea', border: '2px solid #000', padding: '14px', marginBottom: '20px', fontSize: '0.88rem', lineHeight: 1.6 }}>
            📋 <strong>10 questions</strong> · <strong>30 seconds</strong> each · Explanation shown after each answer
          </div>
          <button onClick={startQuiz} style={{
            padding: '12px 32px', background: '#000', color: '#f1be3e', border: '2px solid #000',
            boxShadow: '4px 4px 0 #000', fontFamily: 'var(--font-ui)', fontWeight: 900,
            fontSize: '1rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>Start Quiz →</button>
        </div>
      </div>
    </>
  );

  // ── QUIZ ──
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[current];
    const catColor = CATEGORY_COLORS[q.category] || '#000';
    const pct = Math.round(((current + (selected !== null ? 1 : 0)) / questions.length) * 100);
    const timerPct = (timeLeft / (questions.length * 30)) * 100;
    return wrap(
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem' }}>Question {current + 1} / {questions.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: catColor, color: '#fff', padding: '3px 10px', fontWeight: 700, fontSize: '0.78rem', border: '2px solid #000', textTransform: 'uppercase' }}>{q.category}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1rem', color: timeLeft < 10 ? '#cc0000' : '#000' }}>⏱ {timeLeft}s</span>
          </div>
        </div>
        {/* Timer bar */}
        <div style={{ height: '8px', background: '#f4f1ea', border: '2px solid #000', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${timerPct}%`, background: timeLeft < 10 ? '#ff4444' : '#f1be3e', transition: 'width 1s linear' }} />
        </div>
        {/* Progress */}
        <div style={{ height: '6px', background: '#f4f1ea', border: '2px solid #000', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#000', transition: 'width 300ms' }} />
        </div>

        <div style={{ background: '#fff', border: '3px solid #000', boxShadow: '6px 6px 0 #000', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ padding: '24px 24px 20px', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.6, fontFamily: 'var(--font-content)', borderBottom: '2px solid #000' }}>
            {q.q}
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options.map((opt, i) => {
              let bg = '#ffffff', border = '2px solid #000', color = '#000', shadow = '2px 2px 0 #000';
              if (selected !== null) {
                if (i === q.answer) { bg = '#d4edda'; border = '2px solid #28a745'; color = '#000'; shadow = 'none'; }
                else if (i === selected && selected !== q.answer) { bg = '#f8d7da'; border = '2px solid #cc0000'; color = '#cc0000'; shadow = 'none'; }
                else { bg = '#f4f1ea'; shadow = 'none'; color = '#888'; }
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null} style={{
                  padding: '12px 18px', background: bg, border, color, boxShadow: shadow,
                  fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.9rem', cursor: selected !== null ? 'default' : 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 80ms',
                }}>
                  <span style={{ width: '22px', height: '22px', border: `2px solid ${color || '#000'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, flexShrink: 0 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {selected !== null && i === q.answer && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✓</span>}
                  {selected !== null && i === selected && selected !== q.answer && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✗</span>}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <div style={{ background: '#fffbef', borderTop: '2px solid #000', padding: '14px 24px', fontSize: '0.88rem', lineHeight: 1.6, fontFamily: 'var(--font-content)' }}>
              💡 <strong>Explanation:</strong> {q.explanation}
            </div>
          )}
        </div>
        {selected !== null && (
          <button onClick={handleNext} style={{
            padding: '12px 32px', background: '#000', color: '#f1be3e', border: '2px solid #000',
            boxShadow: '4px 4px 0 #000', fontFamily: 'var(--font-ui)', fontWeight: 900,
            fontSize: '1rem', cursor: 'pointer', textTransform: 'uppercase',
          }}>
            {current < questions.length - 1 ? 'Next Question →' : 'See Results →'}
          </button>
        )}
      </>
    );
  }

  // ── RESULTS ──
  const pct = Math.round((score / questions.length) * 100);
  const badge = pct === 100 ? '🏆 Perfect!' : pct >= 80 ? '🎖️ Excellent' : pct >= 60 ? '👍 Good' : '💪 Keep Practicing';
  return wrap(
    <>
      <div style={{ background: '#fff', border: '3px solid #000', boxShadow: '8px 8px 0 #000', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ background: '#f1be3e', borderBottom: '2px solid #000', padding: '16px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{badge.split(' ')[0]}</div>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>{badge.split(' ').slice(1).join(' ')}</div>
        </div>
        <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', textAlign: 'center' }}>
          {[
            { label: 'Score', value: `${score}/${questions.length}`, emoji: '🎯' },
            { label: 'Accuracy', value: `${pct}%`, emoji: '📊' },
            { label: 'Time', value: `${totalTime}s`, emoji: '⏱️' },
          ].map(s => (
            <div key={s.label} style={{ border: '2px solid #000', padding: '16px', boxShadow: '3px 3px 0 #000' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{s.emoji}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', fontWeight: 700, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '2px solid #000', padding: '20px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={startQuiz} style={{ padding: '10px 24px', background: '#000', color: '#f1be3e', border: '2px solid #000', boxShadow: '3px 3px 0 #000', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase' }}>Try Again</button>
          <button onClick={() => setPhase('menu')} style={{ padding: '10px 24px', background: '#f4f1ea', border: '2px solid #000', boxShadow: '3px 3px 0 #000', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase' }}>← Menu</button>
        </div>
      </div>
      {/* Answer review */}
      <div style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Answer Review</div>
      {questions.map((q, i) => {
        const correct = answers[i] === q.answer;
        return (
          <div key={q.id} style={{ background: '#fff', border: '2px solid #000', marginBottom: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #e0e0e0', background: correct ? '#d4edda' : '#f8d7da' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem' }}>Q{i + 1}</span>
              <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600 }}>{q.q}</span>
              <span style={{ fontSize: '1.1rem' }}>{correct ? '✓' : '✗'}</span>
            </div>
            <div style={{ padding: '8px 16px', fontSize: '0.82rem', color: '#555', fontFamily: 'var(--font-content)', lineHeight: 1.5 }}>
              <strong>Your answer:</strong> {answers[i] !== null ? q.options[answers[i]!] : 'Not answered'} &nbsp;|&nbsp;
              <strong>Correct:</strong> {q.options[q.answer]}
            </div>
          </div>
        );
      })}
    </>
  );
}
