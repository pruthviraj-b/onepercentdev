'use client';

import React, { useState, useEffect } from 'react';
import { fetchModules, fetchProgress } from '@/lib/api';

// ── Constants ────────────────────────────────────────────────────────────────
const SPRINT_START = '2026-08-01';
const SPRINT_END = '2026-08-31';
const PHASE_1_END = '2026-08-15';
const SPRINT_TOTAL_DAYS = 31;

const SCHEDULE_PHASE_1 = [
  { start: '06:30', end: '08:30', label: 'SQL' },
  { start: '08:30', end: '10:30', label: 'Python' },
  { start: '10:30', end: '12:30', label: 'Aptitude' },
  { start: '12:30', end: '13:30', label: 'Lunch' },
  { start: '13:30', end: '15:30', label: 'Excel' },
  { start: '15:30', end: '17:30', label: 'Power BI' },
  { start: '17:30', end: '18:00', label: 'Break' },
  { start: '18:00', end: '21:00', label: 'Project Work' },
  { start: '21:00', end: '22:30', label: 'Dinner' },
  { start: '22:00', end: '22:30', label: 'Recap/Notes' },
];

const SCHEDULE_PHASE_2 = [
  { start: '06:30', end: '08:30', label: 'SQL Revision' },
  { start: '08:30', end: '10:30', label: 'Python Revision' },
  { start: '10:30', end: '12:30', label: 'Aptitude' },
  { start: '12:30', end: '13:30', label: 'Lunch' },
  { start: '13:30', end: '15:30', label: 'Excel Revision' },
  { start: '15:30', end: '17:30', label: 'Power BI Revision' },
  { start: '17:30', end: '18:00', label: 'Break' },
  { start: '18:00', end: '20:00', label: 'Project Polish' },
  { start: '20:00', end: '21:30', label: 'Job Apps + LinkedIn' },
  { start: '21:00', end: '22:30', label: 'Dinner' },
];

const LMS_COURSES = ['sql', 'python', 'excel'];
const MANUAL_ITEMS = ['Power BI', 'Aptitude', 'Project Work', 'Job Applications'];

// ── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#080B10',
  surface: '#0F141C',
  surfaceHi: '#151B25',
  border: '#212B38',
  borderHi: '#2E3B4C',
  text: '#E8EDF4',
  textDim: '#7E8CA0',
  textFaint: '#4B5768',
  cyan: '#4CD8E0',
  cyanDim: 'rgba(76,216,224,0.14)',
  violet: '#9C8CFF',
  green: '#3ED598',
  amber: '#F5B84C',
  red: '#F0716C',
  phase1: '#4CD8E0',
  phase2: '#9C8CFF',
};

