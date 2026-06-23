"use client";

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const MarkdownRenderer = dynamic(() => import('../../components/MarkdownRenderer'), { ssr: false });

interface PartMeta {
  part: number;
  title: string;
  importance: string;
  videoId: string;
}

interface Module {
  id: number;
  title: string;
  parts: number[];
}

interface CourseConfig {
  title: string;
  description: string;
  tagline: string;
  mascot: string;
  contentDir: string;
  dirPattern: string;
  playlistUrl: string;
  channelUrl: string;
  discordUrl: string;
  author: string;
  authorTitle: string;
  eyebrow: string;
  subtitle: string;
  target: string;
  goal: string;
  welcomeParagraphs: string[];
  modules: Module[];
  importance: Record<string, string>;
  videos: Record<string, string>;
}

interface Config {
  [course: string]: CourseConfig;
}

const API_BASE = (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || window.location.origin) : 'http://localhost:3001');
const API_URL = `${API_BASE}/api/admin/config`;

// Extract YouTube Video ID from any standard link/format
function extractYoutubeId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  if (trimmed.includes('/') && !trimmed.includes('=')) {
    const segments = trimmed.split('/');
    const last = segments[segments.length - 1];
    if (last && last.length === 11) return last;
  }
  return trimmed;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  const [config, setConfig] = useState<Config | null>(null);
  const [originalConfig, setOriginalConfig] = useState<Config | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('python');
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Expanded Part Content Management
  const [expandedPartNum, setExpandedPartNum] = useState<number | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<string>('');
  const [expandedFiles, setExpandedFiles] = useState<Array<{ path: string; content?: string }>>([]);
  const [contentLoading, setContentLoading] = useState<boolean>(false);
  const [contentMessage, setContentMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textVal = textarea.value;
    const newVal = textVal.substring(0, start) + text + textVal.substring(end);
    setExpandedNotes(newVal);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 50);
  };

  // Load password from session storage on mount
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('admin_pwd');
    if (savedPassword) {
      setLoading(true);
      fetch(API_URL, {
        headers: { 'X-Admin-Password': savedPassword },
      })
        .then((r) => {
          if (!r.ok) throw new Error('Unauthorized');
          return r.json();
        })
        .then((data) => {
          setIsAuthenticated(true);
          setConfig(JSON.parse(JSON.stringify(data)));
          setOriginalConfig(JSON.parse(JSON.stringify(data)));
          setIsDirty(false);
          if (data[selectedCourse]?.modules?.length > 0) {
            setSelectedModuleId(data[selectedCourse].modules[0].id);
          }
        })
        .catch(() => {
          sessionStorage.removeItem('admin_pwd');
          setIsAuthenticated(false);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const fetchConfig = (pwd?: string) => {
    const activePwd = pwd || sessionStorage.getItem('admin_pwd') || '';
    if (!activePwd) return;
    setLoading(true);
    fetch(API_URL, {
      headers: { 'X-Admin-Password': activePwd },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized or failed to load');
        return r.json();
      })
      .then((data) => {
        setConfig(JSON.parse(JSON.stringify(data)));
        setOriginalConfig(JSON.parse(JSON.stringify(data)));
        setIsDirty(false);
        if (data[selectedCourse]?.modules?.length > 0) {
          setSelectedModuleId(data[selectedCourse].modules[0].id);
        }
      })
      .catch((e) => {
        console.error('Failed to load config', e);
        setMessage({ text: 'Error loading configuration. Is the backend server running?', type: 'error' });
      })
      .finally(() => setLoading(false));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetch(API_URL, {
      headers: { 'X-Admin-Password': passwordInput },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then((data) => {
        sessionStorage.setItem('admin_pwd', passwordInput);
        setIsAuthenticated(true);
        setPasswordError('');
        setConfig(JSON.parse(JSON.stringify(data)));
        setOriginalConfig(JSON.parse(JSON.stringify(data)));
        setIsDirty(false);
        if (data[selectedCourse]?.modules?.length > 0) {
          setSelectedModuleId(data[selectedCourse].modules[0].id);
        }
      })
      .catch(() => {
        setPasswordError('Invalid Admin Password. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pwd');
    setIsAuthenticated(false);
    setConfig(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <style>{`
          .login-screen {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            background: #f4f1ea;
            font-family: 'Space Grotesk', -apple-system, sans-serif;
            padding: 1rem;
          }
          .login-card {
            background: #ffffff;
            border: 3px solid #000000;
            box-shadow: 6px 6px 0px #000000;
            padding: 2.5rem;
            max-width: 420px;
            width: 100%;
            border-radius: 0px;
            color: #000000;
          }
          .login-title {
            font-size: 1.5rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -0.05em;
            margin-bottom: 0.5rem;
            border-bottom: 2px solid #000000;
            padding-bottom: 0.5rem;
            color: #f1be3e;
            -webkit-text-stroke: 1px #000;
          }
          .login-subtitle {
            font-size: 0.9rem;
            color: #222222;
            margin-bottom: 1.5rem;
            font-weight: bold;
          }
          .input-group {
            margin-bottom: 1.5rem;
          }
          .input-label {
            display: block;
            font-size: 0.85rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
          }
          .text-input {
            width: 100%;
            padding: 0.75rem;
            background: #ffffff;
            border: 2px solid #000000;
            color: #000000;
            font-family: inherit;
            outline: none;
            box-shadow: inset 2px 2px 0px rgba(0,0,0,0.1);
          }
          .text-input:focus {
            border-color: #f1be3e;
          }
          .login-btn {
            width: 100%;
            background: #f1be3e;
            color: #000000;
            font-weight: bold;
            text-transform: uppercase;
            padding: 0.75rem;
            border: 2px solid #000000;
            cursor: pointer;
            box-shadow: 3px 3px 0px #000000;
            transition: transform 0.1s, box-shadow 0.1s;
          }
          .login-btn:hover {
            transform: translate(-1px, -1px);
            box-shadow: 4px 4px 0px #000000;
          }
          .login-btn:active {
            transform: translate(2px, 2px);
            box-shadow: 0px 0px 0px #000000;
          }
          .error-msg {
            color: #e03131;
            font-size: 0.85rem;
            margin-top: 0.75rem;
            font-weight: bold;
          }
        `}</style>
        <form onSubmit={handleLogin} className="login-card">
          <h1 className="login-title">Admin Terminal</h1>
          <p className="login-subtitle">1% Developer Academy Config Suite</p>
          <div className="input-group">
            <label className="input-label">Security Key</label>
            <input
              type="password"
              placeholder="••••••••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="text-input"
              autoFocus
            />
            {passwordError && <p className="error-msg">{passwordError}</p>}
          </div>
          <button type="submit" className="login-btn">
            Access System
          </button>
        </form>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f1ea', fontFamily: 'monospace', color: '#000000' }}>
        Authenticating and loading configurations...
      </div>
    );
  }

  const course = config[selectedCourse];
  const selectedModule = course?.modules?.find((m) => m.id === selectedModuleId) || null;

  const saveConfig = (newConfig: Config) => {
    setLoading(true);
    const pwd = sessionStorage.getItem('admin_pwd') || '';
    fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': pwd,
      },
      body: JSON.stringify(newConfig),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setConfig(JSON.parse(JSON.stringify(newConfig)));
          setOriginalConfig(JSON.parse(JSON.stringify(newConfig)));
          setIsDirty(false);
          setMessage({ text: 'Configuration saved and live.', type: 'success' });
        } else {
          setMessage({ text: 'Error saving config schema.', type: 'error' });
          console.error(data);
        }
      })
      .catch((e) => {
        setMessage({ text: 'Network connection lost.', type: 'error' });
        console.error(e);
      })
      .finally(() => setLoading(false));
  };

  const triggerSave = () => {
    saveConfig(config);
  };

  const triggerReset = () => {
    if (confirm('Discard all unsaved edits?')) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)));
      setIsDirty(false);
      setExpandedPartNum(null);
      setMessage({ text: 'Edits discarded.', type: 'success' });
    }
  };

  // ── Module Actions ──────────────────────────────────────────────────────────
  const handleAddModule = () => {
    const newId = course.modules.length ? Math.max(...course.modules.map((m) => m.id)) + 1 : 1;
    const newModule: Module = { id: newId, title: `New Module ${newId}`, parts: [] };
    const updated = { ...config };
    updated[selectedCourse].modules = [...course.modules, newModule];
    setConfig(updated);
    setSelectedModuleId(newId);
    setIsDirty(true);
  };

  const handleUpdateModuleTitle = (id: number, title: string) => {
    const updated = { ...config };
    const mod = updated[selectedCourse].modules.find((m) => m.id === id);
    if (mod) {
      mod.title = title;
      setConfig(updated);
      setIsDirty(true);
    }
  };

  const handleDeleteModule = (id: number) => {
    if (confirm('Are you sure you want to delete this module? The lessons inside will be orphaned.')) {
      const updated = { ...config };
      updated[selectedCourse].modules = course.modules.filter((m) => m.id !== id);
      setConfig(updated);
      setIsDirty(true);
      if (selectedModuleId === id) {
        setSelectedModuleId(updated[selectedCourse].modules[0]?.id || null);
      }
    }
  };

  // ── Part Actions ────────────────────────────────────────────────────────────
  const handleAddPartToModule = async (targetModuleId?: number) => {
    const activeModId = targetModuleId !== undefined ? targetModuleId : selectedModuleId;
    if (activeModId === null) return;
    const targetModule = course.modules.find(m => m.id === activeModId);
    if (!targetModule) return;

    const partInput = prompt('Enter a Part Number to add (e.g. 39, 37.1):');
    if (!partInput) return;
    const partNum = parseFloat(partInput);
    if (isNaN(partNum)) {
      alert('Please enter a valid number.');
      return;
    }

    const allExistingParts = course.modules.flatMap(m => m.parts);
    if (allExistingParts.includes(partNum)) {
      alert(`Part ${partNum} is already assigned to a module in this course.`);
      return;
    }

    const titleInput = prompt('Enter Lesson Title (e.g. Introduction to Linux):');
    const lessonTitle = titleInput ? titleInput.trim() : `Part ${partNum}`;

    setLoading(true);
    try {
      const notesContent = `# ${lessonTitle}\n\nThis chapter is currently under construction and will be available in a future update.\n`;
      const res = await fetch(`${API_BASE}/api/admin/notes/${selectedCourse}/${partNum}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': sessionStorage.getItem('admin_pwd') || '',
        },
        body: JSON.stringify({ notes: notesContent }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert('Failed to initialize lesson notes on server.');
        return;
      }
    } catch (err) {
      console.error(err);
      alert('Network error initializing lesson notes.');
      return;
    } finally {
      setLoading(false);
    }

    const updated = { ...config };
    const targetMod = updated[selectedCourse].modules.find((m) => m.id === activeModId);
    if (targetMod) {
      targetMod.parts = [...targetMod.parts, partNum].sort((a, b) => a - b);
      if (!updated[selectedCourse].importance[partNum]) {
        updated[selectedCourse].importance[partNum.toString()] = 'medium';
      }
      if (!updated[selectedCourse].videos[partNum]) {
        updated[selectedCourse].videos[partNum.toString()] = '';
      }
      setConfig(updated);
      setIsDirty(true);
      
      // Select the module and auto-expand the newly created part for user to edit notes immediately
      setSelectedModuleId(activeModId);
      toggleExpandPart(partNum);
    }
  };

  const handleRemovePartFromModule = (partNum: number) => {
    if (!selectedModule) return;
    if (confirm(`Remove Part ${partNum} from module "${selectedModule.title}"?`)) {
      const updated = { ...config };
      const targetMod = updated[selectedCourse].modules.find((m) => m.id === selectedModule.id);
      if (targetMod) {
        targetMod.parts = targetMod.parts.filter((p) => p !== partNum);
        setConfig(updated);
        setIsDirty(true);
        if (expandedPartNum === partNum) {
          setExpandedPartNum(null);
        }
      }
    }
  };

  const handleUpdatePartImportance = (partNum: number, level: string) => {
    const updated = { ...config };
    updated[selectedCourse].importance[partNum.toString()] = level;
    setConfig(updated);
    setIsDirty(true);
  };

  const handleUpdatePartVideo = (partNum: number, value: string) => {
    const updated = { ...config };
    const cleanVideoId = extractYoutubeId(value);
    updated[selectedCourse].videos[partNum.toString()] = cleanVideoId;
    setConfig(updated);
    setIsDirty(true);
  };

  // ── Part Content & Notes Management ──────────────────────────────────────────
  const toggleExpandPart = (partNum: number) => {
    if (expandedPartNum === partNum) {
      setExpandedPartNum(null);
      return;
    }

    setExpandedPartNum(partNum);
    setExpandedNotes('');
    setExpandedFiles([]);
    setContentLoading(true);
    setContentMessage(null);

    // Fetch notes and files for this part
    fetch(`${API_BASE}/api/notes/${selectedCourse}/${partNum}`)
      .then((res) => {
        if (!res.ok) throw new Error('Notes file does not exist yet.');
        return res.json();
      })
      .then((data) => {
        setExpandedNotes(data.notes || '');
        setExpandedFiles(data.files || []);
      })
      .catch((e) => {
        setExpandedNotes(`# Part ${partNum} Notes\n\nWrite your content here...`);
        setExpandedFiles([]);
        setContentMessage({ text: 'No notes file found. Click Save to create notes.md.', type: 'error' });
      })
      .finally(() => setContentLoading(false));
  };

  const handleSaveNotes = (partNum: number) => {
    setContentLoading(true);
    setContentMessage(null);

    fetch(`${API_BASE}/api/admin/notes/${selectedCourse}/${partNum}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': sessionStorage.getItem('admin_pwd') || '',
      },
      body: JSON.stringify({ notes: expandedNotes }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setContentMessage({ text: 'notes.md updated successfully.', type: 'success' });
        } else {
          setContentMessage({ text: 'Failed to update notes file.', type: 'error' });
        }
      })
      .catch((e) => {
        console.error(e);
        setContentMessage({ text: 'Network connection lost.', type: 'error' });
      })
      .finally(() => setContentLoading(false));
  };

  const handleUploadFile = (partNum: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setContentLoading(true);
    setContentMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      
      fetch(`${API_BASE}/api/admin/upload/${selectedCourse}/${partNum}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': sessionStorage.getItem('admin_pwd') || '',
        },
        body: JSON.stringify({
          filename: file.name,
          content: base64String,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setContentMessage({ text: `File "${file.name}" uploaded successfully.`, type: 'success' });
            // Refresh files list
            setExpandedFiles(prev => [...prev.filter(f => f.path !== file.name), { path: file.name }]);
          } else {
            setContentMessage({ text: 'Failed to upload asset file.', type: 'error' });
          }
        })
        .catch((e) => {
          console.error(e);
          setContentMessage({ text: 'Network error uploading asset.', type: 'error' });
        })
        .finally(() => {
          setContentLoading(false);
          e.target.value = ''; // clear picker
        });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFile = (partNum: number, filename: string) => {
    if (!confirm(`Delete asset file "${filename}" permanently?`)) return;

    setContentLoading(true);
    setContentMessage(null);

    fetch(`${API_BASE}/api/admin/files/${selectedCourse}/${partNum}/${filename}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Password': sessionStorage.getItem('admin_pwd') || '',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setContentMessage({ text: `File "${filename}" deleted successfully.`, type: 'success' });
          setExpandedFiles(prev => prev.filter(f => f.path !== filename));
        } else {
          setContentMessage({ text: 'Failed to delete asset file.', type: 'error' });
        }
      })
      .catch((e) => {
        console.error(e);
        setContentMessage({ text: 'Network error deleting file.', type: 'error' });
      })
      .finally(() => setContentLoading(false));
  };

  return (
    <div className="admin-container">
      <style>{`
        .admin-container {
          min-height: 100vh;
          background: #f4f1ea;
          color: #000000;
          font-family: 'Space Grotesk', -apple-system, sans-serif;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        /* Titlebar */
        .titlebar {
          background: #f1be3e;
          border: 3px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          color: #000000;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .titlebar-brand {
          font-weight: 800;
          font-size: 1.3rem;
          letter-spacing: -0.05em;
          text-transform: uppercase;
        }
        .titlebar-status {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .badge {
          font-size: 0.75rem;
          font-weight: bold;
          text-transform: uppercase;
          padding: 0.25rem 0.5rem;
          border: 1px solid #000000;
          background: #ffffff;
          color: #000000;
        }
        .badge.dirty {
          background: #e03131;
          color: #ffffff;
        }
        .badge.clean {
          background: #2b8a3e;
          color: #ffffff;
        }
        
        /* Layout columns */
        .main-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          flex: 1;
        }

        /* Sidebar Module Manager */
        .module-pane {
          background: #ffffff;
          border: 3px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .pane-header {
          font-size: 1.1rem;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 2px solid #000000;
          padding-bottom: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #000000;
        }

        /* Module Item cards */
        .module-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 60vh;
          overflow-y: auto;
        }
        .module-item {
          background: #fdfdfd;
          border: 2px solid #000000;
          padding: 0.75rem;
          cursor: pointer;
          transition: background 0.1s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .module-item.active {
          border-color: #f1be3e;
          background: #fff9db;
          box-shadow: 2px 2px 0px #000;
        }
        .module-item:hover {
          background: #f1f3f5;
        }
        .module-name {
          font-weight: bold;
          font-size: 0.95rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }

        /* Input Elements */
        .select-field {
          padding: 0.5rem;
          background: #ffffff;
          border: 2px solid #000000;
          color: #000000;
          font-family: inherit;
          font-weight: bold;
          outline: none;
          width: 100%;
        }
        .text-input-field {
          padding: 0.5rem;
          background: #ffffff;
          border: 2px solid #000000;
          color: #000000;
          font-family: inherit;
          outline: none;
          width: 100%;
        }
        .text-input-field:focus {
          border-color: #f1be3e;
        }

        /* Neo buttons */
        .neo-btn {
          background: #ffffff;
          color: #000000;
          font-weight: bold;
          padding: 0.5rem 1rem;
          border: 2px solid #000000;
          box-shadow: 2px 2px 0px #000000;
          cursor: pointer;
          text-transform: uppercase;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .neo-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #000000;
        }
        .neo-btn:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0px #000000;
        }
        .neo-btn.primary {
          background: #f1be3e;
        }
        .neo-btn.primary.pulse {
          animation: pulse-border 1.5s infinite;
          background: #f1be3e;
          border-color: #000000;
        }
        @keyframes pulse-border {
          0% {
            box-shadow: 2px 2px 0px #000000;
            transform: scale(1);
          }
          50% {
            box-shadow: 4px 4px 0px #000000;
            transform: scale(1.02);
            background: #ffd43b;
          }
          100% {
            box-shadow: 2px 2px 0px #000000;
            transform: scale(1);
          }
        }
        .neo-btn.danger {
          background: #ff6b6b;
          color: #ffffff;
        }
        .neo-btn.outline {
          background: transparent;
          color: #000000;
          border-color: #000000;
          box-shadow: 2px 2px 0px #000000;
        }
        .neo-btn.outline:hover {
          box-shadow: 3px 3px 0px #000000;
        }
        .neo-btn.outline:active {
          box-shadow: 1px 1px 0px #000000;
        }
        .neo-btn.mini {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }

        /* Details Pane */
        .details-pane {
          background: #ffffff;
          border: 3px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Lesson cards list layout as single table-like headers */
        .lessons-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .lessons-header {
          display: grid;
          grid-template-columns: 80px 1.5fr 1fr 100px 100px;
          gap: 1rem;
          padding: 0.5rem 1rem;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: #555555;
          border-bottom: 2px solid #000000;
        }
        .lesson-card {
          background: #fdfdfd;
          border: 2px solid #000000;
          padding: 0.6rem 1rem;
          display: grid;
          grid-template-columns: 80px 1.5fr 1fr 100px 100px;
          align-items: center;
          gap: 1rem;
        }
        .part-label {
          font-weight: 800;
          font-size: 1rem;
          color: #000000;
        }
        
        /* Expandable content drawer */
        .content-drawer {
          grid-column: 1 / -1;
          background: #fffdf6;
          border: 2px dashed #000000;
          padding: 1.25rem;
          margin-top: -0.25rem;
          margin-bottom: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .notes-textarea {
          width: 100%;
          height: 220px;
          background: #ffffff;
          border: 2px solid #000000;
          padding: 0.75rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.85rem;
          outline: none;
          resize: vertical;
        }
        .notes-textarea:focus {
          border-color: #f1be3e;
        }
        .editor-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }
        @media (max-width: 900px) {
          .editor-split {
            grid-template-columns: 1fr;
          }
        }
        .toolbar-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          background: #f8f9fa;
          padding: 0.4rem;
          border: 2px solid #000000;
          border-bottom: none;
        }
        .toolbar-btn {
          background: #ffffff;
          border: 1px solid #000000;
          padding: 0.2rem 0.5rem;
          font-size: 0.75rem;
          font-weight: bold;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 1px 1px 0px #000000;
          transition: background 0.1s;
        }
        .toolbar-btn:hover {
          background: #e9ecef;
          transform: translate(-0.5px, -0.5px);
          box-shadow: 1.5px 1.5px 0px #000000;
        }
        .preview-pane {
          background: #ffffff;
          border: 2px solid #000000;
          padding: 1rem;
          height: 258px;
          overflow-y: auto;
          box-shadow: inset 2px 2px 0px rgba(0,0,0,0.05);
        }
        
        /* Attached files container */
        .attached-files-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .file-chip {
          background: #ffffff;
          border: 1px solid #000000;
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 1px 1px 0px #000000;
        }

        /* Alerts */
        .alert-banner {
          border: 2px solid #000000;
          padding: 0.75rem 1rem;
          font-weight: bold;
        }
        .alert-banner.success {
          background: #51cf66;
          color: #000000;
        }
        .alert-banner.error {
          background: #ff6b6b;
          color: #ffffff;
        }
      `}</style>

      {/* Header bar */}
      <header className="titlebar">
        <span className="titlebar-brand">1% Dev Academy · Admin Suite</span>
        <div className="titlebar-status">
          {isDirty ? (
            <span className="badge dirty">⚠️ Unsaved Changes</span>
          ) : (
            <span className="badge clean">✓ Synced</span>
          )}
          <button onClick={triggerSave} disabled={loading || !isDirty} className={`neo-btn primary${isDirty ? ' pulse' : ''}`}>
            {loading ? 'Saving...' : 'Save Config'}
          </button>
          {isDirty && (
            <button onClick={triggerReset} className="neo-btn danger">
              Reset
            </button>
          )}
          <button onClick={handleLogout} className="neo-btn outline mini">
            Exit
          </button>
        </div>
      </header>

      {/* Notification banner */}
      {message && (
        <div className={`alert-banner ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Core Layout */}
      <div className="main-layout">
        {/* Left Column: Modules list */}
        <aside className="module-pane">
          <div className="pane-header">
            <span>Course Setup</span>
          </div>
          <div className="mb-2" style={{ border: '2px solid #000000', padding: '0.75rem', background: '#fff9db', boxShadow: '2px 2px 0px #000000' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', marginBottom: '0.4rem', color: '#555555' }}>
              Active Course Configuration
            </span>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                const firstMod = config[e.target.value]?.modules?.[0];
                setSelectedModuleId(firstMod ? firstMod.id : null);
              }}
              className="select-field"
              style={{ background: '#ffffff', color: '#000000', border: '2px solid #000000', padding: '0.5rem', fontWeight: 'bold', width: '100%' }}
            >
              <option value="python">🐍 Python in Kannada</option>
              <option value="cloud">☁️ Cloud Computing</option>
            </select>
          </div>

          <div className="pane-header mt-4">
            <span>Modules List</span>
            <button onClick={handleAddModule} className="neo-btn primary mini">
              + Add
            </button>
          </div>

          <ul className="module-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0 }}>
            {course?.modules?.map((mod) => {
              const isActive = selectedModuleId === mod.id;
              return (
                <li
                  key={mod.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#ffffff',
                    border: '2px solid #000000',
                    boxShadow: isActive ? '3px 3px 0px #000000' : '1px 1px 0px #000000',
                    transition: 'box-shadow 0.1s',
                  }}
                >
                  {/* Module Header Row */}
                  <div
                    onClick={() => setSelectedModuleId(mod.id)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      background: isActive ? '#fff9db' : '#f8f9fa',
                      borderBottom: '2px solid #000000',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '160px',
                      }}
                      title={mod.title}
                    >
                      {mod.title}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddPartToModule(mod.id);
                        }}
                        className="neo-btn primary mini"
                        style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                        title="Add Lesson to this module"
                      >
                        + L
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(mod.id);
                        }}
                        className="neo-btn danger mini"
                        style={{ padding: '2px 6px', background: '#ff6b6b' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Module Chapters (Parts) List */}
                  <div style={{ padding: '0.5rem', background: '#ffffff' }}>
                    {mod.parts.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: '#868e96', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                        No lessons linked.
                      </span>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {mod.parts.map((partNum) => {
                          const partIsExpanded = expandedPartNum === partNum;
                          const importance = course?.importance?.[partNum.toString()] || 'medium';
                          return (
                            <li
                              key={partNum}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedModuleId(mod.id);
                                toggleExpandPart(partNum);
                              }}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.35rem 0.5rem',
                                border: '1px solid #000000',
                                background: partIsExpanded ? '#f1be3e' : '#f8f9fa',
                                color: '#000000',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                boxShadow: partIsExpanded ? '1px 1px 0px #000000' : 'none',
                              }}
                            >
                              <span>Part {partNum}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ fontSize: '0.75rem' }}>
                                  {importance === 'high' ? '🔥' : importance === 'medium' ? '⚡' : '💤'}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Right Column: Selected Module & its Parts */}
        <main className="details-pane">
          {selectedModule ? (
            <>
              <div className="pane-header" style={{ borderBottom: 'none' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.8rem', color: '#555555', textTransform: 'uppercase' }}>Module Title</span>
                  <input
                    type="text"
                    value={selectedModule.title}
                    onChange={(e) => handleUpdateModuleTitle(selectedModule.id, e.target.value)}
                    className="text-input-field"
                    style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div className="pane-header">
                <span>Lessons & Parts ({selectedModule.parts.length})</span>
                <button onClick={() => handleAddPartToModule(selectedModule.id)} className="neo-btn primary mini">
                  + Add Lesson
                </button>
              </div>

              <div className="lessons-grid">
                {selectedModule.parts.length === 0 ? (
                  <p style={{ color: '#555555', fontStyle: 'italic', padding: '1rem 0' }}>
                    No lessons linked to this module. Click "+ Add Lesson" to create and configure lesson files.
                  </p>
                ) : (
                  <>
                    <div className="lessons-header">
                      <div>Lesson</div>
                      <div>Paste Link or YouTube Video ID</div>
                      <div>Importance</div>
                      <div style={{ textAlign: 'center' }}>Notes & Files</div>
                      <div style={{ textAlign: 'right' }}>Action</div>
                    </div>
                    {selectedModule.parts.map((partNum) => {
                      const videoId = course?.videos?.[partNum.toString()] || '';
                      const isExpanded = expandedPartNum === partNum;
                      return (
                        <div key={partNum} style={{ display: 'contents' }}>
                          <div className="lesson-card">
                            <div className="part-label">Part {partNum}</div>
                            <div>
                              <input
                                type="text"
                                placeholder="Paste full URL or video ID"
                                value={videoId}
                                onChange={(e) => handleUpdatePartVideo(partNum, e.target.value)}
                                className="text-input-field"
                              />
                            </div>
                            <div>
                              <select
                                value={course?.importance?.[partNum.toString()] || 'medium'}
                                onChange={(e) => handleUpdatePartImportance(partNum, e.target.value)}
                                className="select-field"
                              >
                                <option value="high">🔥 High</option>
                                <option value="medium">⚡ Medium</option>
                                <option value="low">💤 Low</option>
                              </select>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => toggleExpandPart(partNum)}
                                className={`neo-btn mini ${isExpanded ? 'primary' : 'outline'}`}
                              >
                                {isExpanded ? 'Collapse' : '📝 Manage'}
                              </button>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleRemovePartFromModule(partNum)}
                                className="neo-btn danger mini"
                              >
                                Unlink
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content Drawer */}
                          {isExpanded && (
                            <div className="content-drawer">
                              {contentLoading ? (
                                <p style={{ fontStyle: 'italic', color: '#555555' }}>Loading notes and assets from file system...</p>
                              ) : (
                                <>
                                  {contentMessage && (
                                    <div className={`alert-banner ${contentMessage.type}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                      {contentMessage.text}
                                    </div>
                                  )}

                                  {/* Notes Editor (Split view: Editor & Live Preview) */}
                                  <div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                                      Lesson Notes (Markdown text & real-time preview)
                                    </span>
                                    <div className="editor-split">
                                      {/* Left side: Textarea + Toolbar */}
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div className="toolbar-row">
                                          <button type="button" onClick={() => handleInsertText('## ')} className="toolbar-btn" title="Add H2 Heading">H2</button>
                                          <button type="button" onClick={() => handleInsertText('### ')} className="toolbar-btn" title="Add H3 Heading">H3</button>
                                          <button type="button" onClick={() => handleInsertText('**bold**')} className="toolbar-btn" title="Bold Text">B</button>
                                          <button type="button" onClick={() => handleInsertText('- Item')} className="toolbar-btn" title="Bullet List">- List</button>
                                          <button type="button" onClick={() => handleInsertText('```python\n\n```')} className="toolbar-btn" title="Python Code Block">Python</button>
                                          <button type="button" onClick={() => handleInsertText('```bash\n$ \n```')} className="toolbar-btn" title="Terminal Code Block">Cmd</button>
                                          <button type="button" onClick={() => handleInsertText('| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |')} className="toolbar-btn" title="Insert Table">Table</button>
                                          <button type="button" onClick={() => handleInsertText('> **💡 KEY CONCEPT:** \n')} className="toolbar-btn" title="Key Concept Callout">Concept</button>
                                          <button type="button" onClick={() => handleInsertText('> ⚠️ **IMPORTANT WARNING:** \n')} className="toolbar-btn" title="Warning Callout">Warning</button>
                                        </div>
                                        <textarea
                                          ref={textareaRef}
                                          value={expandedNotes}
                                          onChange={(e) => setExpandedNotes(e.target.value)}
                                          className="notes-textarea"
                                          placeholder="# Lesson notes..."
                                          style={{ borderTop: 'none', height: '220px' }}
                                        />
                                      </div>

                                      {/* Right side: Real-time Prose Preview */}
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div className="toolbar-row" style={{ background: '#e9ecef', justifyContent: 'center' }}>
                                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#495057', textTransform: 'uppercase' }}>Live Reader Preview</span>
                                        </div>
                                        <div className="preview-pane prose">
                                          <MarkdownRenderer
                                            content={expandedNotes}
                                            components={{
                                              table: ({ children }: any) => (
                                                <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                                                  <table>{children}</table>
                                                </div>
                                              ),
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleSaveNotes(partNum)}
                                      className="neo-btn primary mini"
                                      style={{ marginTop: '0.75rem' }}
                                    >
                                      Save notes.md
                                    </button>
                                  </div>

                                  {/* Assets Manager */}
                                  <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #ccc', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Lesson Downloads & PDF Assets</span>
                                      <label className="neo-btn primary mini" style={{ cursor: 'pointer' }}>
                                        + Upload File
                                        <input
                                          type="file"
                                          accept=".pdf,.py,.txt,.zip,.doc,.json"
                                          onChange={(e) => handleUploadFile(partNum, e)}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                    </div>

                                    {expandedFiles.length === 0 ? (
                                      <p style={{ fontSize: '0.8rem', color: '#777777', fontStyle: 'italic', marginTop: '0.5rem' }}>
                                        No files attached. Upload code files or PDF notes for this lesson.
                                      </p>
                                    ) : (
                                      <div className="attached-files-list">
                                        {expandedFiles.map((file) => (
                                          <div key={file.path} className="file-chip">
                                            <span>📄 {file.path}</span>
                                            <button
                                              onClick={() => handleDeleteFile(partNum, file.path)}
                                              style={{ background: 'none', border: 'none', color: '#e03131', cursor: 'pointer', fontWeight: 'bold' }}
                                              title="Delete permanently"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#555555', fontStyle: 'italic' }}>
              Select a module from the left list or click "+ Add" to create one.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
