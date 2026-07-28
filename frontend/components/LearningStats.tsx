'use client';

import { useState, useEffect } from 'react';
import { LearningStats, PomodoroStats, fetchLearningStats, fetchPomodoroStats, formatDuration } from '@/lib/learningPlayerApi';

export function LearningStatsPanel() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [pomo, setPomo] = useState<PomodoroStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLearningStats(), fetchPomodoroStats()]).then(([s, p]) => {
      setStats(s); setPomo(p); setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontFamily: 'var(--font-ui)' }}>Loading stats…</div>
  );

  const s = stats!;
  const cards = [
    { label: 'Today', value: formatDuration(s.today_seconds), icon: '📅', color: '#f1be3e' },
    { label: 'This Week', value: formatDuration(s.week_seconds), icon: '📆', color: '#3498db' },
    { label: 'This Month', value: formatDuration(s.month_seconds), icon: '🗓', color: '#9b59b6' },
    { label: 'All Time', value: formatDuration(s.total_seconds), icon: '⏳', color: '#2ecc71' },
    { label: 'Videos Watched', value: String(s.videos_watched), icon: '▶️', color: '#e67e22' },
    { label: 'Avg Daily', value: formatDuration(s.avg_daily_seconds), icon: '📊', color: '#1abc9c' },
    { label: 'Active Days', value: String(s.active_days), icon: '🗓', color: '#e74c3c' },
    { label: 'Study Streak', value: `${s.current_streak_days}d`, icon: '🔥', color: '#f39c12' },
  ];

  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 900, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        📈 Learning Time Tracker
      </h3>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
        {cards.map(card => (
          <div key={card.label}
            style={{ background: '#fff', border: '2px solid #000', padding: '12px 14px', boxShadow: '3px 3px 0 #000' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{card.icon}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: card.color }}>{card.value || '0'}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666', marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Pomodoro stats */}
      {pomo && (pomo.today_sessions > 0) && (
        <div style={{ background: '#000', color: '#fff', border: '2px solid #000', padding: '12px 16px', display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>🍅</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#f1be3e' }}>
              {pomo.today_sessions} Pomodoro{pomo.today_sessions > 1 ? 's' : ''} today
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              {pomo.today_minutes} min focused · {pomo.today_hours}h total
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {s.total_seconds === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#aaa', border: '2px dashed #ddd', marginTop: 10 }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📺</div>
          <div style={{ fontSize: '0.82rem' }}>Start watching lessons to track your learning time.</div>
        </div>
      )}
    </div>
  );
}
