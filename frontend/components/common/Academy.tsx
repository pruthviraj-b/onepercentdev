'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  fetchModules, fetchNote, fetchProgress, fetchBookmarks,
  toggleProgress, toggleBookmark,
  Course, Module, PartMeta, NoteData, countCompletedCourseParts, isPartComplete,
} from '@/services/courseService';
import { logActivity, sendHeartbeat } from '@/services/analyticsService';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Reader } from '@/components/reader/Reader';
import { Landing } from '@/components/course/Landing';
import { ShortcutsModal } from '@/components/reader/ShortcutsModal';
import { useAuth } from '@/features/authentication/AuthProvider';
import { Login } from '@/features/authentication/Login';
import { Dashboard, preloadDashboardData } from '@/components/dashboard/Dashboard';
import { TargetRoom } from '@/components/dashboard/TargetRoom';
import { TypingView } from '@/components/lesson/TypingView';
import { AptitudeView } from '@/components/lesson/AptitudeView';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { TaskHub } from '@/components/assignments/TaskHub';
import { AchievementShare } from '@/components/common/AchievementShare';
import { getMilestones, hasMilestoneSystem, isMilestoneComplete, isMilestoneUnlocked, milestoneForModule, milestoneParts } from '@/features/certificates/milestones';

type View = 'login' | 'dashboard' | 'landing' | 'reader' | 'typing' | 'aptitude' | 'taskhub' | 'targetroom';

function flattenCourseNotes(courseModules: Module[]): PartMeta[] {
  return courseModules.flatMap(module => module.notes.flatMap(note => [note, ...(note.subtopics || [])]));
}

function escapeHtml(str: string): string {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function inlineExportMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code class="export-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToExportHtml(markdown: string): { html: string; toc: string } {
  const lines = String(markdown || '').replace(/\r/g, '').split('\n');
  const html: string[] = [];
  const headings: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    const fence = line.match(/^\s*```\s*([\w+#.-]*)\s*$/);
    if (fence) {
      const language = fence[1] || 'code';
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) { code.push(lines[i]); i += 1; }
      if (i < lines.length) i += 1;
      html.push(`<div class="export-code-shell"><div class="export-code-toolbar"><span>${escapeHtml(language.toUpperCase())}</span></div><pre class="export-code-block">${escapeHtml(code.join('\n'))}</pre></div>`);
      continue;
    }

    const heading = line.match(/^\s*(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = `section-${headings.length + 1}`;
      headings.push(`<li><a href="#${id}">${inlineExportMarkdown(text)}</a></li>`);
      html.push(`<h${level} id="${id}" class="export-h${level}">${inlineExportMarkdown(text)}</h${level}>`);
      i += 1;
      continue;
    }

    const callout = line.match(/^>\s*\[!([A-Z ]+)\]\s*(.*)$/i);
    if (callout) {
      const type = callout[1].toUpperCase();
      const body = [callout[2]];
      i += 1;
      while (i < lines.length && /^>/.test(lines[i])) { body.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      html.push(`<aside class="export-callout"><div class="export-callout-header"><span class="export-callout-icon">●</span><span>${escapeHtml(type)}</span></div><div class="export-callout-body">${inlineExportMarkdown(body.join(' '))}</div></aside>`);
      continue;
    }

    if (i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])) {
      const parseRow = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
      const headers = parseRow(line);
      i += 2;
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(`<tr>${parseRow(lines[i]).map(cell => `<td>${inlineExportMarkdown(cell)}</td>`).join('')}</tr>`); i += 1; }
      html.push(`<div class="export-table-wrap"><table class="export-table"><thead><tr>${headers.map(cell => `<th>${inlineExportMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`);
      continue;
    }

    const list = line.match(/^\s*([-*+] |\d+[.)] )/);
    if (list) {
      const ordered = /^\d/.test(list[1]);
      const items: string[] = [];
      while (i < lines.length && new RegExp(`^\\s*${ordered ? '\\d+[.)]' : '[-*+]'} `).test(lines[i])) {
        items.push(`<li>${inlineExportMarkdown(lines[i].replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ''))}</li>`);
        i += 1;
      }
      html.push(`<${ordered ? 'ol' : 'ul'} class="export-list">${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^(\s*```|\s*#{1,3}\s|\s*[-*+] |\s*\d+[.)] |\s*>|\s*\|)/.test(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p class="export-paragraph">${inlineExportMarkdown(paragraph.join(' '))}</p>`);
  }

  const toc = headings.length ? `<section class="doc-toc"><h2 class="doc-toc-title">Contents</h2><ol class="doc-toc-list">${headings.join('')}</ol></section>` : '';
  return { html: html.join('\n'), toc };
}

// ── Signal-deck tokens (matches Dashboard / Landing) ───────────────────────
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
  violet:    '#3B82F6',
  violetDim: 'rgba(59,130,246,0.12)',
  green:     '#22C55E',
  greenDim:  'rgba(34,197,94,0.12)',
  amber:     '#F59E0B',
  red:       '#EF4444',
  onAccent:  '#FFFFFF',
};
const F = {
  display: "'Google Sans Flex', sans-serif",
  body:    "'Google Sans Flex', sans-serif",
  mono:    "'Google Sans Flex', sans-serif",
};

// ── Pro Navbar Dropdown ────────────────────────────────────────────────────
function NavDropdown({
  label, icon, items, align = 'left',
}: {
  label: string;
  icon?: React.ReactNode;
  align?: 'left' | 'right';
  items: { label: string; sublabel?: string; onClick: () => void; icon?: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px',
          background: open ? C.surfaceHi : 'transparent',
          border: `1px solid ${open ? C.borderHi : 'transparent'}`,
          borderRadius: 9, color: open ? C.cyan : C.text,
          fontFamily: F.body, fontWeight: 600, fontSize: '0.86rem',
          cursor: 'pointer', transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
      >
        {icon}
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease', opacity: 0.7 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', [align]: 0, minWidth: 250,
            background: `linear-gradient(180deg, ${C.surfaceHi}, ${C.surface})`,
            border: `1px solid ${C.borderHi}`, borderRadius: 14,
            boxShadow: `0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(76,216,224,0.06)`,
            padding: 7, zIndex: 200,
            animation: 'navDropIn 140ms ease',
          }}
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              onClick={() => { it.onClick(); setOpen(false); }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '10px 12px 10px 16px', background: hoverIdx === i ? C.surface : 'transparent',
                border: 'none', borderRadius: 9,
                color: C.text, cursor: 'pointer', fontFamily: F.body,
                transition: 'background 120ms ease',
              }}
            >
              <span
                style={{
                  position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3, borderRadius: 3,
                  background: C.cyan, opacity: hoverIdx === i ? 1 : 0,
                  transition: 'opacity 120ms ease',
                }}
              />
              {it.icon && (
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: hoverIdx === i ? C.cyanDim : C.bg,
                  color: hoverIdx === i ? C.cyan : C.textDim,
                  transition: 'background 120ms ease, color 120ms ease',
                }}>
                  {it.icon}
                </span>
              )}
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: hoverIdx === i ? C.cyan : C.text, transition: 'color 120ms ease' }}>
                  {it.label}
                </div>
                {it.sublabel && <div style={{ fontSize: '0.72rem', color: C.textDim, marginTop: 1 }}>{it.sublabel}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cinematic chapter title card (shown above the reader) ─────────────────
function ChapterHero({
  courseTitle, moduleName, partLabel, title, isCompleted,
}: { courseTitle: string; moduleName: string; partLabel: string; title: string; isCompleted: boolean }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', padding: '28px 32px 22px',
      background: `radial-gradient(1100px 260px at 15% 0%, ${C.cyanDim}, transparent 60%), radial-gradient(900px 220px at 90% 10%, ${C.violetDim}, transparent 65%), ${C.bg}`,
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{
          fontFamily: F.mono, fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em',
          color: C.onAccent, background: isCompleted ? C.green : C.cyan, padding: '4px 9px', borderRadius: '5px',
        }}>{partLabel}</span>
        <span style={{ fontFamily: F.mono, fontSize: '0.66rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{moduleName}</span>
        {isCompleted && <span style={{ fontFamily: F.mono, fontSize: '0.64rem', color: C.green }}>✓ completed</span>}
      </div>
      <h1 style={{
        fontFamily: F.display, fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
        letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.1,
      }}>{title}</h1>
      <div style={{ height: '3px', width: '64px', borderRadius: '2px', background: `linear-gradient(90deg, ${C.cyan}, ${C.violet})`, margin: '14px 0 8px' }} />
      <div style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.textFaint, letterSpacing: '0.04em' }}>{courseTitle}</div>
    </div>
  );
}

