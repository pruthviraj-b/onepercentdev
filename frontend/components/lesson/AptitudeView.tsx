'use client';

import React, { useState, useEffect, useRef } from 'react';
import { submitAptitudeScore, pingStreak } from '@/services/learningService';

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
const C = {
  bg:        '#FFFFFF',
  surface:   '#FFFFFF',
  surfaceHi: '#FFFFFF',
  border:    '#E5E7EB',
  borderHi:  '#1F2937',
  text:      '#1F2937',
  textDim:   '#6B7280',
  textFaint: '#9CA3AF',
  cyan:      '#F98012',
  cyanDim:   'rgba(255,104,66,0.13)',
  violet:    '#776C86',
  violetDim: 'rgba(119,108,134,0.12)',
  green:     '#22C55E',
  greenDim:  'rgba(45,150,117,0.12)',
  amber:     '#F59E0B',
  red:       '#EF4444',
  onAccent:  '#FFFFFF',
};

// ─────────────────────────────────────────────
// DATA — questions mapped to the new curriculum tiers
// Categories: Quant (Tier 1-2), Logical (Tier 3), DI (Tier 5),
// Verbal (Tier 6), Business (Tier 7)
// ─────────────────────────────────────────────
interface Question {
  id: number;
  category: string;
  tier: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Quant: C.cyan,
  Logical: C.violet,
  DI: C.green,
  Verbal: C.amber,
  Business: C.red,
};

