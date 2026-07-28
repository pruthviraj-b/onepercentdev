'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  StudentAnalytics, StudentListItem, ActivityLogEntry,
  searchStudents, fetchStudentAnalytics, fetchStudentActivity,
  formatSecs, relativeTime, eventLabel, eventIcon,
} from '@/lib/studentAnalyticsApi';

const getApiBase = () => typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || window.location.origin)
  : 'http://localhost:3001';

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 16 }: { w?: string; h?: number }) {
  return (
    <div style={{
      width: w, height: h, background: 'linear-gradient(90deg,#e8e0d4 25%,#f4f1ea 50%,#e8e0d4 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 2,
    }} />
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent = '#f1be3e' }: {
  icon: string; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div style={{
      background: '#fff', border: '2px solid #000', padding: '14px 16px',
      boxShadow: '3px 3px 0 #000', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: '1.2rem' }}>{icon}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: accent }}>{value}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#555' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: '#888' }}>{sub}</div>}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = '#f1be3e' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 8, background: '#f0ebe2', border: '1px solid #ccc', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ── Student List ──────────────────────────────────────────────────────────────
function StudentList({ pwd, onSelect }: { pwd: string; onSelect: (id: string) => void }) {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = 1, q = search, f = filter) => {
    setLoading(true);
    const res = await searchStudents(pwd, { search: q || undefined, filter: f || undefined, page: p });
    if (p === 1) setStudents(res.students);
    else setStudents(prev => [...prev, ...res.students]);
    setTotal(res.total);
    setLoading(false);
  }, [pwd, search, filter]);

  useEffect(() => { setPage(1); load(1); }, [search, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, or ID..."
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', outline: 'none', background: '#fff' }}
        />
        {['', 'online', 'today', 'highest_time', 'lowest_time'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 12px', border: '2px solid #000', background: filter === f ? '#000' : '#fff', color: filter === f ? '#f1be3e' : '#000', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', cursor: 'pointer' }}>
            {f === '' ? 'All' : f === 'online' ? '🟢 Online' : f === 'today' ? '📅 Today' : f === 'highest_time' ? '⬆ Study Time' : '⬇ Study Time'}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '0.78rem', color: '#888' }}>{total} student{total !== 1 ? 's' : ''} found</div>

      {loading && page === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ height: 60, background: '#e8e0d4', border: '2px solid #000', animation: 'shimmer 1.4s infinite' }} />)}
        </div>
      ) : students.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #ccc', color: '#aaa' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>👥</div>
          <div>No students found. Students appear here after their first login.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {students.map(s => (
            <div key={s.user_id} onClick={() => onSelect(s.user_id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '2px solid #000', cursor: 'pointer', transition: 'box-shadow 80ms' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '4px 4px 0 #000')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              {/* Avatar */}
              <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', overflow: 'hidden', border: '2px solid #000', background: '#f4f1ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900 }}>
                {s.photo_url ? <img src={s.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : (s.display_name?.[0] || '?')}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.display_name || 'Unknown'}
                  {s.is_online && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ecc71', display: 'inline-block' }} />}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#888', fontFamily: 'var(--font-mono)' }}>{s.email || s.user_id}</div>
              </div>
              {/* Last seen */}
              <div style={{ fontSize: '0.7rem', color: '#aaa', textAlign: 'right', flexShrink: 0 }}>
                {s.is_online ? <span style={{ color: '#2ecc71', fontWeight: 800 }}>🟢 Online</span> : relativeTime(s.last_seen_at)}
              </div>
              {/* Arrow */}
              <div style={{ fontSize: '1rem', color: '#ccc', flexShrink: 0 }}>→</div>
            </div>
          ))}
          {students.length < total && (
            <button onClick={() => { const np = page + 1; setPage(np); load(np); }}
              disabled={loading}
              style={{ padding: '10px', border: '2px solid #000', background: '#f4f1ea', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase' }}>
              {loading ? 'Loading…' : `Load More (${total - students.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Activity Timeline ─────────────────────────────────────────────────────────
function ActivityTimeline({ logs, loading }: { logs: ActivityLogEntry[]; loading: boolean }) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1,2,3,4,5].map(i => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div style={{ width: 32, height: 32, background: '#e8e0d4', borderRadius: '50%' }} /><Skeleton h={16} w="70%" /></div>)}
    </div>
  );
  if (logs.length === 0) return (
    <div style={{ padding: '24px', textAlign: 'center', color: '#aaa', border: '2px dashed #ddd' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📋</div>
      <div>No activity recorded yet.</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {logs.map((log, i) => {
        const d = new Date(log.createdAt);
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const isToday = d.toDateString() === new Date().toDateString();
        return (
          <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < logs.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
            {/* Timeline dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f4f1ea', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                {eventIcon(log.eventType)}
              </div>
              {i < logs.length - 1 && <div style={{ width: 2, height: 16, background: 'rgba(0,0,0,0.1)', marginTop: 2 }} />}
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111' }}>{eventLabel(log.eventType)}</div>
              {log.courseId && (
                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 1 }}>
                  {log.courseId}{log.partId ? ` · Part ${log.partId}` : ''}
                </div>
              )}
            </div>
            {/* Time */}
            <div style={{ fontSize: '0.68rem', color: '#aaa', textAlign: 'right', flexShrink: 0, paddingTop: 4 }}>
              <div style={{ fontWeight: 700, color: '#555', fontFamily: 'var(--font-mono)' }}>{timeStr}</div>
              {!isToday && <div>{dateStr}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Course Progress Row ───────────────────────────────────────────────────────
function CourseProgressRow({ item }: { item: import('@/lib/studentAnalyticsApi').CourseProgressItem }) {
  const color = item.progressPct === 100 ? '#2ecc71' : item.progressPct > 50 ? '#f1be3e' : '#e74c3c';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      {/* Thumbnail */}
      <div style={{ width: 64, height: 36, flexShrink: 0, background: '#111', overflow: 'hidden', border: '2px solid #000' }}>
        {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 4 }}>{item.courseTitle}</div>
        <ProgressBar pct={item.progressPct} color={color} />
        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.7rem', color: '#888' }}>
          <span>{item.lessonsCompleted}/{item.totalLessons} lessons</span>
          <span>{formatSecs(item.timeSpentSeconds)} spent</span>
          {item.lastOpenedAt && <span>Last: {relativeTime(item.lastOpenedAt)}</span>}
        </div>
      </div>
      {/* Pct badge */}
      <div style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.9rem', color, minWidth: 44, textAlign: 'right' }}>
        {item.progressPct}%
      </div>
    </div>
  );
}

// ── Student Detail Page ───────────────────────────────────────────────────────
function StudentDetail({ pwd, userId, onBack }: { pwd: string; userId: string; onBack: () => void }) {
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreLogsLoading, setMoreLogsLoading] = useState(false);
  const [allLogs, setAllLogs] = useState<ActivityLogEntry[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    setLoading(true);
    fetchStudentAnalytics(pwd, userId).then(res => {
      setData(res);
      setAllLogs(res?.activityLogs || []);
      setTotalLogs(res?.activityLogs?.length || 0);
      setLoading(false);
    });
  }, [pwd, userId]);

  const loadMoreLogs = useCallback(async () => {
    const nextPage = logsPage + 1;
    setMoreLogsLoading(true);
    const res = await fetchStudentActivity(pwd, userId, nextPage);
    setAllLogs(prev => [...prev, ...res.logs]);
    setTotalLogs(res.total);
    setLogsPage(nextPage);
    setMoreLogsLoading(false);
  }, [pwd, userId, logsPage]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', padding: '6px 14px', border: '2px solid #000', background: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>← Back</button>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 90, background: '#e8e0d4', border: '2px solid #000' }} />)}
      </div>
    </div>
  );
  if (!data) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#cc0000', border: '2px solid #cc0000' }}>
      Failed to load student data.
      <button onClick={onBack} style={{ marginLeft: 12, padding: '4px 10px', border: '2px solid #000', cursor: 'pointer' }}>← Back</button>
    </div>
  );

  const { profile, learningTime, courseProgress, stats, activityLogs } = data;

  const navItems = ['overview', 'courses', 'activity', 'statistics'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back button */}
      <button onClick={onBack}
        style={{ alignSelf: 'flex-start', padding: '6px 14px', border: '2px solid #000', background: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', boxShadow: '2px 2px 0 #000', textTransform: 'uppercase' }}>
        ← Students
      </button>

      {/* Profile Card */}
      <div style={{ background: '#fff', border: '3px solid #000', boxShadow: '5px 5px 0 #000', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '3px solid #000', flexShrink: 0, background: '#f4f1ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 }}>
          {profile.photoUrl
            ? <img src={profile.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : (profile.displayName?.[0] || '?')}
        </div>
        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{profile.displayName}</div>
            {profile.isOnline
              ? <span style={{ padding: '2px 8px', background: '#2ecc71', color: '#fff', fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase' }}>🟢 Online</span>
              : <span style={{ padding: '2px 8px', background: '#f0ebe2', color: '#888', fontSize: '0.68rem', fontWeight: 800, border: '1px solid #ccc', textTransform: 'uppercase' }}>Offline</span>}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#555', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{profile.email}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: '#888' }}>Joined: {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'Unknown'}</span>
            <span style={{ fontSize: '0.72rem', color: '#888' }}>Last active: {relativeTime(profile.lastSeenAt)}</span>
            <span style={{ fontSize: '0.72rem', color: '#888', fontFamily: 'var(--font-mono)' }}>ID: {profile.userId.slice(0,12)}…</span>
          </div>
        </div>
        {/* Current activity */}
        {profile.isOnline && profile.currentCourseId && (
          <div style={{ background: '#f0fff4', border: '2px solid #2ecc71', padding: '12px 16px', minWidth: 200 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', color: '#2ecc71', marginBottom: 4 }}>Currently Learning</div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{profile.currentCourseId}</div>
            {profile.currentPartId && <div style={{ fontSize: '0.75rem', color: '#555' }}>Part {profile.currentPartId}</div>}
            {profile.currentSessionSeconds > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 4 }}>
                Session: {formatSecs(profile.currentSessionSeconds)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section nav */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #000' }}>
        {navItems.map(n => (
          <button key={n} onClick={() => setActiveSection(n)}
            style={{ padding: '8px 18px', border: 'none', borderBottom: activeSection === n ? '3px solid #f1be3e' : '3px solid transparent', background: 'transparent', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', cursor: 'pointer', color: activeSection === n ? '#000' : '#888', marginBottom: -2 }}>
            {n}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeSection === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Learning Time */}
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px', borderBottom: '2px solid #000', paddingBottom: 6 }}>
              ⏱ Learning Time
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
              <StatCard icon="📅" label="Today" value={formatSecs(learningTime.todaySecs)} accent="#f1be3e" />
              <StatCard icon="📆" label="This Week" value={formatSecs(learningTime.weekSecs)} accent="#3498db" />
              <StatCard icon="🗓" label="This Month" value={formatSecs(learningTime.monthSecs)} accent="#9b59b6" />
              <StatCard icon="⏳" label="All Time" value={formatSecs(learningTime.totalSecs)} accent="#2ecc71" />
            </div>
          </div>

          {/* Quick stats */}
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px', borderBottom: '2px solid #000', paddingBottom: 6 }}>
              �� Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
              <StatCard icon="▶️" label="Videos Watched" value={String(stats.videosCompleted)} />
              <StatCard icon="✅" label="Lessons Done" value={String(stats.lessonsCompleted)} />
              <StatCard icon="📝" label="Notes Added" value={String(stats.notesAdded)} />
              <StatCard icon="🔖" label="Bookmarks" value={String(stats.bookmarksAdded)} />
              <StatCard icon="🔥" label="Study Streak" value={`${stats.currentStreak}d`} accent="#e74c3c" />
              <StatCard icon="📆" label="Active Days" value={String(stats.totalActiveDays)} />
              <StatCard icon="🍅" label="Pomodoros" value={String(stats.pomodoroSessions)} />
            </div>
          </div>

          {/* Recent activity preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, borderBottom: '2px solid #000', paddingBottom: 6, flex: 1 }}>
                📋 Recent Activity
              </h3>
              <button onClick={() => setActiveSection('activity')} style={{ fontSize: '0.72rem', fontWeight: 800, background: 'transparent', border: 'none', cursor: 'pointer', color: '#888', textDecoration: 'underline' }}>
                View all →
              </button>
            </div>
            <ActivityTimeline logs={allLogs.slice(0, 10)} loading={false} />
          </div>
        </div>
      )}

      {/* ── COURSES ── */}
      {activeSection === 'courses' && (
        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px', borderBottom: '2px solid #000', paddingBottom: 6 }}>
            📚 Course Progress ({courseProgress.length} courses)
          </h3>
          {courseProgress.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#aaa', border: '2px dashed #ddd' }}>No course activity recorded yet.</div>
          ) : (
            <div style={{ background: '#fff', border: '2px solid #000', padding: '0 16px' }}>
              {courseProgress.map(item => <CourseProgressRow key={item.courseId} item={item} />)}
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY ── */}
      {activeSection === 'activity' && (
        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px', borderBottom: '2px solid #000', paddingBottom: 6 }}>
            📋 Activity Timeline
          </h3>
          <div style={{ background: '#fff', border: '2px solid #000', padding: '4px 16px 16px' }}>
            <ActivityTimeline logs={allLogs} loading={false} />
            {allLogs.length < totalLogs && (
              <button onClick={loadMoreLogs} disabled={moreLogsLoading}
                style={{ marginTop: 12, width: '100%', padding: '10px', border: '2px solid #000', background: '#f4f1ea', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase' }}>
                {moreLogsLoading ? 'Loading…' : `Load More (${totalLogs - allLogs.length} remaining)`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STATISTICS ── */}
      {activeSection === 'statistics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px', borderBottom: '2px solid #000', paddingBottom: 6 }}>
              📈 Learning Summary
            </h3>
            <div style={{ background: '#fff', border: '2px solid #000', padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {[
                ['Total Watch Time', formatSecs(learningTime.totalSecs)],
                ['Today', formatSecs(learningTime.todaySecs)],
                ['This Week', formatSecs(learningTime.weekSecs)],
                ['This Month', formatSecs(learningTime.monthSecs)],
                ['Videos Watched', String(stats.videosCompleted)],
                ['Lessons Completed', String(stats.lessonsCompleted)],
                ['Timestamp Notes', String(stats.notesAdded)],
                ['Bookmarks', String(stats.bookmarksAdded)],
                ['Pomodoro Sessions', String(stats.pomodoroSessions)],
                ['Current Streak', `${stats.currentStreak} days`],
                ['Total Active Days', String(stats.totalActiveDays)],
                ['Courses Enrolled', String(courseProgress.length)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#555' }}>{label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Export: StudentAnalyticsModule ──────────────────────────────────────
export function StudentAnalyticsModule({ adminPassword }: { adminPassword: string }) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<{ checked: boolean; allOk: boolean; sql: string; missing: string[] }>({
    checked: false, allOk: true, sql: '', missing: [],
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${getApiBase()}/api/admin/analytics-setup`, {
      headers: { 'X-Admin-Password': adminPassword },
    })
      .then(r => r.json())
      .then(d => {
        setSetupStatus({
          checked: true,
          allOk: d.allOk,
          sql: d.sql || '',
          missing: (d.tables || []).filter((t: any) => !t.exists).map((t: any) => t.table),
        });
      })
      .catch(() => setSetupStatus(s => ({ ...s, checked: true })));
  }, [adminPassword]);

  const copySQL = () => {
    navigator.clipboard.writeText(setupStatus.sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ background: '#f1be3e', border: '2px solid #000', padding: '4px 10px', fontWeight: 900, fontSize: '0.72rem', textTransform: 'uppercase' }}>
            Admin Only
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            👥 Student Analytics
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#555' }}>
          Monitor any student's learning progress, time, and activity without accessing their account.
        </p>
      </div>

      {/* ── Setup Banner — shown when tables are missing ── */}
      {setupStatus.checked && !setupStatus.allOk && (
        <div style={{ background: '#fff3cd', border: '3px solid #f1be3e', padding: '16px 20px', marginBottom: 20, boxShadow: '4px 4px 0 #000' }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: 8 }}>
            ⚠️ Database Setup Required
          </div>
          <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#555' }}>
            These tables are missing in Supabase:{' '}
            <strong>{setupStatus.missing.join(', ')}</strong>
          </p>
          <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#555' }}>
            1. Go to <strong>Supabase Dashboard</strong> → <strong>SQL Editor</strong> → <strong>New Query</strong><br/>
            2. Click <strong>Copy SQL</strong> below → Paste → Click <strong>Run</strong><br/>
            3. Come back here and refresh
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={copySQL}
              style={{ padding: '8px 20px', background: copied ? '#2ecc71' : '#000', color: '#f1be3e', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase', transition: 'background 200ms' }}>
              {copied ? '✓ Copied!' : '📋 Copy SQL to Clipboard'}
            </button>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
              style={{ padding: '8px 16px', background: '#fff', border: '2px solid #000', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.78rem', textDecoration: 'none', color: '#000', textTransform: 'uppercase' }}>
              Open Supabase →
            </a>
          </div>

          {/* Inline SQL preview */}
          {setupStatus.sql && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#555' }}>
                View SQL ↓
              </summary>
              <pre style={{ marginTop: 8, padding: '12px', background: '#1a1a1a', color: '#f1be3e', fontSize: '0.65rem', overflowX: 'auto', maxHeight: 300, border: '2px solid #000', fontFamily: 'monospace', lineHeight: 1.5 }}>
                {setupStatus.sql}
              </pre>
            </details>
          )}
        </div>
      )}

      {selectedStudentId ? (
        <StudentDetail
          pwd={adminPassword}
          userId={selectedStudentId}
          onBack={() => setSelectedStudentId(null)}
        />
      ) : (
        <StudentList pwd={adminPassword} onSelect={setSelectedStudentId} />
      )}
    </div>
  );
}