const F = {
  display: "'Google Sans Flex', sans-serif",
  body: "'Google Sans Flex', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

// ── Types ────────────────────────────────────────────────────────────────────
interface CourseProgress {
  id: string;
  total: number;
  completed: number;
  remaining: number;
  percentComplete: number;
  lastActivity: string | null;
  error?: boolean;
}

interface ManualProgress {
  [key: string]: boolean;
}

interface TimeBlock {
  start: string;
  end: string;
  label: string;
}

// ── Utility functions ────────────────────────────────────────────────────────
function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentPhase(today: string): 1 | 2 {
  return today <= PHASE_1_END ? 1 : 2;
}

function getDaysLeft(today: string): number {
  const t = parseDate(today);
  const end = parseDate(SPRINT_END);
  const diff = Math.ceil((end.getTime() - t.getTime()) / 86400000);
  return Math.max(0, Math.min(SPRINT_TOTAL_DAYS, diff));
}

function getHoursLeftToday(): number {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(22, 30, 0, 0);
  const diff = (endOfDay.getTime() - now.getTime()) / 3600000;
  return Math.max(0, diff);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getCurrentBlock(schedule: TimeBlock[]): TimeBlock | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return schedule.find(block => {
    const start = timeToMinutes(block.start);
    const end = timeToMinutes(block.end);
    return currentMinutes >= start && currentMinutes < end;
  }) || null;
}

function getScheduleForDate(dateStr: string): TimeBlock[] {
  const phase = getCurrentPhase(dateStr);
  return phase === 1 ? SCHEDULE_PHASE_1 : SCHEDULE_PHASE_2;
}

function getOverallProgress(courses: CourseProgress[], manual: ManualProgress): number {
  const courseTotal = courses.reduce((sum, c) => sum + c.total, 0);
  const courseCompleted = courses.reduce((sum, c) => sum + c.completed, 0);
  const manualTotal = MANUAL_ITEMS.length;
  const manualCompleted = MANUAL_ITEMS.filter(item => manual[item]).length;
  const total = courseTotal + manualTotal;
  const completed = courseCompleted + manualCompleted;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function isPaceOnTrack(course: CourseProgress, today: string): boolean {
  if (course.total === 0) return true;
  const sprintStart = parseDate(SPRINT_START);
  const currentDate = parseDate(today);
  const daysElapsed = Math.max(0, Math.ceil((currentDate.getTime() - sprintStart.getTime()) / 86400000));
  const expectedProgress = (daysElapsed / SPRINT_TOTAL_DAYS) * 100;
  return course.percentComplete >= expectedProgress - 5; // 5% tolerance
}

// ── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'targetroom_manual_progress';

function loadManualProgress(): ManualProgress {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveManualProgress(progress: ManualProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export function TargetRoom({ onBack }: { onBack: () => void }) {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [manualProgress, setManualProgress] = useState<ManualProgress>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const today = todayStr();
  const phase = getCurrentPhase(today);
  const daysLeft = getDaysLeft(today);
  const hoursLeft = getHoursLeftToday();
  const currentBlock = getCurrentBlock(getScheduleForDate(today));
  const overallPct = getOverallProgress(courses, manualProgress);

  // Load manual progress from localStorage on mount
  useEffect(() => {
    setManualProgress(loadManualProgress());
  }, []);

  // Fetch LMS course data on mount and every 5 minutes
  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      const results = await Promise.all(
        LMS_COURSES.map(async (courseId) => {
          try {
            const [modules, progress] = await Promise.all([
              fetchModules(courseId),
              fetchProgress(courseId),
            ]);
            const total = modules.reduce((sum, m) => sum + m.notes.length, 0);
            const completed = progress.length;
            return {
              id: courseId,
              total,
              completed,
              remaining: Math.max(0, total - completed),
              percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
              lastActivity: null, // Would need additional API endpoint for this
            };
          } catch {
            return {
              id: courseId,
              total: 0,
              completed: 0,
              remaining: 0,
              percentComplete: 0,
              lastActivity: null,
              error: true,
            };
          }
        })
      );
      setCourses(results);
      setLoading(false);
    };

    fetchCourseData();
    const interval = setInterval(fetchCourseData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleManualToggle = (item: string) => {
    const updated = { ...manualProgress, [item]: !manualProgress[item] };
    setManualProgress(updated);
    saveManualProgress(updated);
  };

  const handleResetManual = () => {
    if (confirm('Reset all manual progress? This will NOT affect LMS course data.')) {
      setManualProgress({});
      saveManualProgress({});
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.borderHi}; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* Header */}
      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: C.surfaceHi,
              border: `1px solid ${C.border}`,
              borderRadius: '8px',
              padding: '8px 14px',
              color: C.text,
              cursor: 'pointer',
              fontFamily: F.mono,
              fontSize: '0.78rem',
            }}
          >← Back</button>
          <div>
            <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.4rem', margin: 0 }}>Target Room</h1>
            <div style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.textDim }}>
              Aug 1–31, 2026 · Data Analyst Sprint
            </div>
          </div>
        </div>
        <button
          onClick={handleResetManual}
          style={{
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '8px 14px',
            color: C.red,
            cursor: 'pointer',
            fontFamily: F.mono,
            fontSize: '0.72rem',
          }}
        >Reset Manual Progress</button>
      </header>

      {/* Status Strip */}
      <div style={{
        background: `linear-gradient(135deg, ${phase === 1 ? C.phase1 : C.phase2}22, ${C.surface})`,
        borderBottom: `1px solid ${C.border}`,
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '20px',
      }}>
        <StatusCell label="Days Left" value={`${daysLeft} / 31`} />
        <StatusCell label="Hours Left Today" value={hoursLeft.toFixed(1)} />
        <StatusCell label="Current Phase" value={`Phase ${phase}`} color={phase === 1 ? C.phase1 : C.phase2} />
        <StatusCell label="Current Block" value={currentBlock?.label || 'None'} />
        <StatusCell label="Overall Progress" value={`${overallPct}%`} color={C.green} />
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => setView('calendar')}
            style={{
              background: view === 'calendar' ? C.cyan : C.surface,
              color: view === 'calendar' ? C.bg : C.text,
              border: `1px solid ${view === 'calendar' ? C.cyan : C.border}`,
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontFamily: F.mono,
              fontWeight: 600,
              fontSize: '0.78rem',
            }}
          >Calendar View</button>
          <button
            onClick={() => setView('list')}
            style={{
              background: view === 'list' ? C.cyan : C.surface,
              color: view === 'list' ? C.bg : C.text,
              border: `1px solid ${view === 'list' ? C.cyan : C.border}`,
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontFamily: F.mono,
              fontWeight: 600,
              fontSize: '0.78rem',
            }}
          >List View</button>
        </div>

        {/* Course Insight Cards */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>LMS Course Progress</h2>
          {loading && <div style={{ color: C.textDim, fontFamily: F.mono, fontSize: '0.8rem' }}>Loading course data...</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {courses.map(course => (
              <CourseCard key={course.id} course={course} today={today} />
            ))}
          </div>
        </section>

        {/* Manual Checklist */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>Manual Items (Phase {phase})</h2>
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            padding: '16px',
          }}>
            {MANUAL_ITEMS.map(item => (
              <label key={item} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.surfaceHi}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={!!manualProgress[item]}
                  onChange={() => handleManualToggle(item)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: F.body, fontSize: '0.9rem', color: C.text }}>{item}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Calendar or List View */}
        {view === 'calendar' ? (
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            courses={courses}
            manualProgress={manualProgress}
          />
        ) : (
          <ListView
            courses={courses}
            manualProgress={manualProgress}
          />
        )}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function StatusCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: F.mono, fontSize: '0.62rem', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.3rem', color: color || C.text, marginTop: '4px' }}>{value}</div>
    </div>
  );
}

