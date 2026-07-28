'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  WatchHistoryEntry, fetchWatchHistory, deleteWatchHistoryEntry,
  formatSeconds, formatDuration,
} from '@/lib/learningPlayerApi';

interface WatchHistoryProps {
  onResume: (courseId: string, partId: number) => void;
}

export function WatchHistory({ onResume }: WatchHistoryProps) {
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = 1, q = search) => {
    setLoading(true);
    const { history: h, total: t } = await fetchWatchHistory({ search: q || undefined, page: p });
    if (p === 1) setHistory(h);
    else setHistory(prev => [...prev, ...h]);
    setTotal(t);
    setLoading(false);
  }, [search]);

  useEffect(() => { setPage(1); load(1, search); }, [search]);

  const handleDelete = useCallback(async (courseId: string, partId: number) => {
    if (!confirm('Remove from watch history?')) return;
    await deleteWatchHistoryEntry(courseId, partId);
    setHistory(prev => prev.filter(h => !(h.course_id === courseId && h.part_id === partId)));
    setTotal(t => t - 1);
  }, []);

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 4px', textTransform: 'uppercase' }}>📺 Watch History</h2>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#555' }}>
          {total > 0 ? `${total} video${total > 1 ? 's' : ''} in your history` : 'Your watch history will appear here'}
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by lesson or course name..."
          style={{ width: '100%', border: '2px solid #000', padding: '8px 12px', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* List */}
      {loading && page === 1 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Loading history…</div>
      ) : history.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa', border: '2px dashed #ccc' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📺</div>
          <div>{search ? 'No results found.' : 'No watch history yet. Start watching a lesson!'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map(entry => (
            <div key={`${entry.course_id}-${entry.part_id}`}
              style={{ border: '2px solid #000', background: '#fff', display: 'flex', gap: 12, padding: 12, position: 'relative' }}>
              {/* Thumbnail */}
              <div style={{ flexShrink: 0, width: 120, height: 68, position: 'relative', background: '#111', overflow: 'hidden' }}>
                {entry.thumbnail_url && (
                  <img src={entry.thumbnail_url} alt={entry.lesson_title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {/* Progress overlay */}
                {entry.duration_seconds && entry.duration_seconds > 0 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.4)' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, entry.percent_watched)}%`, background: entry.is_completed ? '#2ecc71' : '#f1be3e' }} />
                  </div>
                )}
                {entry.is_completed && (
                  <div style={{ position: 'absolute', top: 4, right: 4, background: '#2ecc71', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '2px 5px' }}>✓</div>
                )}
                {/* Resume time */}
                {entry.resume_at > 5 && !entry.is_completed && (
                  <div style={{ position: 'absolute', bottom: 6, right: 4, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', padding: '1px 4px' }}>
                    {formatSeconds(entry.resume_at)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  {entry.course_title}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.lesson_title || `Part ${entry.part_id}`}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: '#888' }}>{relativeTime(entry.last_watched_at)}</span>
                  {entry.duration_seconds && (
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>{formatDuration(entry.duration_seconds)}</span>
                  )}
                  {entry.percent_watched > 0 && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: entry.is_completed ? '#2ecc71' : '#e67e22' }}>
                      {entry.is_completed ? '✓ Completed' : `${Math.round(entry.percent_watched)}% watched`}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                <button onClick={() => onResume(entry.course_id, entry.part_id)}
                  style={{ padding: '5px 12px', background: '#000', color: '#f1be3e', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {entry.is_completed ? '▶ Rewatch' : entry.resume_at > 5 ? '▶ Resume' : '▶ Watch'}
                </button>
                <button onClick={() => handleDelete(entry.course_id, entry.part_id)}
                  style={{ padding: '4px 8px', background: 'transparent', color: '#cc0000', border: '2px solid #cc0000', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Load more */}
          {history.length < total && (
            <button onClick={() => { const np = page + 1; setPage(np); load(np); }}
              disabled={loading}
              style={{ padding: '10px', border: '2px solid #000', background: '#f4f1ea', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase' }}>
              {loading ? 'Loading…' : `Load More (${total - history.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
