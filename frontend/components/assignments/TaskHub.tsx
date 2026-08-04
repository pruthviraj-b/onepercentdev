'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  SmartTask, TaskType, TaskStatus, TaskPriority, LinkType, InternalTarget,
  TimeFilter, CreateTaskInput, UpdateTaskInput,
  fetchTasks, createTask, updateTask, deleteTask, duplicateTask,
  bulkUpdateSortOrder, fetchAnalytics, fetchLinkPreview, fetchUserTags,
  detectUrlResourceType, getResourceIcon, getTaskTypeLabel,
  getPriorityColor, getPriorityBg, formatDueDate, todayStr, tomorrowStr,
  TaskAnalytics,
  NotificationPreferences, defaultNotificationPreferences,
  fetchNotificationPreferences, saveNotificationPreferences,
  ReminderStatus, ReminderHistoryItem,
  fetchReminderStatus, fetchReminderHistory,
  sendTestReminderEmail,
} from '@/services/taskService';
import { useAuth } from '@/features/authentication/AuthProvider';

// ── VS Code Dark+ theme tokens ────────────────────────────────────────────
const VS = {
  bg:        '#FFFFFF',
  bgAlt:     '#FFFFFF',
  bgRaised:  '#FFFFFF',
  bgHover:   '#FFF2E8',
  border:    '#E7DED4',
  borderStrong: '#CFC1B4',
  text:      '#1F2937',
  textDim:   '#65717C',
  comment:   '#2E8D6C', // success green
  keyword:   '#F98012', // primary accent
  func:      '#B57718', // secondary accent / badges
  string:    '#C85B3D', // warnings / warm accent
  number:    '#2E8D6C', // stats / soft green
  danger:    '#D65353', // error red
  onAccent: '#FFFFFF',
};
const FONT_MONO = "var(--font-mono, 'Google Sans Flex', sans-serif)";
const FONT_UI = "var(--font-ui, 'Google Sans Flex', sans-serif)";

// ── Types ────────────────────────────────────────────────────────────────

interface TaskHubProps {
  onBack: () => void;
  onNavigateInternal?: (target: string, id: string) => void;
  courses?: { id: string; title: string; mascot?: string }[];
}

interface WebAlert {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'today',      label: '📅 Today' },
  { key: 'tomorrow',   label: '🌅 Tomorrow' },
  { key: 'this_week',  label: '📆 This Week' },
  { key: 'next_week',  label: '🗓️ Next Week' },
  { key: 'this_month', label: '📆 This Month' },
  { key: 'all',        label: '🗂️ All Tasks' },
];

const TASK_TYPES: TaskType[] = [
  'study','watch_video','read_article','practice_coding','complete_lesson',
  'assignment','revision','mock_test','interview_prep','build_project','research','custom',
];
const PRIORITIES: TaskPriority[] = ['low','medium','high','critical'];
const STATUSES: TaskStatus[] = ['not_started','in_progress','completed','skipped','archived'];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '🟢 Low', medium: '🟡 Medium', high: '🟠 High', critical: '🔴 Critical',
};
const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: '⬜ Not Started', in_progress: '🔵 In Progress',
  completed: '✅ Completed', skipped: '⏭️ Skipped', archived: '📦 Archived',
};
const INTERNAL_TARGETS: InternalTarget[] = [
  'course','module','lesson','quiz','assignment','project','practice_lab','certificate','dashboard',
];
const INTERNAL_TARGET_LABELS: Record<string, string> = {
  course: '📘 Course', module: '📂 Module', lesson: '📄 Lesson',
  quiz: '🧪 Quiz', assignment: '📝 Assignment', project: '🏗️ Project',
  practice_lab: '🔬 Practice Lab', certificate: '🏆 Certificate', dashboard: '🏠 Dashboard',
};

const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  low: VS.comment, medium: VS.func, high: VS.string, critical: VS.danger,
};

// ── Notification helper ─────────────────────────────────────────────────

function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  useEffect(() => {
    if (typeof Notification !== 'undefined') setPermission(Notification.permission);
  }, []);
  const request = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setPermission(p);
  }, []);
  const notify = useCallback((title: string, body: string) => {
    if (permission !== 'granted' || typeof Notification === 'undefined') return false;
    new Notification(title, { body, icon: '/favicon.ico', tag: `opd-${title}-${body}` });
    return true;
  }, [permission]);
  return { permission, request, notify };
}

function getReminderDate(task: SmartTask): Date | null {
  if (!task.due_date) return null;
  const due = new Date(`${task.due_date}T${task.due_time || '09:00'}`);
  return Number.isNaN(due.getTime()) ? null : due;
}

function useTaskReminders(
  tasks: SmartTask[],
  notify: (title: string, body: string) => boolean,
  showToast: (msg: string) => void,
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sentKey = 'opd_task_reminders_sent';
    const readSent = () => {
      try { return JSON.parse(window.localStorage.getItem(sentKey) || '{}') as Record<string, number>; }
      catch { return {}; }
    };
    const writeSent = (sent: Record<string, number>) => {
      try { window.localStorage.setItem(sentKey, JSON.stringify(sent)); } catch {}
    };

    const check = () => {
      const now = Date.now();
      const sent = readSent();
      const active = tasks.filter(t =>
        !t.is_archived &&
        t.status !== 'completed' &&
        t.status !== 'skipped' &&
        !!t.due_date
      );

      for (const task of active) {
        const due = getReminderDate(task);
        if (!due) continue;
        const msUntilDue = due.getTime() - now;
        const dueKey = `${task.id}:due:${task.updated_at}`;
        const soonKey = `${task.id}:soon:${task.updated_at}`;

        if (msUntilDue <= 0 && msUntilDue > -60 * 60 * 1000 && !sent[dueKey]) {
          const body = task.due_time ? `Due now at ${task.due_time}` : 'Due today';
          notify(`Task due: ${task.title}`, body);
          showToast(`Reminder: ${task.title}`);
          sent[dueKey] = now;
        } else if (msUntilDue > 0 && msUntilDue <= 10 * 60 * 1000 && !sent[soonKey]) {
          const minutes = Math.max(1, Math.round(msUntilDue / 60000));
          notify(`Upcoming task: ${task.title}`, `Due in ${minutes} min`);
          showToast(`Due soon: ${task.title}`);
          sent[soonKey] = now;
        }
      }

      const cutoff = now - 14 * 24 * 60 * 60 * 1000;
      for (const key of Object.keys(sent)) {
        if (sent[key] < cutoff) delete sent[key];
      }
      writeSent(sent);
    };

    check();
    const id = window.setInterval(check, 30000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [tasks, notify, showToast]);
}

// ── Link Preview Card ────────────────────────────────────────────────────

