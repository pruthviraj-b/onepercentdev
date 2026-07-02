'use client';

import { useState, useMemo, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Course, Module, fetchStreak, StreakData } from '@/lib/api';
import { createTask, tomorrowStr } from '@/lib/smartTaskApi';

interface Props {
  courses: Course[];
  activeCourseId: string | null;
  onSelectCourse: (courseId: string) => void;
  onChangeCourse: () => void;
  modules: Module[];
  completedParts: number[];
  progressPct: number;
  completedCount: number;
  totalParts: number;
  booting: boolean;
  onLaunch: () => void;
  onSelectPart: (part: number) => void;
}

// ── Hidden courses — not shown in UI but kept in config ──────────────────────
const HIDDEN_COURSE_IDS = ['data-analyst', 'data-analyst-en'];

function isHiddenCourse(courseId: string) {
  return HIDDEN_COURSE_IDS.includes(courseId);
}

function shouldShowAsRootCourse(course: Course) {
  return !isHiddenCourse(course.id) && (!course.parentId || isHiddenCourse(course.parentId));
}

// ── Course metadata keyed by courseId ────────────────────────────
const COURSE_META: Record<string, {
  difficulty: string;
  language: string;
  lastUpdated: string;
  enrolled: string;
  rating: number;
  ratingCount: string;
  duration: string;
  whatYouLearn: string[];
  skills: string[];
  requirements: string[];
  careerOutcomes: string[];
  projects: { title: string; desc: string; icon: string }[];
  tools: { name: string; icon: string; category: string }[];
  roadmapSteps: { label: string; icon: string; desc: string }[];
  faqs: { q: string; a: string }[];
  reviews: { name: string; initials: string; rating: number; date: string; text: string }[];
}> = {
  'data-analyst-en': {
    difficulty: 'Beginner to Advanced',
    language: 'English',
    lastUpdated: 'June 2025',
    enrolled: '',
    rating: 0,
    ratingCount: '',
    duration: '80+ hours',
    whatYouLearn: [
      'Perform descriptive, diagnostic, predictive & prescriptive analytics',
      'Master Excel: VLOOKUP, Pivot Tables, advanced functions & charting',
      'Write SQL queries for real-world database analysis',
      'Manipulate and clean data using Python & Pandas',
      'Build stunning visualizations with Matplotlib, Seaborn & Tableau',
      'Apply statistical analysis: hypothesis testing, regression, correlation',
      'Understand Machine Learning fundamentals for data analysts',
      'Work with Big Data technologies: Hadoop, Spark, MapReduce',
      'Build a professional portfolio with 2+ capstone projects',
    ],
    skills: ['SQL', 'Python', 'Pandas', 'Excel', 'Tableau', 'Power BI', 'Statistics', 'Data Visualization', 'Machine Learning Basics', 'Big Data'],
    requirements: [
      'No prior programming experience needed',
      'Basic computer literacy (files, folders, spreadsheets)',
      'A laptop with internet connection',
      'Curiosity and willingness to practice daily',
    ],
    careerOutcomes: [
      'Data Analyst', 'Business Intelligence Analyst', 'SQL Developer',
      'Python Data Engineer', 'Reporting Analyst', 'Data Scientist (Junior)',
    ],
    projects: [
      { title: 'Sales Trend Forecasting', desc: 'Analyze 2 years of sales data, identify seasonality, and forecast next quarter.', icon: '📈' },
      { title: 'Customer Segmentation', desc: 'Use K-Means clustering to segment 10,000 customers and build a Tableau dashboard.', icon: '👥' },
    ],
    tools: [
      { name: 'Python', icon: '🐍', category: 'Language' },
      { name: 'SQL', icon: '🗄️', category: 'Language' },
      { name: 'R', icon: '📊', category: 'Language' },
      { name: 'Excel', icon: '📋', category: 'Tool' },
      { name: 'Pandas', icon: '🐼', category: 'Library' },
      { name: 'Matplotlib', icon: '📉', category: 'Library' },
      { name: 'Seaborn', icon: '🌊', category: 'Library' },
      { name: 'Tableau', icon: '🔵', category: 'Tool' },
      { name: 'Power BI', icon: '⚡', category: 'Tool' },
      { name: 'Scikit-learn', icon: '🤖', category: 'Library' },
      { name: 'Hadoop', icon: '🐘', category: 'Big Data' },
      { name: 'Spark', icon: '✨', category: 'Big Data' },
    ],
    roadmapSteps: [
      { label: 'Foundations', icon: '🏗️', desc: 'What is Data Analytics, Types, Key Concepts' },
      { label: 'Excel Mastery', icon: '📋', desc: 'Functions, Pivot Tables, Charts, Reporting' },
      { label: 'SQL & Databases', icon: '🗄️', desc: 'Queries, Joins, Aggregations, Data Storage' },
      { label: 'Python & Pandas', icon: '🐍', desc: 'Data manipulation, cleanup, transformation' },
      { label: 'Data Visualization', icon: '📊', desc: 'Matplotlib, Seaborn, Tableau, Power BI' },
      { label: 'Statistics', icon: '📐', desc: 'Hypothesis Testing, Regression, Correlation' },
      { label: 'Machine Learning', icon: '🤖', desc: 'Supervised, Unsupervised, Model Evaluation' },
      { label: 'Big Data', icon: '🐘', desc: 'Hadoop, Spark, MapReduce, Parallel Processing' },
      { label: 'Capstone Projects', icon: '🚀', desc: 'Build portfolio, Kaggle competitions' },
      { label: 'Certificate', icon: '🎓', desc: 'Complete and earn your Data Analyst certificate' },
    ],
    faqs: [
      { q: 'Do I need coding experience to start?', a: 'No. This course starts from absolute basics. We cover Excel and SQL before introducing Python.' },
      { q: 'How long does it take to complete?', a: 'At 1 hour per day, expect 2–3 months. The course is self-paced so you go at your own speed.' },
      { q: 'Will I get a certificate?', a: 'Yes. Upon completing all modules you receive a 1% Developer Academy certificate of completion.' },
      { q: 'Is this course updated regularly?', a: 'Yes. Content is reviewed and updated to reflect current industry tools and practices.' },
      { q: 'Can I get a job after this course?', a: 'This course covers everything required for entry-level and mid-level Data Analyst roles. Projects and portfolio work are emphasized.' },
    ],
    reviews: [],
  },
  'data-analyst-te': {
    difficulty: 'Beginner to Advanced',
    language: 'Telugu',
    lastUpdated: 'June 2025',
    enrolled: '',
    rating: 0,
    ratingCount: '',
    duration: '70+ hours',
    whatYouLearn: [
      'Understand types of analytics: Descriptive, Diagnostic, Predictive, Prescriptive',
      'Master Excel functions: VLOOKUP, IF, DATEDIF, Pivot Tables',
      'Write SQL from beginner to advanced level',
      'Use Python & Pandas for data manipulation and cleanup',
      'Create visualizations with Matplotlib, Seaborn, Tableau & Power BI',
      'Apply statistical methods: mean, median, variance, hypothesis testing',
      'Learn Machine Learning basics for Data Analysts',
      'Work with Big Data: Hadoop, Spark, and MapReduce concepts',
    ],
    skills: ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', 'Pandas', 'Statistics', 'Data Cleaning'],
    requirements: [
      'No programming experience required',
      'Basic computer usage knowledge',
      'Laptop or desktop with internet',
    ],
    careerOutcomes: ['Data Analyst', 'BI Developer', 'SQL Analyst', 'Reporting Specialist', 'Junior Data Scientist'],
    projects: [
      { title: 'Sales Trend Forecasting', desc: 'Analyze sales data and build forecasting model using Python & Excel.', icon: '📈' },
      { title: 'Customer Segmentation', desc: 'Segment customers using clustering algorithms and visualize in Tableau.', icon: '👥' },
    ],
    tools: [
      { name: 'Python', icon: '🐍', category: 'Language' },
      { name: 'SQL', icon: '🗄️', category: 'Language' },
      { name: 'Excel', icon: '📋', category: 'Tool' },
      { name: 'Pandas', icon: '🐼', category: 'Library' },
      { name: 'Tableau', icon: '🔵', category: 'Tool' },
      { name: 'Power BI', icon: '⚡', category: 'Tool' },
      { name: 'Matplotlib', icon: '📉', category: 'Library' },
      { name: 'Hadoop', icon: '🐘', category: 'Big Data' },
    ],
    roadmapSteps: [
      { label: 'Foundations', icon: '🏗️', desc: 'Data Analytics intro, types, and key concepts' },
      { label: 'Excel & SQL', icon: '📋', desc: 'Functions, Pivot Tables, SQL queries' },
      { label: 'Python & Pandas', icon: '🐍', desc: 'Data wrangling and manipulation' },
      { label: 'Data Visualization', icon: '📊', desc: 'Charts, dashboards, Tableau, Power BI' },
      { label: 'Statistics', icon: '📐', desc: 'Distributions, correlation, regression' },
      { label: 'Machine Learning', icon: '🤖', desc: 'Fundamentals for analysts' },
      { label: 'Big Data', icon: '🐘', desc: 'Hadoop, Spark basics' },
      { label: 'Projects & Portfolio', icon: '🚀', desc: 'Real projects and certificate' },
    ],
    faqs: [
      { q: 'Is this course in Telugu?', a: 'Yes, all instruction is in Telugu making it easier to understand for native Telugu speakers.' },
      { q: 'Do I need coding experience?', a: 'No prior coding needed. We start from the very basics.' },
      { q: 'What certificate will I get?', a: '1% Developer Academy Data Analyst certificate upon completion.' },
    ],
    reviews: [],
  },
  // Default fallback for courses without custom meta
  default: {
    difficulty: 'Beginner to Advanced',
    language: 'English',
    lastUpdated: 'June 2025',
    enrolled: '',
    rating: 0,
    ratingCount: '',
    duration: '40+ hours',
    whatYouLearn: [],
    skills: [],
    requirements: [],
    careerOutcomes: [],
    projects: [],
    tools: [],
    roadmapSteps: [],
    faqs: [],
    reviews: [],
  },
};

