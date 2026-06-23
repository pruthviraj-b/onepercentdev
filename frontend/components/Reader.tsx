'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { NoteData } from '@/lib/api';
import { getVideoId } from '@/lib/videos';
import { Playground } from './Playground';
import { InteractiveBlueprint } from './InteractiveBlueprint';
import { CodexQuiz } from './CodexQuiz';
import { IlMentore } from './IlMentore';

const MarkdownRenderer = dynamic(() => import('./MarkdownRenderer'), { ssr: false });

const downloadFile = (filename: string, content: string) => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

interface Props {
  noteData: NoteData | null;
  loading: boolean;
  activeTab: 'notes' | 'files';
  isCompleted: boolean;
  isBookmarked: boolean;
  currentIdx: number;
  totalCount: number;
  notesExpanded: boolean;
  onToggleExpand: () => void;
  onTabChange: (tab: 'notes' | 'files') => void;
  onToggleComplete: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  videoPlaygroundMode: boolean;
  onToggleVideoPlayground: () => void;
  onShowShortcuts: () => void;
  courseId: string;
}

export function Reader({
  noteData, loading, activeTab, isCompleted,
  currentIdx, totalCount,
  notesExpanded, onToggleExpand,
  onTabChange, onToggleComplete, onPrev, onNext,
  videoPlaygroundMode, onToggleVideoPlayground,
  onShowShortcuts,
  courseId,
}: Props) {
  const notesRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [readingPct, setReadingPct] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [playgroundCode, setPlaygroundCode] = useState<string | null>(null);
  const [playgroundKey, setPlaygroundKey] = useState(0);
  const [splitPct, setSplitPct] = useState(38); // percentage for LEFT side-panel
  const [activePanelTab, setActivePanelTab] = useState<'practice' | 'blueprint'>('practice');
  const [mentoreOpen, setMentoreOpen] = useState(false);

  const videoId = noteData ? getVideoId(courseId, noteData.part) : null;

  // Reading progress
  useEffect(() => {
    const el = notesRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const pct = scrollHeight > clientHeight
        ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
      setReadingPct(pct);
      setShowScrollTop(scrollTop > 300);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [noteData]);

  // Reset scroll when note changes
  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.scrollTop = 0;
      setReadingPct(0);
      setShowScrollTop(false);
    }
  }, [noteData?.part]);

  // Keyboard shortcut listener to toggle Il Mentore
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMentoreOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sendToPlayground = useCallback((code: string) => {
    if (typeof window !== 'undefined') {
      const confirmOverride = window.confirm("Are you sure you want to load this code snippet? It will replace the current active code in the coding playground.");
      if (!confirmOverride) return;
    }
    setPlaygroundCode(code);
    setPlaygroundKey(k => k + 1);
  }, []);

  // Drag-to-resize handlers
  const onResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(65, Math.max(20, pct)));
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const readTime = noteData
    ? Math.max(1, Math.round(noteData.notes.split(/\s+/).length / 200))
    : 0;

  return (
    <div className="reader">

      {/* ── Toolbar ── */}
      <div className="reader-toolbar">
        <div className="tab-row">
          <button
            className={`tab-btn${activeTab === 'notes' ? ' active' : ''}`}
            onClick={() => onTabChange('notes')}
          >
            Notes
          </button>
          {noteData && noteData.files.length > 0 && (
            <button
              className={`tab-btn${activeTab === 'files' ? ' active' : ''}`}
              onClick={() => onTabChange('files')}
            >
              Files ({noteData.files.length})
            </button>
          )}
        </div>

        <div className="toolbar-right">
          {noteData && (
            <span className="toolbar-meta">{readTime} min read</span>
          )}
          <span className="toolbar-meta">{currentIdx + 1} / {totalCount}</span>
          <button className="part-nav-btn" onClick={onPrev} disabled={!onPrev}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Prev
          </button>
          <button className="part-nav-btn" onClick={onNext} disabled={!onNext}>
            Next
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          {noteData && (
            <button
              className="part-nav-btn download-notes-btn"
              onClick={() => downloadFile(`Part-${noteData.part}-Notes.md`, noteData.notes)}
              title="Download Notes as Markdown file"
              style={{ background: 'var(--win-midlight)' }}
            >
              📥 Notes
            </button>
          )}
          {/* Expand / collapse right panel */}
          <button
            className={`icon-btn${notesExpanded ? ' active' : ''}`}
            title={notesExpanded ? 'Show Video & Playground' : 'Expand Notes Full Width'}
            onClick={onToggleExpand}
          >
            {notesExpanded ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            )}
          </button>
          <button
            className={`icon-btn${videoPlaygroundMode ? ' active' : ''}`}
            title={videoPlaygroundMode ? 'Show Notes' : 'Split Video & Playground [v]'}
            onClick={onToggleVideoPlayground}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
              <polygon points="7 9 10 12 7 15" fill="currentColor" />
              <path d="M15 8l2 2-2 2" />
              <line x1="15" y1="14" x2="19" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Reading progress bar ── */}
      <div className="reading-progress">
        <div className="reading-progress-fill" style={{ width: `${readingPct}%` }} />
      </div>

      {/* ── SPLIT LAYOUT ── */}
      <div
        ref={splitRef}
        className={`reader-split${notesExpanded ? ' notes-only' : ''}${videoPlaygroundMode ? ' video-playground-only' : ''}`}
        style={notesExpanded || videoPlaygroundMode ? undefined : { gridTemplateColumns: `${splitPct}% ${100 - splitPct}%` }}
      >

        {/* ════ LEFT: Video + Playground or Interactive Blueprint ════ */}
        <div className="side-panel">
          {/* Side Panel Tabs */}
          <div className="side-panel-tabs" style={{ display: 'flex', background: 'var(--win-bg)', borderBottom: '2px solid var(--border)', flexShrink: 0 }}>
            <button
              className={`panel-tab-btn ${activePanelTab === 'practice' ? 'active' : ''}`}
              onClick={() => setActivePanelTab('practice')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                background: activePanelTab === 'practice' ? 'var(--win-light)' : 'transparent',
                color: activePanelTab === 'practice' ? 'var(--link)' : 'var(--page-text)',
                border: 'none',
                borderRight: '2px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              📹 Video & Practice
            </button>
            <button
              className={`panel-tab-btn ${activePanelTab === 'blueprint' ? 'active' : ''}`}
              onClick={() => setActivePanelTab('blueprint')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                background: activePanelTab === 'blueprint' ? 'var(--win-light)' : 'transparent',
                color: activePanelTab === 'blueprint' ? 'var(--link)' : 'var(--page-text)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              📐 System Blueprint
            </button>
          </div>

          {activePanelTab === 'practice' ? (
            <>
              {/* Video */}
              <div className="side-video">
                <div className="side-video-label">
                  <span className="panel-label">
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{width:10,height:10,display:'inline',marginRight:5}}>
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Lesson Video
                  </span>
                </div>
                <div className="video-embed-wrap">
                  {loading ? (
                    <div className="video-skeleton" />
                  ) : videoId ? (
                    <iframe
                      key={videoId}
                      className="video-iframe"
                      src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&color=white`}
                      title={noteData?.title || 'Lesson'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="video-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="2" width="20" height="20" rx="2"/>
                        <polygon points="10 8 16 12 10 16 10 8"/>
                      </svg>
                      <span>No video for this part</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Playground */}
              <div className="side-playground">
                <Playground key={playgroundKey} prefilledCode={playgroundCode} isCloud={courseId === 'cloud'} />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', background: 'var(--win-midlight)' }}>
              <InteractiveBlueprint courseId={courseId} part={noteData ? noteData.part : 1} />
            </div>
          )}
        </div>

        <div className="notes-panel">
          <div className="notes-scroll" ref={notesRef}>


            {loading && <SkeletonLoader />}

            {!loading && noteData && activeTab === 'notes' && (
              <div className="notes-inner">
                {/* Meta strip */}
                <div className="note-meta-strip">
                  <span className="note-part-badge">Part {noteData.part}</span>
                  <span className={`importance-tag importance-${noteData.importance}`}>
                    {noteData.importance}
                  </span>
                  <span className="note-module-badge">{noteData.module}</span>
                  <span className="note-title-text">
                    {noteData.title.replace(/^Part \d+ [-–] ?/, '')}
                  </span>
                </div>

                {/* Markdown content */}
                <div className="prose">
                  <MarkdownRenderer
                    content={noteData.notes}
                    components={{
                      code(props: any) {
                        const { className, children, ...rest } = props as any;
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1] : 'text';
                        const codeText = String(children ?? '').replace(/\n$/, '');
                        const isBlock = !!match || codeText.includes('\n');
                        if (isBlock) {
                          const isPython = ['python', 'py'].includes(lang.toLowerCase());
                          return (
                            <CodeBlock
                              lang={lang}
                              code={codeText}
                              onRun={isPython ? () => sendToPlayground(codeText) : undefined}
                            />
                          );
                        }
                        return <code className={className} {...rest}>{children}</code>;
                      },
                      pre({ children }: any) { return <>{children}</>; },
                      table: ({ children }: any) => (
                        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                          <table>{children}</table>
                        </div>
                      ),
                    }}
                  />
                </div>

                {/* Codex Quiz */}
                <CodexQuiz
                  courseId={courseId}
                  part={noteData.part}
                  onComplete={() => {
                    if (!isCompleted) {
                      onToggleComplete();
                    }
                  }}
                />

                {/* Complete button */}
                <div className="notes-footer">
                  <button
                    className={`btn-complete${isCompleted ? ' done' : ''}`}
                    onClick={onToggleComplete}
                  >
                    {isCompleted ? '✓ Completed — Click to undo' : 'Mark Part as Complete →'}
                  </button>
                  {currentIdx < totalCount - 1 && onNext && (
                    <button className="btn-next-part" onClick={onNext}>
                      Next Part →
                    </button>
                  )}
                </div>
              </div>
            )}

            {!loading && noteData && activeTab === 'files' && (
              <div className="notes-inner">
                <div className="note-meta-strip">
                  <span className="note-part-badge">Part {noteData.part}</span>
                  <span className="note-module-badge">Files</span>
                </div>
                <div className="files-grid">
                  {noteData.files.length === 0 ? (
                    <div className="empty-files">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <p>No code files for this part.</p>
                    </div>
                  ) : noteData.files.map(f => (
                    <FileCard
                      key={f.path}
                      file={f}
                      onRun={f.path.endsWith('.py') ? () => sendToPlayground(f.content) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Scroll to top */}
      <button
        className={`scroll-top${showScrollTop ? ' visible' : ''}`}
        onClick={() => notesRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Scroll to top"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>

      {/* Floating Il Mentore Badge */}
      <button
        className="floating-mentore-badge"
        onClick={() => setMentoreOpen(prev => !prev)}
        title="Consult Il Mentore (da Vinci Companion) [m]"
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '80px',
          zIndex: 98,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          border: '2px solid var(--border)',
          background: 'var(--win-light)',
          color: 'var(--page-text)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.78rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '3px 3px 0 var(--win-shadow)',
          transition: 'all 0.1s ease',
        }}
      >
        <span>🦉 Il Mentore</span>
        <kbd style={{
          background: 'var(--win-mid)',
          padding: '1px 4px',
          border: '1px solid var(--border)',
          fontSize: '0.62rem',
          marginLeft: '4px',
          color: 'var(--page-text)'
        }}>m</kbd>
      </button>

      {/* Floating Shortcuts Badge */}
      <button
        className="floating-shortcuts-badge"
        onClick={onShowShortcuts}
        title="Show Keyboard Shortcuts [?]"
      >
        <span>Shortcuts</span>
        <kbd className="badge-kbd">?</kbd>
      </button>

      {/* Il Mentore companion side-drawer */}
      <IlMentore
        courseId={courseId}
        partNum={noteData ? noteData.part : 1}
        lessonTitle={noteData ? noteData.title : 'Lesson'}
        isOpen={mentoreOpen}
        onClose={() => setMentoreOpen(false)}
      />
    </div>
  );
}

// ── Code Block ────────────────────────────────────────────────────
function CodeBlock({ lang, code, onRun }: { lang: string; code: string; onRun?: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <pre>
      <div className="code-block-header">
        <span className="code-lang">{lang}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {onRun && (
            <button className="run-btn" onClick={onRun} title="Send to playground →">
              ▶ Run
            </button>
          )}
          <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            className="copy-btn"
            onClick={() => {
              const ext = ['python', 'py'].includes(lang.toLowerCase()) ? 'py' : ['bash', 'sh'].includes(lang.toLowerCase()) ? 'sh' : 'txt';
              downloadFile(`snippet.${ext}`, code);
            }}
            title="Download this code snippet"
          >
            Download
          </button>
        </div>
      </div>
      <code>{code}</code>
    </pre>
  );
}

// ── File Card ─────────────────────────────────────────────────────
function FileCard({ file, onRun }: { file: { path: string; content: string }; onRun?: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="file-card">
      <div className="file-card-header">
        <span className="file-name">{file.path}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {onRun && <button className="run-btn" onClick={onRun}>▶ Run</button>}
          <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            className="copy-btn"
            onClick={() => downloadFile(file.path, file.content)}
            title="Download this file"
          >
            Download
          </button>
        </div>
      </div>
      <pre className="file-code">{file.content}</pre>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div style={{ padding: '32px 40px' }}>
      {[70, 50, 90, 60, 80, 45, 75, 55].map((w, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}
