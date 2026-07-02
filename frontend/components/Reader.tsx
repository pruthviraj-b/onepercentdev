'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { NoteData } from '@/lib/api';
import { getVideoIds } from '@/lib/videos';
import MarkdownRenderer from './MarkdownRenderer';

const Playground = dynamic(() => import('./Playground').then(m => m.Playground), { ssr: false });
const InteractiveBlueprint = dynamic(() => import('./InteractiveBlueprint').then(m => m.InteractiveBlueprint), { ssr: false });
const CodexQuiz = dynamic(() => import('./CodexQuiz').then(m => m.CodexQuiz), { ssr: false });
const IlMentore = dynamic(() => import('./IlMentore').then(m => m.IlMentore), { ssr: false });

type ReaderMode = 'read' | 'watch' | 'split' | 'practice' | 'blueprint';

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

// â”€â”€ YouTube Resumable Player â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Smooth, non-blocking video resume. The video loads INSTANTLY using localStorage
// for the start time. Backend sync happens in the background without blocking playback.

import { fetchVideoTimestamp, saveVideoTimestamp } from '@/lib/api';

const LS_VTS = 'opd_video_ts';
const getLocalTs = (cid: string, p: number): number => {
  try { return parseFloat(localStorage.getItem(`${LS_VTS}_${cid}_${p}`) || '0') || 0; } catch { return 0; }
};
const setLocalTs = (cid: string, p: number, t: number) => {
  try { localStorage.setItem(`${LS_VTS}_${cid}_${p}`, String(t)); } catch {}
};

// Ensure YT API script is loaded exactly once
let ytApiPromise: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if ((window as any).YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

function YouTubeResumable({ videoId, courseId, part }: { videoId: string; courseId: string; part: number; title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let dead = false;

    // 1. Read localStorage SYNCHRONOUSLY â€” zero delay
    const localTs = getLocalTs(courseId, part);

    const boot = async () => {
      await loadYTApi();
      if (dead || !hostRef.current) return;

      // Create a fresh target div inside the host
      const id = `yt-${courseId}-${part}-${Date.now()}`;
      const el = document.createElement('div');
      el.id = id;
      // Don't wipe â€” just append (host starts empty or was cleaned on unmount)
      hostRef.current.appendChild(el);

      playerRef.current = new (window as any).YT.Player(id, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          color: 'white',
          start: Math.floor(localTs), // instant â€” from localStorage
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            // In parallel, check if the backend has a NEWER timestamp
            fetchVideoTimestamp(courseId, part).then(serverTs => {
              if (dead) return;
              // Only seek if server time is meaningfully different (>5s ahead)
              if (serverTs > localTs + 5 && playerRef.current?.seekTo) {
                playerRef.current.seekTo(serverTs, true);
                setLocalTs(courseId, part, serverTs);
              }
            }).catch(() => {});
          },
          onStateChange: (ev: any) => {
            const YT = (window as any).YT;
            if (ev.data === YT.PlayerState.PLAYING) {
              // Save to localStorage every 5s (instant, no network)
              if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                  try {
                    const t = playerRef.current?.getCurrentTime?.();
                    if (t > 0) setLocalTs(courseId, part, t);
                  } catch {}
                }, 5000);
              }
              // Save to backend every 30s (light network)
              if (!backendTimerRef.current) {
                backendTimerRef.current = setInterval(() => {
                  try {
                    const t = playerRef.current?.getCurrentTime?.();
                    if (t > 0) saveVideoTimestamp(courseId, part, t);
                  } catch {}
                }, 30000);
              }
            } else {
              // Paused / ended / buffering â€” save once and clear timers
              clearInterval(timerRef.current!);
              timerRef.current = null;
              clearInterval(backendTimerRef.current!);
              backendTimerRef.current = null;
              try {
                const t = playerRef.current?.getCurrentTime?.();
                if (t > 0) {
                  setLocalTs(courseId, part, t);
                  saveVideoTimestamp(courseId, part, t);
                }
              } catch {}
            }
          },
        },
      });
    };

    boot();

    return () => {
      dead = true;
      clearInterval(timerRef.current!);
      clearInterval(backendTimerRef.current!);
      // Save final position
      try {
        const t = playerRef.current?.getCurrentTime?.();
        if (t > 0) {
          setLocalTs(courseId, part, t);
          saveVideoTimestamp(courseId, part, t);
        }
      } catch {}
      try { playerRef.current?.destroy?.(); } catch {}
      // Clean the host div
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [videoId, courseId, part]);

  return (
    <div
      ref={hostRef}
      className="video-iframe-wrap"
      style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, background: '#000' }}
    >
      <style>{`
        .video-iframe-wrap iframe {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
      `}</style>
    </div>
  );
}