// ── Chapter-complete celebration overlay ───────────────────────────────────
function ChapterCompleteCelebration({ title, onDone }: { title: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(4,6,9,0.55)', backdropFilter: 'blur(6px)', animation: 'celebFadeIn 220ms ease',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes celebFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes celebFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes celebPop { 0% { transform: scale(0.85); opacity: 0; } 60% { transform: scale(1.03); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes celebRing { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes celebCheck { 0% { stroke-dashoffset: 40; } 100% { stroke-dashoffset: 0; } }
      `}</style>
      <div style={{
        position: 'relative', textAlign: 'center', background: C.amber, border: `3px solid ${C.text}`, boxShadow: `10px 10px 0 ${C.text}`, padding: '28px 24px 24px', animation: 'celebPop 480ms cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        <div style={{ position: 'relative', width: '84px', height: '84px', margin: '0 auto 18px' }}>
          <div style={{ position: 'absolute', inset: -10, border: `3px solid ${C.amber}`, animation: 'celebRing 1s ease-out' }} />
          <div style={{
            width: '84px', height: '84px', background: C.amber,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${C.text}`, boxShadow: `5px 5px 0 ${C.text}`,
          }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={C.onAccent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 40, animation: 'celebCheck 420ms 200ms ease-out both' }} />
            </svg>
          </div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: '0.68rem', color: C.text, letterSpacing: '0.14em', marginBottom: '6px', fontWeight: 900 }}>CHAPTER COMPLETE</div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: '1.3rem', color: C.text, maxWidth: '420px', padding: '0 20px' }}>{title}</div>
      </div>
    </div>
  );
}

const SPACE_PARTICLES = Array.from({ length: 128 }, (_, index) => ({
  angle: (index * 137.5) % 360,
  radius: 130 + ((index * 47) % 360),
  size: 1 + (index % 4) * 0.55,
  depth: index % 3,
  delay: -((index * 0.17) % 8),
  duration: 7 + (index % 7) * 0.8,
}));

function AcademyBootScreen({ stage = 'auth' }: { stage?: 'auth' | 'courses' }) {
  const [phase, setPhase] = useState(0);
  const coursePhases = [
    ['Initializing Intelligence...', 'Mapping your learning universe'],
    ['Building Knowledge Universe...', 'Aligning courses and modules'],
    ['Synchronizing Learning Modules...', 'Pulling your progress into orbit'],
    ['Tuning Learning Orbit...', 'Calibrating your next learning move'],
    ['Opening Learning Portal...', 'Rendering your knowledge galaxy'],
  ];
  const authPhases = [
    ['Calibrating Neural Systems...', 'Securing your learning universe'],
    ['Opening Learning Portal...', 'Preparing your personalized academy'],
  ];
  const phases = stage === 'courses' ? coursePhases : authPhases;

  useEffect(() => {
    let timer: number | undefined;
    const start = () => {
      if (document.hidden) return;
      timer = window.setInterval(() => setPhase(current => (current + 1) % phases.length), 2200);
    };
    const handleVisibility = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
      if (!document.hidden) start();
    };
    start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (timer) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [phases.length]);

  const current = phases[phase];

  return (
    <div className="academy-boot academy-space" role="status" aria-live="polite" aria-label={stage === 'courses' ? 'Opening the learning universe' : 'Opening secure learning portal'}>
      <div className="academy-boot-glow academy-boot-glow-one" aria-hidden="true" />
      <div className="academy-boot-glow academy-boot-glow-two" aria-hidden="true" />
      <div className="academy-boot-grid" aria-hidden="true" />
      <div className="academy-space-stars" aria-hidden="true">
        {SPACE_PARTICLES.map((particle, index) => (
          <i
            key={index}
            className={`academy-space-particle depth-${particle.depth}`}
            style={{ '--angle': `${particle.angle}deg`, '--radius': `${particle.radius}px`, '--size': `${particle.size}px`, '--delay': `${particle.delay}s`, '--duration': `${particle.duration}s` } as any}
          />
        ))}
      </div>
      <div className="academy-space-scene" aria-hidden="true">
        <div className="academy-space-lens academy-space-lens-one" />
        <div className="academy-space-lens academy-space-lens-two" />
        <div className="academy-space-disk academy-space-disk-back" />
        <div className="academy-space-photon-ring" />
        <div className="academy-space-horizon" />
        <div className="academy-space-disk academy-space-disk-front" />
        <div className="academy-space-accretion-glow" />
        <div className="academy-space-pulse academy-space-pulse-one" />
        <div className="academy-space-pulse academy-space-pulse-two" />
      </div>

      {stage === 'courses' && (
        <div className="academy-loading-preview" aria-hidden="true">
          <div className="academy-preview-sidebar">
            <div className="preview-brand"><span /> <i /></div>
            <div className="preview-search" />
            <div className="preview-label" />
            <div className="preview-nav preview-nav-active" /><div className="preview-nav" /><div className="preview-nav" /><div className="preview-nav" />
            <div className="preview-label preview-label-small" />
            <div className="preview-nav" /><div className="preview-nav" />
          </div>
          <div className="academy-preview-main">
            <div className="preview-header"><div className="preview-header-title" /><div className="preview-header-actions"><span /><span /><b /></div></div>
            <div className="preview-heading"><div className="preview-heading-kicker" /><div className="preview-heading-title" /><div className="preview-heading-copy" /></div>
            <div className="preview-stats"><div /><div /><div /></div>
            <div className="preview-course-grid"><div className="preview-course-card"><span /><i /><b /></div><div className="preview-course-card"><span /><i /><b /></div><div className="preview-course-card"><span /><i /><b /></div><div className="preview-course-card"><span /><i /><b /></div></div>
          </div>
        </div>
      )}

      <div className="academy-boot-content">
        <div className="academy-boot-brand">
          <div className="academy-boot-logo" aria-hidden="true"><span>1</span><small>%</small></div>
          <div><strong>Developer Academy</strong><small>YOUR DAILY ADVANTAGE</small></div>
        </div>

        <div className="academy-boot-orbit" aria-hidden="true">
          <div className="academy-boot-orbit-ring academy-boot-orbit-ring-one" />
          <div className="academy-boot-orbit-ring academy-boot-orbit-ring-two" />
          <div className="academy-boot-orbit-core"><span>{stage === 'courses' ? '01' : '...'}</span></div>
        </div>

        <div className="academy-boot-copy">
          <p className="academy-boot-kicker"><span /> {stage === 'courses' ? 'BUILDING YOUR ACADEMY' : 'SECURE ACCESS'}</p>
          <h1>{current[0]}</h1>
          <p>{current[1]}</p>
        </div>

        <div className="academy-boot-progress" aria-hidden="true">
          <div className="academy-boot-progress-track"><span /></div>
          <div className="academy-boot-progress-meta"><span>{stage === 'courses' ? 'COURSE SYSTEM ONLINE' : 'CHECKING CONNECTION'}</span><span className="academy-boot-live">LIVE</span></div>
        </div>

        <div className="academy-boot-steps" aria-hidden="true">
          {(stage === 'courses' ? ['Profile', 'Courses', 'Progress'] : ['Identity', 'Workspace']).map((label, index) => (
            <div className={index <= phase ? 'academy-boot-step is-active' : 'academy-boot-step'} key={label}><span>{index < phase ? '✓' : String(index + 1).padStart(2, '0')}</span>{label}</div>
          ))}
        </div>
      </div>
      <div className="academy-space-sidecopy academy-space-sidecopy-right" aria-hidden="true">
        <span>ORBITAL STATUS</span>
        <strong>GRAVITY ONLINE</strong>
        <small>128 PARTICLE STREAMS</small>
        <small>KNOWLEDGE FIELD STABLE</small>
      </div>
      <div className="academy-boot-footer"><span>ONE PERCENT BETTER / EVERY DAY</span><span>PLEASE HOLD — WE ARE MAKING SPACE FOR YOUR NEXT REP</span></div>
    </div>
  );
}

