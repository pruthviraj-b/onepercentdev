'use client';

import { useState, useMemo } from 'react';
import { Module, PartMeta } from '@/lib/api';

interface Props {
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
  modules, currentPart, completedParts, bookmarkedParts,
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
    <aside className="sidebar">
      {/* Search */}
      <div className="sidebar-search">
        <input
          className="search-input"
          type="text"
          placeholder="Search parts..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          autoComplete="off"
        />
        <span className="search-key">/</span>
      </div>

      {/* Progress */}
      <div className="sidebar-progress">
        <div className="sidebar-progress-label">
          <span>Progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Workshop Rank & Achievements */}
      <div className="sidebar-rank" style={{ padding: '8px 10px', borderBottom: '2px solid var(--border)', background: 'var(--win-midlight)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--page-text)' }}>
          <span>Rank:</span>
          <span style={{ color: 'var(--link)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            {progressPct <= 25 ? '🎨 Apprentice' : progressPct <= 75 ? '🛠️ Journeyman' : '🏰 Master Builder'}
          </span>
        </div>
        {(() => {
          const list = [];
          const isCloud = modules.some(m => m.title.toLowerCase().includes('cloud') || m.notes.some(n => n.title.toLowerCase().includes('cloud')));
          
          if (isCloud) {
            // The Cartographer: Networking chapters (Part 7, etc.)
            if (completedParts.includes(7)) {
              list.push({ title: 'The Cartographer', desc: 'Mastered Networking Essentials', icon: '🗺️' });
            }
            // The Master Mason: Hypervisors / VMs (Part 19)
            if (completedParts.includes(19)) {
              list.push({ title: 'The Master Mason', desc: 'Mastered Virtualization & Hypervisors', icon: '🧱' });
            }
          } else {
            // The Alchemist: core variables & loops (Part 3 or 4)
            if (completedParts.includes(4)) {
              list.push({ title: 'The Alchemist', desc: 'Mastered Loops & Variables', icon: '🧪' });
            }
          }

          if (list.length === 0) return null;

          return (
            <div style={{ marginTop: '6px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Codex Achievements</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {list.map((ach, idx) => (
                  <span 
                    key={idx} 
                    title={`${ach.title}: ${ach.desc}`}
                    style={{
                      fontSize: '0.62rem',
                      background: 'var(--win-light)',
                      border: '1px solid var(--border)',
                      padding: '1px 4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      color: 'var(--page-text)'
                    }}
                  >
                    {ach.icon} {ach.title}
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
          <div>
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
            <ul className="part-list">
              {filtered.length === 0 ? (
                <li style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
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
                    <span className="module-name">Pinned</span>
                  </div>
                </div>
                <ul className="part-list">
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

            {/* Module groups */}
            {modules.filter(mod => mod.notes.length > 0).map(mod => (
              <div key={mod.id} className={`module-group${collapsed.has(mod.id) ? ' collapsed' : ''}`}>
                <div className="module-header" onClick={() => toggle(mod.id)}>
                  <div className="module-title-row">
                    <span className="module-num">M{mod.id}</span>
                    <span className="module-name">{mod.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="module-count">
                      {mod.notes.filter(n => completedParts.includes(n.part)).length}/{mod.notes.length}
                    </span>
                    <span className="chevron">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  </div>
                </div>
                <ul className="part-list">
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
            ))}
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
  return (
    <li
      className={`part-item${active ? ' active' : ''}${done ? ' done' : ''}`}
      onClick={() => onSelect(note.part)}
    >
      <div className="part-item-left">
        <span className="part-icon">
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
      <div className="part-badges">
        {done && <span className="badge badge-done">✓</span>}
        <span className="badge">{note.importance.toUpperCase().slice(0, 3)}</span>
      </div>
    </li>
  );
}
