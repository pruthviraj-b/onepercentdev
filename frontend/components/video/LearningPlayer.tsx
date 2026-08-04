'use client';

/**
 * LearningPlayer — Advanced YouTube Learning Player
 *
 * Wraps the existing YouTubeResumable player and adds:
 * 1. Auto-complete at 90% (fires onAutoComplete callback)
 * 2. Watch session tracking (start/end sessions for learning time)
 * 3. Watch history upsert on play/pause
 * 4. Exposes current timestamp via onTimeUpdate for notes/bookmarks
 * 5. Resume dialog shown when returning to a lesson with >30s saved progress
 * 6. Completion animation overlay
 *
 * Clean separation: this component handles LMS logic; the YouTube API
 * interaction is handled by the inner YouTubeCore subcomponent.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  startWatchSession, endWatchSession,
  markVideoCompleted, checkVideoCompleted,
  upsertWatchHistory,
  formatSeconds,
} from '@/services/readerService';
import { fetchVideoTimestamp, saveVideoTimestamp } from '@/services/courseService';
import { logActivity } from '@/services/analyticsService';

// ── YouTube API loader ────────────────────────────────────────────────────────
let ytApiPromise: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if ((window as any).YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

const LS_VTS = 'opd_video_ts';
const getLocalTs = (cid: string, p: number) => {
  try { return parseFloat(localStorage.getItem(`${LS_VTS}_${cid}_${p}`) || '0') || 0; } catch { return 0; }
};
const setLocalTs = (cid: string, p: number, t: number) => {
  try { localStorage.setItem(`${LS_VTS}_${cid}_${p}`, String(t)); } catch {}
};

// ── Completion animation ──────────────────────────────────────────────────────
function CompletionAnimation({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, animation: 'fadeIn 0.3s ease',
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div style={{ fontSize: '3rem', animation: 'popIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>🎉</div>
      <div style={{ color: '#F59E0B', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '1.2rem', marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Lesson Complete!
      </div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginTop: 6, fontFamily: 'var(--font-ui)' }}>
        Progress saved ✓
      </div>
    </div>
  );
}

// ── Resume dialog ─────────────────────────────────────────────────────────────
function ResumeDialog({ savedAt, onResume, onStartOver }: {
  savedAt: number; onResume: () => void; onStartOver: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40,
    }}>
      <div style={{ background: '#fff', border: '3px solid #1F2937', boxShadow: '8px 8px 0 #1F2937', padding: '24px 28px', maxWidth: 300, width: '90%', textAlign: 'center', fontFamily: 'var(--font-ui)' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>▶</div>
        <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: 6, textTransform: 'uppercase' }}>Continue watching?</div>
        <div style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: 18 }}>
          You left off at <strong>{formatSeconds(savedAt)}</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onResume}
            style={{ flex: 1, padding: '10px', background: '#1F2937', color: '#F59E0B', border: '2px solid #1F2937', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase' }}>
            Resume
          </button>
          <button onClick={onStartOver}
            style={{ flex: 1, padding: '10px', background: '#fff', color: '#1F2937', border: '2px solid #1F2937', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase' }}>
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface LearningPlayerProps {
  videoId: string;
  courseId: string;
  partId: number;
  courseTitle?: string;
  lessonTitle?: string;
  /** Called every second with the current playback position */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** Called when the video auto-completes (90% threshold) */
  onAutoComplete?: () => void;
}