function MilestoneCompleteCelebration({ courseTitle, milestoneName, skills, modulesCompleted, onDone }: { courseTitle: string; milestoneName: string; skills: string[]; modulesCompleted: number; onDone: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onDone, 6500); return () => window.clearTimeout(timer); }, [onDone]);
  return <div className="milestone-celebration" role="dialog" aria-modal="true" aria-label={`${milestoneName} completed`}><div className="milestone-confetti" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ ['--i' as any]: i }} />)}</div><div className="milestone-celebration-card"><button type="button" className="milestone-celebration-close" onClick={onDone} aria-label="Close celebration">×</button><div className="milestone-celebration-kicker">MILESTONE UNLOCKED</div><div className="milestone-celebration-badge">✓</div><h2>{milestoneName} completed</h2><p>{courseTitle} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p><div className="milestone-celebration-stats"><span><b>{modulesCompleted}</b> modules completed</span><span><b>100%</b> milestone progress</span></div><div className="milestone-celebration-skills">{skills.slice(0, 5).map(skill => <span key={skill}>✓ {skill}</span>)}</div><strong className="milestone-celebration-message">You earned this. Keep building your proof of progress.</strong></div></div>;
}

export function Academy() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>('login');
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [completedParts, setCompletedParts] = useState<number[]>([]);
  const [bookmarkedParts, setBookmarkedParts] = useState<number[]>([]);
  const [currentPart, setCurrentPart] = useState<number>(1);
  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'files'>('notes');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [booting, setBooting] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [courseNavCollapsed, setCourseNavCollapsed] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [milestoneCelebration, setMilestoneCelebration] = useState<{ name: string; skills: string[]; modulesCompleted: number } | null>(null);

  useEffect(() => {
    if (window.innerWidth <= 860) setSidebarOpen(false);
  }, []);

  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === activeCourseId) || null;
  }, [courses, activeCourseId]);

  useEffect(() => {
    if (activeCourse) {
      document.title = `Learning Platform — ${activeCourse.title}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', activeCourse.author ? `${activeCourse.description} Series by ${activeCourse.author}. Complete notes, code, and video.` : `${activeCourse.description}. Complete notes and code.`);
      }
    } else {
      document.title = 'Learning Platform';
    }
  }, [activeCourse]);

  const totalParts = flattenCourseNotes(modules).length;
  const completedCount = countCompletedCourseParts(modules, completedParts);
  const progressPct = totalParts > 0 ? Math.round((completedCount / totalParts) * 100) : 0;

  const updateURL = useCallback((courseId: string | null, part: number | null, viewParam?: string | null) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (courseId) {
      params.set('course', courseId);
      if (part !== null) {
        params.set('part', String(part));
      } else {
        params.delete('part');
      }
    } else {
      params.delete('course');
      params.delete('part');
    }
    if (viewParam) {
      params.set('view', viewParam);
    } else {
      params.delete('view');
    }
    const search = params.toString();
    const newPath = search ? `?${search}` : window.location.pathname;
    window.history.pushState({ view: viewParam || null, course: courseId || null, part: part || null }, '', newPath);
  }, []);

  const handleSelectCourse = useCallback(async (courseId: string, shouldUpdateURL = true, requestedPart?: number) => {
    setActiveCourseId(courseId);
    localStorage.setItem('opd_active_course', courseId);
    setBooting(true);
    logActivity('course_open', courseId);
    sendHeartbeat(courseId);

    const savedPart = localStorage.getItem(`opd_last_part_${courseId}`);

    try {
      const [mods, prog, bkm] = await Promise.all([
        fetchModules(courseId),
        fetchProgress(courseId),
        fetchBookmarks(courseId)
      ]);
      setModules(mods);
      setCompletedParts(prog);
      setBookmarkedParts(bkm);

      const allPartsMeta = flattenCourseNotes(mods);
      let initialPart = requestedPart ?? (allPartsMeta[0]?.part || 1);
      if (requestedPart === undefined && savedPart) {
        const parsed = parseFloat(savedPart);
        if (allPartsMeta.some(p => p.part === parsed)) {
          initialPart = parsed;
        }
      }
      setCurrentPart(initialPart);
      if (requestedPart !== undefined) {
        setView('reader');
        setNoteLoading(true);
        try {
          const data = await fetchNote(courseId, initialPart);
          setNoteData(data);
        } catch {
          setNoteData(null);
        } finally {
          setNoteLoading(false);
        }
      } else {
        setView('landing');
      }
      if (shouldUpdateURL) {
        updateURL(courseId, requestedPart ?? null, requestedPart !== undefined ? 'reader' : 'landing');
      }
    } catch (err) {
      console.error(`Error loading course ${courseId}:`, err);
    } finally {
      setBooting(false);
    }
  }, [updateURL]);

  const handleOpenLesson = useCallback((courseId: string, part: number) => {
    void handleSelectCourse(courseId, true, part);
  }, [handleSelectCourse]);

  const handleChangeCourse = useCallback(() => {
    setActiveCourseId(null);
    localStorage.removeItem('opd_active_course');
    setModules([]);
    setCompletedParts([]);
    setBookmarkedParts([]);
    setNoteData(null);
    setView('landing');
    updateURL(null, null, 'landing');
  }, [updateURL]);

  const selectPart = useCallback(async (part: number, tab: 'notes' | 'files' = 'notes', shouldUpdateURL = true) => {
    if (!activeCourseId) return;
    setCurrentPart(part);
    setActiveTab(tab);
    setView('reader');
    setNoteLoading(true);
    localStorage.setItem(`opd_last_part_${activeCourseId}`, String(part));
    if (shouldUpdateURL) {
      updateURL(activeCourseId, part, 'reader');
    }
    logActivity('lesson_start', activeCourseId, part);
    sendHeartbeat(activeCourseId, part);
    try {
      const data = await fetchNote(activeCourseId, part);
      setNoteData(data);
    } catch {
      setNoteData(null);
    } finally {
      setNoteLoading(false);
    }
  }, [activeCourseId, updateURL]);

  const handleGoHome = useCallback(() => {
    setActiveCourseId(null);
    localStorage.removeItem('opd_active_course');
    setView('dashboard');
    setNoteData(null);
    updateURL(null, null, 'dashboard');
  }, [updateURL]);

  const heartbeatCourseRef = useRef<string | null>(null);
  const heartbeatPartRef = useRef<number>(1);
  const heartbeatViewRef = useRef<string>('dashboard');
  heartbeatCourseRef.current = activeCourseId;
  heartbeatPartRef.current = currentPart;
  heartbeatViewRef.current = view;

  useEffect(() => {
    if (!user) return;
    logActivity('login');
    const hb = setInterval(() => {
      sendHeartbeat(
        heartbeatCourseRef.current || undefined,
        heartbeatViewRef.current === 'reader' ? heartbeatPartRef.current : undefined,
      );
    }, 60000);
    sendHeartbeat(heartbeatCourseRef.current || undefined, heartbeatViewRef.current === 'reader' ? heartbeatPartRef.current : undefined);
    return () => clearInterval(hb);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    // Start the complete dashboard preload immediately after auth resolves.
    // The splash is presentation-only; it must never be the thing that starts
    // network activity. Dashboard data is shared with the Dashboard component
    // through its module-level request cache.
    const dashboardDataPromise = preloadDashboardData();
    const splashMinimum = new Promise<void>(resolve => window.setTimeout(resolve, 1400));
    const params = new URLSearchParams(window.location.search);
    const courseParam = params.get('course');
    const partParam = params.get('part');

    // Establish the destination before the presentation timer can finish.
    // Without this, the initial `login` view could briefly fall through to
    // the empty reader shell while dashboard requests were still resolving.
    if (!courseParam) setView('dashboard');

    dashboardDataPromise
      .then(({ courses: fetchedCourses }) => {
        setCourses(fetchedCourses);

        if (courseParam && fetchedCourses.some(c => c.id === courseParam)) {
          setActiveCourseId(courseParam);
          Promise.all([
            fetchModules(courseParam),
            fetchProgress(courseParam),
            fetchBookmarks(courseParam)
          ]).then(async ([mods, prog, bkm]) => {
            setModules(mods);
            setCompletedParts(prog);
            setBookmarkedParts(bkm);
            logActivity('course_open', courseParam);
            sendHeartbeat(courseParam);

            if (partParam) {
              const partNum = parseFloat(partParam);
              setCurrentPart(partNum);
              setView('reader');
              setNoteLoading(true);
              try {
                const data = await fetchNote(courseParam, partNum);
                setNoteData(data);
              } catch {
                setNoteData(null);
              } finally {
                setNoteLoading(false);
              }
            } else {
              const allPartsMeta = flattenCourseNotes(mods);
              const savedPart = localStorage.getItem(`opd_last_part_${courseParam}`);
              let initialPart = allPartsMeta[0]?.part || 1;
              if (savedPart) {
                const parsed = parseFloat(savedPart);
                if (allPartsMeta.some(p => p.part === parsed)) {
                  initialPart = parsed;
                }
              }
              setCurrentPart(initialPart);
              setView('reader');
              setNoteLoading(true);
              try {
                const data = await fetchNote(courseParam, initialPart);
                setNoteData(data);
              } catch {
                setNoteData(null);
              } finally {
                setNoteLoading(false);
              }
            }
            return splashMinimum.then(() => setBooting(false));
          }).catch(() => setBooting(false));
        } else {
          setView('dashboard');
          // Keep the branded scene up until the shared dashboard preload has
          // completed. Mounting Dashboard after only the visual timer ends
          // exposes its internal loading placeholders as a blank gap.
          splashMinimum.then(() => setBooting(false));
        }
      })
        .catch(err => {
          console.error('Failed to boot Academy:', err);
          setBooting(false);
        });
  }, [handleSelectCourse, user, authLoading]);

  useEffect(() => {
    const handlePopState = async () => {
      const params = new URLSearchParams(window.location.search);
      const courseParam = params.get('course');
      const partParam = params.get('part');

      if (courseParam) {
        if (courseParam !== activeCourseId) {
          setActiveCourseId(courseParam);
          setBooting(true);
          try {
            const [mods, prog, bkm] = await Promise.all([
              fetchModules(courseParam),
              fetchProgress(courseParam),
              fetchBookmarks(courseParam)
            ]);
            setModules(mods);
            setCompletedParts(prog);
            setBookmarkedParts(bkm);

            if (partParam) {
              const partNum = parseFloat(partParam);
              setCurrentPart(partNum);
              setView('reader');
              setNoteLoading(true);
              const data = await fetchNote(courseParam, partNum);
              setNoteData(data);
              setNoteLoading(false);
            } else {
              const allPartsMeta = flattenCourseNotes(mods);
              const savedPart = localStorage.getItem(`opd_last_part_${courseParam}`);
              let initialPart = allPartsMeta[0]?.part || 1;
              if (savedPart) {
                const parsed = parseFloat(savedPart);
                if (allPartsMeta.some(p => p.part === parsed)) {
                  initialPart = parsed;
                }
              }
              setCurrentPart(initialPart);
              setView('reader');
              setNoteLoading(true);
              try {
                const data = await fetchNote(courseParam, initialPart);
                setNoteData(data);
              } catch {
                setNoteData(null);
              } finally {
                setNoteLoading(false);
              }
            }
          } catch (err) {
            console.error(err);
          } finally {
            setBooting(false);
          }
        } else {
          if (partParam) {
            const partNum = parseFloat(partParam);
            setCurrentPart(partNum);
            setView('reader');
            setNoteLoading(true);
            try {
              const data = await fetchNote(courseParam, partNum);
              setNoteData(data);
            } catch {
              setNoteData(null);
            } finally {
              setNoteLoading(false);
            }
          } else {
            setNoteData(null);
            setView('landing');
          }
        }
      } else {
        setActiveCourseId(null);
        setModules([]);
        setCompletedParts([]);
        setBookmarkedParts([]);
        setNoteData(null);
        setView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeCourseId]);

  const handleToggleComplete = useCallback(async (part: number) => {
    if (!activeCourseId) return;
    const note = flattenCourseNotes(modules).find(candidate => candidate.part === part);
    const relatedParts = note?.subtopics?.length ? [part, ...note.subtopics.map(subtopic => subtopic.part)] : [part];
    const isDone = note ? isPartComplete(note, completedParts) : completedParts.includes(part);
    setCompletedParts(prev => isDone ? prev.filter(p => !relatedParts.includes(p)) : Array.from(new Set([...prev, ...relatedParts])));
    await Promise.all(relatedParts.map(relatedPart => toggleProgress(activeCourseId, relatedPart, !isDone)));
    if (!isDone) {
      logActivity('lesson_complete', activeCourseId, part);
      if (hasMilestoneSystem(activeCourseId)) {
        const after = new Set([...completedParts, ...relatedParts]);
        const newlyCompleted = getMilestones(activeCourseId).find(milestone => {
          const wasComplete = isMilestoneComplete(modules, completedParts, milestone);
          const nowComplete = isMilestoneUnlocked(activeCourseId, modules, Array.from(after), milestone) && isMilestoneComplete(modules, Array.from(after), milestone);
          return !wasComplete && nowComplete;
        });
        if (newlyCompleted) {
          const celebrationKey = `opd_milestone_celebrated_${user?.uid || 'local'}_${activeCourseId}_${newlyCompleted.id}`;
          if (!localStorage.getItem(celebrationKey)) {
            localStorage.setItem(celebrationKey, new Date().toISOString());
            setMilestoneCelebration({ name: newlyCompleted.name, skills: newlyCompleted.skills, modulesCompleted: newlyCompleted.moduleIds.length });
          }
        }
      }
      // Fire the chapter-complete celebration only when moving TO completed
      const title = noteData && noteData.part === part ? noteData.title : `Part ${part}`;
      setCelebration(title);
    } else {
      logActivity('progress_marked', activeCourseId, part);
    }
  }, [activeCourseId, completedParts, modules, noteData, user?.uid]);

  const handleToggleBookmark = useCallback(async (part: number) => {
    if (!activeCourseId) return;
    const isPinned = bookmarkedParts.includes(part);
    setBookmarkedParts(prev => isPinned ? prev.filter(p => p !== part) : [...prev, part]);
    await toggleBookmark(activeCourseId, part, !isPinned);
    if (!isPinned) logActivity('bookmark_added', activeCourseId, part);
  }, [activeCourseId, bookmarkedParts]);

  const downloadFile = (filename: string, content: string, type = 'text/plain;charset=utf-8') => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLesson = useCallback((format: 'pdf' | 'markdown' | 'docx') => {
    if (!noteData) return;
    const safeTitle = noteData.title.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
    const filename = `Part-${noteData.part}-${safeTitle || 'lesson'}`;

    const generatedAt = new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });

    const EXPORT_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>__TITLE__ | __COURSE__</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wdth,wght@6..144,25..100,100..900&display=swap');
      :root {
        color-scheme: light;
        --ink: #1F2937; --muted: #6B7280; --line: #1F2937; --accent: #F98012;
        --accent-soft: #fff0e9; --hair: #E5E7EB; --surface: #ffffff; --surface-alt: #fff8f1;
        --shadow-sm: 0 1px 2px rgba(20,22,30,0.06), 0 1px 1px rgba(20,22,30,0.04);
        --shadow-md: 0 4px 14px rgba(20,22,30,0.08), 0 2px 4px rgba(20,22,30,0.05);
      }
      * { box-sizing: border-box; }
      html { counter-reset: page; }
      body {
        margin: 0; font-family: 'Google Sans Flex', sans-serif;
        color: var(--ink); background: #f2f2f5; line-height: 1.7; font-size: 15.5px;
        -webkit-font-smoothing: antialiased;
      }
      @page {
        size: A4; margin: 22mm 18mm 24mm;
        @bottom-center { content: "Page " counter(page) " of " counter(pages); font-family: 'Google Sans Flex', sans-serif; font-size: 8.5px; color: #8a8f9a; letter-spacing: 0.05em; }
      }
      .doc-page { max-width: 960px; margin: 0 auto; padding: 44px 48px 56px; background: var(--surface); box-shadow: var(--shadow-md); }

      .letterhead {
        display: flex; align-items: center; gap: 16px; padding-bottom: 22px; margin-bottom: 28px;
        border-bottom: 2px solid var(--ink);
      }
      .letterhead-seal {
        width: 46px; height: 46px; border-radius: 10px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Google Sans Flex', sans-serif; font-weight: 700; font-size: 1rem; color: #fff;
        background: linear-gradient(145deg, var(--accent), #e84e35); box-shadow: var(--shadow-sm);
      }
      .letterhead-text { flex: 1; }
      .letterhead-org {
        font-family: 'Google Sans Flex', sans-serif; font-weight: 600; font-size: 1.15rem;
        letter-spacing: -0.01em; margin: 0; color: var(--ink);
      }
      .letterhead-dept {
        font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--muted); margin-top: 2px; font-weight: 500;
      }
      .letterhead-ref {
        text-align: right; font-family: 'Google Sans Flex', sans-serif;
        font-size: 0.65rem; letter-spacing: 0.02em; color: var(--muted); line-height: 1.6;
      }
      .letterhead-ref strong { color: var(--ink); }

      .doc-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 24px; padding-bottom: 20px; margin-bottom: 28px; border-bottom: 1px solid var(--hair);
      }
      .doc-badge {
        display: inline-block; font-family: 'Google Sans Flex', sans-serif; font-size: 0.65rem;
        font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
        background: var(--accent-soft); color: var(--accent); padding: 5px 11px; border-radius: 5px; margin-bottom: 10px;
      }
      .doc-header h1 {
        margin: 0 0 6px; font-family: 'Google Sans Flex', sans-serif; font-weight: 600;
        font-size: 1.25rem; letter-spacing: -0.01em;
      }
      .doc-header p { margin: 0; color: var(--muted); font-size: 0.85rem; }
      .doc-meta-right { text-align: right; font-size: 0.8rem; color: var(--muted); }
      .doc-meta-right p { margin: 0 0 4px; }
      .doc-meta-right strong { color: var(--ink); font-weight: 600; }

      .doc-title-block {
        text-align: center; padding: 32px 28px; margin-bottom: 30px;
        border-radius: 14px; position: relative; overflow: hidden;
        background: linear-gradient(180deg, var(--surface-alt), var(--surface));
        border: 1px solid var(--hair); box-shadow: var(--shadow-sm);
      }
      .doc-title-block::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
        background: linear-gradient(90deg, var(--accent), #5b3fd6);
      }
      .doc-eyebrow {
        display: block; font-size: 0.68rem; letter-spacing: 0.16em; text-transform: uppercase;
        color: var(--accent); font-weight: 600; margin-bottom: 12px;
      }
      .doc-title-block h1 {
        margin: 0 0 18px; font-family: 'Google Sans Flex', sans-serif; font-weight: 600;
        font-size: 2rem; line-height: 1.25; letter-spacing: -0.015em; color: var(--ink);
      }
      .doc-meta-row {
        display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 16px;
        font-size: 0.8rem; color: var(--muted);
      }
      .doc-meta-row span {
        background: var(--surface); border: 1px solid var(--hair); border-radius: 20px;
        padding: 5px 13px;
      }
      .doc-meta-row span strong { color: var(--ink); font-weight: 600; }

      .doc-toc {
        margin-bottom: 32px; padding: 24px 28px; border-radius: 14px;
        background: var(--surface-alt); border: 1px solid var(--hair);
      }
      .doc-toc-title {
        font-family: 'Google Sans Flex', sans-serif; font-weight: 600; font-size: 1rem;
        margin: 0 0 14px; display: flex; align-items: center; gap: 9px; color: var(--ink);
      }
      .doc-toc-title::before {
        content: ''; width: 18px; height: 3px; background: var(--accent); border-radius: 2px; display: inline-block;
      }
      .doc-toc-list { list-style: none; margin: 0; padding: 0; counter-reset: toc; }
      .doc-toc-list li {
        counter-increment: toc; display: flex; align-items: baseline; gap: 10px;
        font-size: 0.88rem; padding: 7px 0; color: var(--ink);
      }
      .doc-toc-list li::before {
        content: counter(toc, decimal-leading-zero); font-family: 'Google Sans Flex', sans-serif;
        font-size: 0.72rem; color: var(--accent); font-weight: 600; flex-shrink: 0;
      }
      .doc-toc-list li::after {
        content: ''; flex: 1; border-bottom: 1px dotted var(--hair); margin: 0 4px; transform: translateY(-3px);
      }
      .doc-toc-list a { color: var(--ink); text-decoration: none; font-weight: 500; }
      .doc-toc-empty { font-size: 0.85rem; color: var(--muted); font-style: italic; }

      .doc-section { margin-bottom: 24px; }
      .export-h1, .export-h2, .export-h3 {
        font-family: 'Google Sans Flex', sans-serif; font-weight: 600; color: var(--ink);
      }
      .export-h1 {
        font-size: 1.5rem; margin: 2.6rem 0 1rem; padding-bottom: 10px;
        border-bottom: 2px solid var(--ink); letter-spacing: -0.01em;
      }
      .export-h2 {
        font-size: 1.2rem; margin: 2.1rem 0 0.8rem; padding-left: 13px;
        border-left: 3px solid var(--accent); letter-spacing: -0.005em;
      }
      .export-h3 { font-size: 1.02rem; margin: 1.6rem 0 0.6rem; font-style: italic; color: var(--muted); }
      .export-paragraph { margin: 0 0 1.1rem; font-size: 0.97rem; color: var(--ink); }
      .export-list { padding-left: 1.5rem; margin: 0 0 1.1rem; }
      .export-list li { margin-bottom: 0.55rem; }

      .export-callout {
        padding: 16px 20px; border-radius: 10px; border: 1px solid var(--hair); border-left: 4px solid var(--accent);
        background: var(--accent-soft); margin: 1.7rem 0; box-shadow: var(--shadow-sm);
      }
      .export-callout-header { display:flex; align-items:center; gap:8px; font-weight:600; margin-bottom:0.5rem; font-family: 'Google Sans Flex', sans-serif; color: var(--ink); }
      .export-callout-icon { font-size:1rem; color: var(--accent); }
      .export-callout-body { color:var(--ink) }

      .export-inline-code {
        display:inline-block; padding:2px 7px; margin:0 1px; border-radius: 5px;
        background:var(--surface-alt); border: 1px solid var(--hair);
        font-family:'Google Sans Flex', sans-serif; font-size:0.85em; color: #5b3fd6;
      }
      .export-code-shell {
        overflow:hidden; border-radius: 10px; border:1px solid var(--hair);
        background:#1a1d23; margin:1.7rem 0; box-shadow: var(--shadow-md);
      }
      .export-code-toolbar {
        display:flex; justify-content:space-between; align-items:center; padding:9px 16px;
        background:#25282f; border-bottom:1px solid #33363e; color:#9aa0ac;
        font-family:'Google Sans Flex', sans-serif; font-size:0.68rem; font-weight:600; letter-spacing:0.08em;
      }
      .export-code-toolbar::before {
        content: '● ● ●'; letter-spacing: 2px; color: #4a4e58; font-size: 0.6rem;
      }
      .export-code-block {
        margin:0; padding:16px; font-family:'Google Sans Flex', sans-serif; font-size:0.83rem;
        color:#e4e6ea; white-space:pre-wrap; word-break:break-word; background:transparent; line-height: 1.6;
      }
      .export-table-wrap {
        overflow:hidden; border-radius: 10px; border:1px solid var(--hair);
        margin:1.7rem 0; box-shadow: var(--shadow-sm);
      }
      .export-table { width:100%; border-collapse:collapse; font-size:0.89rem; background:var(--surface) }
      .export-table th {
        background:var(--ink); color: #fff; text-align:left;
        padding:12px 16px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; font-size:0.72rem;
      }
      .export-table td { padding:11px 16px; border-top:1px solid var(--hair); }
      .export-table tbody tr:nth-child(even) { background: var(--surface-alt); }
      .export-table tbody tr:hover { background: var(--accent-soft); }

      .doc-footer { margin-top: 52px; padding-top: 24px; border-top: 1px solid var(--hair); }
      .doc-cert-line { font-size: 0.82rem; color: var(--muted); font-style: italic; margin-bottom: 26px; }
      .doc-signature-row { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 24px; }
      .doc-signature-block { flex: 1; text-align: center; }
      .doc-signature-line { border-bottom: 1px solid var(--ink); height: 40px; margin-bottom: 6px; }
      .doc-signature-label { font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
      .doc-footer-meta {
        display: flex; justify-content: space-between; align-items: center;
        font-family: 'Google Sans Flex', sans-serif; font-size: 0.66rem; color: var(--muted);
        letter-spacing: 0.02em; padding-top: 14px; border-top: 1px solid var(--hair);
      }

      @media print {
        html { counter-reset: page; }
        body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .doc-page { padding: 0; max-width: 100%; background: #fff; box-shadow: none; position: relative; }
        .doc-page::before, .doc-page::after {
          content: ''; position: fixed; width: 22px; height: 22px; border-color: var(--hair); border-style: solid; opacity: 0.55;
        }
        .doc-page::before { top: 8mm; left: 8mm; border-width: 1px 0 0 1px; }
        .doc-page::after { bottom: 8mm; right: 8mm; border-width: 0 1px 1px 0; }
        .letterhead, .doc-title-block, .doc-toc, .export-code-shell, .export-table-wrap, .export-callout, .doc-signature-row {
          break-inside: avoid; page-break-inside: avoid;
        }
        .export-table th { background: #2a2d33 !important; }
        .export-code-shell { background: #1f2127 !important; }
      }
    </style>
  </head>
  <body>
    <div class="doc-page">

      <div class="letterhead">
        <div class="letterhead-seal">1%</div>
        <div class="letterhead-text">
          <h1 class="letterhead-org">Learning Platform</h1>
          <div class="letterhead-dept">Office of Curriculum &amp; Certified Learning Records</div>
        </div>
        <div class="letterhead-ref">
          <div><strong>Ref.</strong> __COURSE__/${noteData.part}/2026</div>
          <div><strong>Category:</strong> __MODULE__</div>
        </div>
      </div>

      <header class="doc-header">
        <div>
          <div class="doc-badge">__COURSE__</div>
          <h1>__TITLE__</h1>
          <p>__MODULE__ &nbsp;•&nbsp; Part ${noteData.part} &nbsp;•&nbsp; Classification: ${escapeHtml(noteData.importance || 'Standard')}</p>
        </div>
        <div class="doc-meta-right">
          <p><strong>Date Issued:</strong> __GENERATED__</p>
          <p><strong>Document Version:</strong> 1.0</p>
          <p><strong>Authority:</strong> Learning Platform</p>
        </div>
      </header>

      <section class="doc-title-block">
        <span class="doc-eyebrow">Official Lesson Record — For Reference &amp; Certification Purposes</span>
        <h1>__TITLE__</h1>
        <div class="doc-meta-row">
          <span><strong>Course:</strong> __COURSE__</span>
          <span><strong>Module:</strong> __MODULE__</span>
          <span><strong>Part No.:</strong> ${noteData.part}</span>
          <span><strong>Duration:</strong> ${Math.max(1, Math.round((noteData.notes || '').split(/\s+/).length / 200))} min</span>
          <span><strong>Level:</strong> ${escapeHtml(noteData.difficulty || noteData.importance || 'General')}</span>
        </div>
      </section>

      __TOC__

      <div class="doc-section">__NOTES__</div>

      <footer class="doc-footer">
        <p class="doc-cert-line">
          This document is issued as an official transcript of record for the above-referenced lesson,
          certified accurate as of the date of issue by Learning Platform.
        </p>

        <div class="doc-signature-row">
          <div class="doc-signature-block">
            <div class="doc-signature-line"></div>
            <div class="doc-signature-label">Instructor / Author</div>
          </div>
          <div class="doc-signature-block">
            <div class="doc-signature-line"></div>
            <div class="doc-signature-label">Academic Registrar</div>
          </div>
          <div class="doc-signature-block">
            <div class="doc-signature-line"></div>
            <div class="doc-signature-label">Date</div>
          </div>
        </div>

        <div class="doc-footer-meta">
          <span>__COURSE__ • __MODULE__ • Part ${noteData.part}</span>
          <span>Issued __GENERATED__ • Learning Platform — Official Record</span>
        </div>
      </footer>

    </div>
  </body>
</html>`;

    const renderedExport = markdownToExportHtml(noteData.notes || '');
    const notesHtml = renderedExport.html;

    const fullHtml = EXPORT_TEMPLATE
      .replace(/__TITLE__/g, escapeHtml(noteData.title))
      .replace(/__COURSE__/g, escapeHtml(activeCourse?.id || activeCourseId || 'sql'))
      .replace(/__MODULE__/g, escapeHtml(noteData.module || ''))
      .replace(/__GENERATED__/g, escapeHtml(generatedAt))
      .replace(/__TOC__/g, renderedExport.toc)
      .replace(/__NOTES__/g, notesHtml);

    if (format === 'markdown') {
      const md = `# ${noteData.title}\n\nModule: ${noteData.module}\nPart: ${noteData.part}\nImportance: ${noteData.importance}\nCourse: ${activeCourse?.title || activeCourseId || 'Course'}\n\n---\n\n${noteData.notes}`;
      downloadFile(`${filename}.md`, md, 'text/markdown;charset=utf-8');
    } else if (format === 'docx') {
      downloadFile(`${filename}.docx`, fullHtml, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8');
    } else {
      const popup = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
      if (popup) {
        popup.document.write(fullHtml);
        popup.document.close();
        popup.document.title = `${noteData.title} — Export`;
      } else {
        downloadFile(`${filename}.html`, fullHtml, 'text/html;charset=utf-8');
      }
    }
    setDownloadMenuOpen(false);
  }, [noteData, activeCourse, activeCourseId]);

  const handleLaunch = () => {
    if (noteData) setView('reader');
    else selectPart(currentPart);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts(s => !s);
        return;
      }
      if (showShortcuts) return;
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        if (view === 'landing') setView('reader');
      }
      if (e.key === 's' && view === 'reader') {
        setSidebarOpen(o => !o);
      }
      if (e.key === 'b' && view === 'reader') handleToggleBookmark(currentPart);
      if (e.key === 'c' && view === 'reader') handleToggleComplete(currentPart);
      if (e.key === 'Escape') {
        if (view === 'reader' && !showShortcuts) handleGoHome();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, currentPart, showShortcuts, handleToggleBookmark, handleToggleComplete]);

  const allParts: PartMeta[] = flattenCourseNotes(modules);
  const currentIdx = allParts.findIndex(p => p.part === currentPart);
  const currentPartMeta = allParts.find(p => p.part === currentPart);
  const currentPartDone = currentPartMeta ? isPartComplete(currentPartMeta, completedParts) : completedParts.includes(currentPart);
  const currentModule = modules.find(module => flattenCourseNotes([module]).some(note => note.part === currentPart)) || null;
  const currentModuleNotes = currentModule ? flattenCourseNotes([currentModule]) : [];
  const currentModuleComplete = currentModuleNotes.length > 0 && currentModuleNotes.every(note => isPartComplete(note, completedParts));
  const currentMilestone = activeCourseId && currentModule && hasMilestoneSystem(activeCourseId)
    ? milestoneForModule(activeCourseId, currentModule.id)
    : null;
  const currentMilestoneParts = currentMilestone ? milestoneParts(modules, currentMilestone) : [];
  const currentMilestoneComplete = Boolean(currentMilestone && isMilestoneUnlocked(activeCourseId || '', modules, completedParts, currentMilestone) && currentMilestoneParts.length > 0 && currentMilestoneParts.every(part => completedParts.includes(part)));
  const isMilestoneFinalModule = Boolean(currentMilestone && currentModule && currentMilestone.moduleIds.at(-1) === currentModule.id);

  if (authLoading) {
    return <AcademyBootScreen stage="auth" />;
  }

  if (!user) {
    return <Login />;
  }

  // Never expose the reader shell while the authenticated route is still
  // resolving its initial dashboard/course state.
  if (booting) {
    return <AcademyBootScreen stage="courses" />;
  }

  // A stale landing/reader URL can briefly arrive without a selected course.
  // Treat that state as the dashboard instead of exposing an empty reader.
  if (view === 'dashboard' || ((view === 'login' || view === 'reader') && !activeCourseId)) {
    return (
      <div className="academy-view-frame" style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <ErrorBoundary name="Dashboard">
          <Dashboard 
            onNavigate={(mod) => {
              if (mod.startsWith('resume_')) {
                const parts = mod.split('_');
                const courseId = parts[1];
                const partId = parts[2];
                handleOpenLesson(courseId, Number(partId));
              } else if (mod.startsWith('course_')) {
                const courseId = mod.replace('course_', '');
                const course = courses.find(c => c.id === courseId);
                if (course) handleSelectCourse(course.id, true);
              } else if (mod === 'academy') {
                handleChangeCourse();
              } else if (mod === 'typing') {
                setView('typing');
                setActiveCourseId(null);
                updateURL(null, null);
              } else if (mod === 'aptitude') {
                setView('aptitude');
                setActiveCourseId(null);
                updateURL(null, null);
              } else if (mod === 'targetroom') {
                setView('targetroom');
                setActiveCourseId(null);
                updateURL(null, null);
              }
            }}
            onOpenTaskHub={() => { setView('taskhub'); updateURL(null, null, 'taskhub'); }}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'taskhub') {
    return (
      <div className="academy-view-frame" style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <ErrorBoundary name="Task Hub">
          <TaskHub
            onBack={() => { setView('dashboard'); updateURL(null, null, 'dashboard'); }}
            courses={courses}
            onNavigateInternal={(target, id) => {
              if (target === 'lesson' || target === 'course') {
                const courseId = target === 'course' ? id : activeCourseId || id;
                if (target === 'lesson') {
                  const partNum = parseFloat(id);
                  if (!isNaN(partNum) && courseId) {
                    handleOpenLesson(courseId, partNum);
                  }
                } else {
                  handleSelectCourse(id, true);
                  setView('landing');
                }
              } else {
                setView('dashboard');
                updateURL(null, null, 'dashboard');
              }
            }}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'typing') {
    return (
      <div className="academy-view-frame" style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <ErrorBoundary name="Typing Practice">
          <TypingView onBack={() => { setView('dashboard'); updateURL(null, null, 'dashboard'); }} />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'targetroom') {
    return (
      <div className="academy-view-frame" style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <ErrorBoundary name="Target Room">
          <TargetRoom onBack={() => { setView('dashboard'); updateURL(null, null, 'dashboard'); }} />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'aptitude') {
    return (
      <div className="academy-view-frame" style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <ErrorBoundary name="Aptitude Tests">
          <AptitudeView onBack={() => { setView('dashboard'); updateURL(null, null, 'dashboard'); }} />
        </ErrorBoundary>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className="academy-view-frame" style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <ErrorBoundary name="Course Detail">
          <Landing
            courses={courses}
            activeCourseId={activeCourseId}
            onSelectCourse={handleSelectCourse}
            onChangeCourse={handleChangeCourse}
            onGoHome={handleGoHome}
            modules={modules}
            completedParts={completedParts}
            progressPct={progressPct}
            completedCount={completedCount}
            totalParts={totalParts}
            booting={booting}
            onLaunch={() => {
              const allPartsMeta = flattenCourseNotes(modules);
              const nextUncompleted = allPartsMeta.find(p => !completedParts.includes(p.part));
              const targetPart = nextUncompleted ? nextUncompleted.part : (allPartsMeta[0]?.part || 1);
              selectPart(targetPart);
            }}
            onSelectPart={selectPart}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <ErrorBoundary name="Course Reader">
    <>
      <style>{`
        @keyframes navDropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {celebration && (
        <ChapterCompleteCelebration title={celebration} onDone={() => setCelebration(null)} />
      )}
      {milestoneCelebration && activeCourse && (
        <MilestoneCompleteCelebration courseTitle={activeCourse.title} milestoneName={milestoneCelebration.name} skills={milestoneCelebration.skills} modulesCompleted={milestoneCelebration.modulesCompleted} onDone={() => setMilestoneCelebration(null)} />
      )}

      <a href="#main-content" className="skip-to-main">Skip to main content</a>
      <div className={`app-shell ${(view as string) === 'landing' ? 'landing-view' : ''} ${view === 'reader' ? 'reader-view reader-layout' : ''} ${courseNavCollapsed && view === 'reader' ? 'course-nav-collapsed' : ''} ${!sidebarOpen && view === 'reader' ? 'sidebar-collapsed' : ''} ${sidebarOpen && view === 'reader' ? 'mobile-sidebar-open' : ''} ${!activeCourseId ? 'no-active-course' : ''}`}>
        <header
          className="header"
          role="banner"
          style={{
            position: 'sticky', top: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px', background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {view === 'reader' && activeCourseId && (
              <button
                className={`icon-btn sidebar-toggle-btn${sidebarOpen ? ' active' : ''}`}
                title={sidebarOpen ? 'Close Sidebar [s]' : 'Open Sidebar [s]'}
                aria-label={sidebarOpen ? 'Close course navigation' : 'Open course navigation'}
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(o => !o)}
              >
                {sidebarOpen ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <polyline points="6 9 3 12 6 15"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <polyline points="12 9 15 12 12 15"/>
                  </svg>
                )}
              </button>
            )}

            <nav aria-label="Primary" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <NavDropdown
                label="Menu"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                }
                items={[
                  { label: 'Dashboard', sublabel: 'Home overview', onClick: handleGoHome },
                  { label: 'All Courses', sublabel: 'Browse pathways', onClick: handleChangeCourse },
                  { label: 'Typing Practice', onClick: () => { setView('typing'); setActiveCourseId(null); updateURL(null, null); } },
                  { label: 'Aptitude Tests', onClick: () => { setView('aptitude'); setActiveCourseId(null); updateURL(null, null); } },
                  { label: 'Task Hub', onClick: () => setView('taskhub') },
                ]}
              />

              {activeCourse && (
                <NavDropdown
                  label={activeCourse.title.length > 22 ? activeCourse.title.slice(0, 22) + '…' : activeCourse.title}
                  items={[
                    { label: 'Course Overview', onClick: () => setView('landing') },
                    ...(noteData ? [{ label: `Part ${noteData.part} — ${noteData.module}`, sublabel: 'Current lesson', onClick: () => setView('reader') }] : []),
                    { label: 'Switch Course', onClick: handleChangeCourse },
                  ]}
                />
              )}
            </nav>
          </div>

          <div className="header-right" role="toolbar" aria-label="Reader actions" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {view === 'reader' && activeCourseId && (
              <>
                <button
                  className={`icon-btn${currentPartDone ? ' active' : ''}`}
                  title={`${currentPartDone ? 'Mark Incomplete' : 'Mark Complete'} [c]`}
                  aria-label={currentPartDone ? 'Mark part incomplete' : 'Mark part complete'}
                  aria-pressed={currentPartDone}
                  onClick={() => handleToggleComplete(currentPart)}
                  style={currentPartDone ? { color: C.green } : undefined}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>

                <button
                  className={`icon-btn${bookmarkedParts.includes(currentPart) ? ' active' : ''}`}
                  title="Bookmark [b]"
                  aria-label={bookmarkedParts.includes(currentPart) ? 'Remove bookmark' : 'Bookmark this part'}
                  aria-pressed={bookmarkedParts.includes(currentPart)}
                  onClick={() => handleToggleBookmark(currentPart)}
                  style={bookmarkedParts.includes(currentPart) ? { color: C.amber } : undefined}
                >
                  <svg viewBox="0 0 24 24" fill={bookmarkedParts.includes(currentPart) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              </>
            )}

            {view === 'reader' && activeCourseId && noteData && (
              <NavDropdown
                label="Export"
                align="right"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                }
                items={[
                  { label: 'Print / PDF', sublabel: 'Open printable version or save as PDF', onClick: () => handleDownloadLesson('pdf') },
                  { label: 'Markdown', sublabel: 'Download lesson notes as .md', onClick: () => handleDownloadLesson('markdown') },
                  { label: 'Word Document', sublabel: 'Download lesson notes as .docx', onClick: () => handleDownloadLesson('docx') },
                ]}
              />
            )}

            {(view === 'reader' || (view as string) === 'landing') && (
              <button
                className="icon-btn"
                title="Go to Dashboard [Esc]"
                aria-label="Go to Dashboard"
                onClick={handleGoHome}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </button>
            )}

            <button
              className="icon-btn"
              title="Keyboard Shortcuts [?]"
              aria-label="Show keyboard shortcuts"
              onClick={() => setShowShortcuts(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
              </svg>
            </button>
          </div>
        </header>

        {activeCourseId && view !== 'reader' && (
          <Sidebar
            courseId={activeCourseId}
            modules={modules}
            currentPart={currentPart}
            completedParts={completedParts}
            bookmarkedParts={bookmarkedParts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectPart={selectPart}
            progressPct={progressPct}
            completedCount={completedCount}
            totalParts={totalParts}
            isCurrentCompleted={currentPartDone}
            onToggleComplete={() => handleToggleComplete(currentPart)}
            onPrev={currentIdx > 0 ? () => selectPart(allParts[currentIdx - 1].part) : undefined}
            onNext={currentIdx < allParts.length - 1 ? () => selectPart(allParts[currentIdx + 1].part) : undefined}
            railCollapsed={courseNavCollapsed}
            onToggleRail={() => setCourseNavCollapsed(v => !v)}
          />
        )}

        <main className="main" id="main-content" tabIndex={-1}>
          {(view as string) === 'landing' ? (
            <Landing
              courses={courses}
              activeCourseId={activeCourseId}
              onSelectCourse={handleSelectCourse}
              onChangeCourse={handleChangeCourse}
              onGoHome={handleGoHome}
              modules={modules}
              completedParts={completedParts}
              progressPct={progressPct}
              completedCount={completedCount}
              totalParts={totalParts}
              booting={booting}
              onLaunch={handleLaunch}
              onSelectPart={selectPart}
            />
          ) : activeCourseId ? (
            <Reader
              noteData={noteData}
              loading={noteLoading}
              activeTab={activeTab}
              isCompleted={currentPartDone}
              currentIdx={currentIdx}
              totalCount={allParts.length}
              onTabChange={setActiveTab}
              onToggleComplete={() => handleToggleComplete(currentPart)}
              onPrev={currentIdx > 0 ? () => selectPart(allParts[currentIdx - 1].part) : undefined}
              onNext={currentIdx < allParts.length - 1 ? () => selectPart(allParts[currentIdx + 1].part) : undefined}
              onShowShortcuts={() => setShowShortcuts(true)}
              onGoHome={handleGoHome}
              onSwitchCourse={handleChangeCourse}
              courseId={activeCourseId}
              modules={modules}
              currentPart={currentPart}
              completedParts={completedParts}
              bookmarkedParts={bookmarkedParts}
              onSelectPart={selectPart}
              completionAction={activeCourse && currentMilestone && currentMilestoneComplete && isMilestoneFinalModule ? (
                <AchievementShare
                  userId={user?.uid}
                  courseId={activeCourseId}
                  courseTitle={activeCourse.title}
                  moduleId={currentMilestone.index}
                  moduleTitle={currentMilestone.name}
                  milestoneLabel={`${currentMilestone.name} milestone`}
                  nextMilestoneLabel={currentMilestone.nextLabel}
                  completedParts={currentMilestoneParts}
                  partTitles={currentMilestone.skills}
                  partNumbers={currentMilestoneParts}
                />
              ) : undefined}
            />
          ) : (
            <AcademyBootScreen stage="courses" />
          )}
        </main>
      </div>

      {sidebarOpen && view !== 'reader' && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
    </ErrorBoundary>
  );
}
