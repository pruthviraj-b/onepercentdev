'use client';

import { useState, useMemo } from 'react';
import { Module, PartMeta } from '@/lib/api';

interface Props {
  courseId: string;
  modules: Module[];
  currentPart: number;
  completedParts: number[];
  bookmarkedParts: number[];
  searchQuery: string;
  progressPct: number;
  completedCount: number;
  totalParts: number;
  onSearchChange: (q: string) => void;
  onSelectPart: (part: number) => void;
}

export function Sidebar({
  courseId, modules, currentPart, completedParts, bookmarkedParts,
  searchQuery, progressPct, completedCount, totalParts,
  onSearchChange, onSelectPart,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setCollapsed(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return modules.flatMap(m =>
      m.notes.filter(n => n.title.toLowerCase().includes(q))
    );
  }, [modules, searchQuery]);

  const bookmarkedNotes: PartMeta[] = useMemo(() => {
    if (!searchQuery.trim() && bookmarkedParts.length) {
      return modules.flatMap(m => m.notes).filter(n => bookmarkedParts.includes(n.part));
    }
    return [];
  }, [modules, bookmarkedParts, searchQuery]);

  return (
    <aside className="sidebar" aria-label="Course navigation">
      {/* Search */}
      <div className="sidebar-search">
        <label htmlFor="sidebar-search-input" className="sr-only">Search course parts</label>
        <input
          id="sidebar-search-input"
          className="search-input"
          type="search"
          placeholder="Search parts…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          autoComplete="off"
          aria-label="Search course parts"
        />
        <span className="search-key" aria-hidden="true">/</span>
      </div>

      {/* Progress */}
      <div className="sidebar-progress">
        <div className="sidebar-progress-label">
          <span>Progress</span>
          <span aria-label={`${progressPct}% complete`}>{progressPct}%</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Course progress: ${progressPct}% complete, ${completedCount} of ${totalParts} parts`}
        >
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Rank & Achievements — gamification section */}
      <div className="sidebar-rank" style={{ padding: '10px 12px', borderBottom: '2px solid var(--border)', background: 'var(--win-midlight)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--page-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <span aria-hidden="true">🏅</span>
          <span>Rank:</span>
          <span style={{ color: 'var(--page-text)' }} aria-label={`Current rank: ${progressPct <= 25 ? 'Apprentice' : progressPct <= 75 ? 'Journeyman' : 'Master Builder'}`}>
            {progressPct <= 25 ? '🎨 Apprentice' : progressPct <= 75 ? '🛠️ Journeyman' : '🏰 Master Builder'}
          </span>
        </div>
        {(() => {
          const list: { title: string; desc: string; icon: string }[] = [];

          if (courseId === 'cloud') {
            if (completedParts.includes(7)) {
              list.push({ title: 'The Cartographer', desc: 'Mastered Networking Essentials', icon: '🗺️' });
            }
            if (completedParts.includes(19)) {
              list.push({ title: 'The Master Mason', desc: 'Mastered Virtualization & Hypervisors', icon: '🧱' });
            }
          } else if (courseId === 'python') {
            if (completedParts.includes(4)) {
              list.push({ title: 'The Alchemist', desc: 'Mastered Loops & Variables', icon: '🧪' });
            }
          } else if (courseId === 'data-analyst') {
            if (completedParts.includes(1)) {
              list.push({ title: 'The Visionary', desc: 'Mastered Data Basics', icon: '📊' });
            }
          }

          if (list.length === 0) return null;

          return (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '4px' }}>
                Achievements
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }} role="list" aria-label="Earned achievements">
                {list.map((ach, idx) => (
                  <span
                    key={idx}
                    title={`${ach.title}: ${ach.desc}`}
                    role="listitem"
                    aria-label={`Achievement: ${ach.title} — ${ach.desc}`}
                    style={{
                      fontSize: '0.62rem',
                      background: 'var(--win-titlebar)',
                      border: '1px solid #000000',
                      padding: '2px 6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      color: '#000000',
                      fontWeight: 700,
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    <span aria-hidden="true">{ach.icon}</span> {ach.title}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="sidebar-body">
        {/* Search results */}
        {filtered ? (
          <div role="region" aria-label={`Search results: ${filtered.length} parts found`}>
            <div style={{
              padding: '8px 12px 4px',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
            }}>
              Results ({filtered.length})
            </div>
            <ul className="part-list" role="listbox" aria-label="Search results">
              {filtered.length === 0 ? (
                <li style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-dim)' }} aria-live="polite">
                  No parts found.
                </li>
              ) : filtered.map(n => (
                <PartItem
                  key={n.part}
                  note={n}
                  active={n.part === currentPart}
                  done={completedParts.includes(n.part)}
                  bookmarked={bookmarkedParts.includes(n.part)}
                  onSelect={onSelectPart}
                />
              ))}
            </ul>
          </div>
        ) : (
          <>
            {/* Pinned bookmarks */}
            {bookmarkedNotes.length > 0 && (
              <div className="module-group">
                <div className="module-header" style={{ cursor: 'default' }}>
                  <div className="module-title-row">
                    <span className="module-name" aria-label="Pinned bookmarks">📌 Pinned</span>
                  </div>
                </div>
                <ul className="part-list" role="list" aria-label="Pinned parts">
                  {bookmarkedNotes.map(n => (
                    <PartItem
                      key={n.part}
                      note={n}
                      active={n.part === currentPart}
                      done={completedParts.includes(n.part)}
                      bookmarked
                      onSelect={onSelectPart}
                    />
                  ))}
                </ul>
              </div>
            )}

            {/* Course Content section label */}
            <div style={{ padding: '6px 12px 4px', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--win-mid)', background: 'var(--win-bg)' }}>
              Course Content
            </div>
            {/* Module groups */}
            {modules.filter(mod => mod.notes.length > 0).map(mod => {
              const isCollapsed = collapsed.has(mod.id);
              const doneCount = mod.notes.filter(n => completedParts.includes(n.part)).length;
              return (
                <div key={mod.id} className={`module-group${isCollapsed ? ' collapsed' : ''}`}>
                  <div
                    className="module-header"
                    onClick={() => toggle(mod.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={!isCollapsed}
                    aria-controls={`module-parts-${mod.id}`}
                    aria-label={`Module ${mod.id}: ${mod.title}. ${doneCount} of ${mod.notes.length} parts complete. ${isCollapsed ? 'Collapsed' : 'Expanded'}`}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(mod.id))}
                  >
                    <div className="module-title-row">
                      <span className="module-num" aria-hidden="true">M{mod.id}</span>
                      <span className="module-name">{mod.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="module-count" aria-hidden="true">
                        {doneCount}/{mod.notes.length}
                      </span>
                      <span className={`chevron${isCollapsed ? '' : ' open'}`} aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          style={{ transform: isCollapsed ? 'none' : 'rotate(180deg)', transition: 'transform 150ms ease' }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <ul
                    id={`module-parts-${mod.id}`}
                    className="part-list"
                    role="list"
                    aria-label={`Parts in module ${mod.id}: ${mod.title}`}
                  >
                    {mod.notes.map(n => (
                      <PartItem
                        key={n.part}
                        note={n}
                        active={n.part === currentPart}
                        done={completedParts.includes(n.part)}
                        bookmarked={bookmarkedParts.includes(n.part)}
                        onSelect={onSelectPart}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
}

function PartItem({ note, active, done, bookmarked, onSelect }: {
  note: PartMeta;
  active: boolean;
  done: boolean;
  bookmarked: boolean;
  onSelect: (part: number) => void;
}) {
  const shortTitle = note.title.replace(/^Part\s+\d+[\s—\-]+/i, '');
  const statusLabel = done ? 'Completed.' : bookmarked ? 'Bookmarked.' : '';
  return (
    <li
      className={`part-item${active ? ' active' : ''}${done ? ' done' : ''}`}
      onClick={() => onSelect(note.part)}
      role="option"
      aria-selected={active}
      aria-label={`Part ${note.part}: ${shortTitle}. ${statusLabel} Importance: ${note.importance}.`}
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(note.part))}
    >
      <div className="part-item-left">
        <span className="part-icon" aria-hidden="true">
          {done ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : bookmarked ? (
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          )}
        </span>
        <span className="part-name">{shortTitle}</span>
      </div>
      <div className="part-badges" aria-hidden="true">
        {done && <span className="badge badge-done">✓</span>}
      </div>
    </li>
  );
}
