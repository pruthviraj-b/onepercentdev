'use client';

import { useState } from 'react';

// ── Python Icon ── official two-snake yin-yang (blue top, gold bottom) ─────────
export function PythonIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Blue snake — top half */}
      <path
        d="M16 3C11.3 3 8 5.9 8 9.8V14.3H15.8C16.7 14.3 17.5 15.1 17.5 16V16.5H23.5V9.8C23.5 5.9 20.2 3 16 3Z"
        fill="#3776C0"
      />
      {/* Blue connector nub (extends left) */}
      <rect x="8" y="14.3" width="5" height="2.5" rx="1.25" fill="#3776C0" />
      {/* Yellow snake — bottom half */}
      <path
        d="M16 29C20.7 29 24 26.1 24 22.2V17.7H16.2C15.3 17.7 14.5 16.9 14.5 16V15.5H8.5V22.2C8.5 26.1 11.8 29 16 29Z"
        fill="#FFD444"
      />
      {/* Yellow connector nub (extends right) */}
      <rect x="19" y="15.2" width="5" height="2.5" rx="1.25" fill="#FFD444" />
      {/* Eyes */}
      <circle cx="12" cy="9.5" r="1.6" fill="white" />
      <circle cx="20" cy="22.5" r="1.6" fill="white" />
    </svg>
  );
}

// ── SQL Icon ── 3-ring database cylinder (outline, green) ─────────────────────
export function SQLIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="7.5" rx="10" ry="3.5" stroke="#2DA44E" strokeWidth="1.8" />
      <line x1="6" y1="7.5" x2="6" y2="16" stroke="#2DA44E" strokeWidth="1.8" />
      <line x1="26" y1="7.5" x2="26" y2="16" stroke="#2DA44E" strokeWidth="1.8" />
      <ellipse cx="16" cy="16" rx="10" ry="3.5" stroke="#2DA44E" strokeWidth="1.8" />
      <line x1="6" y1="16" x2="6" y2="24.5" stroke="#2DA44E" strokeWidth="1.8" />
      <line x1="26" y1="16" x2="26" y2="24.5" stroke="#2DA44E" strokeWidth="1.8" />
      <ellipse cx="16" cy="24.5" rx="10" ry="3.5" stroke="#2DA44E" strokeWidth="1.8" />
    </svg>
  );
}

// ── Excel Icon ── green X on document ─────────────────────────────────────────
export function ExcelIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Document body */}
      <path d="M5 4C5 3.448 5.448 3 6 3H20L27 10V28C27 28.552 26.552 29 26 29H6C5.448 29 5 28.552 5 28V4Z" fill="#1D6F42" />
      {/* Folded corner */}
      <path d="M20 3L27 10H21C20.448 10 20 9.552 20 9V3Z" fill="#185C37" />
      {/* White X */}
      <path d="M10 13.5L13.8 19.5L10 25.5H13.2L16 21L18.8 25.5H22L18.2 19.5L22 13.5H18.8L16 18L13.2 13.5H10Z" fill="white" />
    </svg>
  );
}

// ── Cloud Icon ── simple cloud outline (purple/indigo) ────────────────────────
export function CloudIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M23.5 20H22.9C22.6 17.2 20.3 15 17.4 15.1C15.7 15.1 14.1 16 13.2 17.4C12.9 17.1 12.5 17 12 17C11 17 10.2 17.8 10.2 18.8V19H8.5C6.6 19 5 20.6 5 22.5C5 24.4 6.6 26 8.5 26H23.5C25.4 26 27 24.4 27 22.5C27 20.6 25.4 19 23.5 19L23.5 20Z"
        stroke="#7C3AED"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Internal helpers ───────────────────────────────────────────────────────────
function matchCourse(mascot?: string, id?: string) {
  const v = (mascot || id || '').toLowerCase();
  if (v.includes('python') || v.includes('snake')) return 'python';
  if (v.includes('sql') || v.includes('database')) return 'sql';
  if (v.includes('excel')) return 'excel';
  if (v.includes('cloud')) return 'cloud';
  return 'other';
}