function LinkPreviewCard({ task }: { task: SmartTask }) {
  if (!task.external_url) return null;
  if (task.preview_title || task.preview_domain) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px',
        background: VS.bgAlt, border: `1px solid ${VS.border}`, marginTop:'8px', borderRadius: 6 }}>
        {task.preview_favicon && (
          <img src={task.preview_favicon} alt="" width={20} height={20}
            style={{ flexShrink:0, borderRadius: 3 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        )}
        {task.preview_thumbnail && (
          <img src={task.preview_thumbnail} alt="" style={{ width:56, height:40, objectFit:'cover', flexShrink:0, border:`1px solid ${VS.border}`, borderRadius: 4 }}
            onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        )}
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'0.82rem', color: VS.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {task.preview_title || task.external_url}
          </div>
          {task.preview_domain && (
            <div style={{ fontSize:'0.7rem', color: VS.textDim, fontFamily: FONT_MONO, marginTop:2 }}>
              {getResourceIcon(task.url_resource_type || null)} {task.preview_domain}
            </div>
          )}
        </div>
        <a href={task.external_url} target="_blank" rel="noopener noreferrer"
          style={{ marginLeft:'auto', fontSize:'0.72rem', fontWeight:700, color: VS.onAccent, textDecoration:'none',
            padding:'4px 10px', borderRadius: 5, background: VS.func, whiteSpace:'nowrap', flexShrink:0 }}
          onClick={e => e.stopPropagation()}>
          Open ↗
        </a>
      </div>
    );
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 10px',
      background: VS.bgAlt, border: `1px solid ${VS.border}`, borderRadius: 6, marginTop:'6px', fontSize:'0.78rem' }}>
      <span>{getResourceIcon(task.url_resource_type || null)}</span>
      <a href={task.external_url} target="_blank" rel="noopener noreferrer"
        style={{ color: VS.func, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
        onClick={e => e.stopPropagation()}>
        {task.external_url}
      </a>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────

function TaskCard({
  task, onToggleStatus, onPin, onArchive, onDuplicate, onDelete, onEdit, onNavigate,
}: {
  task: SmartTask;
  onToggleStatus: (t: SmartTask) => void;
  onPin: (t: SmartTask) => void;
  onArchive: (t: SmartTask) => void;
  onDuplicate: (t: SmartTask) => void;
  onDelete: (t: SmartTask) => void;
  onEdit: (t: SmartTask) => void;
  onNavigate?: (target: string, id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const due = formatDueDate(task.due_date);
  const isDone = task.status === 'completed';
  const accent = PRIORITY_ACCENT[task.priority];

  const handleCardClick = useCallback(() => {
    if (task.external_url) {
      window.open(task.external_url, '_blank', 'noopener,noreferrer');
    } else if (task.link_type === 'internal' && task.internal_link_target && task.internal_link_id && onNavigate) {
      onNavigate(task.internal_link_target, task.internal_link_id);
    } else {
      setExpanded(e => !e);
    }
  }, [task, onNavigate]);

  return (
    <div
      className="taskhub-task-card"
      style={{
        background: isDone ? VS.bgAlt : VS.bgRaised,
        border: `1px solid ${task.is_pinned ? VS.keyword : VS.border}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 8,
        marginBottom: 10, opacity: isDone ? 0.65 : 1,
        transition: 'border-color 120ms, background 120ms',
      }}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', cursor:'pointer' }}
        onClick={handleCardClick}>
        {/* Status toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggleStatus(task); }}
          style={{ width:20, height:20, flexShrink:0, border:`2px solid ${isDone ? VS.number : VS.borderStrong}`,
            borderRadius: 5,
            background: isDone ? VS.number : 'transparent', display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer', marginTop:2 }}
          aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
          title={isDone ? 'Mark incomplete' : 'Mark complete'}>
          {isDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={VS.bg} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </button>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6, marginBottom:3 }}>
            <span style={{ fontSize:'0.72rem', color: VS.textDim, fontFamily: FONT_MONO }}>
              {getTaskTypeLabel(task.task_type).split(' ')[0]}
            </span>
            {task.is_pinned && <span title="Pinned" style={{ fontSize:'0.7rem' }}>📌</span>}
            {task.link_type === 'external' && task.url_resource_type && (
              <span title={task.url_resource_type} style={{ fontSize:'0.75rem' }}>
                {getResourceIcon(task.url_resource_type)}
              </span>
            )}
            {task.link_type === 'internal' && (
              <span title="Internal LMS link" style={{ fontSize:'0.75rem' }}>🔗</span>
            )}
            {task.recurrence_rule && task.recurrence_rule !== 'none' && (
              <span title={`Recurring: ${task.recurrence_rule}`} style={{ fontSize:'0.7rem' }}>🔄</span>
            )}
          </div>
          <div style={{ fontWeight:600, fontSize:'0.92rem', fontFamily: FONT_UI, textDecoration: isDone ? 'line-through' : 'none',
            color: isDone ? VS.textDim : VS.text, lineHeight:1.3 }}>
            {task.title}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:5, alignItems:'center' }}>
            <span style={{ fontSize:'0.66rem', fontWeight:700, padding:'2px 7px', borderRadius: 4, border:`1px solid ${accent}`,
              background: 'transparent', color: accent, fontFamily: FONT_MONO }}>
              {task.priority.toUpperCase()}
            </span>
            {due && (
              <span style={{ fontSize:'0.7rem', fontFamily: FONT_MONO, fontWeight:700,
                color: due.overdue ? VS.danger : due.today ? VS.string : VS.textDim }}>
                {due.overdue ? '⚠️ ' : ''}{due.label}
              </span>
            )}
            {task.estimated_duration_minutes && (
              <span style={{ fontSize:'0.7rem', color: VS.textDim, fontFamily: FONT_MONO }}>
                ⏱ {task.estimated_duration_minutes}m
              </span>
            )}
            {task.course_id && (
              <span style={{ fontSize:'0.66rem', background: VS.bgHover, color: VS.keyword, padding:'1px 6px', borderRadius: 4, border:`1px solid ${VS.border}` }}>
                {task.course_id}
              </span>
            )}
          </div>
          {task.tags?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:5 }}>
              {task.tags.map(tag => (
                <span key={tag} style={{ fontSize:'0.64rem', background: VS.bgHover, color: VS.func, padding:'1px 6px', borderRadius: 4,
                  border:`1px solid ${VS.border}`, fontWeight:700 }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button onClick={e => { e.stopPropagation(); setMenuOpen(m => !m); }}
            style={{ background:'transparent', border:'none', cursor:'pointer', padding:'4px 6px',
              fontSize:'1rem', color: VS.textDim, lineHeight:1 }}
            aria-label="Task menu" title="More options">⋮</button>
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div style={{ borderTop:`1px solid ${VS.border}`, padding:'6px 12px', display:'flex', flexWrap:'wrap', gap:6 }}
          onClick={e => e.stopPropagation()}>
          {[
            { label:'✏️ Edit',       action: () => { onEdit(task); setMenuOpen(false); } },
            { label:'📋 Duplicate',  action: () => { onDuplicate(task); setMenuOpen(false); } },
            { label: task.is_pinned ? '📌 Unpin' : '📌 Pin', action: () => { onPin(task); setMenuOpen(false); } },
            { label: task.is_archived ? '♻️ Restore' : '📦 Archive', action: () => { onArchive(task); setMenuOpen(false); } },
            { label:'🗑️ Delete',    action: () => { onDelete(task); setMenuOpen(false); } },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              style={{ padding:'4px 10px', fontSize:'0.75rem', fontWeight:700, border:`1px solid ${VS.border}`, borderRadius: 5,
                background: VS.bgHover, color: VS.text, cursor:'pointer', fontFamily: FONT_UI }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${VS.border}`, padding:'12px 14px', background: VS.bgAlt }}
          onClick={e => e.stopPropagation()}>
          {task.description && <p style={{ margin:'0 0 8px', fontSize:'0.85rem', lineHeight:1.6, color: VS.text }}>{task.description}</p>}
          {task.personal_notes && (
            <div style={{ background: VS.bgHover, border:`1px solid ${VS.border}`, borderRadius: 6, padding:'8px 10px', marginTop:6, fontSize:'0.82rem', lineHeight:1.6 }}>
              <strong style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.04em', color: VS.string }}>Personal Notes</strong>
              <p style={{ margin:'4px 0 0', color: VS.text }}>{task.personal_notes}</p>
            </div>
          )}
          {task.link_type === 'internal' && task.internal_link_target && (
            <div style={{ marginTop:8, fontSize:'0.8rem', color: VS.text }}>
              🔗 <strong>Internal:</strong> {INTERNAL_TARGET_LABELS[task.internal_link_target] || task.internal_link_target}
              {task.internal_link_label && <span> — {task.internal_link_label}</span>}
              {task.internal_link_id && onNavigate !== undefined && (
                <button onClick={() => onNavigate?.(task.internal_link_target!, task.internal_link_id!)}
                  style={{ marginLeft:8, padding:'2px 8px', fontSize:'0.72rem', border:`1px solid ${VS.keyword}`, borderRadius: 5,
                    background: VS.keyword, color: VS.onAccent, cursor:'pointer', fontWeight:700 }}>
                  Open →
                </button>
              )}
            </div>
          )}
          <LinkPreviewCard task={task} />
          <div style={{ display:'flex', gap:12, marginTop:8, fontSize:'0.72rem', color: VS.textDim, fontFamily: FONT_MONO }}>
            {task.due_time && <span>🕐 {task.due_time}</span>}
            {task.recurrence_rule && task.recurrence_rule !== 'none' && <span>🔄 {task.recurrence_rule}</span>}
            <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Task Form (Create / Edit) ────────────────────────────────────────────

const EMPTY_FORM: CreateTaskInput = {
  title: '', description: '', task_type: 'study', status: 'not_started', priority: 'medium',
  due_date: '', due_time: '', estimated_duration_minutes: undefined, recurrence_rule: 'none',
  link_type: null, internal_link_target: null, internal_link_id: '', internal_link_label: '',
  external_url: '', course_id: '', category: '', personal_notes: '', tags: [],
  is_pinned: false, is_archived: false, sort_order: 0,
};

function TaskForm({
  initial, courses, onSave, onCancel, allTags,
}: {
  initial?: SmartTask;
  courses: { id: string; title: string; mascot?: string }[];
  onSave: (data: CreateTaskInput) => Promise<void>;
  onCancel: () => void;
  allTags: string[];
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<CreateTaskInput>(() =>
    initial ? {
      title: initial.title, description: initial.description || '',
      task_type: initial.task_type, status: initial.status, priority: initial.priority,
      due_date: initial.due_date || '', due_time: initial.due_time || '',
      estimated_duration_minutes: initial.estimated_duration_minutes || undefined,
      recurrence_rule: initial.recurrence_rule || 'none',
      link_type: initial.link_type, internal_link_target: initial.internal_link_target,
      internal_link_id: initial.internal_link_id || '', internal_link_label: initial.internal_link_label || '',
      external_url: initial.external_url || '', course_id: initial.course_id || '',
      category: initial.category || '', personal_notes: initial.personal_notes || '',
      tags: initial.tags || [], is_pinned: initial.is_pinned, is_archived: initial.is_archived,
      sort_order: initial.sort_order,
    } : { ...EMPTY_FORM }
  );
  const [activeSection, setActiveSection] = useState<'basic'|'schedule'|'link'|'details'>('basic');
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ title: string|null; favicon: string|null; thumbnail: string|null; domain: string|null } | null>(
    initial?.preview_title ? { title: initial.preview_title, favicon: initial.preview_favicon||null, thumbnail: initial.preview_thumbnail||null, domain: initial.preview_domain||null } : null
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const set = useCallback(<K extends keyof CreateTaskInput>(k: K, v: CreateTaskInput[K]) => {
    setForm(f => ({ ...f, [k]: v }));
  }, []);

  const handleUrlBlur = useCallback(async () => {
    const url = form.external_url?.trim();
    if (!url) { setPreview(null); return; }
    setPreviewLoading(true);
    try {
      const p = await fetchLinkPreview(url);
      setPreview(p);
    } finally {
      setPreviewLoading(false);
    }
  }, [form.external_url]);

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/,'').toLowerCase();
      if (tag && !form.tags.includes(tag) && form.tags.length < 20 && tag.length <= 50) {
        set('tags', [...form.tags, tag]);
      }
      setTagInput('');
      setTagSuggestions([]);
    }
  };

  const handleTagInput = (v: string) => {
    setTagInput(v);
    if (v) setTagSuggestions(allTags.filter(t => t.includes(v.toLowerCase()) && !form.tags.includes(t)).slice(0,6));
    else setTagSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (payload.link_type !== 'external') { payload.external_url = ''; }
      if (payload.link_type !== 'internal') { payload.internal_link_target = null; payload.internal_link_id = ''; }
      if (preview && payload.external_url) {
        (payload as any).preview_title     = preview.title;
        (payload as any).preview_favicon   = preview.favicon;
        (payload as any).preview_thumbnail = preview.thumbnail;
        (payload as any).preview_domain    = preview.domain;
        (payload as any).preview_fetched_at = new Date().toISOString();
      }
      await onSave(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'9px 11px', border:`1px solid ${VS.border}`, borderRadius: 6,
    fontFamily: FONT_UI, fontSize:'0.88rem', background: VS.bgAlt, color: VS.text,
    outline:'none', boxSizing:'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display:'block', fontWeight:700, fontSize:'0.72rem', marginBottom:5, color: VS.textDim,
    textTransform:'uppercase', letterSpacing:'0.05em',
  };
  const sectionBtnStyle = (active: boolean): React.CSSProperties => ({
    padding:'7px 14px', border:`1px solid ${active ? VS.keyword : VS.border}`, borderRadius: 6, fontWeight:700, fontSize:'0.76rem',
    cursor:'pointer', fontFamily: FONT_UI, textTransform:'uppercase',
    background: active ? VS.keyword : VS.bgAlt, color: active ? VS.bg : VS.textDim,
  });

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:600, padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <form onSubmit={handleSubmit} style={{ background: VS.bgRaised, border:`1px solid ${VS.border}`, borderRadius: 10,
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)', width:'min(620px,96vw)', maxHeight:'90vh',
        display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ background: VS.bgAlt, borderBottom:`1px solid ${VS.border}`, padding:'14px 18px',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, borderRadius:'10px 10px 0 0' }}>
          <span style={{ fontWeight:800, fontSize:'0.95rem', color: VS.func, textTransform:'uppercase', letterSpacing:'0.04em' }}>
            {isEdit ? '✏️ Edit Task' : '+ New Task'}
          </span>
          <button type="button" onClick={onCancel}
            style={{ background:'none', border:'none', cursor:'pointer', fontWeight:900, fontSize:'1.1rem', color: VS.textDim }}
            aria-label="Close">✕</button>
        </div>

        {/* Section tabs */}
        <div style={{ display:'flex', gap:6, padding:'12px 16px 0', borderBottom:`1px solid ${VS.border}`, flexShrink:0 }}>
          {(['basic','schedule','link','details'] as const).map(s => (
            <button key={s} type="button" style={sectionBtnStyle(activeSection===s)}
              onClick={() => setActiveSection(s)}>
              {{ basic:'📋 Basic', schedule:'📅 Schedule', link:'🔗 Link', details:'📝 Details' }[s]}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', padding:'18px', flex:1 }}>

          {/* ── BASIC section ── */}
          {activeSection === 'basic' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input ref={titleRef} style={inputStyle} value={form.title} maxLength={255}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Watch SQL Lesson 5, Read Python docs..."
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
                  required />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Task Type</label>
                  <select style={inputStyle} value={form.task_type} onChange={e => set('task_type', e.target.value as TaskType)}>
                    {TASK_TYPES.map(t => <option key={t} value={t}>{getTaskTypeLabel(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select style={inputStyle} value={form.priority} onChange={e => set('priority', e.target.value as TaskPriority)}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value as TaskStatus)}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Course (optional)</label>
                  <select style={inputStyle} value={form.course_id || ''} onChange={e => set('course_id', e.target.value || '')}>
                    <option value="">— None —</option>
                    {courses.filter(c => !['data-analyst','data-analyst-en'].includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.mascot || '📘'} {c.title}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:700, fontSize:'0.82rem', color: VS.text }}>
                  <input type="checkbox" checked={form.is_pinned} onChange={e => set('is_pinned', e.target.checked)} style={{ width:16, height:16 }} />
                  📌 Pin this task
                </label>
              </div>
            </div>
          )}

          {/* ── SCHEDULE section ── */}
          {activeSection === 'schedule' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input style={inputStyle} type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Due Time</label>
                  <input style={inputStyle} type="time" value={form.due_time || ''} onChange={e => set('due_time', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Estimated Duration (minutes)</label>
                <input style={inputStyle} type="number" min={1} max={600} value={form.estimated_duration_minutes || ''}
                  onChange={e => set('estimated_duration_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g. 30" />
              </div>
              <div>
                <label style={labelStyle}>Recurrence</label>
                <select style={inputStyle} value={form.recurrence_rule || 'none'}
                  onChange={e => set('recurrence_rule', e.target.value as any)}>
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (Mon–Fri)</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  {(['7','14','30'].map(n => (
                    <option key={n} value={`custom_${n}`}>Every {n} days</option>
                  )))}
                </select>
              </div>
              <div style={{ background: VS.bgAlt, border:`1px solid ${VS.border}`, borderRadius: 6, padding:'10px 12px',
                fontSize:'0.78rem', lineHeight:1.45, fontWeight:600, color: VS.textDim }}>
                Reminder alerts use the due date and time above. Open Reminder Center to choose website alerts, email reminders, lead times, and daily digest.
              </div>
            </div>
          )}

          {/* ── LINK section ── */}
          {activeSection === 'link' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={labelStyle}>Link Type</label>
                <div style={{ display:'flex', gap:8 }}>
                  {([null,'internal','external'] as (LinkType|null)[]).map(lt => (
                    <button key={String(lt)} type="button"
                      style={{ ...sectionBtnStyle(form.link_type === lt), flex:1 }}
                      onClick={() => set('link_type', lt)}>
                      {lt === null ? '— None' : lt === 'internal' ? '🏫 Internal' : '🌐 External'}
                    </button>
                  ))}
                </div>
              </div>

              {form.link_type === 'internal' && (
                <>
                  <div>
                    <label style={labelStyle}>Destination Type</label>
                    <select style={inputStyle} value={form.internal_link_target || ''} onChange={e => set('internal_link_target', e.target.value as InternalTarget || null)}>
                      <option value="">— Select —</option>
                      {INTERNAL_TARGETS.map(t => <option key={t!} value={t!}>{INTERNAL_TARGET_LABELS[t!]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Destination ID (Course ID or Part number)</label>
                    <input style={inputStyle} value={form.internal_link_id || ''} onChange={e => set('internal_link_id', e.target.value)} placeholder="e.g. python or 5" />
                  </div>
                  <div>
                    <label style={labelStyle}>Label (optional display name)</label>
                    <input style={inputStyle} value={form.internal_link_label || ''} onChange={e => set('internal_link_label', e.target.value)} placeholder="e.g. Python Loops Lesson" />
                  </div>
                </>
              )}

              {form.link_type === 'external' && (
                <>
                  <div>
                    <label style={labelStyle}>URL</label>
                    <input style={inputStyle} type="url" value={form.external_url || ''} placeholder="https://..."
                      onChange={e => set('external_url', e.target.value)}
                      onBlur={handleUrlBlur} />
                    {form.external_url && (
                      <div style={{ marginTop:4, fontSize:'0.72rem', color: VS.textDim, fontFamily: FONT_MONO }}>
                        Detected: {getResourceIcon(detectUrlResourceType(form.external_url))} {detectUrlResourceType(form.external_url)}
                      </div>
                    )}
                  </div>
                  {previewLoading && <div style={{ fontSize:'0.8rem', color: VS.textDim, fontFamily: FONT_MONO }}>Fetching preview…</div>}
                  {preview && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                      background: VS.bgAlt, border:`1px solid ${VS.border}`, borderRadius: 6 }}>
                      {preview.favicon && <img src={preview.favicon} alt="" width={20} height={20} />}
                      {preview.thumbnail && <img src={preview.thumbnail} alt="" style={{ width:56, height:40, objectFit:'cover', border:`1px solid ${VS.border}`, borderRadius: 4 }} />}
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'0.82rem', color: VS.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{preview.title}</div>
                        {preview.domain && <div style={{ fontSize:'0.7rem', color: VS.textDim, fontFamily: FONT_MONO, marginTop:2 }}>{preview.domain}</div>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── DETAILS section ── */}
          {activeSection === 'details' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, resize:'vertical', minHeight:80 }} maxLength={2000}
                  value={form.description || ''} onChange={e => set('description', e.target.value)}
                  placeholder="What does this task involve?" />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input style={inputStyle} maxLength={100} value={form.category || ''} onChange={e => set('category', e.target.value)} placeholder="e.g. Algorithms, Cloud Basics" />
              </div>
              <div>
                <label style={labelStyle}>Personal Notes</label>
                <textarea style={{ ...inputStyle, resize:'vertical', minHeight:80 }} maxLength={5000}
                  value={form.personal_notes || ''} onChange={e => set('personal_notes', e.target.value)}
                  placeholder="Private notes to yourself..." />
              </div>
              <div>
                <label style={labelStyle}>Tags (Enter or comma to add)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                  {form.tags.map(tag => (
                    <span key={tag} style={{ fontSize:'0.72rem', background: VS.bgHover, color: VS.func, padding:'2px 8px', borderRadius: 4,
                      border:`1px solid ${VS.border}`, display:'flex', alignItems:'center', gap:4 }}>
                      #{tag}
                      <button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontSize:'0.7rem', lineHeight:1, color: VS.textDim }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ position:'relative' }}>
                  <input style={inputStyle} value={tagInput} onChange={e => handleTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown} placeholder="type tag + Enter" maxLength={50} />
                  {tagSuggestions.length > 0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, background: VS.bgRaised, border:`1px solid ${VS.border}`, borderRadius: 6, zIndex:10, overflow:'hidden' }}>
                      {tagSuggestions.map(s => (
                        <div key={s} onClick={() => { set('tags', [...form.tags, s]); setTagInput(''); setTagSuggestions([]); }}
                          style={{ padding:'7px 10px', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, color: VS.text }}
                          onMouseEnter={e => (e.currentTarget.style.background = VS.bgHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          #{s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && <p style={{ color: VS.danger, fontSize:'0.82rem', fontWeight:700, marginTop:8 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ borderTop:`1px solid ${VS.border}`, padding:'14px 18px', display:'flex',
          justifyContent:'flex-end', gap:10, flexShrink:0, background: VS.bgAlt, borderRadius:'0 0 10px 10px' }}>
          <button type="button" onClick={onCancel}
            style={{ padding:'9px 18px', border:`1px solid ${VS.border}`, borderRadius: 6, background: VS.bgRaised, color: VS.text,
              fontFamily: FONT_UI, fontWeight:700, fontSize:'0.82rem', cursor:'pointer', textTransform:'uppercase' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.title.trim()}
            style={{ padding:'9px 22px', border:'none', borderRadius: 6,
              background: (!saving && form.title.trim()) ? VS.keyword : VS.border,
              color: (!saving && form.title.trim()) ? VS.bg : VS.textDim, fontFamily: FONT_UI, fontWeight:800,
              fontSize:'0.82rem', cursor: (!saving && form.title.trim()) ? 'pointer' : 'not-allowed',
              textTransform:'uppercase' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Analytics Panel ───────────────────────────────────────────────────────

function AnalyticsPanel({ analytics }: { analytics: TaskAnalytics | null }) {
  if (!analytics) {
    return (
      <div style={{ textAlign:'center', padding:'40px 0', color: VS.textDim, fontFamily: FONT_MONO, fontSize:'0.82rem' }}>
        Loading analytics…
      </div>
    );
  }
  const stats = [
    { label:'Completed',  value: analytics.completed_tasks, sub:`${analytics.completion_pct}% done`, icon:'✅', color: VS.number },
    { label:'Daily Streak', value: analytics.daily_streak, sub:`${analytics.weekly_streak} week streak`, icon:'🔥', color: VS.string },
    { label:'Study Hours', value: `${analytics.study_hours}h`, sub:'Estimated', icon:'⏱️', color: VS.func },
    { label:'Completion', value: `${analytics.completion_pct}%`, sub:`${analytics.total_tasks} total tasks`, icon:'📊', color: VS.keyword },
  ];
  return (
    <div className="taskhub-analytics-widget" style={{ background: VS.bgRaised, border:`1px solid ${VS.border}`, borderRadius: 10, marginBottom:20, overflow:'hidden' }}>
      <div style={{ background: VS.bgAlt, borderBottom:`1px solid ${VS.border}`, padding:'11px 16px' }}>
        <h2 style={{ margin:0, fontSize:'0.85rem', fontWeight:800, color: VS.func, textTransform:'uppercase', letterSpacing:'0.05em' }}>
          📊 Learning Analytics
        </h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:0 }}>
        {stats.map((s, i) => (
          <div key={s.label} className="taskhub-analytics-stat" style={{ padding:'14px 16px', borderRight: i < stats.length-1 ? `1px solid ${VS.border}` : 'none' }}>
            <div style={{ fontSize:'1.3rem', marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize:'1.15rem', fontWeight:800, color: s.color }}>{s.value}</div>
            <div style={{ fontWeight:700, fontSize:'0.7rem', color: VS.text, textTransform:'uppercase', letterSpacing:'0.04em', marginTop:3 }}>{s.label}</div>
            <div style={{ fontSize:'0.66rem', color: VS.textDim, fontFamily: FONT_MONO, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      {(analytics.most_studied_course || analytics.most_used_resource_type) && (
        <div style={{ borderTop:`1px solid ${VS.border}`, padding:'10px 16px', display:'flex', gap:16, flexWrap:'wrap', fontSize:'0.78rem', color: VS.textDim }}>
          {analytics.most_studied_course && <span>🏆 Top course: <strong style={{ color: VS.text }}>{analytics.most_studied_course}</strong></span>}
          {analytics.most_used_resource_type && <span>{getResourceIcon(analytics.most_used_resource_type)} Top resource: <strong style={{ color: VS.text }}>{analytics.most_used_resource_type}</strong></span>}
        </div>
      )}
    </div>
  );
}

// ── Reminder Settings Panel ──────────────────────────────────────────────

function ReminderSettingsPanel({
  prefs, saving, testingEmail, emailHint, history, onChange, onSave, onRefreshHistory, onTestBrowser, onTestEmail,
}: {
  prefs: NotificationPreferences;
  saving: boolean;
  testingEmail: boolean;
  emailHint?: string | null;
  status: ReminderStatus | null;
  history: ReminderHistoryItem[];
  onChange: (prefs: NotificationPreferences) => void;
  onSave: () => void;
  onRefreshHistory: () => void;
  onTestBrowser: () => void;
  onTestEmail: () => void;
}) {
  // Auto-save 700ms after any change
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = useCallback((next: NotificationPreferences) => {
    onChange(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onSave(), 700);
  }, [onChange, onSave]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const labelSt: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: VS.textDim, marginBottom: 6, display: 'block',
  };
  const inputSt: React.CSSProperties = {
    width: '100%', border: `1px solid ${VS.border}`, borderRadius: 6, padding: '9px 11px',
    fontFamily: FONT_UI, fontSize: '0.88rem',
    background: VS.bgAlt, color: VS.text, outline: 'none', boxSizing: 'border-box',
  };

  const OffsetChip = ({ minutes, label }: { minutes: number; label: string }) => {
    const active = prefs.reminder_offsets_minutes.includes(minutes);
    const toggle = () => {
      const exists = prefs.reminder_offsets_minutes.includes(minutes);
      const next = exists
        ? prefs.reminder_offsets_minutes.filter(n => n !== minutes)
        : [...prefs.reminder_offsets_minutes, minutes];
      handleChange({ ...prefs, reminder_offsets_minutes: next.sort((a, b) => b - a) });
    };
    return (
      <button type="button" onClick={toggle} style={{
        border: `1px solid ${active ? VS.keyword : VS.border}`, borderRadius: 6, padding: '7px 13px', fontWeight:700,
        fontSize: '0.75rem', cursor: 'pointer', fontFamily: FONT_UI,
        background: active ? VS.keyword : VS.bgAlt, color: active ? VS.bg : VS.textDim,
        transition: 'background 100ms',
      }}>{label}</button>
    );
  };

  const browserReady = prefs.browser_enabled;
  const sectionHeader = (bg: string, color: string, label: string, right?: React.ReactNode) => (
    <div style={{ background: bg, borderBottom: `1px solid ${VS.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontWeight: 800, fontSize: '0.8rem', color, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
      {right}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* In-app alerts */}
      <div style={{ border: `1px solid ${VS.border}`, borderRadius: 10, background: VS.bgRaised, overflow:'hidden' }}>
        {sectionHeader(VS.bgAlt, VS.func, '🔔 In-App Alerts',
          <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: browserReady ? VS.comment : VS.border, color: browserReady ? VS.bg : VS.textDim }}>
            {browserReady ? 'ON' : 'OFF'}
          </span>)}
        <div style={{ padding: '14px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: VS.textDim, lineHeight: 1.5 }}>
            Get notified right inside the app when a task is due. No email needed.
          </p>
          <button type="button" onClick={onTestBrowser} style={{
            width: '100%', border: `1px solid ${browserReady ? VS.comment : VS.keyword}`, borderRadius: 6, padding: '9px',
            fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
            fontFamily: FONT_UI, textTransform: 'uppercase',
            background: browserReady ? VS.comment : VS.keyword,
            color: VS.onAccent,
          }}>
            {browserReady ? '✓ Alerts Active — Send Test' : 'Turn On In-App Alerts'}
          </button>
        </div>
      </div>

      {/* Email reminders */}
      <div style={{ border: `1px solid ${VS.border}`, borderRadius: 10, background: VS.bgRaised, overflow:'hidden' }}>
        {sectionHeader(VS.bgAlt, VS.string, '✉️ Email Reminders',
          <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: prefs.email_enabled && prefs.email_address ? VS.comment : VS.border, color: prefs.email_enabled && prefs.email_address ? VS.bg : VS.textDim }}>
            {prefs.email_enabled && prefs.email_address ? 'ON' : 'OFF'}
          </span>)}
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelSt}>Your Email Address</label>
            <input
              type="email"
              value={prefs.email_address || ''}
              placeholder={emailHint || 'you@example.com'}
              onChange={e => handleChange({ ...prefs, email_address: e.target.value, email_enabled: !!e.target.value })}
              style={inputSt}
            />
            <p style={{ margin: '5px 0 0', fontSize: '0.72rem', color: VS.textDim }}>
              Type your email — reminders will go here automatically when tasks are due.
            </p>
          </div>
          {prefs.email_address && (
            <button type="button" onClick={onTestEmail} disabled={testingEmail} style={{
              border: 'none', borderRadius: 6, padding: '9px', fontWeight: 800,
              fontSize: '0.78rem', cursor: testingEmail ? 'wait' : 'pointer',
              fontFamily: FONT_UI, textTransform: 'uppercase',
              background: VS.keyword, color: VS.onAccent, width: '100%',
            }}>
              {testingEmail ? 'Sending…' : `Send Test → ${prefs.email_address}`}
            </button>
          )}
        </div>
      </div>

      {/* When to remind */}
      <div style={{ border: `1px solid ${VS.border}`, borderRadius: 10, background: VS.bgRaised, overflow:'hidden' }}>
        {sectionHeader(VS.bgAlt, VS.text, '⏰ Remind Me')}
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: VS.textDim }}>Before the task is due:</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <OffsetChip minutes={60} label="1 hr before" />
            <OffsetChip minutes={30} label="30 min" />
            <OffsetChip minutes={10} label="10 min" />
            <OffsetChip minutes={0}  label="At due time" />
          </div>
          <p style={{ margin: 0, fontSize: '0.7rem', color: VS.textDim, opacity: 0.7 }}>
            Pick one or more. Works for both in-app and email.
          </p>
        </div>
      </div>

      {/* Daily digest */}
      <div style={{ border: `1px solid ${VS.border}`, borderRadius: 10, background: VS.bgRaised, overflow:'hidden' }}>
        {sectionHeader(VS.bgAlt, VS.text, '📋 Morning Summary Email',
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={prefs.daily_digest_enabled}
              onChange={e => handleChange({ ...prefs, daily_digest_enabled: e.target.checked })}
              style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: VS.textDim }}>{prefs.daily_digest_enabled ? 'ON' : 'OFF'}</span>
          </label>)}
        {prefs.daily_digest_enabled && (
          <div style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <label style={labelSt}>Send daily at</label>
              <input type="time" value={prefs.daily_digest_time || '08:00'}
                onChange={e => handleChange({ ...prefs, daily_digest_time: e.target.value })}
                style={{ ...inputSt, width: '130px' }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: VS.textDim, lineHeight: 1.5 }}>
              A summary of today's tasks will be emailed to you every morning.
            </p>
          </div>
        )}
      </div>

      {saving && (
        <div style={{ textAlign: 'center', fontSize: '0.7rem', color: VS.textDim, fontWeight: 700 }}>Saving…</div>
      )}

      {history.length > 0 && (
        <div style={{ border: `1px solid ${VS.border}`, borderRadius: 10, background: VS.bgRaised, overflow:'hidden' }}>
          <div style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${VS.border}` }}>
            <span style={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', color: VS.textDim }}>Recently Sent</span>
            <button type="button" onClick={onRefreshHistory}
              style={{ border: `1px solid ${VS.border}`, borderRadius: 5, background: VS.bgAlt, color: VS.text, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>
              Refresh
            </button>
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {history.slice(0, 5).map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.75rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: item.status === 'sent' ? VS.comment : item.status === 'failed' ? VS.danger : VS.textDim }} />
                <span style={{ flex: 1, color: VS.text }}>
                  {item.channel === 'email' ? '✉️' : '🔔'}{' '}
                  {item.task_id ? `Task #${item.task_id}` : 'Daily digest'}
                </span>
                <span style={{ color: VS.textDim, whiteSpace: 'nowrap', fontFamily: FONT_MONO, fontSize: '0.68rem' }}>
                  {new Date(item.delivered_at || item.scheduled_for).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main TaskHub Component ───────────────────────────────────────────────

export function TaskHub({ onBack, onNavigateInternal, courses = [] }: TaskHubProps) {
  const { user } = useAuth();
  const { permission: notifPerm, request: requestNotif, notify } = useNotifications();

  // Tasks state
  const [tasks, setTasks] = useState<SmartTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterCourse, setFilterCourse] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<SmartTask | null>(null);
  const [rightTab, setRightTab] = useState<'analytics' | 'reminders'>('analytics');
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() => ({
    ...defaultNotificationPreferences,
    email_address: user?.email || '',
  }));
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus | null>(null);
  const [reminderHistory, setReminderHistory] = useState<ReminderHistoryItem[]>([]);
  const [savingNotificationPrefs, setSavingNotificationPrefs] = useState(false);
  const [testingReminderEmail, setTestingReminderEmail] = useState(false);
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [webAlerts, setWebAlerts] = useState<WebAlert[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadRequestRef = useRef(0);
  const overdueNoticeKeyRef = useRef('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const addWebAlert = useCallback((title: string, body: string) => {
    const alert: WebAlert = { id: Date.now(), title, body, createdAt: new Date().toISOString() };
    setWebAlerts(prev => [alert, ...prev].slice(0, 8));
    setTimeout(() => {
      setWebAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 10000);
  }, []);

  const browserNotify = useCallback((title: string, body: string) => {
    if (!notificationPrefs.browser_enabled) return false;
    addWebAlert(title, body);
    return notify(title, body);
  }, [addWebAlert, notificationPrefs.browser_enabled, notify]);

  useTaskReminders(tasks, browserNotify, showToast);

  // Load tasks
  const load = useCallback(async (pg = 1, append = false) => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    try {
      const result = await fetchTasks({
        page: pg, pageSize: 50, timeFilter, search: searchQuery || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        course_id: filterCourse || undefined, includeArchived: showArchived,
      });
      if (requestId !== loadRequestRef.current) return;
      setTasks(prev => append ? [...prev, ...result.tasks] : result.tasks);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(pg);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      setTasks(prev => append ? prev : []);
      setHasMore(false);
      setTotal(0);
      showToast(error instanceof Error ? error.message : 'Could not load tasks');
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [timeFilter, searchQuery, filterStatus, filterPriority, filterCourse, showArchived, showToast]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    fetchNotificationPreferences().then(prefs => {
      setNotificationPrefs({
        ...prefs,
        email_address: prefs.email_address || user?.email || '',
      });
    });
    fetchReminderStatus().then(setReminderStatus);
    fetchReminderHistory().then(setReminderHistory);
  }, [user?.email]);

  useEffect(() => {
    fetchReminderStatus().then(setReminderStatus);
    fetchReminderHistory().then(setReminderHistory);
  }, [rightTab]);

  useEffect(() => {
    fetchAnalytics().then(setAnalytics);
  }, []);

  useEffect(() => { fetchUserTags().then(setAllTags); }, []);

  // Check overdue on open and notify through the shared reminder helper.
  useEffect(() => {
    if (notifPerm !== 'granted' || tasks.length === 0) return;
    const today = todayStr();
    const overdue = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'skipped');
    const noticeKey = `${today}:${overdue.map(task => task.id).sort((a, b) => a - b).join(',')}`;
    if (overdue.length > 0 && overdueNoticeKeyRef.current !== noticeKey) {
      overdueNoticeKeyRef.current = noticeKey;
      browserNotify('Overdue Tasks', `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifPerm, tasks]);

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) load(page + 1, true);
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, load]);

  // ── CRUD handlers ──

  const handleCreate = useCallback(async (data: CreateTaskInput) => {
    try {
      const task = await createTask(data);
      setTasks(prev => [task, ...prev]);
      setTotal(t => t + 1);
      setShowForm(false);
      showToast('✅ Task created!');
      fetchAnalytics().then(setAnalytics);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not create task'); }
  }, [showToast]);

  const handleUpdate = useCallback(async (data: UpdateTaskInput) => {
    if (!editTask) return;
    try {
      const updated = await updateTask(editTask.id, data);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditTask(null);
      showToast('✅ Task updated!');
      fetchAnalytics().then(setAnalytics);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not update task'); }
  }, [editTask, showToast]);

  const handleToggleStatus = useCallback(async (task: SmartTask) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'not_started' : 'completed';
    try {
      const updated = await updateTask(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (newStatus === 'completed') showToast('🎉 Task completed!');
      fetchAnalytics().then(setAnalytics);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not update task'); }
  }, [showToast]);

  const handlePin = useCallback(async (task: SmartTask) => {
    try {
      const updated = await updateTask(task.id, { is_pinned: !task.is_pinned });
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      showToast(updated.is_pinned ? '📌 Pinned!' : '📌 Unpinned');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not pin task'); }
  }, [showToast]);

  const handleArchive = useCallback(async (task: SmartTask) => {
    try {
      const updated = await updateTask(task.id, { is_archived: !task.is_archived });
      if (!showArchived) {
        setTasks(prev => prev.filter(t => t.id !== updated.id));
        setTotal(n => Math.max(0, n - 1));
      } else {
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      }
      showToast(updated.is_archived ? '📦 Archived' : '♻️ Restored');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not archive task'); }
  }, [showArchived, showToast]);

  const handleDuplicate = useCallback(async (task: SmartTask) => {
    try {
      const copy = await duplicateTask(task.id);
      setTasks(prev => [copy, ...prev]);
      setTotal(n => n + 1);
      showToast('📋 Duplicated!');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not duplicate task'); }
  }, [showToast]);

  const handleDelete = useCallback(async (task: SmartTask) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      setTotal(n => Math.max(0, n - 1));
      showToast('🗑️ Deleted');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not delete task'); }
  }, [showToast]);

  const handleNavigate = useCallback((target: string, id: string) => {
    onNavigateInternal?.(target, id);
  }, [onNavigateInternal]);

  // Suggested next tasks (Today view)
  const suggestedTasks = useMemo(() => {
    if (timeFilter !== 'today') return [];
    return tasks
      .filter(t => t.status === 'not_started' && !t.is_archived)
      .sort((a, b) => {
        const pOrder: Record<string, number> = { critical:0, high:1, medium:2, low:3 };
        return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
      })
      .slice(0, 3);
  }, [tasks, timeFilter]);

  const completedToday = useMemo(() =>
    tasks.filter(t => t.status === 'completed' && t.updated_at?.slice(0,10) === todayStr()).length,
  [tasks]);

  const overdueCount = useMemo(() =>
    tasks.filter(t => t.due_date && t.due_date < todayStr() && t.status !== 'completed' && t.status !== 'skipped').length,
  [tasks]);

  const handleEnableReminders = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      showToast('Browser notifications are not supported here');
      return;
    }
    await requestNotif();
    if (Notification.permission === 'granted') {
      const saved = await saveNotificationPreferences({ ...notificationPrefs, browser_enabled: true });
      setNotificationPrefs(saved);
      fetchReminderStatus().then(setReminderStatus);
      showToast('Reminders enabled');
    } else {
      showToast('Notifications not allowed');
    }
  }, [notificationPrefs, requestNotif, showToast]);

  const handleSaveReminderSettings = useCallback(async () => {
    setSavingNotificationPrefs(true);
    try {
      const saved = await saveNotificationPreferences(notificationPrefs);
      setNotificationPrefs(saved);
      fetchReminderStatus().then(setReminderStatus);
      fetchReminderHistory().then(setReminderHistory);
      showToast('Reminder settings saved');
    } catch {
      showToast('Could not save reminder settings');
    } finally {
      setSavingNotificationPrefs(false);
    }
  }, [notificationPrefs, showToast]);

  const handleRefreshReminderHistory = useCallback(() => {
    fetchReminderStatus().then(setReminderStatus);
    fetchReminderHistory().then(setReminderHistory);
    showToast('Reminder status refreshed');
  }, [showToast]);

  const handleTestBrowserReminder = useCallback(async () => {
    addWebAlert('Test reminder', 'Website alerts are working inside Task Hub.');
    let systemSent = false;
    if (typeof Notification !== 'undefined') {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Test reminder', {
          body: 'Website alerts are working for 1% Dev Academy.',
          icon: '/favicon.ico',
          tag: 'opd-test-reminder',
        });
        systemSent = true;
      }
    }
    const saved = await saveNotificationPreferences({ ...notificationPrefs, browser_enabled: true });
    setNotificationPrefs(saved);
    fetchReminderStatus().then(setReminderStatus);
    showToast(systemSent ? 'Website and browser alert sent' : 'Website alert shown in Task Hub');
  }, [addWebAlert, notificationPrefs, showToast]);

  const handleTestEmailReminder = useCallback(async () => {
    if (!notificationPrefs.email_address) {
      showToast('Add an email address first');
      return;
    }
    setTestingReminderEmail(true);
    try {
      const saved = await saveNotificationPreferences({ ...notificationPrefs, email_enabled: true });
      setNotificationPrefs(saved);
      const result = await sendTestReminderEmail(saved.email_address);
      fetchReminderStatus().then(setReminderStatus);
      fetchReminderHistory().then(setReminderHistory);
      showToast(result.sent ? `Test email sent to ${result.to}` : 'Email test skipped');
    } catch (err: any) {
      showToast(err.message || 'Could not send test email');
    } finally {
      setTestingReminderEmail(false);
    }
  }, [notificationPrefs, showToast]);

  return (
    <div className="taskhub-page" style={{ height:'100vh', display:'flex', flexDirection:'column', background: VS.bg, fontFamily: FONT_UI, overflow:'hidden', color: VS.text }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', background: VS.bgRaised, color: VS.func,
          padding:'9px 20px', border:`1px solid ${VS.keyword}`, borderRadius: 8, fontWeight:700, fontSize:'0.85rem', zIndex:1000,
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)', whiteSpace:'nowrap' }}
          role="status" aria-live="polite">{toast}</div>
      )}

      {/* Web alerts (top-right) */}
      {webAlerts.length > 0 && (
        <div style={{ position:'fixed', top:72, right:16, width:'min(320px,calc(100vw - 32px))',
          display:'grid', gap:6, zIndex:1001 }} aria-live="assertive">
          {webAlerts.map(alert => (
            <div key={alert.id} style={{ background: VS.bgRaised, border:`1px solid ${VS.keyword}`, borderRadius: 8, boxShadow:'0 8px 24px rgba(0,0,0,0.5)', padding:'10px 12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:'0.8rem', color: VS.func, textTransform:'uppercase', marginBottom:3 }}>{alert.title}</div>
                  <div style={{ fontSize:'0.76rem', lineHeight:1.4, fontWeight:500, color: VS.text }}>{alert.body}</div>
                </div>
                <button type="button" onClick={() => setWebAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  style={{ border:`1px solid ${VS.border}`, borderRadius: 4, background: VS.bgHover, color: VS.textDim, cursor:'pointer', fontWeight:900, padding:'0 6px', lineHeight:'18px' }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top nav */}
      <nav className="taskhub-nav" style={{ flexShrink:0, background: VS.bgAlt, borderBottom:`1px solid ${VS.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 20px', height:52, zIndex:200 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onBack} style={{ background: VS.bgRaised, color: VS.text, border:`1px solid ${VS.border}`, borderRadius: 6,
            padding:'6px 12px', fontWeight:700, fontSize:'0.78rem', cursor:'pointer', fontFamily: FONT_UI,
            textTransform:'uppercase' }} aria-label="Back">← Back</button>
          <span style={{ fontWeight:800, fontSize:'0.98rem', color: VS.func, textTransform:'uppercase', letterSpacing:'0.04em' }}>🎯 Task Hub</span>
          {total > 0 && (
            <span style={{ fontSize:'0.7rem', fontFamily: FONT_MONO, background: VS.bgHover, color: VS.number, padding:'2px 8px', borderRadius: 4, fontWeight:700 }}>
              {total} tasks
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {overdueCount > 0 && (
            <span style={{ background:'rgba(244,71,71,0.15)', color: VS.danger, padding:'3px 9px', border:`1px solid ${VS.danger}`, borderRadius: 5, fontWeight:800, fontSize:'0.72rem' }}>
              ⚠️ {overdueCount} Overdue
            </span>
          )}
          {completedToday > 0 && (
            <span style={{ background:'rgba(106,153,85,0.15)', color: VS.comment, padding:'3px 9px', border:`1px solid ${VS.comment}`, borderRadius: 5, fontWeight:800, fontSize:'0.72rem' }}>
              ✅ {completedToday} Done
            </span>
          )}
          <button onClick={handleEnableReminders}
            style={{ background: notifPerm === 'granted' ? VS.comment : VS.bgRaised,
              color: notifPerm === 'granted' ? VS.bg : VS.text,
              border:`1px solid ${notifPerm === 'granted' ? VS.comment : VS.border}`, borderRadius: 6, padding:'6px 11px', fontWeight:700, fontSize:'0.75rem',
              cursor:'pointer', fontFamily: FONT_UI, textTransform:'uppercase' }}>
            {notifPerm === 'granted' ? '🔔 On' : 'Enable Reminders'}
          </button>
          <button onClick={() => setShowForm(true)}
            style={{ background: VS.keyword, color: VS.onAccent, border:'none', borderRadius: 6, padding:'7px 16px',
              fontWeight:800, fontSize:'0.85rem', cursor:'pointer', fontFamily: FONT_UI,
              textTransform:'uppercase' }}>
            + New Task
          </button>
        </div>
      </nav>

      {/* Split-screen body */}
      <div className="taskhub-workspace" style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

        {/* LEFT PANEL — Task list (60%) */}
        <div className="taskhub-list-panel" style={{ flex:'0 0 60%', display:'flex', flexDirection:'column', borderRight:`1px solid ${VS.border}`, overflow:'hidden' }}>

          {/* Filter bar */}
          <div className="taskhub-filter-bar" style={{ flexShrink:0, background: VS.bgAlt, borderBottom:`1px solid ${VS.border}`, padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>

            {/* Time filter tabs */}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {TIME_FILTERS.map(tf => (
                <button key={tf.key} onClick={() => setTimeFilter(tf.key)}
                  style={{ padding:'6px 12px', border:`1px solid ${timeFilter === tf.key ? VS.keyword : VS.border}`, borderRadius: 6, fontWeight:700, fontSize:'0.72rem',
                    cursor:'pointer', fontFamily: FONT_UI, textTransform:'uppercase',
                    background: timeFilter === tf.key ? VS.keyword : VS.bgRaised,
                    color: timeFilter === tf.key ? VS.bg : VS.textDim }}>
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Search + dropdowns */}
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <input ref={searchRef} type="search" placeholder="🔍 Search tasks…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex:'1 1 160px', padding:'7px 10px', border:`1px solid ${VS.border}`, borderRadius: 6, fontFamily: FONT_UI,
                  fontSize:'0.82rem', background: VS.bgRaised, color: VS.text, outline:'none', boxSizing:'border-box', minWidth:0 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                style={{ padding:'7px 8px', border:`1px solid ${VS.border}`, borderRadius: 6, fontFamily: FONT_UI, fontSize:'0.78rem', background: VS.bgRaised, color: VS.text, cursor:'pointer' }}>
                <option value="all">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)}
                style={{ padding:'7px 8px', border:`1px solid ${VS.border}`, borderRadius: 6, fontFamily: FONT_UI, fontSize:'0.78rem', background: VS.bgRaised, color: VS.text, cursor:'pointer' }}>
                <option value="all">All Priority</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
              {courses.length > 0 && (
                <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
                  style={{ padding:'7px 8px', border:`1px solid ${VS.border}`, borderRadius: 6, fontFamily: FONT_UI, fontSize:'0.78rem', background: VS.bgRaised, color: VS.text, cursor:'pointer' }}>
                  <option value="">All Courses</option>
                  {courses.filter(c => !['data-analyst','data-analyst-en'].includes(c.id)).map(c =>
                    <option key={c.id} value={c.id}>{c.mascot || '📘'} {c.title}</option>
                  )}
                </select>
              )}
              <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.75rem', fontWeight:700, color: VS.textDim, cursor:'pointer', whiteSpace:'nowrap' }}>
                <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} style={{ width:13, height:13 }} />
                Archived
              </label>
            </div>
          </div>

          {/* Scrollable task list */}
          <div className="taskhub-task-scroll" style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>

            {/* Suggested next (Today view only) */}
            {timeFilter === 'today' && suggestedTasks.length > 0 && !searchQuery && (
              <div className="taskhub-suggestion-widget" style={{ background:'rgba(206,145,120,0.1)', border:`1px solid ${VS.string}`, borderRadius: 8, padding:'10px 14px', marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:'0.75rem', textTransform:'uppercase', marginBottom:7, color: VS.string }}>
                  ⚡ Suggested Next
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {suggestedTasks.map(t => (
                    <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.82rem', cursor:'pointer' }}
                      onClick={() => setEditTask(t)}>
                      <span style={{ flexShrink:0, fontSize:'0.65rem', border:`1px solid ${PRIORITY_ACCENT[t.priority]}`, borderRadius: 4,
                        padding:'1px 5px', color: PRIORITY_ACCENT[t.priority], fontWeight:700 }}>
                        {t.priority.toUpperCase()}
                      </span>
                      <span style={{ fontWeight:600, color: VS.text }}>{t.title}</span>
                      {t.due_date && <span style={{ fontSize:'0.68rem', color: VS.textDim, fontFamily: FONT_MONO }}>{formatDueDate(t.due_date)?.label}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && page === 1 && (
              <div style={{ textAlign:'center', padding:'40px 0', color: VS.textDim, fontFamily: FONT_MONO, fontSize:'0.82rem' }}
                role="status">Loading tasks…</div>
            )}

            {/* Empty state */}
            {!loading && tasks.length === 0 && (
              <div className="taskhub-empty-widget" style={{ textAlign:'center', padding:'50px 20px', border:`2px dashed ${VS.border}`, borderRadius: 10 }}>
                <div style={{ fontSize:'2.8rem', marginBottom:10 }}>📋</div>
                <p style={{ fontWeight:700, fontSize:'0.95rem', margin:'0 0 5px', color: VS.text }}>
                  {searchQuery ? `No tasks matching "${searchQuery}"` : 'No tasks here yet'}
                </p>
                <p style={{ color: VS.textDim, fontSize:'0.82rem', margin:'0 0 16px' }}>
                  {timeFilter === 'today' ? 'Nothing due today — try another filter.' : 'Add your first task above.'}
                </p>
                <button onClick={() => setShowForm(true)}
                  style={{ padding:'9px 22px', background: VS.keyword, color: VS.onAccent, border:'none', borderRadius: 6,
                    fontWeight:800, fontSize:'0.85rem', cursor:'pointer', textTransform:'uppercase',
                    fontFamily: FONT_UI }}>
                  + Add Task
                </button>
              </div>
            )}

            {/* Task cards */}
            {tasks.map(task => (
              <TaskCard key={task.id} task={task}
                onToggleStatus={handleToggleStatus}
                onPin={handlePin} onArchive={handleArchive}
                onDuplicate={handleDuplicate} onDelete={handleDelete}
                onEdit={setEditTask} onNavigate={handleNavigate} />
            ))}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={loadMoreRef} style={{ height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {loading && <span style={{ color: VS.textDim, fontFamily: FONT_MONO, fontSize:'0.78rem' }}>Loading more…</span>}
              </div>
            )}
            <div style={{ height:24 }} />
          </div>
        </div>

        {/* RIGHT PANEL — Analytics + Reminder Center (40%) */}
        <div className="taskhub-side-panel" style={{ flex:'0 0 40%', display:'flex', flexDirection:'column', overflow:'hidden', background: VS.bg }}>

          {/* Right panel tab switcher */}
          <div style={{ flexShrink:0, display:'flex', borderBottom:`1px solid ${VS.border}`, background: VS.bgAlt }}>
            {([
              { key:'analytics', label:'📊 Analytics' },
              { key:'reminders', label:'🔔 Reminder Center' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setRightTab(tab.key)}
                style={{ flex:1, padding:'12px 8px', border:'none',
                  borderRight: tab.key === 'analytics' ? `1px solid ${VS.border}` : 'none',
                  fontWeight:800, fontSize:'0.8rem', cursor:'pointer',
                  fontFamily: FONT_UI, textTransform:'uppercase', letterSpacing:'0.04em',
                  background: rightTab === tab.key ? VS.bgHover : 'transparent',
                  color: rightTab === tab.key ? VS.func : VS.textDim,
                  transition:'background 100ms' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right panel content — scrollable */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
            {rightTab === 'analytics' && (
              <AnalyticsPanel analytics={analytics} />
            )}
            {rightTab === 'reminders' && (
              <ReminderSettingsPanel
                prefs={notificationPrefs}
                saving={savingNotificationPrefs}
                testingEmail={testingReminderEmail}
                emailHint={user?.email}
                status={reminderStatus}
                history={reminderHistory}
                onChange={setNotificationPrefs}
                onSave={handleSaveReminderSettings}
                onRefreshHistory={handleRefreshReminderHistory}
                onTestBrowser={handleTestBrowserReminder}
                onTestEmail={handleTestEmailReminder}
              />
            )}
          </div>
        </div>

      </div>

      {/* Create / Edit form modal */}
      {(showForm || editTask) && (
        <TaskForm
          initial={editTask || undefined}
          courses={courses}
          allTags={allTags}
          onSave={editTask ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}
