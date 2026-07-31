'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TimestampBookmark, BookmarkCategory,
  fetchTimestampBookmarks, createTimestampBookmark,
  updateTimestampBookmark, deleteTimestampBookmark,
  formatSeconds,
} from '@/lib/learningPlayerApi';
import { logActivity } from '@/lib/studentAnalyticsApi';

const DEFAULT_CATEGORIES: BookmarkCategory[] = [
  { name: 'Interview', color: '#e74c3c' },
  { name: 'Exam', color: '#9b59b6' },
  { name: 'Revision', color: '#3498db' },
  { name: 'Assignment', color: '#e67e22' },
  { name: 'Important', color: '#f1be3e' },
  { name: 'Formula', color: '#2ecc71' },
  { name: 'Common Mistake', color: '#e74c3c' },
  { name: 'Favorite', color: '#e91e63' },
];

interface TimestampBookmarksProps {
  courseId: string;
  partId: number;
  videoId: string;
  currentTime: number;
  onSeek: (sec: number) => void;
}

export function TimestampBookmarks({ courseId, partId, videoId, currentTime, onSeek }: TimestampBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<TimestampBookmark[]>([]);
  const [categories, setCategories] = useState<BookmarkCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('Important');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { bookmarks: bks, categories: cats } = await fetchTimestampBookmarks(courseId, partId);
    setBookmarks(bks);
    if (cats.length > 0) setCategories(cats);
    setLoading(false);
  }, [courseId, partId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = useCallback(async () => {
    const bk = await createTimestampBookmark({
      courseId, partId, videoId, timestampSec: currentTime,
      label: newLabel.trim() || formatSeconds(currentTime),
      category: newCategory,
    });
    if (bk) {
      setBookmarks(prev => [...prev, bk].sort((a,b) => a.timestamp_sec - b.timestamp_sec));
      logActivity('bookmark_added', courseId, partId, videoId, { timestampSec: currentTime, category: newCategory });
    }
    setNewLabel(''); setShowAdd(false);
  }, [courseId, partId, videoId, currentTime, newLabel, newCategory]);

  const handleSaveEdit = useCallback(async (id: number) => {
    const updated = await updateTimestampBookmark(id, editLabel.trim(), editCategory);
    if (updated) setBookmarks(prev => prev.map(b => b.id === id ? updated : b));
    setEditingId(null);
  }, [editLabel, editCategory]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Delete this bookmark?')) return;
    await deleteTimestampBookmark(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const filtered = bookmarks.filter(b => {
    if (filterCategory && b.category !== filterCategory) return false;
    if (search && !b.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const usedCategories = [...new Set(bookmarks.map(b => b.category))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div style={{ background: 'transparent', color: '#111', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 900, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#222' }}>
          🔖 Bookmarks {bookmarks.length > 0 && <span style={{ opacity: 0.5, fontWeight: 400 }}>({bookmarks.length})</span>}
        </div>
        <button onClick={() => setShowAdd(a => !a)}
          style={{ background: 'transparent', color: '#000', border: '2px solid #000', padding: '4px 10px', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', textTransform: 'uppercase' }}>
          + {formatSeconds(currentTime)}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ padding: '10px 14px', background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 6 }}>Adding bookmark at ⏱ {formatSeconds(currentTime)}</div>
          <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="Label (optional)"
            style={{ width: '100%', border: '2px solid #000', padding: '6px 10px', fontFamily: 'var(--font-ui)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          {/* Category pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {DEFAULT_CATEGORIES.map(cat => (
              <button key={cat.name} onClick={() => setNewCategory(cat.name)}
                style={{ padding: '3px 8px', border: '2px solid', borderColor: newCategory === cat.name ? cat.color : '#ddd', background: newCategory === cat.name ? cat.color : '#fff', color: newCategory === cat.name ? '#fff' : '#555', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer' }}>
                {cat.name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleAdd}
              style={{ padding: '5px 14px', background: '#000', color: '#f1be3e', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer' }}>
              Save
            </button>
            <button onClick={() => { setShowAdd(false); setNewLabel(''); }}
              style={{ padding: '5px 10px', background: 'transparent', color: '#555', border: '2px solid #ccc', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter + Search */}
      {(usedCategories.length > 1 || bookmarks.length > 4) && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {usedCategories.length > 1 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button onClick={() => setFilterCategory('')}
                style={{ padding: '2px 8px', border: '2px solid', borderColor: !filterCategory ? '#000' : '#ccc', background: !filterCategory ? '#000' : '#fff', color: !filterCategory ? '#fff' : '#555', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer' }}>
                All
              </button>
              {usedCategories.map(cat => {
                const c = categories.find(c => c.name === cat) || { color: '#888' };
                return (
                  <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                    style={{ padding: '2px 8px', border: '2px solid', borderColor: filterCategory === cat ? c.color : '#ddd', background: filterCategory === cat ? c.color : '#fff', color: filterCategory === cat ? '#fff' : '#555', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer' }}>
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
          {bookmarks.length > 4 && (
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ flex: 1, minWidth: 80, border: '2px solid #e0e0e0', padding: '3px 8px', fontFamily: 'var(--font-ui)', fontSize: '0.78rem', outline: 'none' }}
            />
          )}
        </div>
      )}

      {/* Bookmark list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.82rem' }}>Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#aaa' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔖</div>
            <div style={{ fontSize: '0.82rem' }}>{search || filterCategory ? 'No bookmarks match.' : 'No bookmarks yet.'}</div>
          </div>
        )}
        {filtered.map(bk => {
          const cat = categories.find(c => c.name === bk.category) || { color: '#f1be3e' };
          return (
            <div key={bk.id} style={{ padding: '8px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {/* Colour indicator */}
              <div style={{ width: 4, height: 36, background: cat.color, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === bk.id ? (
                  <>
                    <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)}
                      style={{ width: '100%', border: '2px solid #000', padding: '4px 8px', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box', marginBottom: 6 }}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(bk.id); if (e.key === 'Escape') setEditingId(null); }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                      {DEFAULT_CATEGORIES.map(c => (
                        <button key={c.name} onClick={() => setEditCategory(c.name)}
                          style={{ padding: '2px 6px', border: '2px solid', borderColor: editCategory === c.name ? c.color : '#ddd', background: editCategory === c.name ? c.color : '#fff', color: editCategory === c.name ? '#fff' : '#555', fontSize: '0.6rem', fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleSaveEdit(bk.id)} style={{ padding: '3px 10px', background: '#000', color: '#f1be3e', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.65rem', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '3px 8px', background: 'transparent', color: '#555', border: '2px solid #ccc', fontSize: '0.65rem', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={() => onSeek(bk.timestamp_sec)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: cat.color, fontWeight: 700 }}>
                        ⏱ {formatSeconds(bk.timestamp_sec)}
                        <span style={{ marginLeft: 6, fontSize: '0.6rem', padding: '1px 5px', background: cat.color, color: '#fff', borderRadius: 2 }}>{bk.category}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111', marginTop: 2, wordBreak: 'break-word' }}>
                        {bk.label || '(Untitled bookmark)'}
                      </div>
                    </button>
                  </>
                )}
              </div>
              {editingId !== bk.id && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                  <button onClick={() => { setEditingId(bk.id); setEditLabel(bk.label); setEditCategory(bk.category); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', padding: '2px' }} title="Edit">✏️</button>
                  <button onClick={() => handleDelete(bk.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: '#cc0000', padding: '2px' }} title="Delete">🗑</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
