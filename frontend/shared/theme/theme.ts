/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  1% Dev Academy — Neo-Brutalist & Maximalist Design System
 *  Single source of truth for all UI tokens & styling primitives.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ── Color Palette (Neo-Brutalist Dark Default) ──────────────────────────── */
export const C = {
  /* Backgrounds */
  bg:            '#FFFFFF',
  surface:       '#FFFFFF',
  surfaceHi:     '#FFFFFF',
  surfaceHover:  '#FFFFFF',
  surfaceRaised: '#FFFFFF',

  /* Hard Borders */
  border:   '#E5E7EB',
  borderHi: '#D1D5DB',
  borderBold: '#F98012',

  /* Text hierarchy */
  text:      '#1F2937',
  textDim:   '#6B7280',
  textFaint: '#9CA3AF',

  /* High-voltage Accents */
  accent:      '#F98012',
  accentDim:   'rgba(249,128,18,0.13)',
  onAccent:    '#FFFFFF',

  cyan:        '#F98012',
  cyanDim:     'rgba(249,128,18,0.13)',
  pink:        '#EF4444',
  pinkDim:     'rgba(239,68,68,0.12)',
  lime:        '#22C55E',
  limeDim:     'rgba(34,197,94,0.12)',
  purple:      '#3B82F6',
  purpleDim:   'rgba(59,130,246,0.12)',
  orange:      '#F59E0B',
  orangeDim:   'rgba(245,158,11,0.14)',

  /* Semantics */
  success:    '#22C55E',
  successDim: 'rgba(34,197,94,0.12)',
  warning:    '#F59E0B',
  warningDim: 'rgba(245,158,11,0.14)',
  error:      '#EF4444',
  errorDim:   'rgba(239,68,68,0.12)',
  info:       '#3B82F6',
  infoDim:    'rgba(59,130,246,0.12)',
  slate:      '#6B7280',
  slateDim:   'rgba(107,114,128,0.12)',
};

/* Light Theme Overrides (Neo-Brutalist Broadsheet Paper) */
export const CLight = {
  bg:            '#FFFFFF',
  surface:       '#FFFFFF',
  surfaceHi:     '#FFFFFF',
  surfaceHover:  '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border:        '#E5E7EB',
  borderHi:      '#D1D5DB',
  borderBold:    '#F98012',
  text:          '#1F2937',
  textDim:       '#6B7280',
  textFaint:     '#9CA3AF',
  accent:        '#F98012',
  accentDim:     'rgba(249,128,18,0.13)',
  onAccent:      '#FFFFFF',
  cyan:          '#F98012',
  cyanDim:       'rgba(249,128,18,0.13)',
  pink:          '#EF4444',
  pinkDim:       'rgba(239,68,68,0.12)',
  lime:          '#22C55E',
  limeDim:       'rgba(34,197,94,0.12)',
  purple:        '#3B82F6',
  purpleDim:     'rgba(59,130,246,0.12)',
  orange:        '#F59E0B',
  orangeDim:     'rgba(245,158,11,0.14)',
  success:       '#22C55E',
  successDim:    'rgba(34,197,94,0.12)',
  warning:       '#F59E0B',
  warningDim:    'rgba(245,158,11,0.14)',
  error:         '#EF4444',
  errorDim:      'rgba(239,68,68,0.12)',
  info:          '#3B82F6',
  infoDim:       'rgba(59,130,246,0.12)',
  slate:         '#6B7280',
  slateDim:      'rgba(107,114,128,0.12)',
};

/* ── Typography ────────────────────────────────────────────────────────────── */
export const F = {
  display: "'Google Sans Flex', sans-serif",
  body:    "'Google Sans Flex', sans-serif",
  mono:    "'Google Sans Flex', sans-serif",
};

export const FS = {
  xs:   '0.7rem',
  sm:   '0.78rem',
  base: '0.88rem',
  md:   '0.95rem',
  lg:   '1.15rem',
  xl:   '1.4rem',
  '2xl':'1.85rem',
  '3xl':'2.4rem',
};

/* ── Spacing 8px Grid ──────────────────────────────────────────────────────── */
export const SP = {
  1: '8px',
  2: '16px',
  3: '24px',
  4: '32px',
  5: '40px',
  6: '48px',
  7: '56px',
  8: '64px',
};

/* ── Neo-Brutalist Border Radius (Sharp / Slightly Rounded) ───────────────── */
export const R = {
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  xl:   '18px',
  pill: '999px',
};

/* ── Neo-Brutalist Hard Offset Shadows ─────────────────────────────────────── */
export const S = {
  card:   '0 8px 24px rgba(29,43,56,0.06)',
  raised: '0 18px 48px rgba(29,43,56,0.12)',
  glow:   '0 0 24px rgba(255,104,66,0.22)',
  inset:  'inset 0 1px 0 rgba(255,255,255,0.8)',
};