function CourseCard({ course, today }: { course: CourseProgress; today: string }) {
  const onTrack = isPaceOnTrack(course, today);
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '12px',
      padding: '18px',
    }}>
      {course.error && (
        <div style={{
          background: C.red + '22',
          border: `1px solid ${C.red}`,
          borderRadius: '8px',
          padding: '12px',
          fontFamily: F.mono,
          fontSize: '0.72rem',
          color: C.red,
          marginBottom: '12px',
        }}>
          ⚠ Couldn't fetch course data
        </div>
      )}
      <div style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {course.id.toUpperCase()}
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.8rem', color: C.text, marginBottom: '4px' }}>
        {course.completed} / {course.total}
      </div>
      <div style={{ fontFamily: F.mono, fontSize: '0.72rem', color: C.textDim, marginBottom: '12px' }}>
        {course.remaining} chapters remaining · {course.percentComplete}%
      </div>
      <div style={{ height: '6px', background: C.border, borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ height: '100%', width: `${course.percentComplete}%`, background: C.cyan, borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
      <div style={{
        display: 'inline-block',
        padding: '4px 10px',
        background: onTrack ? C.green + '22' : C.amber + '22',
        border: `1px solid ${onTrack ? C.green : C.amber}`,
        borderRadius: '6px',
        fontFamily: F.mono,
        fontSize: '0.66rem',
        color: onTrack ? C.green : C.amber,
      }}>
        {onTrack ? '✓ On track' : '⚠ Behind schedule'}
      </div>
    </div>
  );
}

