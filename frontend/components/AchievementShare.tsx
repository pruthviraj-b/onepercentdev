'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { achievementId, buildAchievementPost, loadAchievements, makeBadgeDataUrl, saveAchievement, AchievementRecord } from '@/lib/achievements';
import { fetchNote } from '@/lib/api';

const C = {
  bg: '#080B10', surface: '#0F141C', surfaceHi: '#151B25', border: '#212B38', borderHi: '#2E3B4C',
  text: '#E8EDF4', dim: '#91A4BB', cyan: '#4CD8E0', green: '#3ED598', amber: '#F5B84C', onAccent: '#061012',
};

interface Props {
  userId?: string | null;
  courseId: string;
  courseTitle: string;
  moduleId: number;
  moduleTitle: string;
  completedParts: number[];
  partTitles: string[];
  partNumbers: number[];
}

function getRangeLabel(partTitles: string[]) {
  const ids = partTitles.map(title => title.match(/\d+(?:\.\d+)+/)?.[0]).filter(Boolean) as string[];
  return ids.length > 1 ? `${ids[0]} → ${ids[ids.length - 1]}` : ids[0] || 'completed module';
}

export function AchievementShare({ userId, courseId, courseTitle, moduleId, moduleTitle, completedParts, partTitles, partNumbers }: Props) {
  const [open, setOpen] = useState(false);
  const [reaction, setReaction] = useState('🏆');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<AchievementRecord | null>(null);
  const [learnedItems, setLearnedItems] = useState<string[]>([]);
  const rangeLabel = useMemo(() => getRangeLabel(partTitles), [partTitles]);
  const partLabel = `Part ${moduleId}`;
  const completionLabel = `${completedParts.length}/${partNumbers.length} lessons complete`;
  const completedPartsKey = completedParts.join(',');
  const post = buildAchievementPost({ courseTitle, partLabel, rangeLabel, completionLabel, learnedItems, reaction, customMessage });

  useEffect(() => {
    let cancelled = false;
    const fallback = partTitles.map(title => title.replace(/^\s*\d+(?:\.\d+)+\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').trim()).filter(Boolean);
    setLearnedItems(fallback.slice(0, 8));
    Promise.all(partNumbers.map(part => fetchNote(courseId, part).catch(() => null))).then(notes => {
      if (cancelled) return;
      const extracted = notes.flatMap(note => {
        if (!note) return [];
        const headings = note.notes.match(/^#{2,4}\s+(.+)$/gm)?.map(line => line.replace(/^#{2,4}\s+/, '').replace(/[`*_]/g, '').trim()) || [];
        return headings.length ? headings.slice(0, 2) : [note.title.replace(/^\s*\d+(?:\.\d+)+\s*/, '').trim()];
      }).filter(Boolean);
      setLearnedItems(Array.from(new Set([...extracted, ...fallback])).slice(0, 8));
    });
    return () => { cancelled = true; };
  }, [courseId, partNumbers.join(','), partTitles.join('|')]);

  const ensureBadge = () => {
    if (saved) return saved;
    const record: AchievementRecord = {
      id: achievementId(courseId, moduleId), courseId, courseTitle, moduleId, moduleTitle,
      completedParts: [...completedParts], rangeLabel, completedAt: new Date().toISOString(),
      badgeDataUrl: makeBadgeDataUrl(courseTitle, `${partLabel} – ${courseTitle}`, rangeLabel, completionLabel),
    };
    saveAchievement(record, userId);
    setSaved(record);
    return record;
  };

  useEffect(() => {
    const existing = loadAchievements(userId).find(item => item.id === achievementId(courseId, moduleId));
    if (existing) { setSaved(existing); return; }
    const record: AchievementRecord = {
      id: achievementId(courseId, moduleId), courseId, courseTitle, moduleId, moduleTitle,
      completedParts: [...completedParts], rangeLabel, completedAt: new Date().toISOString(),
      badgeDataUrl: makeBadgeDataUrl(courseTitle, `${partLabel} – ${courseTitle}`, rangeLabel, completionLabel),
    };
    saveAchievement(record, userId);
    setSaved(record);
  }, [userId, courseId, courseTitle, moduleId, moduleTitle, completedPartsKey, rangeLabel, partLabel, completionLabel]);

  const openComposer = () => {
    const existing = loadAchievements(userId).find(item => item.id === achievementId(courseId, moduleId));
    setSaved(existing || null);
    setOpen(true);
  };

  const copyPost = async () => {
    try { await navigator.clipboard.writeText(post); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const shareLinkedIn = () => {
    const record = ensureBadge();
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://onepercentdev.vercel.app')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    void navigator.clipboard?.writeText(post);
    void record;
  };

  const downloadBadge = () => {
    const record = ensureBadge();
    const a = document.createElement('a'); a.href = record.badgeDataUrl; a.download = `${courseId}-part-${moduleId}-milestone.svg`; a.click();
  };

  return (
    <>
      <button className="achievement-share-trigger" onClick={openComposer} aria-haspopup="dialog">
        <span aria-hidden="true">✦</span> Share milestone
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="achievement-share-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <section className="achievement-share-modal" role="dialog" aria-modal="true" aria-labelledby="achievement-share-title">
            <div className="achievement-share-kicker">MILESTONE UNLOCKED</div>
            <div className="achievement-share-heading-row">
              <div><h2 id="achievement-share-title">Share your progress</h2><p>{partLabel} · {courseTitle}</p></div>
              <button className="achievement-share-close" onClick={() => setOpen(false)} aria-label="Close share dialog">×</button>
            </div>
            <div className="achievement-share-grid">
              <div className="achievement-badge-preview">
                <div className="achievement-badge-dots"><i/><i/><i/></div>
                <div className="achievement-badge-label">MILESTONE ACHIEVED</div>
                <strong>{courseTitle}</strong>
                <b>{partLabel}</b>
                <span>Completed modules {rangeLabel}</span>
                <small>{completionLabel}</small>
                <small>via 1% Dev Academy</small>
              </div>
              <div className="achievement-share-form">
                <label>Choose a reaction</label>
                <div className="achievement-reactions">
                  {['🎉', '🏆', '💡'].map(item => <button key={item} className={reaction === item ? 'selected' : ''} onClick={() => setReaction(item)}>{item}</button>)}
                </div>
                <label htmlFor="achievement-custom-message">Add a message <span>(optional)</span></label>
                <textarea id="achievement-custom-message" value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="What did you learn?" rows={3}/>
                <label>Auto-captured learning</label>
                <div className="achievement-learning-list">{learnedItems.map(item => <span key={item}>+ {item}</span>)}</div>
                <div className="achievement-credential-meta">
                  <div><span>ISSUED BY</span><strong>1% Dev Academy</strong></div>
                  <div><span>ACHIEVEMENT ID</span><strong>{courseId.toUpperCase()}-P{moduleId}-{completedParts.length}</strong></div>
                  <div><span>SKILLS EVIDENCE</span><strong>{learnedItems.slice(0, 3).join(' · ') || 'Course milestone completion'}</strong></div>
                </div>
                <div className="achievement-post-preview">{post}</div>
              </div>
            </div>
            <div className="achievement-share-actions">
              <button onClick={downloadBadge}>Download badge</button>
              <button onClick={copyPost}>{copied ? 'Copied' : 'Copy post'}</button>
              <button className="primary" onClick={shareLinkedIn}>Share on LinkedIn ↗</button>
            </div>
            <div className="achievement-share-note">Your milestone badge is saved to your learner profile. LinkedIn opens in a new tab; the post text is copied for you.</div>
          </section>
        </div>,
        document.body,
      )}
      <style jsx>{`
        .achievement-share-trigger{display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid ${C.borderHi};border-radius:6px;background:${C.surface};color:${C.cyan};font:600 .76rem 'Google Sans Flex',sans-serif;cursor:pointer}
        .achievement-share-trigger:hover{background:${C.surfaceHi};border-color:${C.cyan}}
        .achievement-share-backdrop{position:fixed;inset:0;z-index:500;display:grid;place-items:center;padding:20px;background:rgba(3,6,10,.78);backdrop-filter:blur(8px)}
        .achievement-share-modal{width:min(860px,100%);max-height:min(92vh,780px);overflow:auto;padding:28px;border:2px solid ${C.borderHi};border-radius:8px;background:${C.surface};box-shadow:8px 8px 0 ${C.border};color:${C.text};font-family:'Google Sans Flex',sans-serif}
        .achievement-share-kicker{color:${C.cyan};font:700 .68rem 'JetBrains Mono',monospace;letter-spacing:.14em;margin-bottom:8px}.achievement-share-heading-row{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid ${C.border};padding-bottom:18px}.achievement-share-heading-row h2{margin:0;font-size:1.55rem}.achievement-share-heading-row p{margin:5px 0 0;color:${C.dim};font-size:.9rem}.achievement-share-close{border:1px solid ${C.borderHi};background:transparent;color:${C.dim};font-size:1.4rem;line-height:1;border-radius:4px;cursor:pointer;width:34px;height:34px}.achievement-share-grid{display:grid;grid-template-columns:minmax(260px,.9fr) minmax(300px,1.1fr);gap:22px;padding:22px 0}.achievement-badge-preview{min-height:250px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;border:2px solid ${C.borderHi};border-radius:6px;background:${C.bg};box-shadow:4px 4px 0 ${C.border};font-family:'Google Sans Flex',sans-serif}.achievement-badge-dots{display:flex;gap:8px}.achievement-badge-dots i{width:10px;height:10px;border-radius:50%;background:${C.cyan}}.achievement-badge-dots i:nth-child(2){background:${C.green}}.achievement-badge-dots i:nth-child(3){background:${C.amber}}.achievement-badge-label{color:${C.cyan};font:700 .62rem 'JetBrains Mono',monospace;letter-spacing:.14em}.achievement-badge-preview strong{font-size:1.45rem}.achievement-badge-preview b{color:${C.green};font-size:1.1rem}.achievement-badge-preview span{color:${C.dim};font: .72rem 'JetBrains Mono',monospace}.achievement-badge-preview small{color:${C.dim}}.achievement-share-form{display:flex;flex-direction:column;gap:9px}.achievement-share-form label{font-size:.78rem;font-weight:700;color:${C.dim};margin-top:2px}.achievement-share-form label span{font-weight:400;color:${C.borderHi}}.achievement-reactions{display:flex;gap:8px;margin-bottom:8px}.achievement-reactions button{width:42px;height:38px;border:1px solid ${C.borderHi};border-radius:4px;background:${C.bg};font-size:1.1rem;cursor:pointer}.achievement-reactions button.selected{border-color:${C.cyan};background:#183B4D}.achievement-share-form textarea{resize:vertical;min-height:72px;padding:10px;border:1px solid ${C.borderHi};border-radius:4px;background:${C.bg};color:${C.text};font: .84rem 'Google Sans Flex',sans-serif}.achievement-post-preview{white-space:pre-wrap;padding:12px;border:1px solid ${C.border};border-radius:4px;background:${C.bg};color:${C.dim};font:.74rem 'JetBrains Mono',monospace;line-height:1.55}.achievement-share-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;border-top:1px solid ${C.border};padding-top:18px}.achievement-share-actions button{padding:9px 12px;border:1px solid ${C.borderHi};border-radius:4px;background:${C.surfaceHi};color:${C.text};font:600 .76rem 'Google Sans Flex',sans-serif;cursor:pointer}.achievement-share-actions button:hover{border-color:${C.cyan}}.achievement-share-actions .primary{background:${C.cyan};border-color:${C.cyan};color:${C.onAccent}}.achievement-share-note{margin-top:14px;color:${C.dim};font-size:.72rem}@media(max-width:680px){.achievement-share-modal{padding:20px}.achievement-share-grid{grid-template-columns:1fr}.achievement-badge-preview{min-height:220px}}
      `}</style>
      <style jsx>{`
        .achievement-share-backdrop{overflow-y:auto;align-items:center}
        .achievement-share-modal{max-height:calc(100dvh - 40px);margin:auto;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable}
        .achievement-share-grid{align-items:start}
        .achievement-badge-preview{height:auto;min-height:250px;aspect-ratio:1;width:min(100%,340px);justify-self:center;align-items:center;text-align:center;border-radius:50%;padding:34px;box-shadow:0 0 0 8px ${C.bg},0 0 0 10px ${C.borderHi},6px 6px 0 ${C.border}}
        .achievement-badge-preview strong{font-size:1.1rem;max-width:190px}.achievement-badge-preview b{font-size:1rem}.achievement-badge-preview span{font-size:.62rem}.achievement-badge-preview small{font-size:.68rem}
        .achievement-credential-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px;border:1px solid ${C.border};border-radius:4px;background:${C.bg}}.achievement-credential-meta div{display:flex;flex-direction:column;gap:4px;min-width:0}.achievement-credential-meta span{color:${C.cyan};font:700 .56rem 'JetBrains Mono',monospace;letter-spacing:.08em}.achievement-credential-meta strong{color:${C.text};font-size:.68rem;line-height:1.3;overflow-wrap:anywhere}@media(max-width:680px){.achievement-credential-meta{grid-template-columns:1fr}}
        .achievement-post-preview{max-height:220px;overflow:auto}
        @media(max-width:680px){.achievement-share-backdrop{padding:12px}.achievement-share-modal{max-height:calc(100dvh - 24px)}.achievement-share-grid{gap:16px}}
      `}</style>
    </>
  );
}