// â”€â”€ Multi-Video Player â€” tabs for multiple videos per part â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MultiVideoPlayer({ videoIds, courseId, part, title, loading }: {
  videoIds: string[];
  courseId: string;
  part: number;
  title: string;
  loading: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset to first video whenever the part changes
  useEffect(() => { setActiveIdx(0); }, [part]);

  if (loading) return <div className="video-embed-wrap"><div className="video-skeleton" /></div>;

  if (videoIds.length === 0) {
    return (
      <div className="video-embed-wrap">
        <div className="video-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Video in progress / coming soon</span>
        </div>
      </div>
    );
  }

  const safeIdx = Math.min(activeIdx, videoIds.length - 1);

  return (
    <div>
      {/* Video tabs â€” only shown when more than one video */}
      {videoIds.length > 1 && (
        <div style={{ display:'flex', gap:2, padding:'4px 6px', background:'var(--win-mid)',
          borderBottom:'2px solid var(--border)', overflowX:'auto', flexShrink:0 }}
          role="tablist" aria-label="Lesson videos">
          {videoIds.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={safeIdx === i}
              onClick={() => setActiveIdx(i)}
              style={{
                padding:'3px 10px', fontSize:'0.7rem', fontWeight:800,
                border:'2px solid #000', cursor:'pointer',
                fontFamily:'var(--font-ui)', textTransform:'uppercase',
                background: safeIdx === i ? '#000' : '#fff',
                color: safeIdx === i ? '#f1be3e' : '#000',
                flexShrink:0,
                boxShadow: safeIdx === i ? 'none' : '1px 1px 0 #000',
              }}>
              Video {i + 1}
            </button>
          ))}
        </div>
      )}
      {/* Player */}
      <div className="video-embed-wrap">
        <YouTubeResumable
          key={`${courseId}-${part}-${safeIdx}`}
          videoId={videoIds[safeIdx]}
          courseId={courseId}
          part={part}
          title={`${title}${videoIds.length > 1 ? ` (Video ${safeIdx + 1})` : ''}`}
        />
      </div>
    </div>
  );
}

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
  onTabChange, onToggleComplete, onPrev, onNext,
  courseId,
}: Props) {
  const notesRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [readingPct, setReadingPct] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [playgroundCode, setPlaygroundCode] = useState<string | null>(null);
  const [playgroundKey, setPlaygroundKey] = useState(0);
  const [mode, setMode] = useState<ReaderMode>('read');
  const [mentoreOpen, setMentoreOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  const videoIds = noteData ? getVideoIds(courseId, noteData.part) : [];
  const hasFiles = !!noteData?.files.length;
  const cleanTitle = noteData?.title.replace(/^Part\s+\d+(?:\.\d+)?\s*[-–—]?\s*/i, '') || 'Lesson';

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
  }, [noteData, mode]);

  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.scrollTop = 0;
      setReadingPct(0);
      setShowScrollTop(false);
    }
    setMode('read');
  }, [noteData?.part]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMentoreOpen(o => !o);
      }
      if (e.key === '1') setMode('read');
      if (e.key === '2') setMode('watch');
      if (e.key === '3') setMode('split');
      if (e.key === '4') setMode('practice');
      if (e.key === '5') setMode('blueprint');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false);
      }
    };
    if (downloadMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadMenuOpen]);

  const sendToPlayground = useCallback((code: string) => {
    setPlaygroundCode(code);
    setPlaygroundKey(k => k + 1);
    setMode('practice');
  }, []);

  const readTime = noteData
    ? Math.max(1, Math.round(noteData.notes.split(/\s+/).length / 200))
    : 0;

  const renderDownloadMenu = () => noteData && (
    <div ref={downloadMenuRef} className="download-dropdown" role="group" aria-label="Download notes">
      <button
        className={`download-icon-btn${downloadMenuOpen ? ' active' : ''}`}
        onClick={() => setDownloadMenuOpen(o => !o)}
        title="Download notes"
        aria-label="Download notes"
        aria-haspopup="true"
        aria-expanded={downloadMenuOpen}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
      {downloadMenuOpen && (
        <div className="download-menu" role="menu" aria-label="Download format options">
          <button
            role="menuitem"
            className="download-menu-item"
            onClick={() => { downloadFile(`Part-${noteData.part}-Notes.md`, noteData.notes); setDownloadMenuOpen(false); }}
          >
            <span>Markdown <span className="download-menu-ext">.md</span></span>
          </button>
          <button
            role="menuitem"
            className="download-menu-item"
            onClick={async () => {
              setDownloadMenuOpen(false);
              if (typeof window === 'undefined') return;
              if (!(window as any).html2pdf) {
                await new Promise<void>((resolve, reject) => {
                  const script = document.createElement('script');
                  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                  script.onload = () => resolve();
                  script.onerror = reject;
                  document.head.appendChild(script);
                });
              }
              const html2pdf = (window as any).html2pdf;
              const element = document.querySelector('.prose');
              if (element && html2pdf) {
                html2pdf().set({
                  margin: 0.5,
                  filename: `Part-${noteData.part}-Notes.pdf`,
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                }).from(element).save();
              }
            }}
          >
            <span>PDF <span className="download-menu-ext">.pdf</span></span>
          </button>
          <button
            role="menuitem"
            className="download-menu-item"
            onClick={() => {
              setDownloadMenuOpen(false);
              const element = document.querySelector('.prose');
              if (element) {
                const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Notes</title></head><body>";
                const footer = "</body></html>";
                const sourceHTML = header + element.innerHTML + footer;
                const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
                const fileDownload = document.createElement('a');
                document.body.appendChild(fileDownload);
                fileDownload.href = source;
                fileDownload.download = `Part-${noteData.part}-Notes.doc`;
                fileDownload.click();
                document.body.removeChild(fileDownload);
              }
            }}
          >
            <span>Word <span className="download-menu-ext">.doc</span></span>
          </button>
        </div>
      )}
    </div>
  );

  const renderNotesArticle = () => (
    <div className="notes-inner" role="article">
      {noteData && (
        <>
          <div className="note-hero" aria-label="Lesson metadata">
            <div className="note-kicker-row">
              <span className="note-part-badge">Part {noteData.part}</span>
              <span className={`importance-tag importance-${noteData.importance}`}>{noteData.importance}</span>
              <span className="note-module-badge">{noteData.module}</span>
            </div>
            <h1 className="note-title-text">{cleanTitle}</h1>
          </div>

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
                    return <CodeBlock lang={lang} code={codeText} onRun={isPython ? () => sendToPlayground(codeText) : undefined} />;
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

          <CodexQuiz
            courseId={courseId}
            part={noteData.part}
            onComplete={() => {
              if (!isCompleted) onToggleComplete();
            }}
          />

          <div className="notes-footer">
            <button className={`btn-complete${isCompleted ? ' done' : ''}`} onClick={onToggleComplete}>
              {isCompleted ? 'Completed - click to undo' : 'Mark part complete'}
            </button>
            {currentIdx < totalCount - 1 && onNext && (
              <button className="btn-next-part" onClick={onNext}>Next part</button>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderFiles = () => noteData && (
    <div className="notes-inner files-view">
      <div className="note-hero compact">
        <div className="note-kicker-row">
          <span className="note-part-badge">Part {noteData.part}</span>
          <span className="note-module-badge">Files</span>
        </div>
        <h1 className="note-title-text">Lesson files</h1>
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
            onRun={!f.isBinary && f.content && f.path.endsWith('.py') ? () => sendToPlayground(f.content!) : undefined}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={`reader reader-mode-${mode}`}>
      <div className="reader-toolbar reader-toolbar-clean" role="toolbar" aria-label="Lesson toolbar">
        <div className="reader-mode-tabs" role="tablist" aria-label="Lesson mode">
          {([
            ['read', 'Read'],
            ['watch', 'Watch'],
            ['split', 'Video + Code'],
            ['practice', 'Practice'],
            ['blueprint', 'Blueprint'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={mode === value}
              className={`reader-mode-tab${mode === value ? ' active' : ''}`}
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
          {hasFiles && (
            <button
              role="tab"
              aria-selected={activeTab === 'files'}
              className={`reader-mode-tab${activeTab === 'files' ? ' active' : ''}`}
              onClick={() => onTabChange(activeTab === 'files' ? 'notes' : 'files')}
            >
              Files
            </button>
          )}
        </div>

        <div className="toolbar-right reader-actions">
          {noteData && <span className="toolbar-meta">{readTime} min read</span>}
          <span className="toolbar-meta">{Math.max(0, currentIdx + 1)} / {totalCount}</span>
          {renderDownloadMenu()}
          <button className="part-nav-btn" onClick={onPrev} disabled={!onPrev} aria-label="Previous part">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Prev
          </button>
          <button className="part-nav-btn" onClick={onNext} disabled={!onNext} aria-label="Next part">
            Next
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="reading-progress">
        <div className="reading-progress-fill" style={{ width: `${readingPct}%` }} />
      </div>

      <div className="reader-stage">
        {loading && <SkeletonLoader />}

        {!loading && activeTab === 'files' && renderFiles()}

        {!loading && activeTab === 'notes' && mode === 'read' && (
          <div className="notes-panel reader-focus-panel">
            <div className="notes-scroll" ref={notesRef}>{renderNotesArticle()}</div>
          </div>
        )}

        {!loading && activeTab === 'notes' && mode === 'watch' && (
          <div className="reader-tool-page watch-page">
            <div className="tool-page-header">
              <span className="note-part-badge">Part {noteData?.part ?? '-'}</span>
              <h1>{cleanTitle}</h1>
            </div>
            <div className="watch-layout">
              <div className="watch-player-shell">
                <MultiVideoPlayer
                  videoIds={videoIds}
                  courseId={courseId}
                  part={noteData?.part ?? 0}
                  title={noteData?.title || 'Lesson'}
                  loading={loading}
                />
              </div>
              <aside className="watch-companion">
                <h2>Keep momentum</h2>
                <p>Watch the lesson, then jump into practice when a concept needs hands-on work.</p>
                <button className="btn-next-part" onClick={() => setMode('practice')}>Open practice</button>
              </aside>
            </div>
          </div>
        )}

        {!loading && activeTab === 'notes' && mode === 'split' && (
          <div className="reader-tool-page split-page">
            <div className="split-layout">
              <section className="split-video-panel" aria-label="Lesson video">
                <div className="split-panel-header">
                  <span className="note-part-badge">Video</span>
                  <h2>{cleanTitle}</h2>
                </div>
                <div className="split-video-shell">
                  <MultiVideoPlayer
                    videoIds={videoIds}
                    courseId={courseId}
                    part={noteData?.part ?? 0}
                    title={noteData?.title || 'Lesson'}
                    loading={loading}
                  />
                </div>
              </section>

              <section className="split-practice-panel" aria-label="Practice playground">
                <div className="split-panel-header">
                  <span className="note-part-badge">Playground</span>
                  <h2>Practice while watching</h2>
                </div>
                <div className="split-playground-shell">
                  <Playground key={playgroundKey} prefilledCode={playgroundCode} courseId={courseId} />
                </div>
              </section>
            </div>
          </div>
        )}

        {!loading && activeTab === 'notes' && mode === 'practice' && (
          <div className="reader-tool-page practice-page">
            <div className="tool-page-header compact">
              <span className="note-part-badge">Practice</span>
              <h1>{cleanTitle}</h1>
            </div>
            <div className="practice-shell">
              <Playground key={playgroundKey} prefilledCode={playgroundCode} courseId={courseId} />
            </div>
          </div>
        )}

        {!loading && activeTab === 'notes' && mode === 'blueprint' && (
          <div className="reader-tool-page blueprint-page">
            <InteractiveBlueprint courseId={courseId} part={noteData ? noteData.part : 1} />
          </div>
        )}
      </div>

      <button
        className={`scroll-top${showScrollTop && mode === 'read' ? ' visible' : ''}`}
        onClick={() => notesRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Scroll to top"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>

      <button
        className={`floating-mentore-badge${mentoreOpen ? ' active' : ''}`}
        onClick={() => setMentoreOpen(prev => !prev)}
        title="Ask AI tutor about this lesson [m]"
        aria-label="Open AI tutor for this lesson"
        aria-expanded={mentoreOpen}
      >
        <span>Ask AI</span>
        <kbd aria-label="Keyboard shortcut: m">m</kbd>
      </button>

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
// â”€â”€ Code Block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            <button className="run-btn" onClick={onRun} title="Send to playground">
              Run
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

// â”€â”€ File Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FileCard({ file, onRun }: { file: { path: string; content: string | null; isBinary?: boolean; url?: string }; onRun?: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownload = () => {
    if (file.url) {
      // Cloudinary URLs are cross-origin â€” a.download is blocked by browsers.
      // Use fetch+blob for same-origin, window.open for cross-origin (Cloudinary).
      const isCrossOrigin = file.url.startsWith('http') && !file.url.startsWith(window.location.origin);
      if (isCrossOrigin) {
        // Fetch through a proxy-friendly approach: fetch the blob then download
        fetch(file.url)
          .then(r => r.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = file.path.split('/').pop() || file.path;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          })
          .catch(() => {
            // Fallback: open in new tab so user can save manually
            window.open(file.url, '_blank');
          });
      } else {
        const a = document.createElement('a');
        a.href = file.url;
        a.download = file.path.split('/').pop() || file.path;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } else if (file.content) {
      downloadFile(file.path, file.content);
    }
  };

  return (
    <div className="file-card">
      <div className="file-card-header">
        <span className="file-name">{file.path}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {file.isBinary && file.url && (
            <button className="run-btn" onClick={() => window.open(file.url, '_blank')} title="Open in new tab">Open</button>
          )}
          {!file.isBinary && onRun && <button className="run-btn" onClick={onRun}>Run</button>}
          {!file.isBinary && (
            <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          <button
            className="copy-btn"
            onClick={handleDownload}
            title="Download this file"
          >
            Download
          </button>
        </div>
      </div>
      {!file.isBinary && <pre className="file-code">{file.content}</pre>}
      {file.isBinary && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--page-text-muted)', fontSize: '0.9rem' }}>
          Binary file ({file.path.split('.').pop()?.toUpperCase()}) - use buttons above to open or download.
        </div>
      )}
    </div>
  );
}

// â”€â”€ Skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SkeletonLoader() {
  return (
    <div style={{ padding: '32px 40px' }}>
      {[70, 50, 90, 60, 80, 45, 75, 55].map((w, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}