/* ── Transitions ───────────────────────────────────────────────────────────── */
export const T = {
  fast: '110ms cubic-bezier(0.2, 0, 0, 1)',
  base: '180ms cubic-bezier(0.2, 0, 0, 1)',
  slow: '250ms cubic-bezier(0.2, 0, 0, 1)',
  ease: 'cubic-bezier(0.16,1,0.3,1)',
};

/* ── Layout ────────────────────────────────────────────────────────────────── */
export const L = {
  sidebarWidth:          '264px',
  sidebarCollapsedWidth: '0px',
  toolbarHeight:         '54px',
  railWidth:             '260px',
  railCollapsedWidth:    '42px',
};

/* ── Callout Variant Map ────────────────────────────────────────────────────── */
export type CalloutVariant =
  | 'definition' | 'explanation' | 'example' | 'basic-example'
  | 'intermediate-example' | 'advanced-example' | 'professional-example'
  | 'warning' | 'mistake' | 'tip' | 'interview' | 'hr' | 'output'
  | 'syntax' | 'cheatsheet' | 'memory' | 'shortcut' | 'takeaways'
  | 'real-world' | 'best-practice' | 'edge-case' | 'exercise'
  | 'challenge' | 'quiz' | 'summary' | 'checklist' | 'note'
  | 'reference' | 'faq';

export const CALLOUT_MAP: Record<CalloutVariant, { label: string; accent: string; accentDim: string }> = {
  definition:             { label: 'Definition',            accent: C.purple,  accentDim: C.purpleDim  },
  explanation:            { label: 'Explanation',           accent: C.cyan,    accentDim: C.cyanDim    },
  example:                { label: 'Example',               accent: C.lime,    accentDim: C.limeDim    },
  'basic-example':        { label: 'Basic Example',         accent: C.lime,    accentDim: C.limeDim    },
  'intermediate-example': { label: 'Intermediate Example',  accent: C.cyan,    accentDim: C.cyanDim    },
  'advanced-example':     { label: 'Advanced Example',      accent: C.purple,  accentDim: C.purpleDim  },
  'professional-example': { label: 'Professional Example',  accent: C.pink,    accentDim: C.pinkDim    },
  warning:                { label: 'Warning',               accent: C.accent,  accentDim: C.accentDim  },
  mistake:                { label: 'Common Mistake',        accent: C.error,   accentDim: C.errorDim   },
  tip:                    { label: 'Professional Tip',      accent: C.lime,    accentDim: C.limeDim    },
  interview:              { label: 'Interview Question',    accent: C.purple,  accentDim: C.purpleDim  },
  hr:                     { label: 'HR Question',           accent: C.orange,  accentDim: C.orangeDim  },
  output:                 { label: 'Output',                accent: C.slate,   accentDim: C.slateDim   },
  syntax:                 { label: 'Syntax',                accent: C.cyan,    accentDim: C.cyanDim    },
  cheatsheet:             { label: 'Cheat Sheet',           accent: C.accent,  accentDim: C.accentDim  },
  memory:                 { label: 'Memory Trick',          accent: C.pink,    accentDim: C.pinkDim    },
  shortcut:               { label: 'Shortcut',              accent: C.cyan,    accentDim: C.cyanDim    },
  takeaways:              { label: 'Key Takeaways',         accent: C.lime,    accentDim: C.limeDim    },
  'real-world':           { label: 'Real-World Scenario',   accent: C.orange,  accentDim: C.orangeDim  },
  'best-practice':        { label: 'Best Practice',         accent: C.lime,    accentDim: C.limeDim    },
  'edge-case':            { label: 'Edge Case',             accent: C.orange,  accentDim: C.orangeDim  },
  exercise:               { label: 'Exercise',              accent: C.purple,  accentDim: C.purpleDim  },
  challenge:              { label: 'Challenge',             accent: C.error,   accentDim: C.errorDim   },
  quiz:                   { label: 'Quiz',                  accent: C.pink,    accentDim: C.pinkDim    },
  summary:                { label: 'Summary',               accent: C.cyan,    accentDim: C.cyanDim    },
  checklist:              { label: 'Revision Checklist',    accent: C.lime,    accentDim: C.limeDim    },
  note:                   { label: 'Note',                  accent: C.slate,   accentDim: C.slateDim   },
  reference:              { label: 'Reference',             accent: C.slate,   accentDim: C.slateDim   },
  faq:                    { label: 'FAQ',                   accent: C.cyan,    accentDim: C.cyanDim    },
};

export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wdth,wght@6..144,25..100,100..900&display=swap');`;
