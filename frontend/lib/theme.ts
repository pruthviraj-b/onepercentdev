/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  1% Dev Academy — Neo-Brutalist & Maximalist Design System
 *  Single source of truth for all UI tokens & styling primitives.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ── Color Palette (Neo-Brutalist Dark Default) ──────────────────────────── */
export const C = {
  /* Backgrounds */
  bg:            '#0A0C10',   // deep dark ink
  surface:       '#12151E',   // panel surface
  surfaceHi:     '#1A1E2B',   // card / input fill
  surfaceHover:  '#222738',   // hover state
  surfaceRaised: '#1E2333',   // modal / popover

  /* Hard Borders */
  border:   '#282F44',        // default 2px border
  borderHi: '#3D4766',        // focus ring / active border
  borderBold: '#FFE600',      // Neo accent border

  /* Text hierarchy */
  text:      '#F0F4FC',       // crisp white body text
  textDim:   '#98A6C0',       // secondary text
  textFaint: '#5C6984',       // muted labels

  /* High-voltage Accents */
  accent:      '#FFE600',     // Electric Yellow / Gold
  accentDim:   'rgba(255,230,0,0.14)',
  onAccent:    '#0A0C10',

  cyan:        '#00F0FF',     // Neo Cyan
  cyanDim:     'rgba(0,240,255,0.14)',
  pink:        '#FF007A',     // Hot Pink
  pinkDim:     'rgba(255,0,122,0.14)',
  lime:        '#00FF66',     // Neon Lime
  limeDim:     'rgba(0,255,102,0.14)',
  purple:      '#B55CFF',     // Vivid Purple
  purpleDim:   'rgba(181,92,255,0.14)',
  orange:      '#FF6B00',     // Tangerine
  orangeDim:   'rgba(255,107,0,0.14)',

  /* Semantics */
  success:    '#00FF66',
  successDim: 'rgba(0,255,102,0.14)',
  warning:    '#FFE600',
  warningDim: 'rgba(255,230,0,0.14)',
  error:      '#FF3366',
  errorDim:   'rgba(255,51,102,0.14)',
  info:       '#00F0FF',
  infoDim:    'rgba(0,240,255,0.14)',
  slate:      '#98A6C0',
  slateDim:   'rgba(152,166,192,0.12)',
};

/* Light Theme Overrides (Neo-Brutalist Broadsheet Paper) */
export const CLight = {
  bg:            '#F5F1EA',   // broadsheet cream paper
  surface:       '#FFFFFF',   // crisp paper panels
  surfaceHi:     '#EFEAE1',   // input background
  surfaceHover:  '#E6E0D4',   // hover fill
  surfaceRaised: '#FFFFFF',
  border:        '#181818',   // bold 2px black border
  borderHi:      '#000000',
  borderBold:    '#181818',
  text:          '#121212',   // dark ink text
  textDim:       '#4A4A4A',
  textFaint:     '#767676',
  accent:        '#FFE600',   // bold yellow highlight
  accentDim:     'rgba(255,230,0,0.25)',
  onAccent:      '#121212',
  cyan:          '#00E5FF',
  cyanDim:       'rgba(0,229,255,0.20)',
  pink:          '#FF007A',
  pinkDim:       'rgba(255,0,122,0.18)',
  lime:          '#00E65C',
  limeDim:       'rgba(0,230,92,0.20)',
  purple:        '#9D35FF',
  purpleDim:     'rgba(157,53,255,0.18)',
  orange:        '#FF5500',
  orangeDim:     'rgba(255,85,0,0.18)',
  success:       '#00E65C',
  successDim:    'rgba(0,230,92,0.20)',
  warning:       '#FFE600',
  warningDim:    'rgba(255,230,0,0.25)',
  error:         '#FF2A55',
  errorDim:      'rgba(255,42,85,0.18)',
  info:          '#00E5FF',
  infoDim:       'rgba(0,229,255,0.20)',
  slate:         '#5A6578',
  slateDim:      'rgba(90,101,120,0.15)',
};

/* ── Typography ────────────────────────────────────────────────────────────── */
export const F = {
  display: "'Google Sans Flex', -apple-system, sans-serif",
  body:    "'Google Sans Flex', -apple-system, sans-serif",
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
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
  sm:   '3px',
  md:   '5px',
  lg:   '8px',
  xl:   '12px',
  pill: '999px',
};

/* ── Neo-Brutalist Hard Offset Shadows ─────────────────────────────────────── */
export const S = {
  card:   '3px 3px 0px #000000',
  raised: '5px 5px 0px #000000',
  glow:   '0 0 12px rgba(255,230,0,0.3)',
  inset:  'inset 0 0 0 2px rgba(255,255,255,0.06)',
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
  sidebarWidth:          '300px',
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

export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap');`;