// ── LearningPlayer ────────────────────────────────────────────────────────────
export function LearningPlayer({
  videoId, courseId, partId, courseTitle, lessonTitle, onTimeUpdate, onAutoComplete,
}: LearningPlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const sessionIdRef = useRef<number | null>(null);
  const watchSecsRef = useRef(0);  // actual seconds watched (not paused)
  const watchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const backendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const durationRef  = useRef(0);

  const [showResume, setShowResume] = useState(false);
  const [savedTs, setSavedTs] = useState(0);
  const [resolvedTs, setResolvedTs] = useState<number | null>(null); // null = not yet decided
  const [showCompletion, setShowCompletion] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Check prior completion status once
  useEffect(() => {
    checkVideoCompleted(courseId, partId).then(r => {
      if (r.completed) setAlreadyCompleted(true);
    });
  }, [courseId, partId]);

  // Decide whether to show resume dialog
  useEffect(() => {
    const localTs = getLocalTs(courseId, partId);
    if (localTs > 30) {
      setSavedTs(localTs);
      setShowResume(true);
    } else {
      setResolvedTs(localTs);
    }
  }, [courseId, partId]);

  const stopWatchTimer = useCallback(() => {
    clearInterval(watchTimerRef.current!); watchTimerRef.current = null;
    clearInterval(saveTimerRef.current!); saveTimerRef.current = null;
    clearInterval(backendTimerRef.current!); backendTimerRef.current = null;
  }, []);

  const saveProgress = useCallback((t: number) => {
    if (t > 0) {
      setLocalTs(courseId, partId, t);
      saveVideoTimestamp(courseId, partId, t);
    }
    const dur = durationRef.current;
    if (dur > 0) {
      upsertWatchHistory({
        courseId, partId, videoId,
        courseTitle, lessonTitle,
        resumeAt: t,
        durationSeconds: dur,
        percentWatched: (t / dur) * 100,
        isCompleted: completedRef.current,
      });
    }
  }, [courseId, partId, videoId, courseTitle, lessonTitle]);

  const endSession = useCallback((t: number) => {
    if (sessionIdRef.current) {
      const dur = durationRef.current;
      endWatchSession(
        sessionIdRef.current, watchSecsRef.current,
        dur > 0 ? (t / dur) * 100 : 0, 1.0, completedRef.current
      );
      sessionIdRef.current = null;
    }
  }, []);

  const bootPlayer = useCallback((startAt: number) => {
    if (!hostRef.current) return;
    // Clean previous player
    try { playerRef.current?.destroy?.(); } catch {}
    if (hostRef.current) hostRef.current.innerHTML = '';

    const id = `yt-lp-${courseId}-${partId}-${Date.now()}`;
    const el = document.createElement('div');
    el.id = id;
    hostRef.current.appendChild(el);

    playerRef.current = new (window as any).YT.Player(id, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: { rel: 0, modestbranding: 1, color: 'white', start: Math.floor(startAt), enablejsapi: 1, origin: window.location.origin },
      events: {
        onReady: async (ev: any) => {
          const dur = ev.target.getDuration?.() || 0;
          durationRef.current = dur;
          // Check backend for a more recent timestamp
          const serverTs = await fetchVideoTimestamp(courseId, partId);
          if (serverTs > startAt + 5 && serverTs < dur - 5) {
            ev.target.seekTo(serverTs, true);
            setLocalTs(courseId, partId, serverTs);
          }
        },
        onStateChange: async (ev: any) => {
          const YT = (window as any).YT;
          const state = ev.data;
          const t = playerRef.current?.getCurrentTime?.() || 0;
          const dur = playerRef.current?.getDuration?.() || 0;
          durationRef.current = dur;

          if (state === YT.PlayerState.PLAYING) {
            // Log video_play event once per session
            if (!sessionIdRef.current) {
              logActivity('video_play', courseId, partId, videoId);
              startWatchSession(courseId, partId, videoId, dur || undefined).then(id => {
                if (id) sessionIdRef.current = id;
              });
            }
            // Count actual watch seconds
            if (!watchTimerRef.current) {
              watchTimerRef.current = setInterval(() => {
                watchSecsRef.current += 1;
                const ct = playerRef.current?.getCurrentTime?.() || 0;
                const d  = playerRef.current?.getDuration?.() || dur;
                onTimeUpdate?.(ct, d);
                durationRef.current = d;

                // Auto-complete at 90% (but not if already done or if user just seeked to end)
                if (!completedRef.current && !alreadyCompleted && d > 30) {
                  const pct = ct / d;
                  if (pct >= 0.9) {
                    completedRef.current = true;
                    setAlreadyCompleted(true);
                    setShowCompletion(true);
                    markVideoCompleted(courseId, partId, videoId, 'threshold');
                    onAutoComplete?.();
                  }
                }
              }, 1000);
            }
            // Save to localStorage every 5s
            if (!saveTimerRef.current) {
              saveTimerRef.current = setInterval(() => {
                const ct2 = playerRef.current?.getCurrentTime?.() || 0;
                if (ct2 > 0) setLocalTs(courseId, partId, ct2);
              }, 5000);
            }
            // Save to backend every 30s
            if (!backendTimerRef.current) {
              backendTimerRef.current = setInterval(() => {
                const ct3 = playerRef.current?.getCurrentTime?.() || 0;
                if (ct3 > 0) saveProgress(ct3);
              }, 30000);
            }
          } else {
            // Paused / ended / buffering
            stopWatchTimer();
            saveProgress(t);
            if (state === YT.PlayerState.ENDED) {
              endSession(t);
            }
          }
        },
      },
    });
  }, [videoId, courseId, partId, alreadyCompleted, onTimeUpdate, onAutoComplete, saveProgress, endSession, stopWatchTimer]);

  // Boot player once resolvedTs is known
  useEffect(() => {
    if (resolvedTs === null) return;
    let dead = false;
    loadYTApi().then(() => {
      if (dead || !hostRef.current) return;
      bootPlayer(resolvedTs);
      // Register player in global registry so LearningWorkspace can seek
      const key = `${courseId}-${partId}`;
      if (!(window as any).__lpPlayers) (window as any).__lpPlayers = {};
      // playerRef will be populated after bootPlayer creates YT.Player
      // We use a proxy object that always reads from playerRef
      (window as any).__lpPlayers[key] = {
        seekTo: (sec: number, allowSeekAhead: boolean) => playerRef.current?.seekTo?.(sec, allowSeekAhead),
      };
    });
    return () => {
      dead = true;
      stopWatchTimer();
      const t = playerRef.current?.getCurrentTime?.() || 0;
      saveProgress(t);
      endSession(t);
      // Clean global registry
      const key = `${courseId}-${partId}`;
      if ((window as any).__lpPlayers) delete (window as any).__lpPlayers[key];
      try { playerRef.current?.destroy?.(); } catch {}
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [resolvedTs, videoId, courseId, partId]);

  // Save on page unload / tab close
  useEffect(() => {
    const handleUnload = () => {
      stopWatchTimer();
      const t = playerRef.current?.getCurrentTime?.() || 0;
      saveProgress(t);
      endSession(t);
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) handleUnload();
    });
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [saveProgress, endSession, stopWatchTimer]);

  const handleResume = useCallback(async () => {
    setShowResume(false);
    setResolvedTs(savedTs);
  }, [savedTs]);

  const handleStartOver = useCallback(() => {
    setShowResume(false);
    setLocalTs(courseId, partId, 0);
    setResolvedTs(0);
  }, [courseId, partId]);

  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, background: '#1F2937' }}>
      <style>{`.lp-iframe-wrap iframe { position:absolute;top:0;left:0;width:100%;height:100%;border:none; }`}</style>

      {/* Player host */}
      <div
        ref={hostRef}
        className="lp-iframe-wrap"
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Resume dialog — blocks the player until user chooses */}
      {showResume && (
        <ResumeDialog savedAt={savedTs} onResume={handleResume} onStartOver={handleStartOver} />
      )}

      {/* Completion animation */}
      {showCompletion && (
        <CompletionAnimation onDone={() => setShowCompletion(false)} />
      )}

      {/* Already completed badge */}
      {alreadyCompleted && !showCompletion && (
        <div style={{
          position: 'absolute', top: 8, right: 8, background: '#22C55E', color: '#fff',
          fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.65rem',
          padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 10,
        }}>
          ✓ Completed
        </div>
      )}
    </div>
  );
}