function badgeColors(type: string) {
  switch (type) {
    case 'python': return { bg: '#EBF4FF', border: '#BFDBFE', text: '#1D4ED8' };
    case 'sql':    return { bg: '#EDFAF2', border: '#A7F3D0', text: '#065F46' };
    case 'excel':  return { bg: '#EDFAF2', border: '#A7F3D0', text: '#065F46' };
    case 'cloud':  return { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6' };
    default:       return { bg: '#F3F4F6', border: '#E5E7EB', text: '#374151' };
  }
}

function fallbackEmoji(type: string) {
  return type === 'python' ? '🐍' : type === 'sql' ? '🗄️' : type === 'excel' ? '📊' : type === 'cloud' ? '☁️' : '📘';
}

// ── CourseIconDisplay ── renders the SVG icon at any size ─────────────────────
export function CourseIconDisplay({ mascot, id, size = 28 }: { mascot?: string; id?: string; size?: number }) {
  const type = matchCourse(mascot, id);
  if (type === 'python') return <PythonIcon size={size} />;
  if (type === 'sql')    return <SQLIcon size={size} />;
  if (type === 'excel')  return <ExcelIcon size={size} />;
  if (type === 'cloud')  return <CloudIcon size={size} />;
  return <span style={{ fontSize: size * 0.75, lineHeight: 1 }}>{fallbackEmoji(type)}</span>;
}

// ── CourseBadge ── the pill card (icon | CourseName) ─────────────────────────
export function CourseBadge({
  mascot, courseId, title, onClick,
}: {
  mascot?: string; courseId: string; title: string; onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const type = matchCourse(mascot, courseId);
  const { bg, border, text } = badgeColors(type);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 0,
        background: hover ? border : bg,
        border: `1.5px solid ${border}`,
        borderRadius: '14px',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms ease',
        transform: hover && onClick ? 'translateY(-1px)' : 'none',
        boxShadow: hover && onClick ? `0 4px 14px ${border}88` : 'none',
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        flexShrink: 0,
        overflow: 'hidden',
        height: '52px',
        minWidth: '140px',
      }}
    >
      {/* Icon section */}
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '52px', height: '52px', flexShrink: 0,
      }}>
        <CourseIconDisplay mascot={mascot} id={courseId} size={28} />
      </span>
      {/* Divider */}
      <span style={{ width: '1.5px', height: '32px', background: border, flexShrink: 0 }} />
      {/* Label */}
      <span style={{
        fontWeight: 700, fontSize: '0.9rem', color: text,
        padding: '0 16px', whiteSpace: 'nowrap', letterSpacing: '0.01em',
      }}>
        {title}
      </span>
    </button>
  );
}

// ── NavCoursePill ── compact nav button for the topbar ────────────────────────
export function NavCoursePill({
  mascot, courseId, label, onClick, active = false,
}: {
  mascot?: string; courseId: string; label: string; onClick: () => void; active?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const type = matchCourse(mascot, courseId);
  const { bg, border, text } = badgeColors(type);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        background: active ? '#1a1a1a' : hover ? bg : 'rgba(0,0,0,0.08)',
        border: hover && !active ? `1px solid ${border}` : '1px solid transparent',
        borderRadius: '8px', height: '32px', padding: '0 10px',
        cursor: 'pointer', transition: 'all 120ms', flexShrink: 0,
        fontFamily: "'DM Sans', sans-serif",
        color: active ? '#f1be3e' : hover ? text : '#1a1a1a',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', lineHeight: 0 }}>
        {active
          ? <CourseIconDisplay mascot={mascot} id={courseId} size={16} />
          : hover
          ? <CourseIconDisplay mascot={mascot} id={courseId} size={16} />
          : <CourseIconDisplay mascot={mascot} id={courseId} size={16} />
        }
      </span>
      {(hover || active) && (
        <span style={{ fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      )}
    </button>
  );
}

// ── getCourseEmoji ── legacy fallback (for backward compat) ───────────────────
export function getCourseEmoji(mascot?: string, id?: string): string {
  return fallbackEmoji(matchCourse(mascot, id));
}