function getMeta(courseId: string) {
  return COURSE_META[courseId] ?? COURSE_META['default'];
}

function getCourseTone(courseId: string) {
  if (courseId.includes('cloud')) return 'Cloud systems';
  if (courseId.includes('data')) return 'Analytics track';
  if (courseId.includes('python')) return 'Programming track';
  return 'Career track';
}

function getCourseAccent(courseId: string) {
  if (courseId.includes('cloud')) return '#6ea8ff';
  if (courseId.includes('data')) return '#ff9a9e';
  return '#f1be3e';
}

function stripMarkup(text: string) {
  return text.replace(/<[^>]+>/g, '');
}

// ── Star Rating ──────────────────────────────────────────────────
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }} aria-label={`${rating} out of 5 stars`}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#f1be3e' : 'none'} stroke="#000" strokeWidth="2" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

// ── Section Heading ──────────────────────────────────────────────
function SectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div id={id} style={{ borderLeft: '4px solid #f1be3e', paddingLeft: '14px', marginBottom: '20px' }}>
      <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '1.15rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#000' }}>
        {children}
      </h2>
    </div>
  );
}

// ── Mascot SVG (reused from original) ───────────────────────────
function MascotSVG({ mascot, context }: { mascot?: string; context: 'card' | 'header' }) {
  const stroke = context === 'card' ? 'currentColor' : '#000000';
  const snakeBg = context === 'card' ? 'var(--mascot-circle-bg)' : '#f1be3e';
  const cloudBg = context === 'card' ? 'var(--mascot-circle-bg)' : '#a0c8ff';
  const chartBg = context === 'card' ? 'var(--mascot-circle-bg)' : '#ff9a9e';
  if (mascot === 'snake') return (
    <svg viewBox="0 0 120 120" width="72" height="72" aria-hidden="true">
      <path d="M 30 90 Q 40 40 60 55 T 90 45" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round"/>
      <circle cx="60" cy="35" r="16" fill={snakeBg} stroke={stroke} strokeWidth="3"/>
      <circle cx="54" cy="32" r="3" fill={stroke}/><circle cx="66" cy="32" r="3" fill={stroke}/>
      <path d="M 52 42 Q 60 48 68 42" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
  if (mascot === 'chart') return (
    <svg viewBox="0 0 120 120" width="72" height="72" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="20" y="20" width="80" height="80" rx="8" fill={chartBg} stroke={stroke} strokeWidth="3"/>
      <path d="M 35 80 L 35 50 M 60 80 L 60 35 M 85 80 L 85 60" stroke={stroke} strokeWidth="8"/>
      <path d="M 20 80 L 100 80" stroke={stroke} strokeWidth="3"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 120 120" width="72" height="72" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M 35 75 A 15 15 0 0 1 35 45 A 20 20 0 0 1 70 35 A 25 25 0 0 1 95 55 A 15 15 0 0 1 85 85 Z" fill={cloudBg}/>
    </svg>
  );
}

// ── StreakWidget ─────────────────────────────────────────────────
function StreakWidget({ streak }: { streak: StreakData | null }) {
  if (!streak) return null;
  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
      <div style={{ background: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0 #000', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 220px' }}>
        <div style={{ fontSize: '2rem' }}>🔥</div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#666', letterSpacing: '1px', textTransform: 'uppercase' }}>Current Streak</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-1px' }}>{streak.currentStreak} {streak.currentStreak === 1 ? 'Day' : 'Days'}</div>
        </div>
      </div>
      <div style={{ background: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0 #000', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 220px' }}>
        <div style={{ fontSize: '2rem' }}>🎯</div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#666', letterSpacing: '1px', textTransform: 'uppercase' }}>Total Active Days</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-1px' }}>{streak.totalActiveDays}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Landing Export ──────────────────────────────────────────
export function Landing({
  courses, activeCourseId, onSelectCourse, onChangeCourse,
  modules, completedParts, progressPct, completedCount, totalParts,
  booting, onLaunch, onSelectPart,
}: Props) {
  const [showAbout, setShowAbout] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([1]));
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set([0]));
  const [courseToast, setCourseToast] = useState<string | null>(null);

  useEffect(() => { fetchStreak().then(setStreak); }, []);

  const totalWords = useMemo(() => modules.flatMap(m => m.notes).reduce((s, n) => s + n.wordCount, 0), [modules]);
  const estHours = useMemo(() => Math.max(1, Math.round(totalWords / 200 / 60)), [totalWords]);
  const activeCourse = useMemo(() => courses.find(c => c.id === activeCourseId) || null, [courses, activeCourseId]);
  const meta = useMemo(() => getMeta(activeCourseId || 'default'), [activeCourseId]);

  const totalLessons = useMemo(() => modules.reduce((s, m) => s + m.notes.length, 0), [modules]);

  const toggleModule = (id: number) => setExpandedModules(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });
  const toggleFaq = (i: number) => setExpandedFaqs(prev => {
    const s = new Set(prev);
    s.has(i) ? s.delete(i) : s.add(i);
    return s;
  });

  const showCourseToast = (message: string) => {
    setCourseToast(message);
    window.setTimeout(() => setCourseToast(null), 2600);
  };

  // ── COURSE SELECTOR (no course selected) ──
  if (!activeCourseId) {
    const displayCourses = selectedGroup
      ? courses.filter(c => c.parentId === selectedGroup && !isHiddenCourse(c.id))
      : courses.filter(shouldShowAsRootCourse);
    const visibleParentCourses = courses.filter(shouldShowAsRootCourse);
    const visibleLeafCourses = courses.filter(c => !c.children && !isHiddenCourse(c.id));
    return (
      <div className="course-select-wrap">
        <div className="course-select-inner">
          <div className="course-select-branding" style={{ position: 'relative' }}>
            {selectedGroup && (
              <button onClick={() => setSelectedGroup(null)} style={{ position: 'absolute', top: -28, left: 0, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-ui)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' }} aria-label="Back to pathway selection">← Back to Pathways</button>
            )}
            <span className="course-select-eyebrow">1% Developer Academy</span>
            <h1 className="course-select-title">{selectedGroup ? 'Choose Your Language' : 'Courses built for serious builders'}</h1>
            <p className="course-select-desc">
              {selectedGroup
                ? 'Pick the language path that helps you learn fastest. You can switch courses any time.'
                : 'Start with a focused pathway, learn in short lessons, and move from fundamentals into practical projects and real-world engineering judgment.'}
            </p>
            {!selectedGroup && (
              <div className="course-select-proof" aria-label="Academy course summary">
                <span><strong>{visibleParentCourses.length}</strong> pathways</span>
                <span><strong>{visibleLeafCourses.reduce((sum, course) => sum + course.totalParts, 0)}</strong> lessons</span>
                <span><strong>Project-first</strong> curriculum</span>
              </div>
            )}
          </div>
          {!selectedGroup && <StreakWidget streak={streak} />}
          <div className="course-grid" role="list" aria-label={selectedGroup ? 'Language options' : 'Course pathways'}>
            {displayCourses.map(course => {
              const hasChildren = !!(course.children && course.children.length > 0);
              const metaForCard = getMeta(course.id);
              const accent = getCourseAccent(course.id);
              return (
                <div key={course.id} className={`course-card course-card-${course.id}`} style={{ '--course-card-accent': accent } as CSSProperties}
                  onClick={() => { if (hasChildren) setSelectedGroup(course.id); else onSelectCourse(course.id); }}
                  role="listitem" tabIndex={0}
                  aria-label={`${course.title}: ${course.description}. ${course.totalParts} ${hasChildren ? 'language options' : 'parts'}.`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (hasChildren) setSelectedGroup(course.id); else onSelectCourse(course.id); } }}>
                  <div className="course-card-topline">
                    <span>{getCourseTone(course.id)}</span>
                    <span>{hasChildren ? `${course.children?.length || 0} options` : metaForCard.language}</span>
                  </div>
                  <div className="course-card-mascot" aria-hidden="true"><MascotSVG mascot={course.mascot} context="card"/></div>
                  <div>
                    <h2 className="course-title-text">{course.title}</h2>
                    <p className="course-description-text">{course.description}</p>
                  </div>
                  <div className="course-card-detail-row" aria-hidden="true">
                    <span>{hasChildren ? 'Choose a language' : metaForCard.difficulty}</span>
                    <span>{hasChildren ? 'Guided path' : metaForCard.duration}</span>
                  </div>
                  <div className="course-footer-meta">
                    <span className="course-parts-badge">{course.totalParts} {hasChildren ? 'Languages' : 'Parts'}</span>
                    <span className="course-action-link" aria-hidden="true">{hasChildren ? 'View options' : 'Enter course'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── COURSE HOME PAGE (course selected) ──
  const welcomeText = activeCourse?.welcomeParagraphs?.length
    ? activeCourse.welcomeParagraphs
    : [activeCourse?.description || ''];

  const relatedCourses = courses.filter(c => c.id !== activeCourseId && !c.children && c.id !== activeCourse?.parentId && !HIDDEN_COURSE_IDS.includes(c.id)).slice(0, 3);
  const availableModules = modules.filter(mod => mod.notes.length > 0);
  const nextNote = availableModules.flatMap(mod => mod.notes).find(note => !completedParts.includes(note.part)) ?? availableModules[0]?.notes[0];
  const heroDescription = stripMarkup(welcomeText[0] || activeCourse?.description || '');
  const heroStats = [
    { label: 'Modules', value: modules.length },
    { label: 'Lessons', value: totalLessons },
    { label: 'Hours', value: `${estHours}+` },
    { label: 'Projects', value: meta.projects.length || 'Hands-on' },
  ];

  const createCourseReminder = async () => {
    if (!activeCourse) return;
    try {
      await createTask({
        title: `Study ${activeCourse.title}`,
        description: `Continue learning ${activeCourse.title}.`,
        task_type: 'study',
        status: 'not_started',
        priority: 'medium',
        due_date: tomorrowStr(),
        due_time: '09:00',
        estimated_duration_minutes: 45,
        recurrence_rule: 'daily',
        link_type: 'internal',
        internal_link_target: 'course',
        internal_link_id: activeCourse.id,
        internal_link_label: activeCourse.title,
        external_url: '',
        course_id: activeCourse.id,
        category: 'course-reminder',
        personal_notes: '',
        tags: ['course', 'reminder'],
        is_pinned: true,
        is_archived: false,
        sort_order: 0,
      });
      showCourseToast('Course reminder created for tomorrow 09:00');
    } catch {
      showCourseToast('Could not create reminder');
    }
  };

  return (
    <div className="course-home" style={{ height: '100%', overflowY: 'auto', background: 'var(--win-bg)', fontFamily: 'var(--font-content)' }}>

      {/* ══════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════ */}
      <div className="ch-hero" style={{ background: '#000', color: '#fff', padding: '32px 40px', display: 'flex', gap: '32px', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', borderBottom: '3px solid #f1be3e' }}>
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '10px', fontFamily: 'var(--font-ui)' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={onChangeCourse}>Academy</span>
            <span style={{ margin: '0 6px', opacity: 0.5 }}>/</span>
            <span style={{ color: '#f1be3e' }}>{activeCourse?.title}</span>
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: 'var(--font-ui)', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.15, color: '#fff' }}>
            {activeCourse?.title}
          </h1>
          <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px', maxWidth: '600px' }}>
            {heroDescription}
          </p>

          <div className="course-hero-actions">
            <button onClick={onLaunch} className="course-hero-primary" aria-label={completedCount > 0 ? 'Resume learning' : 'Start learning'}>
              {completedCount > 0 ? 'Resume Learning' : 'Start Learning'}
            </button>
            {nextNote && (
              <button onClick={() => onSelectPart(nextNote.part)} className="course-hero-secondary" aria-label={`Open part ${nextNote.part}`}>
                {completedCount > 0 ? `Next: Part ${nextNote.part}` : `Preview Part ${nextNote.part}`}
              </button>
            )}
          </div>

          {/* Rating row — only show if real data exists */}
          {meta.rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#f1be3e', fontSize: '1rem' }}>{meta.rating}</span>
              <StarRating rating={meta.rating} size={16}/>
              {meta.ratingCount && <span style={{ fontSize: '0.78rem', color: '#aaa' }}>({meta.ratingCount})</span>}
              {meta.enrolled && (
                <>
                  <span style={{ fontSize: '0.78rem', color: '#aaa' }}>/</span>
                  <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{meta.enrolled} students</span>
                </>
              )}
            </div>
          )}

          {/* Meta chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[
              { icon: 'Updated', label: meta.lastUpdated },
              { icon: 'Language', label: meta.language },
              { icon: 'Duration', label: meta.duration },
              { icon: 'Level', label: meta.difficulty },
            ].map(chip => (
              <span key={chip.label} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', fontSize: '0.75rem', fontFamily: 'var(--font-ui)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', color: '#ddd' }}>
                <span aria-hidden="true">{chip.icon}</span>{chip.label}
              </span>
            ))}
          </div>

          {/* Instructor */}
          <div style={{ fontSize: '0.82rem', color: '#aaa', fontFamily: 'var(--font-ui)' }}>
            Instructor: <span style={{ color: '#f1be3e', fontWeight: 700 }}>{activeCourse?.author || 'Instructor'}</span>
            {activeCourse?.authorTitle && <span style={{ color: '#888' }}> / {activeCourse.authorTitle}</span>}
          </div>
          <div className="course-hero-outcomes" aria-label="Course highlights">
            <span>Self-paced lessons</span>
            <span>Code and notes together</span>
            <span>Built for practical recall</span>
          </div>
        </div>

        {/* Hero CTA Card */}
        <div style={{ background: '#fff', border: '3px solid #f1be3e', boxShadow: '6px 6px 0 #f1be3e', padding: '24px', width: '280px', flexShrink: 0, color: '#000' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <MascotSVG mascot={activeCourse?.mascot} context="header"/>
          </div>
          {/* Progress ring (text only) */}
          {completedCount > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-ui)' }}>
                <span>Your Progress</span>
                <span style={{ color: '#f1be3e' }}>{progressPct}%</span>
              </div>
              <div style={{ height: '8px', background: '#f4f1ea', border: '2px solid #000', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? '#00aa44' : '#f1be3e', transition: 'width 0.4s ease' }}/>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{completedCount} / {totalParts} parts completed</div>
            </div>
          )}
          <button onClick={onLaunch} style={{ width: '100%', padding: '14px', background: '#000', color: '#f1be3e', border: '2px solid #000', boxShadow: '3px 3px 0 #000', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', transition: 'transform 80ms, box-shadow 80ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '5px 5px 0 #000'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '3px 3px 0 #000'; }}
            aria-label={completedCount > 0 ? 'Resume Learning' : 'Start Learning'}>
            {completedCount > 0 ? 'RESUME LEARNING' : 'START LEARNING'}
          </button>
          <div className="course-hero-stat-grid">
            {heroStats.map(stat => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── External links bar ── */}
      {(activeCourse?.channelUrl || activeCourse?.playlistUrl || activeCourse?.discordUrl) && (
        <div style={{ background: '#f4f1ea', borderBottom: '2px solid #000', display: 'flex', flexWrap: 'wrap' }} role="navigation" aria-label="Course resources">
          {activeCourse?.channelUrl && <a className="land-nav-item" href={activeCourse.channelUrl} target="_blank" rel="noopener noreferrer">YOUTUBE</a>}
          {activeCourse?.playlistUrl && <a className="land-nav-item" href={activeCourse.playlistUrl} target="_blank" rel="noopener noreferrer">PLAYLIST</a>}
          {activeCourse?.discordUrl && <a className="land-nav-item" href={activeCourse.discordUrl} target="_blank" rel="noopener noreferrer">DISCORD</a>}
          <button className="land-nav-item" onClick={() => setShowAbout(true)}>ABOUT</button>
        </div>
      )}

      <div className="course-home-snapshot" aria-label="Course snapshot">
        {availableModules.slice(0, 4).map((mod, index) => {
          const doneParts = mod.notes.filter(note => completedParts.includes(note.part)).length;
          return (
            <button key={mod.id} onClick={() => mod.notes[0] && onSelectPart(mod.notes[0].part)} className="course-snapshot-item">
              <span className="course-snapshot-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="course-snapshot-title">{mod.title}</span>
              <span className="course-snapshot-meta">{doneParts}/{mod.notes.length} done</span>
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 28px' }}>

        {/* ══════════════════════════════════════════════
            SECTION 2 — WHAT YOU'LL LEARN
        ══════════════════════════════════════════════ */}
        {meta.whatYouLearn.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="What you will learn">
            <SectionHeading>What You'll Learn</SectionHeading>
            <div style={{ background: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0 #000', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {meta.whatYouLearn.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#f1be3e', fontWeight: 900, fontSize: '1rem', flexShrink: 0, marginTop: '1px' }} aria-hidden="true">✓</span>
                  <span style={{ fontSize: '0.88rem', lineHeight: 1.5, color: '#222', fontFamily: 'var(--font-content)' }}>{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 3 — SKILLS YOU'LL GAIN
        ══════════════════════════════════════════════ */}
        {meta.skills.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="Skills you will gain">
            <SectionHeading>Skills You'll Gain</SectionHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {meta.skills.map(skill => (
                <span key={skill} style={{ background: '#000', color: '#f1be3e', border: '2px solid #000', padding: '6px 16px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.04em', boxShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 4 — LEARNING ROADMAP
        ══════════════════════════════════════════════ */}
        {meta.roadmapSteps.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="Learning roadmap">
            <SectionHeading>Learning Roadmap</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {meta.roadmapSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                  {/* Left connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48px', flexShrink: 0 }}>
                    <div style={{ width: '36px', height: '36px', background: i === 0 ? '#000' : i === meta.roadmapSteps.length - 1 ? '#f1be3e' : '#fff', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', zIndex: 1, boxShadow: '2px 2px 0 rgba(0,0,0,0.15)', flexShrink: 0 }} aria-hidden="true">
                      {step.icon}
                    </div>
                    {i < meta.roadmapSteps.length - 1 && (
                      <div style={{ width: '3px', flex: 1, background: '#000', minHeight: '24px' }} aria-hidden="true"/>
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ paddingLeft: '16px', paddingBottom: i < meta.roadmapSteps.length - 1 ? '20px' : 0, paddingTop: '4px' }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.9rem', color: '#000', marginBottom: '2px' }}>{step.label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#555', fontFamily: 'var(--font-content)' }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 5 — COURSE CURRICULUM
        ══════════════════════════════════════════════ */}
        <section className="course-curriculum-section" aria-label="Course curriculum">
          <div className="course-curriculum-head">
            <SectionHeading id="curriculum">Course Curriculum</SectionHeading>
            <p>
              Follow the course as focused modules. Open any module to preview lessons,
              jump directly into a part, or continue from the first unfinished lesson.
            </p>
          </div>

          <div className="course-curriculum-stats" aria-label="Curriculum summary">
            <div><strong>{modules.length}</strong><span>Modules</span></div>
            <div><strong>{totalLessons}</strong><span>Lessons</span></div>
            <div><strong>{estHours}+</strong><span>Hours</span></div>
            <div><strong>{meta.projects.length || 'Live'}</strong><span>Projects</span></div>
          </div>

          <div className="course-curriculum-grid">
            {availableModules.map((mod, modIdx) => {
              const isOpen = expandedModules.has(mod.id);
              const doneParts = mod.notes.filter(n => completedParts.includes(n.part)).length;
              const modDuration = mod.notes.reduce((s, n) => s + Math.max(1, Math.round(n.wordCount / 200)), 0);
              const modulePct = mod.notes.length > 0 ? Math.round((doneParts / mod.notes.length) * 100) : 0;
              return (
                <article key={mod.id} className={`course-module-card${isOpen ? ' open' : ''}`}>
                  <button
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className="course-module-toggle"
                    aria-expanded={isOpen}
                    aria-controls={`module-content-${mod.id}`}
                  >
                    <span className="course-module-index">M{String(modIdx + 1).padStart(2, '0')}</span>
                    <span className="course-module-title-wrap">
                      <span className="course-module-title">{mod.title}</span>
                      <span className="course-module-meta">{mod.notes.length} lessons / {modDuration} min</span>
                    </span>
                    <span className="course-module-chevron" aria-hidden="true">{isOpen ? 'Close' : 'Open'}</span>
                  </button>

                  <div className="course-module-progress" aria-label={`${modulePct}% complete`}>
                    <span style={{ width: `${modulePct}%` }} />
                  </div>

                  <div className="course-module-card-foot">
                    <span>{doneParts}/{mod.notes.length} complete</span>
                    {nextNote && mod.notes.some(note => note.part === nextNote.part) && <strong>Up next</strong>}
                  </div>

                  {isOpen && (
                    <div id={`module-content-${mod.id}`} className="course-lesson-list" role="list" aria-label={`Lessons in ${mod.title}`}>
                      {mod.notes.map((note, noteIdx) => {
                        const isDone = completedParts.includes(note.part);
                        const shortTitle = note.title.replace(/^Part\s+[\d.]+\s*/i, '').replace(/^[-:]\s*/, '');
                        const readMin = Math.max(1, Math.round(note.wordCount / 200));
                        return (
                          <button
                            key={note.part}
                            type="button"
                            role="listitem"
                            onClick={() => onSelectPart(note.part)}
                            className={`course-lesson-row${isDone ? ' done' : ''}`}
                            aria-label={`Part ${note.part}: ${shortTitle}. ${isDone ? 'Completed.' : ''} ${readMin} minute read.`}
                          >
                            <span className="course-lesson-status" aria-hidden="true">{isDone ? 'Done' : String(noteIdx + 1).padStart(2, '0')}</span>
                            <span className="course-lesson-main">
                              <span className="course-lesson-title">{shortTitle}</span>
                              <span className="course-lesson-tags">
                                <span>Notes</span>
                                {note.hasFiles && <span>Files</span>}
                                <span>{readMin} min</span>
                              </span>
                            </span>
                            <span className="course-lesson-action" aria-hidden="true">Start</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 6 — PROJECTS
        ══════════════════════════════════════════════ */}
        {meta.projects.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="Course projects">
            <SectionHeading>Projects Included</SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {meta.projects.map((proj, i) => (
                <div key={i} style={{ background: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0 #000', padding: '20px', display: 'flex', gap: '14px' }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0, lineHeight: 1 }} aria-hidden="true">{proj.icon}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.9rem', marginBottom: '6px', color: '#000' }}>{proj.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.5, fontFamily: 'var(--font-content)' }}>{proj.desc}</div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                      <span style={{ background: '#f1be3e', border: '1px solid #000', padding: '2px 8px', fontSize: '0.65rem', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>🚀 PROJECT</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 7 — TOOLS & TECHNOLOGIES
        ══════════════════════════════════════════════ */}
        {meta.tools.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="Tools and technologies">
            <SectionHeading>Tools & Technologies</SectionHeading>
            {/* Group by category */}
            {Array.from(new Set(meta.tools.map(t => t.category))).map(cat => (
              <div key={cat} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>{cat}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {meta.tools.filter(t => t.category === cat).map(tool => (
                    <div key={tool.name} style={{ background: '#fff', border: '2px solid #000', boxShadow: '2px 2px 0 #000', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.82rem' }}>
                      <span aria-hidden="true">{tool.icon}</span>{tool.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 8 — REQUIREMENTS
        ══════════════════════════════════════════════ */}
        {meta.requirements.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="Course requirements">
            <SectionHeading>Requirements</SectionHeading>
            <div style={{ background: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0 #000', padding: '20px 24px' }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {meta.requirements.map((req, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.88rem', fontFamily: 'var(--font-content)', color: '#222' }}>
                    <span style={{ color: '#000', fontWeight: 900, flexShrink: 0, marginTop: '1px' }} aria-hidden="true">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 9 — CAREER OUTCOMES
        ══════════════════════════════════════════════ */}
        {meta.careerOutcomes.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="Career outcomes">
            <SectionHeading>Career Outcomes</SectionHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {meta.careerOutcomes.map(role => (
                <div key={role} style={{ background: '#fff', border: '2px solid #000', boxShadow: '3px 3px 0 #000', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.85rem' }}>
                  <span aria-hidden="true">💼</span>{role}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 10 — CERTIFICATE
        ══════════════════════════════════════════════ */}
        <section style={{ marginBottom: '48px' }} aria-label="Certificate">
          <SectionHeading>Certificate of Completion</SectionHeading>
          <div style={{ background: '#fff', border: '3px solid #f1be3e', boxShadow: '6px 6px 0 #000', padding: '28px 32px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '3.5rem', flexShrink: 0 }} aria-hidden="true">🎓</div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '1.1rem', marginBottom: '6px' }}>1% Developer Academy — {activeCourse?.title}</div>
              <div style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.6, fontFamily: 'var(--font-content)', maxWidth: '480px' }}>
                Complete all modules and projects to earn your verified certificate. Showcase it on LinkedIn, in your portfolio, and in job applications.
              </div>
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['✓ Shareable on LinkedIn', '✓ PDF download', '✓ Portfolio-ready'].map(f => (
                  <span key={f} style={{ background: '#f1be3e', border: '1px solid #000', padding: '3px 10px', fontSize: '0.72rem', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 11 — STUDENT REVIEWS
        ══════════════════════════════════════════════ */}
        {meta.reviews.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="Student reviews">
            <SectionHeading>Student Reviews</SectionHeading>
            {/* Aggregate */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '3rem', fontWeight: 900, color: '#f1be3e', lineHeight: 1 }}>{meta.rating}</div>
                <StarRating rating={meta.rating} size={18}/>
                <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '4px', fontFamily: 'var(--font-ui)' }}>Course Rating</div>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#555', fontFamily: 'var(--font-ui)' }}>
                <div>{meta.ratingCount}</div>
                <div>{meta.enrolled} enrolled</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {meta.reviews.map((rev, i) => (
                <div key={i} style={{ background: '#fff', border: '2px solid #000', boxShadow: '3px 3px 0 #000', padding: '18px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ width: '38px', height: '38px', background: '#000', color: '#f1be3e', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.75rem', flexShrink: 0 }} aria-hidden="true">{rev.initials}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.88rem' }}>{rev.name}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <StarRating rating={rev.rating} size={12}/>
                        <span style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'var(--font-mono)' }}>{rev.date}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: '#333', margin: 0, fontFamily: 'var(--font-content)' }}>{rev.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 12 — FAQ
        ══════════════════════════════════════════════ */}
        {meta.faqs.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="Frequently asked questions">
            <SectionHeading>Frequently Asked Questions</SectionHeading>
            <div style={{ border: '2px solid #000', boxShadow: '4px 4px 0 #000', overflow: 'hidden' }}>
              {meta.faqs.map((faq, i) => {
                const isOpen = expandedFaqs.has(i);
                return (
                  <div key={i} style={{ borderBottom: i < meta.faqs.length - 1 ? '2px solid #000' : 'none' }}>
                    <button
                      onClick={() => toggleFaq(i)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: isOpen ? '#f1be3e' : '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.88rem', textAlign: 'left', gap: '16px', transition: 'background 80ms' }}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <span style={{ fontSize: '0.8rem', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', flexShrink: 0 }} aria-hidden="true">▼</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '14px 18px', background: '#faf8f4', fontSize: '0.88rem', lineHeight: 1.6, color: '#333', fontFamily: 'var(--font-content)', borderTop: '1px solid #e0ddd7' }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 13 — RELATED COURSES
        ══════════════════════════════════════════════ */}
        {relatedCourses.length > 0 && (
          <section style={{ marginBottom: '48px' }} aria-label="Related courses">
            <SectionHeading>Related Courses</SectionHeading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {relatedCourses.map(course => {
                const cMeta = getMeta(course.id);
                return (
                  <div key={course.id} style={{ background: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0 #000', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 80ms, box-shadow 80ms' }}
                    onClick={() => onSelectCourse(course.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${course.title}`}
                    onKeyDown={e => e.key === 'Enter' && onSelectCourse(course.id)}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '6px 6px 0 #000'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '4px 4px 0 #000'; }}>
                    {/* Thumbnail */}
                    <div style={{ background: '#000', padding: '20px', display: 'flex', justifyContent: 'center', borderBottom: '2px solid #000', minHeight: '80px', alignItems: 'center' }}>
                      <MascotSVG mascot={course.mascot} context="card"/>
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.9rem', color: '#000' }}>{course.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#555', fontFamily: 'var(--font-ui)' }}>{course.author}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StarRating rating={cMeta.rating} size={11}/>
                        <span style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'var(--font-mono)' }}>{cMeta.rating}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: '#666', fontFamily: 'var(--font-ui)', flexWrap: 'wrap' }}>
                        <span>⏱️ {cMeta.duration}</span>
                        <span>·</span>
                        <span>📶 {cMeta.difficulty}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#555', margin: '4px 0 0', lineHeight: 1.4, fontFamily: 'var(--font-content)' }}>{course.description}</p>
                    </div>
                    <div style={{ padding: '0 16px 16px' }}>
                      <button style={{ width: '100%', padding: '8px', background: '#000', color: '#f1be3e', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        VIEW COURSE →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <div className="course-bottom-cta" style={{ textAlign: 'center', padding: '32px', background: '#000', border: '2px solid #000', boxShadow: '6px 6px 0 #f1be3e', marginBottom: '48px' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>Ready to start your journey?</div>
          <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px', fontFamily: 'var(--font-content)' }}>Join {meta.enrolled} students already learning.</div>
          <button onClick={onLaunch}
            style={{ padding: '14px 40px', background: '#f1be3e', color: '#000', border: '2px solid #f1be3e', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '4px 4px 0 rgba(255,255,255,0.2)', transition: 'transform 80ms, box-shadow 80ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translate(-2px,-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
            aria-label={completedCount > 0 ? 'Resume learning' : 'Start the course'}>
            {completedCount > 0 ? '▶ RESUME LEARNING' : '▶ START LEARNING NOW'}
          </button>
        </div>

      </div>{/* end maxWidth wrapper */}

      {/* ── ABOUT DIALOG ── */}
      {showAbout && (
        <div className="land-about-panel" role="dialog" aria-modal="true" aria-labelledby="about-dialog-title">
          <div className="land-about-titlebar">
            <span id="about-dialog-title">📋 ABOUT THIS COURSE</span>
            <button className="land-win-btn land-win-close" onClick={() => setShowAbout(false)} aria-label="Close about dialog">✕</button>
          </div>
          <div className="land-about-body">
            <table className="land-about-table">
              <tbody>
                <tr><td className="land-about-key">INSTRUCTOR</td><td><strong>{activeCourse?.author}</strong> — {activeCourse?.authorTitle}</td></tr>
                <tr><td className="land-about-key">DEVELOPER</td><td>DESIGNED &amp; BUILT BY <a href="https://pruthviraj-portfolio-nu.vercel.app/" target="_blank" rel="noopener noreferrer">PRUTHVI RAJ B</a> · 2026</td></tr>
                <tr><td className="land-about-key">COURSE</td><td>{activeCourse?.title}</td></tr>
                <tr><td className="land-about-key">TARGET</td><td>{activeCourse?.target}</td></tr>
                <tr><td className="land-about-key">GOAL</td><td>{activeCourse?.goal}</td></tr>
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="land-btn-primary" onClick={() => setShowAbout(false)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
