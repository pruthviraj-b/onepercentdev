'use client';

/**
 * LearningWorkspace — the full LMS video workspace
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────┐
 * │  Toolbar: tabs + actions                            │
 * ├──────────────────────────────┬──────────────────────┤
 * │                              │  Right sidebar:      │
 * │   Video Player (centre)      │  Notes / Bookmarks   │
 * │                              │  (toggleable panels) │
 * ├──────────────────────────────┤                      │
 * │   Bottom bar: Pomodoro timer │                      │
 * └──────────────────────────────┴──────────────────────┘
 */

import { useState, useCallback, useRef } from 'react';
import { LearningPlayer } from './LearningPlayer';
import { TimestampNotes } from './TimestampNotes';
import { TimestampBookmarks } from './TimestampBookmarks';
import { PomodoroTimer } from './PomodoroTimer';
import { formatSeconds } from '@/lib/learningPlayerApi';

type SidePanel = 'notes' | 'bookmarks' | 'pomodoro' | null;

interface LearningWorkspaceProps {
  videoId: string;
  courseId: string;
  partId: number;
  courseTitle?: string;
  lessonTitle?: string;
  onAutoComplete?: () => void;
}

export function LearningWorkspace({
  videoId, courseId, partId, courseTitle, lessonTitle, onAutoComplete,
}: LearningWorkspaceProps) {
  const [sidePanel, setSidePanel] = useState<SidePanel>('notes');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]   = useState(0);
  const [pomodoroFloat, setPomodoroFloat] = useState(false);
  // ref to the player so we can call seek from notes/bookmarks
  const seekRef = useRef<((sec: number) => void) | null>(null);

  const handleTimeUpdate = useCallback((ct: number, dur: number) => {
    setCurrentTime(ct);
    setDuration(dur);
  }, []);

  // We expose seek by wiring it through a ref stored in LearningWorkspace
  // The actual YT.Player seek is inside LearningPlayer — we bridge via a custom event
  const handleSeek = useCallback((sec: number) => {
    // Dispatch a custom event that LearningPlayer listens for
    window.dispatchEvent(new CustomEvent('lp-seek', { detail: { sec, courseId, partId } }));
  }, [courseId, partId]);

  const panelButtons: { id: SidePanel; label: string; icon: string }[] = [
    { id: 'notes',     label: 'Notes',     icon: '📝' },
    { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
    { id: 'pomodoro',  label: 'Pomodoro',  icon: '🍅' },
  ];

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'transparent', fontFamily: 'var(--font-ui)' }}>
      {/* ── Top toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
        background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.1)', flexShrink: 0,
      }}>
        {/* Video progress bar */}
        <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.1)', position: 'relative', cursor: 'pointer' }}
          title={`${formatSeconds(currentTime)} / ${formatSeconds(duration)}`}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#f1be3e', transition: 'width 1s linear' }} />
        </div>

        <span style={{ color: '#888', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', flexShrink: 0 }}>
          {formatSeconds(currentTime)} / {formatSeconds(duration)}
        </span>

        {/* Panel toggle buttons */}
        <div style={{ display: 'flex', gap: 3, marginLeft: 8 }}>
          {panelButtons.map(btn => (
            <button key={btn.id}
              onClick={() => setSidePanel(sidePanel === btn.id ? null : btn.id)}
              title={btn.label}
              style={{
                padding: '4px 10px', border: '2px solid',
                borderColor: sidePanel === btn.id ? '#000' : 'rgba(0,0,0,0.2)',
                background: 'transparent',
                color: sidePanel === btn.id ? '#000' : '#888',
                fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.65rem',
                cursor: 'pointer', textTransform: 'uppercase',
                transition: 'all 120ms',
              }}>
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main area: video LEFT + side panel RIGHT ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* Left: video column — sized to maintain 16:9 aspect ratio */}
        <div style={{
          flex: sidePanel ? '0 0 auto' : '1 1 auto',
          width: sidePanel ? 'calc(100% - 340px)' : '100%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'flex-start',
        }}>
          <LearningPlayerWithSeek
            videoId={videoId} courseId={courseId} partId={partId}
            courseTitle={courseTitle} lessonTitle={lessonTitle}
            onTimeUpdate={handleTimeUpdate} onAutoComplete={onAutoComplete}
          />
        </div>

        {/* Right: side panel — sits beside the video in the empty space */}
        {sidePanel && (
          <div style={{
            width: 340,
            flexShrink: 0,
            borderLeft: '1px solid rgba(0,0,0,0.08)',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
          }}>
            {sidePanel === 'notes' && videoId && (
              <TimestampNotes
                courseId={courseId} partId={partId} videoId={videoId}
                currentTime={currentTime} onSeek={handleSeek}
              />
            )}
            {sidePanel === 'bookmarks' && videoId && (
              <TimestampBookmarks
                courseId={courseId} partId={partId} videoId={videoId}
                currentTime={currentTime} onSeek={handleSeek}
              />
            )}
            {sidePanel === 'pomodoro' && (
              <div style={{ padding: 12, overflowY: 'auto' }}>
                <PomodoroTimer courseId={courseId} partId={partId} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bridge component that wires the seek custom event to LearningPlayer ───────
function LearningPlayerWithSeek(props: {
  videoId: string; courseId: string; partId: number;
  courseTitle?: string; lessonTitle?: string;
  onTimeUpdate?: (ct: number, dur: number) => void;
  onAutoComplete?: () => void;
}) {
  const playerRef = useRef<any>(null);

  // Listen for seek events dispatched by sibling components
  const handleSeekEvent = useCallback((e: Event) => {
    const { sec, courseId, partId } = (e as CustomEvent).detail;
    if (courseId === props.courseId && partId === props.partId) {
      // Access YT player from global ref
      const allPlayers = (window as any).__lpPlayers || {};
      const key = `${props.courseId}-${props.partId}`;
      const player = allPlayers[key];
      if (player?.seekTo) player.seekTo(sec, true);
    }
  }, [props.courseId, props.partId]);

  if (typeof window !== 'undefined') {
    window.addEventListener('lp-seek', handleSeekEvent, { once: false });
  }

  return (
    <LearningPlayer
      {...props}
      onTimeUpdate={props.onTimeUpdate}
      onAutoComplete={props.onAutoComplete}
    />
  );
}