const QUESTIONS: Question[] = [
  // ── Quant (Tier 1 & 2) ──
  { id: 1, category: 'Quant', tier: 'Percentages', q: 'What is 15% of 240?', options: ['30', '32', '36', '40'], answer: 2, explanation: '15% of 240 = (15/100) × 240 = 36.' },
  { id: 2, category: 'Quant', tier: 'Time & Work', q: 'If 5 workers build a wall in 12 days, how many days for 3 workers?', options: ['15', '18', '20', '25'], answer: 2, explanation: 'Total work = 5×12 = 60 worker-days. 3 workers: 60/3 = 20 days.' },
  { id: 3, category: 'Quant', tier: 'Time, Speed & Distance', q: 'A train travels 360km in 4 hours. Speed in m/s?', options: ['20', '25', '30', '22'], answer: 1, explanation: 'Speed = 360/4 = 90 km/h → 90 × (1000/3600) = 25 m/s.' },
  { id: 4, category: 'Quant', tier: 'Progressions', q: 'What comes next: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], answer: 1, explanation: 'Differences: 4,6,8,10,12 → next term 30+12 = 42.' },
  { id: 5, category: 'Quant', tier: 'Simple/Compound Interest', q: 'Find SI on ₹8000 at 5% p.a. for 3 years.', options: ['₹1000', '₹1200', '₹1400', '₹1500'], answer: 1, explanation: 'SI = (P×R×T)/100 = (8000×5×3)/100 = ₹1200.' },
  { id: 6, category: 'Quant', tier: 'Ratio & Proportion', q: 'Divide ₹720 among A, B, C in ratio 2:3:4. Find B\'s share.', options: ['₹160', '₹200', '₹240', '₹320'], answer: 2, explanation: 'Total parts = 9. B\'s share = (3/9)×720 = ₹240.' },

  // ── Logical Reasoning (Tier 3) ──
  { id: 7, category: 'Logical', tier: 'Syllogisms', q: 'All roses are flowers. Some flowers fade quickly. Which must be true?', options: ['All roses fade quickly', 'Some roses may fade quickly', 'No roses fade quickly', 'All flowers are roses'], answer: 1, explanation: 'Roses are a subset of flowers; since some flowers fade quickly, some roses may too — not a guarantee for all.' },
  { id: 8, category: 'Logical', tier: 'Blood Relations', q: 'A is taller than B. B is taller than C. Who is shortest?', options: ['A', 'B', 'C', 'Cannot determine'], answer: 2, explanation: 'A > B > C, so C is shortest.' },
  { id: 9, category: 'Logical', tier: 'Coding-Decoding', q: 'BCEF : DFGI :: JKNO : ?', options: ['LMPQ', 'LMOP', 'LNPQ', 'MNOP'], answer: 0, explanation: 'Each letter shifts by +2,+2,+1,+2. Applying to JKNO gives LMPQ.' },
  { id: 10, category: 'Logical', tier: 'Direction Sense', q: 'Facing north, you turn 90° clockwise, then 180°. Which direction do you face?', options: ['North', 'South', 'East', 'West'], answer: 3, explanation: '90° clockwise from North = East. Another 180° turn = West.' },
  { id: 11, category: 'Logical', tier: 'Statement & Assumption', q: 'Statement: "Buy now, offer ends soon." Assumption: The offer is genuinely limited.', options: ['Assumption is implicit', 'Assumption is stated', 'No assumption made', 'Statement is false'], answer: 0, explanation: 'The urgency framing implies (assumes) the offer really is limited, without stating it outright.' },
  { id: 12, category: 'Logical', tier: 'Series', q: 'Find the missing number: 3, 9, 27, ?, 243', options: ['54', '81', '90', '108'], answer: 1, explanation: 'Each term ×3: 3,9,27,81,243.' },

  // ── Data Interpretation (Tier 5) ──
  { id: 13, category: 'DI', tier: 'Tabular DI', q: 'Sales (units): Jan-100, Feb-150, Mar-120. What is the % growth from Jan to Feb?', options: ['30%', '40%', '50%', '60%'], answer: 2, explanation: 'Growth = (150-100)/100 × 100 = 50%.' },
  { id: 14, category: 'DI', tier: 'Pie Chart DI', q: 'A pie chart shows Marketing = 90°. What % of the total budget is Marketing?', options: ['15%', '20%', '25%', '30%'], answer: 2, explanation: '90° out of 360° = 90/360 = 25%.' },
  { id: 15, category: 'DI', tier: 'Bar Graph DI', q: 'If Product X sold 200 units in Q1 and 250 in Q2, what is the absolute increase?', options: ['30', '40', '50', '60'], answer: 2, explanation: 'Increase = 250 - 200 = 50 units.' },
  { id: 16, category: 'DI', tier: 'Caselets', q: 'A company\'s revenue doubled every year for 3 years starting at ₹5L. What is year-3 revenue?', options: ['₹15L', '₹20L', '₹40L', '₹35L'], answer: 2, explanation: 'Starting at ₹5L: after year 1 = ₹10L, year 2 = ₹20L, year 3 = ₹40L (three doublings).' },
  { id: 17, category: 'DI', tier: 'Line Graph DI', q: 'A line graph shows temperature rising steadily from 20°C to 35°C over 5 hours. Average rate of increase per hour?', options: ['2°C', '3°C', '4°C', '5°C'], answer: 1, explanation: '(35-20)/5 = 3°C per hour.' },

  // ── Verbal Ability (Tier 6) ──
  { id: 18, category: 'Verbal', tier: 'Synonyms', q: 'Choose the synonym for "Meticulous":', options: ['Careless', 'Precise', 'Fast', 'Loud'], answer: 1, explanation: '"Meticulous" means showing great attention to detail — closest to "Precise."' },
  { id: 19, category: 'Verbal', tier: 'Antonyms', q: 'Choose the antonym for "Abundant":', options: ['Plentiful', 'Scarce', 'Huge', 'Rich'], answer: 1, explanation: '"Abundant" means plentiful; its opposite is "Scarce."' },
  { id: 20, category: 'Verbal', tier: 'Error Spotting', q: 'Which sentence is grammatically correct?', options: ['He don\'t like tea.', 'He doesn\'t likes tea.', 'He doesn\'t like tea.', 'He not like tea.'], answer: 2, explanation: 'Correct subject-verb agreement with "doesn\'t" requires the base form "like."' },
  { id: 21, category: 'Verbal', tier: 'One-word Substitution', q: 'A person who talks a lot is called:', options: ['Loquacious', 'Taciturn', 'Reticent', 'Laconic'], answer: 0, explanation: '"Loquacious" describes someone who talks excessively.' },

  // ── DA-Specific Business & Statistical Reasoning (Tier 7) ──
  { id: 22, category: 'Business', tier: 'Weighted Average', q: 'A student scores 80 in a test worth 30% weight and 60 in one worth 70% weight. Weighted average?', options: ['64', '66', '68', '70'], answer: 1, explanation: 'Weighted avg = 0.3×80 + 0.7×60 = 24 + 42 = 66.' },
  { id: 23, category: 'Business', tier: 'Guesstimates', q: 'Estimating market size for umbrellas in a city, which factor matters LEAST?', options: ['Population', 'Rainfall pattern', 'Average umbrella lifespan', 'Favorite umbrella color'], answer: 3, explanation: 'Color preference has negligible impact on market-size estimation compared to population, rainfall, and product lifespan.' },
  { id: 24, category: 'Business', tier: 'Correlation vs Causation', q: 'Ice cream sales and drowning incidents both rise in summer. This means:', options: ['Ice cream causes drowning', 'Drowning causes ice cream sales', 'Both are correlated via a third factor (heat)', 'No relationship exists'], answer: 2, explanation: 'Classic correlation-causation trap — both rise due to summer heat, not because one causes the other.' },
  { id: 25, category: 'Business', tier: 'Set Theory (Business)', q: 'In a survey of 100 people, 60 like tea, 50 like coffee, 20 like both. How many like neither?', options: ['5', '10', '15', '20'], answer: 1, explanation: 'Union = 60+50-20 = 90. Neither = 100-90 = 10.' },
];

// ─────────────────────────────────────────────
// ROADMAP DATA — full curriculum, tier by tier
// ─────────────────────────────────────────────
interface Tier {
  id: string;
  title: string;
  note?: string;
  topics: string[];
  accent: string;
}

const ROADMAP_TIERS: Tier[] = [
  {
    id: 't1', title: 'Tier 1 — Quantitative Aptitude: Number & Arithmetic Basics', accent: C.cyan,
    topics: ['Number System (LCM, HCF, divisibility rules, remainders)', 'Simplification & Approximation (BODMAS)', 'Surds & Indices', 'Percentages', 'Profit & Loss', 'Simple Interest', 'Compound Interest', 'Ratio & Proportion', 'Average', 'Ages (Problems on Ages)', 'Partnership', 'Mixtures & Alligations'],
  },
  {
    id: 't2', title: 'Tier 2 — Quantitative Aptitude: Applied Problem Types', accent: C.cyan,
    topics: ['Time & Work', 'Pipes & Cisterns', 'Time, Speed & Distance', 'Problems on Trains', 'Boats & Streams', 'Races & Games', 'Mensuration — 2D (area, perimeter)', 'Mensuration — 3D (volume, surface area)', 'Linear & Quadratic Equations', 'Progressions (AP, GP)', 'Permutation & Combination', 'Probability', 'Number Series (missing/wrong term)', 'Data Sufficiency (quant-based)', 'Clocks', 'Calendars', 'Logarithms (basics)'],
  },
  {
    id: 't3', title: 'Tier 3 — Logical Reasoning: Verbal', accent: C.violet,
    topics: ['Blood Relations', 'Coding-Decoding', 'Direction Sense', 'Ranking & Order', 'Syllogisms', 'Statement & Assumption', 'Statement & Conclusion', 'Statement & Argument (strong/weak)', 'Course of Action', 'Cause & Effect', 'Analogy', 'Classification (odd one out)', 'Letter / Alpha-numeric Series', 'Mathematical Operations (symbol substitution)', 'Seating Arrangement (linear)', 'Seating Arrangement (circular)', 'Puzzles (box/floor-based)', 'Puzzles (scheduling-based)', 'Logical Venn Diagrams', 'Data Sufficiency (logical)', 'Input-Output Reasoning'],
  },
  {
    id: 't4', title: 'Tier 4 — Logical Reasoning: Non-Verbal', note: 'Lower frequency for IT/DA roles — deprioritize aggressively.', accent: C.textFaint,
    topics: ['Figure Series', 'Mirror & Water Images', 'Embedded Figures', 'Cubes & Dice', 'Paper Folding & Cutting'],
  },
  {
    id: 't5', title: 'Tier 5 — Data Interpretation', note: 'DA-critical — heaviest weight for you.', accent: C.green,
    topics: ['Tabular DI', 'Bar Graph DI', 'Line Graph DI', 'Pie Chart DI', 'Combination Graphs (bar+line, pie+table)', 'Caselets (paragraph-based DI)', 'Missing/Derived Data DI', 'DI-based Data Sufficiency', 'Radar/Spider Chart DI'],
  },
  {
    id: 't6', title: 'Tier 6 — Verbal Ability / English', accent: C.amber,
    topics: ['Reading Comprehension', 'Cloze Test', 'Para Jumbles (sentence rearrangement)', 'Sentence Correction / Grammar', 'Fill in the Blanks', 'Synonyms', 'Antonyms', 'One-word Substitution', 'Idioms & Phrasal Verbs', 'Error Spotting', 'Email / Business Writing'],
  },
  {
    id: 't7', title: 'Tier 7 — DA-Specific Business & Statistical Reasoning', note: 'Your differentiator — worth disproportionate time.', accent: C.red,
    topics: ['Statistical Word Problems (mean/median/mode-based reasoning)', 'Weighted Average Problems', 'Expected Value / Probability in Business Scenarios', 'Guesstimates / Fermi Estimation (market-sizing style)', 'Business Case DI (sales/revenue/funnel tables)', 'Set Theory Numeric Problems (Venn diagrams with real numbers)', 'Ratio-Proportion Applied to Business Metrics', 'Probability Distribution Concepts (normal, binomial — conceptual only)', 'Correlation vs Causation Reasoning Traps', 'Logical Number Grid Puzzles (Einstein-style)'],
  },
  {
    id: 't8', title: 'Tier 8 — Test-Pattern Familiarity', note: 'Practical wrapper — context, not grind material.', accent: C.textDim,
    topics: ['TCS NQT pattern', 'Infosys pattern (pseudocode-heavy + quant + DI)', 'Wipro Elite NTH pattern', 'Capgemini / Cognizant GenC pattern', 'Analytics-firm pattern (Mu Sigma, Fractal, Tiger Analytics, LatentView — guesstimate + stats-heavy rounds)'],
  },
  {
    id: 't9', title: 'Tier 9 — Awareness-Only', note: 'Low frequency for fresher DA specifically.', accent: C.textFaint,
    topics: ['Height & Distance (trigonometry-based)', 'Stocks & Shares', 'Circular Track Races (advanced variant)', 'Advanced P&C (circular arrangement, repetition cases)', 'GRE/CAT-style Critical Reasoning passages (only relevant for analytics-firm case interviews)'],
  },
];

interface AptitudeViewProps { onBack: () => void; }
type Phase = 'landing' | 'roadmap' | 'menu' | 'quiz' | 'results' | 'topic';

export function AptitudeView({ onBack }: AptitudeViewProps) {
  const [phase, setPhase] = useState<Phase>('landing');
  const [category, setCategory] = useState<string>('All');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<{ tier: Tier; topic: string } | null>(null);
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
        if (t <= 1) { clearInterval(timerRef.current!); finishQuiz(shuffled, []); return 0; }
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
    <nav className="aptitude-nav" style={{
      position: 'sticky', top: 0, zIndex: 100, height: '54px',
      background: C.surface, borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', backdropFilter: 'blur(6px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: 800, padding: '3px 10px', background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyan}`, borderRadius: '4px', fontSize: '0.75rem' }}>1%</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: '4px' }}>/ Aptitude Tests</span>
      </div>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: '6px', background: C.surfaceHi, color: C.text,
        border: `1px solid ${C.borderHi}`, borderRadius: '6px', padding: '6px 14px',
        fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase',
      }}>← Home</button>
    </nav>
  );

  const wrap = (children: React.ReactNode) => (
    <div className="aptitude-page" style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-ui)', color: C.text }}>
      <NavBar />
      <div className="aptitude-content" style={{ padding: '32px 24px', maxWidth: '780px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {children}
      </div>
    </div>
  );

  // ── ROADMAP ──
  // Separate blank note records keep every aptitude topic ready for the future reader.
  const aptitudeNotes = Object.fromEntries(ROADMAP_TIERS.flatMap(tier => tier.topics.map(topic => [topic, '']))) as Record<string, string>;

  if (phase === 'landing') return wrap(
    <>
      <section className="aptitude-course-hero">
        <div>
          <div className="aptitude-eyebrow">SEPARATE LEARNING TRACK</div>
          <h1>🧠 Aptitude Tests</h1>
          <p>Build the reasoning, quant, verbal, data interpretation, and business thinking needed for analyst assessments.</p>
          <div className="aptitude-hero-meta"><span>95 topics</span><span>9 tiers</span><span>Practice quizzes</span><span>Notes ready for later</span></div>
        </div>
        <button className="aptitude-hero-action" onClick={() => setPhase('menu')}>Start practice →</button>
      </section>
      <section className="aptitude-course-intro"><strong>How this track works</strong><span>Choose a tier, open any topic, and add notes later without mixing Aptitude into the main Courses catalog.</span></section>
      <div className="aptitude-curriculum-heading"><div><div className="aptitude-eyebrow">CURRICULUM</div><h2>Learning path</h2></div><span>{ROADMAP_TIERS.length} tiers · {ROADMAP_TIERS.reduce((sum, tier) => sum + tier.topics.length, 0)} topics</span></div>
      <div className="aptitude-course-curriculum">
        {ROADMAP_TIERS.map((tier, tierIndex) => (
          <section key={tier.id} className="aptitude-course-module">
            <div className="aptitude-course-module__header">
              <span className="aptitude-module-number">{String(tierIndex + 1).padStart(2, '0')}</span>
              <div><h3>{tier.title.replace(/^Tier \d+\s*[—-]\s*/, '')}</h3>{tier.note && <p>{tier.note}</p>}</div>
              <span className="aptitude-module-count">{tier.topics.length} topics</span>
            </div>
            <div className="aptitude-course-topics">
              {tier.topics.map((topic, topicIndex) => (
                <button key={topic} className="aptitude-course-topic" onClick={() => { setSelectedTopic({ tier, topic }); setPhase('topic'); }}>
                  <span>{tierIndex + 1}.{topicIndex + 1}</span><strong>{topic}</strong><em>Notes →</em>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );

  if (phase === 'topic' && selectedTopic) return wrap(
    <>
      <button className="aptitude-back-link" onClick={() => setPhase('landing')}>← Back to curriculum</button>
      <section className="aptitude-topic-reader">
        <div className="aptitude-eyebrow">{selectedTopic.tier.title}</div>
        <h1>{selectedTopic.topic}</h1>
        <div className="aptitude-empty-notes"><span>NOTES SPACE</span><strong>{aptitudeNotes[selectedTopic.topic] === '' ? 'Notes for this topic are ready to be added.' : aptitudeNotes[selectedTopic.topic]}</strong><p>This topic stays separate from the main Courses catalog. When notes are added later, this reader space will display them here.</p><button onClick={() => setPhase('menu')}>Practice this topic →</button></div>
      </section>
    </>
  );

  if (phase === 'roadmap') return wrap(
    <>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 8px', color: C.text }}>🗺️ Aptitude Roadmap</h1>
      <p style={{ color: C.textDim, fontFamily: 'var(--font-content)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.6 }}>
        95 topics across 9 tiers. "Generic aptitude" is what every fresher test (TCS NQT, Infosys, Wipro) throws at everyone.
        "DA aptitude" — Tiers 5 and 7 especially — is the layer that actually separates a Data Analyst candidate. Most non-DA
        candidates never train these properly.
      </p>

      <div className="aptitude-insight-widget" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', fontSize: '0.86rem', lineHeight: 1.7, color: C.textDim }}>
        <strong style={{ color: C.text }}>Weight distribution:</strong> Tiers 1, 2, 3, and 5 carry almost all the weight — nearly
        every fresher recruiter tests quant, verbal-logical, and DI hard. Tier 4 you can deprioritize. Tier 6 matters specifically
        for TCS NQT-style tests leaning heavy on English. <strong style={{ color: C.red }}>Tier 7 is the actual "DA aptitude"</strong> —
        worth disproportionate time, since it's what a Mu Sigma or Fractal will grill you on that TCS won't. Tiers 8–9 are context,
        not grind material.
      </div>

      {ROADMAP_TIERS.map(tier => (
        <div key={tier.id} className="aptitude-tier-widget" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          <div className="aptitude-tier-header" style={{ background: C.surfaceHi, borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${tier.accent}`, padding: '12px 18px' }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: C.text }}>{tier.title}</div>
            {tier.note && <div style={{ fontSize: '0.76rem', color: tier.accent, marginTop: '3px', fontWeight: 600 }}>{tier.note}</div>}
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tier.topics.map(topic => (
              <span key={topic} className="aptitude-topic-chip" style={{
                fontSize: '0.78rem', padding: '5px 10px', borderRadius: '5px',
                background: C.surfaceHi, border: `1px solid ${C.border}`, color: C.textDim,
              }}>{topic}</span>
            ))}
          </div>
        </div>
      ))}

      <div className="aptitude-warning-widget" style={{ background: C.surfaceHi, border: `1px solid ${C.borderHi}`, borderRadius: '10px', padding: '16px 20px', margin: '24px 0', fontSize: '0.85rem', color: C.textDim, lineHeight: 1.6 }}>
        ⚠️ Exact company test formats (TCS NQT, Infosys, etc.) get revised periodically — cross-check the current year's section
        pattern close to your actual test date. This roadmap covers topics, not the live format.
      </div>

      <button onClick={() => setPhase('menu')} style={{
        padding: '14px 36px', background: C.cyan, color: C.onAccent, border: 'none', borderRadius: '8px',
        fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
        textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: `0 0 20px ${C.cyanDim}`,
      }}>Practice Questions →</button>
    </>
  );

  // ── MENU ──
  if (phase === 'menu') return wrap(
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 8px', color: C.text }}>🧠 Aptitude Tests</h1>
        <button onClick={() => setPhase('landing')} style={{
          background: C.surfaceHi, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: '6px',
          padding: '6px 14px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.78rem',
          cursor: 'pointer', textTransform: 'uppercase',
        }}>← Roadmap</button>
      </div>
      <p style={{ color: C.textDim, fontFamily: 'var(--font-content)', fontSize: '0.95rem', marginBottom: '28px' }}>
        Quant, Logical Reasoning, Data Interpretation, Verbal Ability, and DA-specific Business Reasoning — pulled from the full 95-topic curriculum.
      </p>
      <div className="aptitude-category-widget" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' }}>
        <div className="aptitude-widget-header" style={{ background: C.surfaceHi, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text, fontSize: '0.85rem' }}>
          Choose Category
        </div>
        <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {categories.map(cat => {
            const isActive = category === cat;
            const accent = cat === 'All' ? C.cyan : (CATEGORY_COLORS[cat] || C.cyan);
            return (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.85rem',
                border: `1px solid ${isActive ? accent : C.border}`,
                background: isActive ? `${accent}22` : C.surfaceHi,
                color: isActive ? accent : C.textDim,
                textTransform: 'uppercase', transition: 'all 120ms',
              }}>{cat}</button>
            );
          })}
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div className="aptitude-info-widget" style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px', marginBottom: '20px', fontSize: '0.88rem', lineHeight: 1.6, color: C.textDim }}>
            📋 <strong style={{ color: C.text }}>10 questions</strong> · <strong style={{ color: C.text }}>30 seconds</strong> each · Explanation shown after each answer
          </div>
          <button onClick={startQuiz} style={{
            padding: '12px 32px', background: C.cyan, color: C.onAccent, border: 'none', borderRadius: '8px',
            fontFamily: 'var(--font-ui)', fontWeight: 900,
            fontSize: '1rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
            boxShadow: `0 0 20px ${C.cyanDim}`,
          }}>Start Quiz →</button>
        </div>
      </div>
    </>
  );

  // ── QUIZ ──
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[current];
    const catColor = CATEGORY_COLORS[q.category] || C.cyan;
    const pct = Math.round(((current + (selected !== null ? 1 : 0)) / questions.length) * 100);
    const timerPct = (timeLeft / (questions.length * 30)) * 100;
    return wrap(
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: C.textDim }}>Question {current + 1} / {questions.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: `${catColor}22`, color: catColor, padding: '3px 10px', fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${catColor}`, borderRadius: '4px', textTransform: 'uppercase' }}>{q.category}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1rem', color: timeLeft < 10 ? C.red : C.text }}>⏱ {timeLeft}s</span>
          </div>
        </div>
        {/* Timer bar */}
        <div style={{ height: '6px', background: C.surfaceHi, borderRadius: '4px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${timerPct}%`, background: timeLeft < 10 ? C.red : C.amber, transition: 'width 1s linear' }} />
        </div>
        {/* Progress */}
        <div style={{ height: '4px', background: C.surfaceHi, borderRadius: '4px', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: C.cyan, transition: 'width 300ms' }} />
        </div>

        <div className="aptitude-question-widget" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
          <div className="aptitude-question-header" style={{ padding: '24px 24px 20px', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.6, fontFamily: 'var(--font-content)', borderBottom: `1px solid ${C.border}`, color: C.text }}>
            <span style={{ fontSize: '0.7rem', color: C.textFaint, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{q.tier}</span>
            {q.q}
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options.map((opt, i) => {
              let bg = C.surfaceHi, border = C.border, color = C.text;
              if (selected !== null) {
                if (i === q.answer) { bg = C.greenDim; border = C.green; color = C.green; }
                else if (i === selected && selected !== q.answer) { bg = 'rgba(240,113,108,0.14)'; border = C.red; color = C.red; }
                else { bg = C.surface; border = C.border; color = C.textFaint; }
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null} style={{
                  padding: '12px 18px', background: bg, border: `1px solid ${border}`, color, borderRadius: '8px',
                  fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.9rem', cursor: selected !== null ? 'default' : 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 100ms',
                }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '5px', border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 900, flexShrink: 0 }}>
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
            <div className="aptitude-explanation-widget" style={{ background: C.violetDim, borderTop: `1px solid ${C.border}`, padding: '14px 24px', fontSize: '0.88rem', lineHeight: 1.6, fontFamily: 'var(--font-content)', color: C.text }}>
              💡 <strong style={{ color: C.violet }}>Explanation:</strong> {q.explanation}
            </div>
          )}
        </div>
        {selected !== null && (
          <button onClick={handleNext} style={{
            padding: '12px 32px', background: C.cyan, color: C.onAccent, border: 'none', borderRadius: '8px',
            fontFamily: 'var(--font-ui)', fontWeight: 900,
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
      <div className="aptitude-results-widget" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
        <div className="aptitude-widget-header" style={{ background: C.surfaceHi, borderBottom: `1px solid ${C.border}`, padding: '16px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{badge.split(' ')[0]}</div>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', color: C.text }}>{badge.split(' ').slice(1).join(' ')}</div>
        </div>
        <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', textAlign: 'center' }}>
          {[
            { label: 'Score', value: `${score}/${questions.length}`, emoji: '🎯' },
            { label: 'Accuracy', value: `${pct}%`, emoji: '📊' },
            { label: 'Time', value: `${totalTime}s`, emoji: '⏱️' },
          ].map(s => (
            <div key={s.label} className="aptitude-stat-widget" style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px', background: C.surfaceHi }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{s.emoji}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900, color: C.cyan }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textDim, fontWeight: 700, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={startQuiz} style={{ padding: '10px 24px', background: C.cyan, color: C.onAccent, border: 'none', borderRadius: '6px', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase' }}>Try Again</button>
          <button onClick={() => setPhase('menu')} style={{ padding: '10px 24px', background: C.surfaceHi, color: C.text, border: `1px solid ${C.borderHi}`, borderRadius: '6px', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase' }}>← Menu</button>
        </div>
      </div>
      {/* Answer review */}
      <div style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em', color: C.text }}>Answer Review</div>
      {questions.map((q, i) => {
        const correct = answers[i] === q.answer;
        return (
          <div key={q.id} className="aptitude-review-widget" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
            <div className="aptitude-review-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: correct ? C.greenDim : 'rgba(240,113,108,0.14)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem', color: correct ? C.green : C.red }}>Q{i + 1}</span>
              <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600, color: C.text }}>{q.q}</span>
              <span style={{ fontSize: '1.1rem' }}>{correct ? '✓' : '✗'}</span>
            </div>
            <div style={{ padding: '8px 16px', fontSize: '0.82rem', color: C.textDim, fontFamily: 'var(--font-content)', lineHeight: 1.5 }}>
              <strong style={{ color: C.text }}>Your answer:</strong> {answers[i] !== null ? q.options[answers[i]!] : 'Not answered'} &nbsp;|&nbsp;
              <strong style={{ color: C.text }}>Correct:</strong> {q.options[q.answer]}
            </div>
          </div>
        );
      })}
    </>
  );
}