function CalendarView({
  selectedDate,
  onSelectDate,
  courses,
  manualProgress,
}: {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  courses: CourseProgress[];
  manualProgress: ManualProgress;
}) {
  const today = todayStr();
  const sprintStart = parseDate(SPRINT_START);
  const sprintEnd = parseDate(SPRINT_END);

  // Generate all days in August 2026
  const days: string[] = [];
  const current = new Date(sprintStart);
  while (current <= sprintEnd) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return (
    <section>
      <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>August 2026</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '16px',
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ fontFamily: F.mono, fontSize: '0.7rem', color: C.textFaint, textAlign: 'center', padding: '8px' }}>
            {day}
          </div>
        ))}
        {/* Padding for days before Aug 1 */}
        {Array.from({ length: sprintStart.getDay() }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map(dateStr => {
          const phase = getCurrentPhase(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const pct = getOverallProgress(courses, manualProgress);
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              style={{
                background: isToday ? C.cyan + '44' : isSelected ? C.surfaceHi : C.surface,
                border: `2px solid ${isToday ? C.cyan : isSelected ? C.violet : C.border}`,
                borderRadius: '10px',
                padding: '12px 8px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!isToday && !isSelected) e.currentTarget.style.background = C.surfaceHi;
              }}
              onMouseLeave={e => {
                if (!isToday && !isSelected) e.currentTarget.style.background = C.surface;
              }}
            >
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.1rem', color: C.text, marginBottom: '4px' }}>
                {parseInt(dateStr.slice(-2))}
              </div>
              <div style={{ fontFamily: F.mono, fontSize: '0.62rem', color: phase === 1 ? C.phase1 : C.phase2, marginBottom: '6px' }}>
                Phase {phase}
              </div>
              <div style={{ fontFamily: F.mono, fontSize: '0.7rem', color: C.textDim }}>
                {pct}%
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {getScheduleForDate(selectedDate).map((block, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: C.surfaceHi,
                borderRadius: '8px',
              }}>
                <div style={{ fontFamily: F.mono, fontSize: '0.72rem', color: C.textDim, minWidth: '90px' }}>
                  {block.start}–{block.end}
                </div>
                <div style={{ fontFamily: F.body, fontSize: '0.85rem', color: C.text }}>
                  {block.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ListView({ courses, manualProgress }: { courses: CourseProgress[]; manualProgress: ManualProgress }) {
  const today = todayStr();
  const sprintStart = parseDate(SPRINT_START);
  const sprintEnd = parseDate(SPRINT_END);

  const days: string[] = [];
  const current = new Date(sprintStart);
  while (current <= sprintEnd) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return (
    <section>
      <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>31-Day Schedule</h2>
      <div style={{ display: 'grid', gap: '12px' }}>
        {days.map(dateStr => {
          const phase = getCurrentPhase(dateStr);
          const isToday = dateStr === today;
          const schedule = getScheduleForDate(dateStr);
          return (
            <details key={dateStr} open={isToday} style={{
              background: isToday ? C.surfaceHi : C.surface,
              border: `1px solid ${isToday ? C.cyan : C.border}`,
              borderRadius: '10px',
              padding: '14px 16px',
            }}>
              <summary style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: '0.95rem',
                color: C.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span>
                  {new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span style={{ fontFamily: F.mono, fontSize: '0.68rem', color: phase === 1 ? C.phase1 : C.phase2 }}>
                  Phase {phase}
                </span>
                {isToday && <span style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.cyan }}>TODAY</span>}
              </summary>
              <div style={{ marginTop: '12px', display: 'grid', gap: '6px' }}>
                {schedule.map((block, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    background: C.bg,
                    borderRadius: '6px',
                  }}>
                    <div style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.textDim, minWidth: '90px' }}>
                      {block.start}–{block.end}
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: '0.8rem', color: C.text }}>
                      {block.label}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
