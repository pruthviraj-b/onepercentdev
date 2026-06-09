'use client';

import { useState } from 'react';
import { Module } from '@/lib/api';

interface Props {
  modules: Module[];
  completedParts: number[];
  progressPct: number;
  completedCount: number;
  totalParts: number;
  booting: boolean;
  onLaunch: () => void;
  onSelectPart: (part: number) => void;
}

export function Landing({
  modules, completedParts, progressPct, completedCount, totalParts,
  booting, onLaunch, onSelectPart,
}: Props) {
  const [showAbout, setShowAbout] = useState(false);

  const totalWords = modules.flatMap(m => m.notes).reduce((s, n) => s + n.wordCount, 0);
  const estHours = Math.round(totalWords / 200 / 60);

  return (
    <div className="land-container">
      {/* ── HEADER BRANDING ── */}
      <div className="land-header-wrap">
        {/* Left Mascot: Cute Cartoon Snake */}
        <div className="land-mascot land-mascot-snake">
          <svg viewBox="0 0 120 120" width="80" height="80">
            <path d="M 30 90 Q 40 40 60 55 T 90 45" fill="none" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
            <circle cx="60" cy="35" r="16" fill="#f1be3e" stroke="#000000" strokeWidth="3" />
            <circle cx="54" cy="32" r="3" fill="#000000" />
            <circle cx="66" cy="32" r="3" fill="#000000" />
            <path d="M 52 42 Q 60 48 68 42" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 68 38 L 78 30" stroke="#000000" strokeWidth="2" />
            <path d="M 28 88 L 22 98" stroke="#000000" strokeWidth="3" />
            <path d="M 92 47 L 98 56" stroke="#000000" strokeWidth="3" />
          </svg>
        </div>

        {/* Branding Text */}
        <div className="land-brand-text">
          <span className="land-header-eyebrow">CRAFT BEER & FINE CODE</span>
          <h1 className="retro-title">1% DEV ACADEMY</h1>
          <span className="land-header-sub">PYTHON IN KANNADA · BY SHYAMISCODING</span>
        </div>

        {/* Right Mascot: Cute Retro Computer Monitor */}
        <div className="land-mascot land-mascot-pc">
          <svg viewBox="0 0 120 120" width="80" height="80">
            <rect x="25" y="25" width="70" height="50" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="3" />
            <rect x="32" y="32" width="56" height="36" fill="#f1be3e" stroke="#000000" strokeWidth="2" />
            <circle cx="48" cy="46" r="4.5" fill="#000000" />
            <circle cx="72" cy="46" r="4.5" fill="#000000" />
            <circle cx="46" cy="44" r="1.5" fill="#ffffff" />
            <circle cx="70" cy="44" r="1.5" fill="#ffffff" />
            <path d="M 53 56 Q 60 62 67 56" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 45 75 Q 40 90 35 95" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <path d="M 75 75 Q 80 90 85 95" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="32" cy="95" rx="6" ry="3" fill="#000000" />
            <ellipse cx="88" cy="95" rx="6" ry="3" fill="#000000" />
          </svg>
        </div>
      </div>

      {/* ── NAVIGATION BAR ── */}
      <div className="land-nav-bar">
        <div className="land-nav-item" onClick={onLaunch}>HOME</div>
        <div className="land-nav-item" onClick={() => setShowAbout(true)}>ABOUT</div>
        <a className="land-nav-item" href="https://www.youtube.com/channel/UCT0629rHJIjJWmQj1JyejyA" target="_blank" rel="noopener noreferrer">YOUTUBE</a>
        <a className="land-nav-item" href="https://www.youtube.com/playlist?list=PLPzxNCCwS9ww_I4zEH6w9-HN4IKmt7UED" target="_blank" rel="noopener noreferrer">PLAYLIST</a>
        <a className="land-nav-item" href="https://t.me/shyamiscoding" target="_blank" rel="noopener noreferrer">TELEGRAM</a>
        <a className="land-nav-item" href="https://github.com/Shyamiscoding/onepercentdev" target="_blank" rel="noopener noreferrer">GITHUB</a>
      </div>

      {/* ── MAIN GRID LAYOUT ── */}
      <div className="land-main-split">
        {/* LEFT COLUMN: Welcome, Description and highlights */}
        <div className="land-main-left">
          <div className="land-content-section">
            <span className="land-section-eyebrow">BEGINNER TO 1% DEVELOPER</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h2 className="land-section-title" style={{ margin: 0 }}>PIZZA BY THE CODE</h2>
              <button className="land-btn-primary" onClick={onLaunch} style={{ padding: '8px 24px', fontSize: '0.85rem' }}>
                START LEARNING NOW →
              </button>
            </div>
            <p className="land-description-text">
              This is the complete, premium study companion for the popular YouTube series <b>Python in Kannada</b> by <b>shyamiscoding</b>.
              Every single part is compiled with deep conceptual notes, copyable code blocks, and the exact lesson video — all in one unified, high-contrast dashboard.
            </p>
            <p className="land-description-text">
              Our core objective: teach Python from fundamental memory models up to professional production code.
              We focus on teaching you to think like a robust engineer, rather than just memorize syntax to pass exams.
            </p>
            <div className="land-guide-tip" style={{
              marginTop: '20px',
              padding: '14px 18px',
              background: 'var(--win-light)',
              border: '2px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.82rem',
              color: '#000000',
              lineHeight: '1.5',
            }}>
              💡 <b>STUDY CONTEXT & TOOLS:</b> Press <kbd style={{ padding: '2px 5px', border: '1px solid #000', background: '#fff', borderRadius: '3px', fontWeight: 'bold', fontSize: '0.75rem' }}>?</kbd> anywhere to view keyboard shortcuts. Inside the course reader, press <kbd style={{ padding: '2px 5px', border: '1px solid #000', background: '#fff', borderRadius: '3px', fontWeight: 'bold', fontSize: '0.75rem' }}>v</kbd> or click the toolbar split-screen icon to focus solely on the split lesson video and interactive coding playground.
            </div>
          </div>

          {/* Grid highlights (like single, double, triple) */}
          <div className="land-highlights-grid">
            <div className="land-highlight-card" onClick={onLaunch}>
              <div className="land-highlight-header">START COURSE</div>
              <div className="land-highlight-body">
                <span>77 Videos & Notes</span>
                <span className="land-highlight-price">FREE [ ↗ ]</span>
              </div>
            </div>

            <div className="land-highlight-card">
              <div className="land-highlight-header">EST. DURATION</div>
              <div className="land-highlight-body">
                <span>{estHours}+ Hours Reading</span>
                <span className="land-highlight-price">FREE [ ↗ ]</span>
              </div>
            </div>

            <div className="land-highlight-card">
              <div className="land-highlight-header">CURRICULUM</div>
              <div className="land-highlight-body">
                <span>{totalParts} Complete Parts</span>
                <span className="land-highlight-price">FREE [ ↗ ]</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Progress & Syllabus */}
        <div className="land-main-right">
          {/* Progress Card */}
          <div className="land-win land-progress-card">
            <div className="land-win-titlebar">
              <span>📊 PROGRESS OVERVIEW</span>
            </div>
            <div className="land-win-body">
              <div className="land-progress-stats-row">
                <span>COMPLETED Parts:</span>
                <b>{completedCount} / {totalParts}</b>
              </div>
              <div className="land-progress-bar-wrap">
                <div className="land-progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="land-progress-footer">
                <span>{progressPct}% COMPLETE</span>
                <button className="land-btn-primary" onClick={onLaunch}>
                  RESUME LEARNING
                </button>
              </div>
            </div>
          </div>

          {/* Full Syllabus scroll box */}
          <div className="land-win land-syllabus-card">
            <div className="land-win-titlebar">
              <span>📚 FULL SYLLABUS — CLICK TO OPEN</span>
            </div>
            <div className="land-win-body land-syllabus">
              {modules.map((mod) => {
                const done = mod.notes.filter(n => completedParts.includes(n.part)).length;
                return (
                  <div key={mod.id} className="land-module">
                    <div className="land-module-hdr">
                      <span className="land-module-num">M{mod.id}</span>
                      <span className="land-module-title">{mod.title}</span>
                      <span className="land-module-count">{done}/{mod.notes.length}</span>
                    </div>
                    <div className="land-part-list">
                      {mod.notes.map((n, ni) => {
                        const isDone = completedParts.includes(n.part);
                        const shortTitle = n.title.replace(/^Part\s+\d+[\s—\-]+/i, '');
                        return (
                          <div
                            key={n.part}
                            className={`land-part-item${isDone ? ' done' : ''}`}
                            onClick={() => onSelectPart(n.part)}
                          >
                            <span className="land-part-num">{isDone ? '✓' : String(ni + 1).padStart(2, '0')}</span>
                            <span className="land-part-name">{shortTitle}</span>
                            <span className="land-part-min">~{Math.max(1, Math.round(n.wordCount / 200))}m</span>
                            <span className="land-part-arrow">↗</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── ABOUT DIALOG modal ── */}
      {showAbout && (
        <div className="land-about-panel">
          <div className="land-about-titlebar">
            <span>📋 ABOUT THIS ACADEMY</span>
            <button className="land-win-btn land-win-close" onClick={() => setShowAbout(false)}>✕</button>
          </div>
          <div className="land-about-body">
            <table className="land-about-table">
              <tbody>
                <tr>
                  <td className="land-about-key">INSTRUCTOR</td>
                  <td>
                    <strong>shyamiscoding</strong> — Beginner to 1% Developer 🚀
                    <div style={{ marginTop: '6px', fontSize: '0.75rem' }}>
                      DESIGNED &amp; BUILT BY{' '}
                      <a
                        href="https://pruthviraj-portfolio-nu.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        PRUTHVI RAJ B
                      </a>{' '}
                      . 2026
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="land-about-key">INSTRUCTOR</td>
                  <td>
                    <strong>PRUTHVI RAJ B</strong> — Designed &amp; Built By{' '}
                    <a href="https://pruthviraj-portfolio-nu.vercel.app/" target="_blank" rel="noopener noreferrer">
                      PRUTHVI RAJ B
                    </a>{' '}
                    . 2026
                  </td>
                </tr>
                <tr>
                  <td className="land-about-key">SERIES</td>
                  <td>Python in Kannada — 77 videos complete</td>
                </tr>
                <tr>
                  <td className="land-about-key">TARGET</td>
                  <td>BCA/MCA/Engg Students, Freshers, and developers targeting 2–20 LPA</td>
                </tr>
                <tr>
                  <td className="land-about-key">GOAL</td>
                  <td>Build production-grade development fundamentals</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button className="land-btn-primary" onClick={() => setShowAbout(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
