'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TimestampNote,
  fetchTimestampNotes, createTimestampNote, updateTimestampNote, deleteTimestampNote,
  formatSeconds,
} from '@/lib/learningPlayerApi';
import { logActivity } from '@/lib/studentAnalyticsApi';

interface TimestampNotesProps {
  courseId: string;
  partId: number;
  videoId: string;
  currentTime: number;        // current video playback position in seconds
  onSeek: (sec: number) => void;
}

export function TimestampNotes({ courseId, partId, videoId, currentTime, onSeek }: TimestampNotesProps) {
  const [notes, setNotes] = useState<TimestampNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchTimestampNotes(courseId, partId);
    setNotes(data);
    setLoading(false);
  }, [courseId, partId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = useCallback(async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    const note = await createTimestampNote({ courseId, partId, videoId, timestampSec: currentTime, content: newContent.trim() });
    if (note) {
      setNotes(prev => [...prev, note].sort((a,b) => a.timestamp_sec - b.timestamp_sec));
      logActivity('note_added', courseId, partId, videoId, { timestampSec: currentTime });
    }
    setNewContent('');
    setAdding(false);
    setSaving(false);
  }, [courseId, partId, videoId, currentTime, newContent]);

  const handleEdit = useCallback(async (id: number) => {
    if (!editContent.trim()) return;
    setSaving(true);
    const updated = await updateTimestampNote(id, editContent.trim());
    if (updated) setNotes(prev => prev.map(n => n.id === id ? updated : n));
    setEditingId(null);
    setEditContent('');
    setSaving(false);
  }, [editContent]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Delete this note?')) return;
    await deleteTimestampNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const filtered = notes.filter(n =>
    !search || n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div style={{ background: 'transparent', color: '#111', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 900, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#222' }}>
          📝 Notes {notes.length > 0 && <span style={{ opacity: 0.5, fontWeight: 400 }}>({notes.length})</span>}
        </div>
        <button
          onClick={() => { setAdding(a => !a); setNewContent(''); }}
          style={{ background: 'transparent', color: '#000', border: '2px solid #000', padding: '4px 10px', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', textTransform: 'uppercase' }}>
          + Add at {formatSeconds(currentTime)}
        </button>
      </div>

      {/* Add note form */}
      {adding && (
        <div style={{ padding: '10px 14px', background: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
            ⏱ {formatSeconds(currentTime)}
          </div>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Write your note here..."
            autoFocus
            rows={3}
            style={{ width: '100%', border: '2px solid #000', padding: '8px', fontFamily: 'var(--font-content)', fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewContent(''); } }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button onClick={handleAdd} disabled={!newContent.trim() || saving}
              style={{ padding: '5px 14px', background: '#000', color: '#f1be3e', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase', opacity: !newContent.trim() ? 0.4 : 1 }}>
              {saving ? 'Saving…' : 'Save Note'}
            </button>
            <button onClick={() => { setAdding(false); setNewContent(''); }}
              style={{ padding: '5px 10px', background: 'transparent', color: '#555', border: '2px solid #ccc', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {notes.length > 3 && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            style={{ width: '100%', border: '2px solid #e0e0e0', padding: '5px 10px', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* Notes list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.82rem' }}>Loading notes…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#aaa' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: '0.82rem' }}>{search ? 'No notes match your search.' : 'No notes yet. Add one above!'}</div>
          </div>
        )}
        {filtered.map(note => (
          <div key={note.id}
            style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            {editingId === note.id ? (
              <div>
                <textarea
                  value={editContent} onChange={e => setEditContent(e.target.value)}
                  rows={3} autoFocus
                  style={{ width: '100%', border: '2px solid #000', padding: '8px', fontFamily: 'var(--font-content)', fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  onKeyDown={e => { if (e.key === 'Escape') { setEditingId(null); setEditContent(''); } }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button onClick={() => handleEdit(note.id)} disabled={saving}
                    style={{ padding: '4px 12px', background: '#000', color: '#f1be3e', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => { setEditingId(null); setEditContent(''); }}
                    style={{ padding: '4px 10px', background: 'transparent', color: '#555', border: '2px solid #ccc', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <button
                    onClick={() => onSeek(note.timestamp_sec)}
                    title="Jump to this timestamp"
                    style={{ padding: '2px 8px', background: '#000', color: '#f1be3e', border: '2px solid #000', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0 }}>
                    ⏱ {formatSeconds(note.timestamp_sec)}
                  </button>
                  <span style={{ fontSize: '0.68rem', color: '#aaa' }}>
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    <button onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#888', padding: '2px 4px' }} title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(note.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#cc0000', padding: '2px 4px' }} title="Delete">
                      🗑
                    </button>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5, color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {note.content}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
