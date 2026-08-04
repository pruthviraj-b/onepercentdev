export interface PremiumExportData {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  part: number;
  importance: string;
  notes: string;
  readTime: number;
  generatedAt: string;
  version: string;
}

const calloutMap: Record<string, { label: string; icon: string; accent: string }> = {
  note: { label: 'Note', icon: '✦', accent: '#2563eb' },
  tip: { label: 'Tip', icon: '💡', accent: '#7c3aed' },
  important: { label: 'Important', icon: '⚠', accent: '#dc2626' },
  warning: { label: 'Warning', icon: '🚨', accent: '#d97706' },
  bestpractice: { label: 'Best Practice', icon: '✅', accent: '#059669' },
  commonmistakes: { label: 'Common Mistakes', icon: '🧭', accent: '#ea580c' },
  interviewquestion: { label: 'Interview Question', icon: '❓', accent: '#0f766e' },
  realworldexample: { label: 'Real-world Example', icon: '🛠️', accent: '#4338ca' },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(value: string): string {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="export-inline-code">$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a class="export-link" href="$2" target="_blank" rel="noreferrer">$1 <span class="export-link-icon">↗</span></a>');
}

function highlightCode(code: string, lang: string): string {
  const escaped = escapeHtml(code)
    .replace(/(\/\/.*$)/gm, '<span class="token-comment">$1</span>')
    .replace(/\b(def|class|return|import|from|if|else|for|while|try|except|with|and|or|not|in|is|True|False|None|async|await)\b/g, '<span class="token-keyword">$1</span>')
    .replace(/\b([0-9]+)\b/g, '<span class="token-number">$1</span>')
    .replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g, '<span class="token-string">$1</span>');

  const lines = escaped.split('\n').map((line, index) => {
    const number = index + 1;
    return `<div class="export-code-line"><span class="export-code-line-number">${number}</span><span class="export-code-line-content">${line || ' '}</span></div>`;
  });

  return `
    <div class="export-code-shell">
      <div class="export-code-toolbar">
        <span class="export-code-lang">${lang || 'code'}</span>
        <span class="export-code-pill">copy-ready</span>
      </div>
      <pre class="export-code-block"><code class="language-${lang || 'text'}">${lines.join('')}</code></pre>
    </div>
  `;
}

