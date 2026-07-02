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
} from '@/lib/smartTaskApi';
import { useAuth } from './AuthProvider';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Notification helper ───────────────────────────────────────────────────────

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

// ── Link Preview Card ─────────────────────────────────────────────────────────

function LinkPreviewCard({ task }: { task: SmartTask }) {
  if (!task.external_url) return null;
  if (task.preview_title || task.preview_domain) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px',
        background:'#f4f1ea', border:'2px solid #000', marginTop:'8px', borderRadius:0 }}>
        {task.preview_favicon && (
          <img src={task.preview_favicon} alt="" width={20} height={20}
            style={{ flexShrink:0 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        )}
        {task.preview_thumbnail && (
          <img src={task.preview_thumbnail} alt="" style={{ width:56, height:40, objectFit:'cover', flexShrink:0, border:'1px solid #000' }}
            onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        )}
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'0.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {task.preview_title || task.external_url}
          </div>
          {task.preview_domain && (
            <div style={{ fontSize:'0.7rem', color:'#777', fontFamily:'var(--font-mono)', marginTop:2 }}>
              {getResourceIcon(task.url_resource_type || null)} {task.preview_domain}
            </div>
          )}
        </div>
        <a href={task.external_url} target="_blank" rel="noopener noreferrer"
          style={{ marginLeft:'auto', fontSize:'0.72rem', fontWeight:700, color:'#000', textDecoration:'none',
            padding:'4px 10px', border:'2px solid #000', background:'#f1be3e', whiteSpace:'nowrap', flexShrink:0 }}
          onClick={e => e.stopPropagation()}>
          Open ↗
        </a>
      </div>
    );
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 10px',
      background:'#f4f1ea', border:'1px solid #ccc', marginTop:'6px', fontSize:'0.78rem' }}>
      <span>{getResourceIcon(task.url_resource_type || null)}</span>
      <a href={task.external_url} target="_blank" rel="noopener noreferrer"
        style={{ color:'#000', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
        onClick={e => e.stopPropagation()}>
        {task.external_url}
      </a>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────

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
      style={{
        background: isDone ? '#f8f8f6' : getPriorityBg(task.priority),
        border: `2px solid ${task.is_pinned ? '#f1be3e' : '#000'}`,
        boxShadow: task.is_pinned ? '4px 4px 0 #f1be3e' : '3px 3px 0 #000',
        marginBottom: 10, opacity: isDone ? 0.75 : 1,
        transition: 'box-shadow 80ms',
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
          style={{ width:22, height:22, flexShrink:0, border:'2px solid #000',
            background: isDone ? '#000' : '#fff', display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer', marginTop:2 }}
          aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
          title={isDone ? 'Mark incomplete' : 'Mark complete'}>
          {isDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f1be3e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </button>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6, marginBottom:3 }}>
            <span style={{ fontSize:'0.75rem', color:'#555', fontFamily:'var(--font-mono)' }}>
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
          <div style={{ fontWeight:700, fontSize:'0.92rem', textDecoration: isDone ? 'line-through' : 'none',
            color: isDone ? '#888' : '#000', lineHeight:1.3 }}>
            {task.title}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:5, alignItems:'center' }}>
            <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 7px', border:'1px solid #000',
              background: getPriorityBg(task.priority), color: getPriorityColor(task.priority), fontFamily:'var(--font-mono)' }}>
              {task.priority.toUpperCase()}
            </span>
            {due && (
              <span style={{ fontSize:'0.7rem', fontFamily:'var(--font-mono)', fontWeight:700,
                color: due.overdue ? '#cc0000' : due.today ? '#e67e22' : '#555' }}>
                {due.overdue ? '⚠️ ' : ''}{due.label}
              </span>
            )}
            {task.estimated_duration_minutes && (
              <span style={{ fontSize:'0.7rem', color:'#777', fontFamily:'var(--font-mono)' }}>
                ⏱ {task.estimated_duration_minutes}m
              </span>
            )}
            {task.course_id && (
              <span style={{ fontSize:'0.68rem', background:'#e8e4f0', padding:'1px 6px', border:'1px solid #9b8ec4' }}>
                {task.course_id}
              </span>
            )}
          </div>
          {task.tags?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:5 }}>
              {task.tags.map(tag => (
                <span key={tag} style={{ fontSize:'0.65rem', background:'#f1be3e', padding:'1px 6px',
                  border:'1px solid #000', fontWeight:700 }}>
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
              fontSize:'1rem', color:'#555', lineHeight:1 }}
            aria-label="Task menu" title="More options">⋮</button>
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div style={{ borderTop:'1px solid #e0e0e0', padding:'6px 12px', display:'flex', flexWrap:'wrap', gap:6 }}
          onClick={e => e.stopPropagation()}>
          {[
            { label:'✏️ Edit',       action: () => { onEdit(task); setMenuOpen(false); } },
            { label:'📋 Duplicate',  action: () => { onDuplicate(task); setMenuOpen(false); } },
            { label: task.is_pinned ? '📌 Unpin' : '📌 Pin', action: () => { onPin(task); setMenuOpen(false); } },
            { label: task.is_archived ? '♻️ Restore' : '📦 Archive', action: () => { onArchive(task); setMenuOpen(false); } },
            { label:'🗑️ Delete',    action: () => { onDelete(task); setMenuOpen(false); } },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              style={{ padding:'4px 10px', fontSize:'0.75rem', fontWeight:700, border:'2px solid #000',
                background:'#f4f1ea', cursor:'pointer', fontFamily:'var(--font-ui)' }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop:'2px solid #e0e0e0', padding:'12px 14px', background:'#fafaf8' }}
          onClick={e => e.stopPropagation()}>
          {task.description && <p style={{ margin:'0 0 8px', fontSize:'0.85rem', lineHeight:1.6 }}>{task.description}</p>}
          {task.personal_notes && (
            <div style={{ background:'#fffff0', border:'1px solid #ccc', padding:'8px 10px', marginTop:6, fontSize:'0.82rem', lineHeight:1.6 }}>
              <strong style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Personal Notes</strong>
              <p style={{ margin:'4px 0 0' }}>{task.personal_notes}</p>
            </div>
          )}
          {task.link_type === 'internal' && task.internal_link_target && (
            <div style={{ marginTop:8, fontSize:'0.8rem' }}>
              🔗 <strong>Internal:</strong> {INTERNAL_TARGET_LABELS[task.internal_link_target] || task.internal_link_target}
              {task.internal_link_label && <span> — {task.internal_link_label}</span>}
              {task.internal_link_id && onNavigate !== undefined && (
                <button onClick={() => onNavigate?.(task.internal_link_target!, task.internal_link_id!)}
                  style={{ marginLeft:8, padding:'2px 8px', fontSize:'0.72rem', border:'2px solid #000',
                    background:'#f1be3e', cursor:'pointer', fontWeight:700 }}>
                  Open →
                </button>
              )}
            </div>
          )}
          <LinkPreviewCard task={task} />
          <div style={{ display:'flex', gap:12, marginTop:8, fontSize:'0.72rem', color:'#888', fontFamily:'var(--font-mono)' }}>
            {task.due_time && <span>🕐 {task.due_time}</span>}
            {task.recurrence_rule && task.recurrence_rule !== 'none' && <span>🔄 {task.recurrence_rule}</span>}
            <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Task Form (Create / Edit) ─────────────────────────────────────────────────

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
    const p = await fetchLinkPreview(url);
    setPreview(p);
    setPreviewLoading(false);
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
    width:'100%', padding:'8px 10px', border:'2px solid #000',
    fontFamily:'var(--font-ui)', fontSize:'0.88rem', background:'#f4f1ea',
    outline:'none', boxSizing:'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display:'block', fontWeight:700, fontSize:'0.75rem', marginBottom:4,
    textTransform:'uppercase', letterSpacing:'0.04em',
  };
  const sectionBtnStyle = (active: boolean): React.CSSProperties => ({
    padding:'6px 14px', border:'2px solid #000', fontWeight:700, fontSize:'0.78rem',
    cursor:'pointer', fontFamily:'var(--font-ui)', textTransform:'uppercase',
    background: active ? '#000' : '#f4f1ea', color: active ? '#f1be3e' : '#000',
    boxShadow: active ? 'none' : '2px 2px 0 #000',
  });

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:600, padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <form onSubmit={handleSubmit} style={{ background:'#fff', border:'3px solid #000',
        boxShadow:'10px 10px 0 #000', width:'min(620px,96vw)', maxHeight:'90vh',
        display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ background:'#f1be3e', borderBottom:'3px solid #000', padding:'12px 18px',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ fontWeight:900, fontSize:'1rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            {isEdit ? '✏️ Edit Task' : '+ New Task'}
          </span>
          <button type="button" onClick={onCancel}
            style={{ background:'none', border:'none', cursor:'pointer', fontWeight:900, fontSize:'1.1rem' }}
            aria-label="Close">✕</button>
        </div>

        {/* Section tabs */}
        <div style={{ display:'flex', gap:4, padding:'10px 16px 0', borderBottom:'2px solid #e0e0e0', flexShrink:0 }}>
          {(['basic','schedule','link','details'] as const).map(s => (
            <button key={s} type="button" style={sectionBtnStyle(activeSection===s)}
              onClick={() => setActiveSection(s)}>
              {{ basic:'📋 Basic', schedule:'📅 Schedule', link:'🔗 Link', details:'📝 Details' }[s]}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', padding:'16px', flex:1 }}>

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
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:700, fontSize:'0.82rem' }}>
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
              <div style={{ background:'#fff7d6', border:'2px solid #000', padding:'9px 11px',
                fontSize:'0.78rem', lineHeight:1.45, fontWeight:700, color:'#1f1f1f' }}>
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
                      <div style={{ marginTop:4, fontSize:'0.72rem', color:'#777', fontFamily:'var(--font-mono)' }}>
                        Detected: {getResourceIcon(detectUrlResourceType(form.external_url))} {detectUrlResourceType(form.external_url)}
                      </div>
                    )}
                  </div>
                  {previewLoading && <div style={{ fontSize:'0.8rem', color:'#777', fontFamily:'var(--font-mono)' }}>Fetching preview…</div>}
                  {preview && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                      background:'#f4f1ea', border:'2px solid #000' }}>
                      {preview.favicon && <img src={preview.favicon} alt="" width={20} height={20} />}
                      {preview.thumbnail && <img src={preview.thumbnail} alt="" style={{ width:56, height:40, objectFit:'cover', border:'1px solid #000' }} />}
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'0.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{preview.title}</div>
                        {preview.domain && <div style={{ fontSize:'0.7rem', color:'#777', fontFamily:'var(--font-mono)', marginTop:2 }}>{preview.domain}</div>}
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
                    <span key={tag} style={{ fontSize:'0.72rem', background:'#f1be3e', padding:'2px 8px', border:'1px solid #000', display:'flex', alignItems:'center', gap:4 }}>
                      #{tag}
                      <button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontSize:'0.7rem', lineHeight:1 }}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ position:'relative' }}>
                  <input style={inputStyle} value={tagInput} onChange={e => handleTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown} placeholder="type tag + Enter" maxLength={50} />
                  {tagSuggestions.length > 0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'2px solid #000', zIndex:10 }}>
                      {tagSuggestions.map(s => (
                        <div key={s} onClick={() => { set('tags', [...form.tags, s]); setTagInput(''); setTagSuggestions([]); }}
                          style={{ padding:'6px 10px', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}
                          onMouseEnter={e => (e.currentTarget.style.background='#f4f1ea')}
                          onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
                          #{s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && <p style={{ color:'#cc0000', fontSize:'0.82rem', fontWeight:700, marginTop:8 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ borderTop:'2px solid #000', padding:'12px 16px', display:'flex',
          justifyContent:'flex-end', gap:10, flexShrink:0, background:'#f4f1ea' }}>
          <button type="button" onClick={onCancel}
            style={{ padding:'8px 18px', border:'2px solid #000', background:'#fff',
              fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', textTransform:'uppercase' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.title.trim()}
            style={{ padding:'8px 22px', border:'2px solid #000',
              background: (!saving && form.title.trim()) ? '#000' : '#aaa',
              color: '#f1be3e', fontFamily:'var(--font-ui)', fontWeight:800,
              fontSize:'0.82rem', cursor: (!saving && form.title.trim()) ? 'pointer' : 'not-allowed',
              textTransform:'uppercase', boxShadow: (!saving && form.title.trim()) ? '3px 3px 0 #f1be3e' : 'none' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Analytics Panel ──────────────────────────────────────────────────────────

function AnalyticsPanel({ analytics }: { analytics: TaskAnalytics | null }) {
  if (!analytics) return null;
  const stats = [
    { label:'Completed',  value: analytics.completed_tasks, sub:`${analytics.completion_pct}% done`, icon:'✅' },
    { label:'Daily Streak', value: analytics.daily_streak, sub:`${analytics.weekly_streak} week streak`, icon:'🔥' },
    { label:'Study Hours', value: `${analytics.study_hours}h`, sub:'Estimated', icon:'⏱️' },
    { label:'Completion', value: `${analytics.completion_pct}%`, sub:`${analytics.total_tasks} total tasks`, icon:'📊' },
  ];
  return (
    <div style={{ background:'#fff', border:'3px solid #000', boxShadow:'4px 4px 0 #000', marginBottom:20 }}>
      <div style={{ background:'#f1be3e', borderBottom:'2px solid #000', padding:'10px 16px' }}>
        <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em' }}>
          📊 Learning Analytics
        </h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:0 }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ padding:'14px 16px', borderRight: i < stats.length-1 ? '1px solid #e0e0e0' : 'none' }}>
            <div style={{ fontSize:'1.4rem', marginBottom:2 }}>{s.icon}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.2rem', fontWeight:900 }}>{s.value}</div>
            <div style={{ fontWeight:800, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.04em', marginTop:2 }}>{s.label}</div>
            <div style={{ fontSize:'0.68rem', color:'#777', fontFamily:'var(--font-mono)', marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      {(analytics.most_studied_course || analytics.most_used_resource_type) && (
        <div style={{ borderTop:'1px solid #e0e0e0', padding:'10px 16px', display:'flex', gap:16, flexWrap:'wrap', fontSize:'0.78rem' }}>
          {analytics.most_studied_course && <span>🏆 Top course: <strong>{analytics.most_studied_course}</strong></span>}
          {analytics.most_used_resource_type && <span>{getResourceIcon(analytics.most_used_resource_type)} Top resource: <strong>{analytics.most_used_resource_type}</strong></span>}
        </div>
      )}
    </div>
  );
}

// ── Main TaskHub Component ───────────────────────────────────────────────────

function ReminderSettingsPanel({
  prefs, saving, testingEmail, emailHint, status, history, onChange, onSave, onRefreshHistory, onTestBrowser, onTestEmail,
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
  const emailReady = !!status?.emailConfigured && prefs.email_enabled && !!prefs.email_address;
  const browserReady = prefs.browser_enabled;
  const statusCards = [
    {
      label: 'Website alerts',
      value: browserReady ? 'On' : 'Off',
      color: browserReady ? '#00aa44' : '#888',
      detail: browserReady ? 'Shows alerts inside Task Hub while the app is open.' : 'Turn this on for in-app reminders.',
    },
    {
      label: 'Email reminders',
      value: emailReady ? 'Ready' : 'Needs setup',
      color: emailReady ? '#00aa44' : '#cc0000',
      detail: !prefs.email_enabled
        ? 'Email reminders are off.'
        : !prefs.email_address
          ? 'Add an email address.'
          : status?.emailConfigured
            ? `Will send to ${prefs.email_address}.`
            : 'Backend email key is missing.',
    },
    {
      label: 'Daily digest',
      value: prefs.daily_digest_enabled ? prefs.daily_digest_time : 'Off',
      color: prefs.daily_digest_enabled ? '#000' : '#888',
      detail: prefs.daily_digest_enabled ? 'Sends today’s task list by email.' : 'Optional morning summary.',
    },
    {
      label: 'Saved status',
      value: status?.preferencesSaved ? 'Saved' : 'Not saved',
      color: status?.preferencesSaved ? '#00aa44' : '#e67e22',
      detail: status?.preferencesSaved ? 'Your settings are stored.' : 'Press Save Settings after changes.',
    },
  ];

  const toggleOffset = (minutes: number) => {
    const exists = prefs.reminder_offsets_minutes.includes(minutes);
    const next = exists
      ? prefs.reminder_offsets_minutes.filter(n => n !== minutes)
      : [...prefs.reminder_offsets_minutes, minutes];
    onChange({ ...prefs, reminder_offsets_minutes: next.sort((a, b) => b - a) });
  };
  const chip = (minutes: number, label: string) => {
    const active = prefs.reminder_offsets_minutes.includes(minutes);
    return (
      <button key={minutes} type="button" onClick={() => toggleOffset(minutes)}
        style={{ border:'2px solid #000', background:active ? '#000' : '#fff', color:active ? '#f1be3e' : '#000',
          padding:'5px 10px', fontWeight:800, fontSize:'0.72rem', cursor:'pointer', fontFamily:'var(--font-ui)' }}>
        {label}
      </button>
    );
  };

  return (
    <section style={{ background:'#fff', border:'3px solid #000', boxShadow:'4px 4px 0 #000', marginBottom:20 }}>
      <div style={{ background:'#f1be3e', borderBottom:'2px solid #000', padding:'10px 16px',
        display:'flex', justifyContent:'space-between', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <h2 style={{ margin:0, fontSize:'0.9rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em' }}>
          Reminder Center
        </h2>
        <button type="button" onClick={onSave} disabled={saving}
          style={{ background:'#000', color:'#f1be3e', border:'2px solid #000', padding:'6px 14px',
            fontWeight:900, cursor:saving ? 'wait' : 'pointer', fontFamily:'var(--font-ui)', textTransform:'uppercase' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      <div style={{ padding:16, display:'grid', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
          {statusCards.map(card => (
            <div key={card.label} style={{ border:'2px solid #000', background:'#f8f8f8', padding:'10px 12px' }}>
              <div style={{ fontSize:'0.68rem', fontWeight:900, textTransform:'uppercase', color:'#555', marginBottom:4 }}>
                {card.label}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontWeight:900, color:card.color, fontSize:'1rem' }}>
                {card.value}
              </div>
              <div style={{ fontSize:'0.72rem', color:'#555', marginTop:4, lineHeight:1.35 }}>
                {card.detail}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontWeight:800, fontSize:'0.82rem' }}>
            <input type="checkbox" checked={prefs.browser_enabled}
              onChange={e => onChange({ ...prefs, browser_enabled: e.target.checked })} />
            Website notification
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontWeight:800, fontSize:'0.82rem' }}>
            <input type="checkbox" checked={prefs.email_enabled}
              onChange={e => onChange({ ...prefs, email_enabled: e.target.checked })} />
            Email reminder
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontWeight:800, fontSize:'0.82rem' }}>
            <input type="checkbox" checked={prefs.daily_digest_enabled}
              onChange={e => onChange({ ...prefs, daily_digest_enabled: e.target.checked })} />
            Daily digest
          </label>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'minmax(220px,1fr) 140px', gap:12 }}>
          <div>
            <label style={{ display:'block', fontWeight:800, fontSize:'0.72rem', textTransform:'uppercase', marginBottom:4 }}>
              Email address
            </label>
            <input type="email" value={prefs.email_address || ''} placeholder={emailHint || 'you@example.com'}
              onChange={e => onChange({ ...prefs, email_address: e.target.value })}
              style={{ width:'100%', border:'2px solid #000', padding:'8px 10px', fontFamily:'var(--font-ui)', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ display:'block', fontWeight:800, fontSize:'0.72rem', textTransform:'uppercase', marginBottom:4 }}>
              Digest time
            </label>
            <input type="time" value={prefs.daily_digest_time || '08:00'}
              onChange={e => onChange({ ...prefs, daily_digest_time: e.target.value })}
              style={{ width:'100%', border:'2px solid #000', padding:'8px 10px', fontFamily:'var(--font-ui)', boxSizing:'border-box' }} />
          </div>
        </div>

        <div>
          <div style={{ fontWeight:800, fontSize:'0.72rem', textTransform:'uppercase', marginBottom:6 }}>Alert timing</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {chip(60, '1 hour before')}
            {chip(30, '30 min before')}
            {chip(10, '10 min before')}
            {chip(0, 'At due time')}
          </div>
        </div>

        <div style={{ fontSize:'0.75rem', lineHeight:1.45, color:'#444', fontWeight:700 }}>
          Reminder emails are sent automatically when a task reaches one of the selected alert times. Recent email activity appears below.
        </div>

        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button type="button" onClick={onTestBrowser}
            style={{ border:'2px solid #000', background:'#fff', padding:'7px 12px', fontWeight:900,
              fontFamily:'var(--font-ui)', cursor:'pointer', textTransform:'uppercase' }}>
            Test website alert
          </button>
          <button type="button" onClick={onTestEmail} disabled={testingEmail || !prefs.email_address}
            style={{ border:'2px solid #000', background:prefs.email_address ? '#000' : '#999',
              color:'#f1be3e', padding:'7px 12px', fontWeight:900, fontFamily:'var(--font-ui)',
              cursor:testingEmail || !prefs.email_address ? 'wait' : 'pointer', textTransform:'uppercase' }}>
            {testingEmail ? 'Sending...' : 'Send test email'}
          </button>
        </div>

        <div style={{ border:'2px solid #000', background:'#fff', padding:'10px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:8 }}>
            <div style={{ fontWeight:900, fontSize:'0.78rem', textTransform:'uppercase' }}>Recent reminder history</div>
            <button type="button" onClick={onRefreshHistory}
              style={{ border:'2px solid #000', background:'#f4f1ea', padding:'4px 8px', fontWeight:800, fontSize:'0.7rem', cursor:'pointer' }}>
              Refresh
            </button>
          </div>
          {history.length === 0 ? (
            <div style={{ fontSize:'0.75rem', color:'#666', fontWeight:700 }}>
              No reminder emails have been sent yet. Create a task with a due time, enable email, save settings, then run the reminder check.
            </div>
          ) : (
            <div style={{ display:'grid', gap:6 }}>
              {history.map(item => (
                <div key={item.id} style={{ display:'grid', gridTemplateColumns:'90px 1fr auto', gap:8,
                  alignItems:'center', fontSize:'0.74rem', borderTop:'1px solid #ddd', paddingTop:6 }}>
                  <span style={{ fontWeight:900, color:item.status === 'sent' ? '#00aa44' : item.status === 'failed' ? '#cc0000' : '#888' }}>
                    {item.status.toUpperCase()}
                  </span>
                  <span>{item.channel} reminder {item.task_id ? `for task #${item.task_id}` : 'daily digest'}</span>
                  <span style={{ fontFamily:'var(--font-mono)', color:'#666' }}>
                    {new Date(item.delivered_at || item.scheduled_for).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
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
    setLoading(true);
    try {
      const result = await fetchTasks({
        page: pg, pageSize: 50, timeFilter, search: searchQuery || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        course_id: filterCourse || undefined, includeArchived: showArchived,
      });
      setTasks(prev => append ? [...prev, ...result.tasks] : result.tasks);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(pg);
    } catch {
      setTasks(prev => append ? prev : []);
      setHasMore(false);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [timeFilter, searchQuery, filterStatus, filterPriority, filterCourse, showArchived]);

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
    if (!showReminderSettings) return;
    fetchReminderStatus().then(setReminderStatus);
    fetchReminderHistory().then(setReminderHistory);
  }, [showReminderSettings]);

  // Load analytics + tags lazily
  useEffect(() => {
    if (showAnalytics && !analytics) fetchAnalytics().then(setAnalytics);
  }, [showAnalytics, analytics]);

  useEffect(() => { fetchUserTags().then(setAllTags); }, []);

  // Check overdue on open and notify through the shared reminder helper.
  useEffect(() => {
    if (notifPerm !== 'granted' || tasks.length === 0) return;
    const today = todayStr();
    const overdue = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'skipped');
    if (overdue.length > 0) {
      browserNotify('Overdue Tasks', `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`);
    }
  }, [notifPerm, tasks, browserNotify]);

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
    const task = await createTask(data);
    setTasks(prev => [task, ...prev]);
    setTotal(t => t + 1);
    setShowForm(false);
    showToast('✅ Task created!');
    // Refresh analytics if open
    if (showAnalytics) fetchAnalytics().then(setAnalytics);
  }, [showAnalytics, showToast]);

  const handleUpdate = useCallback(async (data: UpdateTaskInput) => {
    if (!editTask) return;
    const updated = await updateTask(editTask.id, data);
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditTask(null);
    showToast('✅ Task updated!');
    if (showAnalytics) fetchAnalytics().then(setAnalytics);
  }, [editTask, showAnalytics, showToast]);

  const handleToggleStatus = useCallback(async (task: SmartTask) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'not_started' : 'completed';
    const updated = await updateTask(task.id, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (newStatus === 'completed') showToast('🎉 Task completed!');
    if (showAnalytics) fetchAnalytics().then(setAnalytics);
  }, [showAnalytics, showToast]);

  const handlePin = useCallback(async (task: SmartTask) => {
    const updated = await updateTask(task.id, { is_pinned: !task.is_pinned });
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    showToast(updated.is_pinned ? '📌 Pinned!' : '📌 Unpinned');
  }, [showToast]);

  const handleArchive = useCallback(async (task: SmartTask) => {
    const updated = await updateTask(task.id, { is_archived: !task.is_archived });
    if (!showArchived) {
      setTasks(prev => prev.filter(t => t.id !== updated.id));
      setTotal(n => n - 1);
    } else {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
    showToast(updated.is_archived ? '📦 Archived' : '♻️ Restored');
  }, [showArchived, showToast]);

  const handleDuplicate = useCallback(async (task: SmartTask) => {
    const copy = await duplicateTask(task.id);
    setTasks(prev => [copy, ...prev]);
    setTotal(n => n + 1);
    showToast('📋 Duplicated!');
  }, [showToast]);

  const handleDelete = useCallback(async (task: SmartTask) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await deleteTask(task.id);
    setTasks(prev => prev.filter(t => t.id !== task.id));
    setTotal(n => n - 1);
    showToast('🗑️ Deleted');
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

  const firstName = user?.displayName?.split(' ')[0] || 'Student';

  return (
    <div style={{ minHeight:'100vh', background:'#f4f1ea', backgroundImage:'radial-gradient(rgba(0,0,0,0.05) 1.5px,transparent 1.5px)', backgroundSize:'16px 16px', fontFamily:'var(--font-ui)' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, background:'#000', color:'#f1be3e', padding:'10px 18px',
          border:'2px solid #f1be3e', fontWeight:700, fontSize:'0.88rem', zIndex:1000, boxShadow:'4px 4px 0 #f1be3e' }}
          role="status" aria-live="polite">{toast}</div>
      )}

      {webAlerts.length > 0 && (
        <div style={{ position:'fixed', top:72, right:20, width:'min(360px,calc(100vw - 32px))',
          display:'grid', gap:8, zIndex:1001 }} aria-live="assertive">
          {webAlerts.map(alert => (
            <div key={alert.id} style={{ background:'#fff', color:'#000', border:'3px solid #000',
              boxShadow:'5px 5px 0 #f1be3e', padding:'12px 14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:'0.84rem', textTransform:'uppercase', marginBottom:4 }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize:'0.8rem', lineHeight:1.4, fontWeight:700 }}>{alert.body}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.66rem', color:'#666', marginTop:6 }}>
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <button type="button" onClick={() => setWebAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  style={{ border:'2px solid #000', background:'#f1be3e', cursor:'pointer', fontWeight:900, lineHeight:1 }}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:200, background:'#f1be3e', borderBottom:'3px solid #000',
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', minHeight:54,
        boxShadow:'0 3px 0 #000', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ background:'#000', color:'#f1be3e', border:'2px solid #000',
            padding:'5px 12px', fontWeight:900, fontSize:'0.8rem', cursor:'pointer', fontFamily:'var(--font-ui)', textTransform:'uppercase' }}
            aria-label="Back to Dashboard">← Back</button>
          <span style={{ fontWeight:900, fontSize:'1rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            🎯 Task Hub
          </span>
          {total > 0 && (
            <span style={{ fontSize:'0.72rem', fontFamily:'var(--font-mono)', background:'#000', color:'#f1be3e',
              padding:'2px 8px', fontWeight:700 }}>{total} tasks</span>
          )}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {overdueCount > 0 && (
            <span style={{ background:'#cc0000', color:'#fff', padding:'3px 10px', border:'2px solid #000',
              fontWeight:800, fontSize:'0.75rem' }}>⚠️ {overdueCount} Overdue</span>
          )}
          <button onClick={handleEnableReminders}
            style={{ background: notifPerm === 'granted' ? '#00aa44' : '#fff', color: notifPerm === 'granted' ? '#fff' : '#000',
              border:'2px solid #000', padding:'5px 12px', fontWeight:700, fontSize:'0.78rem', cursor:'pointer',
              fontFamily:'var(--font-ui)', textTransform:'uppercase' }}
            title={notifPerm === 'granted' ? 'Browser reminders are enabled' : 'Enable browser reminders'}>
            {notifPerm === 'granted' ? 'Reminders On' : 'Enable Reminders'}
          </button>
          <button onClick={() => setShowReminderSettings(s => !s)}
            style={{ background: showReminderSettings ? '#000' : '#fff', color: showReminderSettings ? '#f1be3e' : '#000',
              border:'2px solid #000', padding:'5px 12px', fontWeight:700, fontSize:'0.78rem', cursor:'pointer',
              fontFamily:'var(--font-ui)', textTransform:'uppercase' }}>
            Reminder Center
          </button>
          {completedToday > 0 && (
            <span style={{ background:'#00aa44', color:'#fff', padding:'3px 10px', border:'2px solid #000',
              fontWeight:800, fontSize:'0.75rem' }}>✅ {completedToday} Done Today</span>
          )}
          <button onClick={() => setShowAnalytics(s => !s)}
            style={{ background: showAnalytics ? '#000' : '#fff', color: showAnalytics ? '#f1be3e' : '#000',
              border:'2px solid #000', padding:'5px 12px', fontWeight:700, fontSize:'0.78rem', cursor:'pointer',
              fontFamily:'var(--font-ui)', textTransform:'uppercase' }}>
            📊 Analytics
          </button>
          <button onClick={() => setShowForm(true)}
            style={{ background:'#000', color:'#f1be3e', border:'2px solid #000', padding:'6px 16px',
              fontWeight:900, fontSize:'0.88rem', cursor:'pointer', fontFamily:'var(--font-ui)',
              textTransform:'uppercase', boxShadow:'3px 3px 0 rgba(0,0,0,0.3)' }}>
            + New Task
          </button>
        </div>
      </nav>

      {/* Main */}
      <main style={{ maxWidth:920, margin:'0 auto', padding:'24px 20px' }}>

        {/* Analytics */}
        {showAnalytics && <AnalyticsPanel analytics={analytics} />}

        {showReminderSettings && (
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

        {/* Time filter tabs */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:16 }}>
          {TIME_FILTERS.map(tf => (
            <button key={tf.key} onClick={() => setTimeFilter(tf.key)}
              style={{ padding:'6px 14px', border:'2px solid #000', fontWeight:700, fontSize:'0.78rem',
                cursor:'pointer', fontFamily:'var(--font-ui)', textTransform:'uppercase',
                background: timeFilter === tf.key ? '#000' : '#fff',
                color: timeFilter === tf.key ? '#f1be3e' : '#000',
                boxShadow: timeFilter === tf.key ? 'none' : '2px 2px 0 #000' }}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* Search + filters row */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:'1 1 200px', position:'relative' }}>
            <input ref={searchRef} type="search" placeholder="🔍 Search tasks…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width:'100%', padding:'8px 12px', border:'2px solid #000', fontFamily:'var(--font-ui)',
                fontSize:'0.88rem', background:'#fff', outline:'none', boxSizing:'border-box' }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
            style={{ padding:'8px 10px', border:'2px solid #000', fontFamily:'var(--font-ui)', fontSize:'0.82rem',
              background:'#fff', cursor:'pointer', minWidth:130 }}>
            <option value="all">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)}
            style={{ padding:'8px 10px', border:'2px solid #000', fontFamily:'var(--font-ui)', fontSize:'0.82rem',
              background:'#fff', cursor:'pointer', minWidth:130 }}>
            <option value="all">All Priority</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
          {courses.length > 0 && (
            <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
              style={{ padding:'8px 10px', border:'2px solid #000', fontFamily:'var(--font-ui)', fontSize:'0.82rem',
                background:'#fff', cursor:'pointer', minWidth:130 }}>
              <option value="">All Courses</option>
              {courses.filter(c => !['data-analyst','data-analyst-en'].includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.mascot || '📘'} {c.title}</option>)}
            </select>
          )}
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
            <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} style={{ width:14, height:14 }} />
            Show archived
          </label>
        </div>

        {/* Suggested next (Today view only) */}
        {timeFilter === 'today' && suggestedTasks.length > 0 && !searchQuery && (
          <div style={{ background:'#fff3e0', border:'2px solid #e67e22', padding:'12px 16px', marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:'0.8rem', textTransform:'uppercase', marginBottom:8, color:'#e67e22' }}>
              ⚡ Suggested Next — Start with these
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {suggestedTasks.map(t => (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, fontSize:'0.85rem', cursor:'pointer' }}
                  onClick={() => setEditTask(t)}>
                  <span style={{ flexShrink:0, fontSize:'0.7rem', background: getPriorityBg(t.priority),
                    padding:'1px 6px', border:`1px solid ${getPriorityColor(t.priority)}`,
                    color: getPriorityColor(t.priority), fontWeight:700 }}>
                    {t.priority.toUpperCase()}
                  </span>
                  <span style={{ fontWeight:600 }}>{t.title}</span>
                  {t.due_date && <span style={{ fontSize:'0.7rem', color:'#888', fontFamily:'var(--font-mono)' }}>{formatDueDate(t.due_date)?.label}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task list */}
        {loading && page === 1 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#888', fontFamily:'var(--font-mono)', fontSize:'0.85rem' }}
            role="status">Loading tasks…</div>
        )}

        {!loading && tasks.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', border:'3px dashed #ccc' }}>
            <div style={{ fontSize:'3rem', marginBottom:12 }}>📋</div>
            <p style={{ fontWeight:700, fontSize:'1rem', margin:'0 0 6px' }}>
              {searchQuery ? `No tasks matching "${searchQuery}"` : 'No tasks here yet'}
            </p>
            <p style={{ color:'#777', fontSize:'0.85rem', margin:'0 0 18px' }}>
              {timeFilter === 'today' ? 'Nothing due today — add something or check upcoming.' : 'Add your first task below.'}
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ padding:'10px 24px', background:'#000', color:'#f1be3e', border:'2px solid #000',
                fontWeight:900, fontSize:'0.88rem', cursor:'pointer', textTransform:'uppercase', fontFamily:'var(--font-ui)',
                boxShadow:'4px 4px 0 #f1be3e' }}>
              + Add Task
            </button>
          </div>
        )}

        {tasks.map(task => (
          <TaskCard key={task.id} task={task}
            onToggleStatus={handleToggleStatus}
            onPin={handlePin} onArchive={handleArchive}
            onDuplicate={handleDuplicate} onDelete={handleDelete}
            onEdit={setEditTask} onNavigate={handleNavigate} />
        ))}

        {/* Load more trigger */}
        {hasMore && <div ref={loadMoreRef} style={{ height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {loading && <span style={{ color:'#888', fontFamily:'var(--font-mono)', fontSize:'0.8rem' }}>Loading more…</span>}
        </div>}

        <div style={{ height:40 }} />
      </main>

      {/* Create / Edit form */}
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