function parseMarkdownToHtml(markdown: string, toc: string[]): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const fenceMatch = trimmed.match(/^```([a-zA-Z0-9_-]+)?/);
      const language = fenceMatch?.[1] || 'text';
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(`<div class="export-block">${highlightCode(codeLines.join('\n'), language)}</div>`);
      continue;
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      const match = trimmed.match(/^(#{1,3})\s+(.*)$/);
      const level = match ? match[1].length : 2;
      const headingText = match ? match[2].trim() : trimmed;
      const safeLevel = Math.min(level, 3);
      const headingTag = `h${safeLevel + 1}`;
      const headingClass = safeLevel === 1 ? 'export-h1' : safeLevel === 2 ? 'export-h2' : 'export-h3';
      toc.push(`<li class="toc-level-${safeLevel}"><a href="#${encodeURIComponent(headingText)}">${renderInlineMarkdown(headingText)}</a></li>`);
      blocks.push(`<div class="export-block"><${headingTag} id="${encodeURIComponent(headingText)}" class="${headingClass}">${renderInlineMarkdown(headingText)}</${headingTag}></div>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].replace(/^>\s?/, '').trim());
        index += 1;
      }
      const content = quoteLines.join(' ');
      const normalized = content.toLowerCase();
      const detected = Object.entries(calloutMap).find(([key]) => normalized.includes(key) || normalized.includes(key.replace(/([a-z])([A-Z])/g, '$1 $2')));
      const variant = detected ? detected[0] : 'note';
      const metadata = calloutMap[variant];
      blocks.push(`<div class="export-block"><aside class="export-callout export-callout-${variant}" style="border-left-color: ${metadata.accent}"><div class="export-callout-header"><span class="export-callout-icon">${metadata.icon}</span><span class="export-callout-title">${metadata.label}</span></div><div class="export-callout-body">${renderInlineMarkdown(content.replace(/^(Note|Tip|Important|Warning|Best Practice|Common Mistakes|Interview Question|Real-world Example)\s*[:\-]?/i, ''))}</div></aside></div>`);
      continue;
    }

    if (/^\|/.test(trimmed)) {
      const rows: string[][] = [];
      while (index < lines.length && /^\|/.test(lines[index].trim())) {
        rows.push(lines[index].split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1));
        index += 1;
      }
      if (rows.length >= 2) {
        const header = rows[0];
        const body = rows.slice(1);
        const tableRows = [
          `<thead><tr>${header.map(cell => `<th>${renderInlineMarkdown(cell)}</th>`).join('')}</tr></thead>`,
          `<tbody>${body.map(row => `<tr>${row.map(cell => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`
        ].join('');
        blocks.push(`<div class="export-block"><div class="export-table-wrap"><table class="export-table">${tableRows}</table></div></div>`);
        continue;
      }
    }

    if (/^(-|\*|\d+\.)\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^(-|\*|\d+\.)\s+/.test(lines[index].trim())) {
        const itemText = lines[index].trim().replace(/^(-|\*|\d+\.)\s+/, '');
        items.push(`<li>${renderInlineMarkdown(itemText)}</li>`);
        index += 1;
      }
      const listTag = /^\d+\./.test(lines[index - 1]?.trim() || '') ? 'ol' : 'ul';
      blocks.push(`<div class="export-block"><${listTag} class="export-list">${items.join('')}</${listTag}></div>`);
      continue;
    }

    if (/^---\s*$/.test(trimmed)) {
      blocks.push('<div class="export-block"><div class="export-divider"></div></div>');
      index += 1;
      continue;
    }

    if (/!\[([^\]]*)\]\(([^)]+)\)/.test(trimmed)) {
      const match = trimmed.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        blocks.push(`<div class="export-block"><figure class="export-figure"><img src="${match[2]}" alt="${match[1] || 'Illustration'}" /><figcaption>Figure ${blocks.filter(block => block.includes('export-figure')).length + 1}. ${match[1] || 'Illustration'}</figcaption></figure></div>`);
      }
      index += 1;
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (!current || /^```/.test(current) || /^#{1,3}\s+/.test(current) || /^>\s?/.test(current) || /^\|/.test(current) || /^(-|\*|\d+\.)\s+/.test(current) || /^---\s*$/.test(current) || /!\[([^\]]*)\]\(([^)]+)\)/.test(current)) {
        break;
      }
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    const paragraphText = paragraphLines.join(' ');
    if (paragraphText) {
      const isFirstParagraph = blocks.filter(block => block.includes('export-paragraph')).length === 0;
      const paragraphClass = isFirstParagraph ? 'export-paragraph first-lead' : 'export-paragraph';
      blocks.push(`<div class="export-block"><p class="${paragraphClass}">${renderInlineMarkdown(paragraphText)}</p></div>`);
    }
  }

  return blocks.join('');
}

export function buildPremiumExportHtml(data: PremiumExportData): string {
  const toc: string[] = [];
  const contentHtml = parseMarkdownToHtml(data.notes, toc);
  const tocHtml = toc.length
    ? `<section class="export-toc"><h2 class="export-h2">Table of Contents</h2><ol>${toc.join('')}</ol></section>`
    : '';

  const generatedAt = data.generatedAt || new Date().toLocaleDateString('en', { dateStyle: 'medium' });
  const lessonTitle = data.lessonTitle || 'Lesson';
  const courseTitle = data.courseTitle || 'Course';
  const moduleTitle = data.moduleTitle || 'Module';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(lessonTitle)} | ${escapeHtml(courseTitle)}</title>
    <style>
:root {
        color-scheme: light;
        --ink: #1F2937;
        --muted: #222222;
        --line: #1F2937;
        --surface: #ffffff;
        --accent: #f5b82e;
        --shadow: 4px 4px 0px #1F2937;
        --shadow-sm: 2px 2px 0px #1F2937;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: 'Google Sans Flex', sans-serif;
        color: var(--ink);
        background: #ffffff;
        line-height: 1.6;
        font-size: 16px;
        font-weight: 500;
      }

      @page { size: A4; margin: 15mm 15mm 18mm; }

      .export-page {
        max-width: 980px;
        margin: 0 auto;
        padding: 20px 24px 36px;
      }

      .newspaper-masthead {
        text-align: center;
        padding: 16px 0 12px;
        margin-bottom: 28px;
        border-top: 4px solid var(--line);
        border-bottom: 4px double var(--line);
        background: #ffffff;
      }

      .newspaper-top-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 8px;
      }

      .brand-title-group {
        display: inline-flex;
        align-items: center;
        gap: 12px;
      }

      .brand-badge {
        background-color: var(--accent);
        color: var(--ink);
        font-family: 'Google Sans Flex', sans-serif;
        font-weight: 700;
        font-size: 0.9rem;
        padding: 3px 8px;
        border: 2px solid var(--line);
        box-shadow: var(--shadow-sm);
        line-height: 1;
      }

      .brand-name {
        font-family: 'Google Sans Flex', sans-serif;
        font-size: 3rem;
        font-weight: 400;
        letter-spacing: 0.02em;
        line-height: 1;
        color: var(--ink);
      }

      .brand-tagline {
        font-family: 'Google Sans Flex', sans-serif;
        color: #222222;
        font-size: 1.05rem;
        line-height: 1.8;
        margin-top: 6px;
      }

      .newspaper-dateline {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        padding: 4px 12px;
        margin-top: 12px;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .export-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        padding-bottom: 20px;
        margin-bottom: 24px;
        border-bottom: 3px solid var(--line);
      }

      .export-header h1 {
        margin: 0 0 6px;
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        text-transform: uppercase;
      }

      .export-header p {
        margin: 0;
        color: var(--muted);
        font-size: 0.95rem;
        font-weight: 700;
      }

      .export-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border: 2px solid var(--line);
        box-shadow: var(--shadow-sm);
        background: #ffffff;
        color: var(--ink);
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }

      .export-hero {
        background: #ffffff;
        color: var(--ink);
        border: 3px solid var(--line);
        padding: 32px 36px;
        margin-bottom: 24px;
        box-shadow: var(--shadow);
      }

      .export-hero .eyebrow {
        display: inline-block;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.8rem;
        font-weight: 700;
        background: #ffffff;
        color: var(--ink);
        padding: 4px 8px;
        border: 2px solid var(--line);
        box-shadow: var(--shadow-sm);
      }

      .export-hero h1 {
        margin: 0 0 16px;
        font-size: 2.2rem;
        line-height: 1.1;
        letter-spacing: -0.03em;
        text-transform: uppercase;
      }

      .export-hero .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        color: var(--ink);
        font-size: 0.95rem;
        font-weight: 700;
      }

      .export-hero .hero-meta span {
        padding: 6px 10px;
        border: 2px solid var(--line);
        background: #ffffff;
        box-shadow: var(--shadow-sm);
      }

      .export-toc {
        border: 3px solid var(--line);
        padding: 20px 22px;
        background: #ffffff;
        margin-bottom: 24px;
        box-shadow: var(--shadow);
      }

      .export-toc h2, .export-h2 {
        margin: 0 0 12px;
        font-size: 1.15rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: -0.01em;
      }

      .export-toc ol {
        margin: 0;
        padding-left: 20px;
        color: var(--ink);
        font-weight: 700;
      }

      .export-toc li { margin: 6px 0; }
      .export-toc a { color: var(--ink); text-decoration: none; border-bottom: 2px solid var(--ink); }
      .export-toc a:hover { background: var(--ink); color: #ffffff; }

      .export-block { margin-bottom: 20px; }

      .export-h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 1.8rem 0 0.75rem;
        text-transform: uppercase;
      }

      .export-h2 {
        font-size: 1.25rem;
        margin: 1.8rem 0 0.75rem;
        padding-bottom: 0;
        border-bottom: none;
        text-transform: uppercase;
        background: none;
        padding-left: 0;
        border-left: none;
      }

      .export-h3 {
        font-size: 1.1rem;
        margin: 1.25rem 0 0.45rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      .export-paragraph {
        margin: 0 0 1rem;
        font-size: 1rem;
        color: var(--ink);
      }

      .first-lead::first-letter {
        font-family: 'Google Sans Flex', sans-serif;
        font-size: 3.4rem;
        float: left;
        line-height: 0.75;
        padding-right: 8px;
        padding-top: 2px;
        color: var(--ink);
      }

      .export-list {
        padding-left: 1.5rem;
        margin: 0 0 1rem;
        list-style-type: square;
      }

      .export-list li { margin-bottom: 0.5rem; font-weight: 500; }

      .export-callout {
        padding: 1rem 1.2rem;
        border-radius: 0;
        border: 3px solid var(--line);
        border-left: 8px solid var(--line);
        background: #ffffff;
        box-shadow: var(--shadow);
        margin: 1.5rem 0;
      }

      .export-callout-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        margin-bottom: 0.45rem;
        text-transform: uppercase;
        font-size: 1.05rem;
      }

      .export-callout-icon { font-size: 1.1rem; }
      .export-callout-body { color: var(--ink); font-weight: 500; }

      .export-inline-code {
        display: inline-block;
        padding: 0px 6px;
        margin: 0 2px;
        border: 1.5px solid var(--line);
        background: #f4f4f4;
        font-family: 'Google Sans Flex', sans-serif;
        font-size: 0.88em;
        font-weight: 700;
        line-height: 1.4;
        vertical-align: middle;
        box-shadow: none;
      }

      .export-code-shell {
        border-radius: 0;
        overflow: hidden;
        border: 3px solid var(--line);
        background: #ffffff;
        box-shadow: var(--shadow);
        margin: 1.5rem 0;
      }

      .export-code-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 14px;
        background: #ffffff;
        border-bottom: 3px solid var(--line);
        color: var(--ink);
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .export-code-block {
        margin: 0;
        padding: 14px;
        font-family: 'Google Sans Flex', sans-serif;
        font-size: 0.9rem;
        color: var(--ink);
        white-space: pre-wrap;
        word-break: break-all;
        font-weight: 700;
        background: #ffffff;
      }

      .export-code-line {
        display: flex;
        gap: 12px;
        min-height: 1.5em;
      }

      .export-code-line-number {
        width: 2.2rem;
        color: #777777;
        text-align: right;
        user-select: none;
      }

      .export-code-line-content { flex: 1; word-break: break-all; white-space: pre-wrap; }

      .token-comment { color: #6A9955; font-style: italic; }
      .token-keyword { color: #C586C0; font-weight: bold; text-decoration: underline; }
      .token-string { color: #CE9178; font-style: italic; }
      .token-number { color: #B5CEA8; font-weight: bold; }

      .export-table-wrap {
        overflow: hidden;
        border: 3px solid var(--line);
        box-shadow: var(--shadow);
        margin: 1.5rem 0;
      }

      .export-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.94rem;
        background: #ffffff;
      }

      .export-table th {
        background: #ffffff;
        border-bottom: 3px solid var(--line);
        text-align: left;
        padding: 12px 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .export-table td {
        padding: 12px 14px;
        border-top: 2px solid var(--line);
        font-weight: 500;
      }

      .export-table tr:nth-child(even) td { background: #ffffff; }

      .export-footer {
        margin-top: 36px;
        padding-top: 16px;
        border-top: 3px solid var(--line);
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--ink);
        font-size: 0.86rem;
        font-weight: 700;
      }

      @media print {
        body {
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .export-page {
          padding: 0;
          max-width: 100%;
        }
        .newspaper-masthead, .export-block, .export-toc, .export-hero, .export-code-shell, .export-table-wrap, .export-callout {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="export-page">
      <div class="newspaper-masthead">
        <div class="newspaper-top-bar">
          <div class="brand-title-group">
            <span class="brand-badge">1%</span>
            <span class="brand-name">Dev Academy</span>
          </div>
        </div>
        <div class="brand-tagline">Your learning. Your streak. Your momentum — every single day.</div>
        <div class="newspaper-dateline">
          <span>Vol. 1 • No. 101</span>
          <span>Daily Learning Discipline</span>
          <span>${escapeHtml(courseTitle.toUpperCase())}</span>
        </div>
      </div>

      <header class="export-header">
        <div>
          <div class="export-badge">${escapeHtml(courseTitle)}</div>
          <h1>${escapeHtml(lessonTitle)}</h1>
          <p>${escapeHtml(moduleTitle)} • Part ${data.part} • ${escapeHtml(data.importance)}</p>
        </div>
        <div style="text-align:right;">
          <p><strong>Generated:</strong> ${escapeHtml(generatedAt)}</p>
          <p><strong>Version:</strong> ${escapeHtml(data.version || '1.0')}</p>
        </div>
      </header>

      <section class="export-hero">
        <div class="eyebrow">Premium lesson export</div>
        <h1>${escapeHtml(lessonTitle)}</h1>
        <div class="hero-meta">
          <span>Course: ${escapeHtml(courseTitle)}</span>
          <span>Module: ${escapeHtml(moduleTitle)}</span>
          <span>Part ${data.part}</span>
          <span>Reading time: ${data.readTime} min</span>
          <span>Difficulty: Intermediate</span>
        </div>
      </section>

      ${tocHtml}
      ${contentHtml}

      <footer class="export-footer">
        <span><strong>${escapeHtml(courseTitle)}</strong> • ${escapeHtml(moduleTitle)}</span>
        <span>Generated ${escapeHtml(generatedAt)} • 1% Dev Academy</span>
      </footer>
    </div>
  </body>
</html>`;
}
