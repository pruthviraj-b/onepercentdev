'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type OutputLine = { text: string; type: 'out' | 'err' | 'info' };

// ── Pyodide Loader ───────────────────────────────────────────────
let pyodideReady: Promise<any> | null = null;

async function getPyodide() {
  if (pyodideReady) return pyodideReady;
  pyodideReady = (async () => {
    if (!(window as any).loadPyodide) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
        s.onload = () => res();
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    return (window as any).loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/',
    });
  })();
  return pyodideReady;
}

// ── SQL.js Loader ────────────────────────────────────────────────
let sqlPromise: Promise<any> | null = null;
async function getSQL() {
  if (sqlPromise) return sqlPromise;
  sqlPromise = (async () => {
    if (!(window as any).initSqlJs) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
        s.onload = () => res();
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    return (window as any).initSqlJs({ locateFile: (f: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}` });
  })();
  return sqlPromise;
}

// ── Web Audio Synth Sounds ────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playClick(freq = 900, duration = 0.02) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq + Math.random() * 50, ctx.currentTime);
    gain.gain.setValueAtTime(0.012, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playSuccessBeep() {
  playClick(523.25, 0.08); // C5
  setTimeout(() => playClick(659.25, 0.08), 60); // E5
  setTimeout(() => playClick(783.99, 0.15), 120); // G5
}

function playErrorBeep() {
  playClick(150, 0.15); // low buzz
  setTimeout(() => playClick(120, 0.2), 120);
}

// ── Execution Helper ──────────────────────────────────────────────
async function runWorkspace(files: Record<string, string>, activeFile: string): Promise<OutputLine[]> {
  const py = await getPyodide();
  const lines: OutputLine[] = [];
  let stdout = '';
  let stderr = '';

  py.setStdout({ batched: (s: string) => { stdout += s + '\n'; } });
  py.setStderr({ batched: (s: string) => { stderr += s + '\n'; } });

  // Write all workspace files into virtual drive
  Object.entries(files).forEach(([name, content]) => {
    py.FS.writeFile(name, content);
  });

  const mainCode = files[activeFile] || '';

  try {
    await py.runPythonAsync(mainCode);
  } catch (e: any) {
    stderr += String(e);
  } finally {
    Object.keys(files).forEach((name) => {
      try {
        py.FS.unlink(name);
      } catch (err) {}
    });
  }

  if (stdout.trim()) stdout.trim().split('\n').forEach(t => lines.push({ text: t, type: 'out' }));
  if (stderr.trim()) stderr.trim().split('\n').forEach(t => lines.push({ text: t, type: 'err' }));
  if (lines.length === 0) lines.push({ text: '(no output)', type: 'info' });
  return lines;
}

// ── SQL Execution Helper ──────────────────────────────────────────
async function runSQLWorkspace(code: string): Promise<OutputLine[]> {
  const SQL = await getSQL();
  const db = new SQL.Database();
  const lines: OutputLine[] = [];
  
  // Pre-load mock data
  db.run("CREATE TABLE employees (employee_id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INTEGER, hire_date DATE);");
  db.run("INSERT INTO employees VALUES (1, 'Alice', 'Sales', 60000, '2019-01-15'), (2, 'Bob', 'Engineering', 90000, '2021-03-22'), (3, 'Charlie', 'Sales', 65000, '2022-11-01');");
  db.run("CREATE TABLE sales (order_id INTEGER PRIMARY KEY, employee_id INTEGER, amount DECIMAL(10,2), order_date DATE);");
  db.run("INSERT INTO sales VALUES (101, 1, 1500.00, '2023-01-10'), (102, 1, 2000.50, '2023-02-15'), (103, 3, 1200.00, '2023-03-01');");

  try {
    // Basic multiple statement split
    const statements = code.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      lines.push({ text: `> ${stmt};`, type: 'info' });
      const results = db.exec(stmt + ';');
      if (results.length === 0) {
        lines.push({ text: 'Query executed successfully (no results).', type: 'info' });
      } else {
        results.forEach((res: any) => {
          const cols = res.columns.join(' | ');
          lines.push({ text: cols, type: 'out' });
          lines.push({ text: '-'.repeat(cols.length), type: 'out' });
          res.values.forEach((row: any[]) => {
            lines.push({ text: row.map((v: any) => v === null ? 'NULL' : v).join(' | '), type: 'out' });
          });
        });
      }
      lines.push({ text: '', type: 'out' });
    }
  } catch (err: any) {
    lines.push({ text: String(err), type: 'err' });
  } finally {
    db.close();
  }
  
  if (lines.length === 0) lines.push({ text: '(no output)', type: 'info' });
  return lines;
}

// ── Trace Wrapper Runner ──────────────────────────────────────────
async function traceWorkspace(files: Record<string, string>, activeFile: string): Promise<{ steps: any[]; output: OutputLine[] }> {
  const py = await getPyodide();
  let stdout = '';
  let stderr = '';

  py.setStdout({ batched: (s: string) => { stdout += s + '\n'; } });
  py.setStderr({ batched: (s: string) => { stderr += s + '\n'; } });

  // Write all workspace files into virtual drive
  Object.entries(files).forEach(([name, content]) => {
    py.FS.writeFile(name, content);
  });

  const mainCode = files[activeFile] || '';
  py.globals.set('code_to_exec', mainCode);

  const wrapperCode = `
import sys
import json

class ExecutionTracer:
    def __init__(self):
        self.steps = []
    
    def trace_lines(self, frame, event, arg):
        if event == 'line':
            if frame.f_code.co_filename != '<string>':
                return self.trace_lines
            line_no = frame.f_lineno
            locals_dict = {}
            for k, v in frame.f_locals.items():
                if not k.startswith('__') and k != 'self':
                    locals_dict[k] = self.serialize(v)
            globals_dict = {}
            for k, v in frame.f_globals.items():
                if not k.startswith('__') and k not in ('sys', 'json', 'ExecutionTracer', 'tracer_inst', 'code_to_exec'):
                    globals_dict[k] = self.serialize(v)
            self.steps.append({
                "line": line_no,
                "locals": locals_dict,
                "globals": globals_dict
            })
        return self.trace_lines

    def serialize(self, val):
        val_id = id(val)
        if isinstance(val, (int, float, str, bool)) or val is None:
            return {"type": "primitive", "val": repr(val)}
        elif isinstance(val, list):
            return {"type": "list", "val": [self.serialize(x) for x in val], "id": val_id}
        elif isinstance(val, dict):
            return {"type": "dict", "val": {str(k): self.serialize(v) for k, v in val.items()}, "id": val_id}
        elif isinstance(val, tuple):
            return {"type": "tuple", "val": [self.serialize(x) for x in val], "id": val_id}
        elif isinstance(val, set):
            return {"type": "set", "val": [self.serialize(x) for x in val], "id": val_id}
        else:
            return {"type": "object", "val": str(val), "class": val.__class__.__name__, "id": val_id}

tracer_inst = ExecutionTracer()
sys.settrace(tracer_inst.trace_lines)
try:
    code_compiled = compile(code_to_exec, '<string>', 'exec')
    exec(code_compiled, {})
except Exception as e:
    tracer_inst.steps.append({
        "line": -1,
        "error": str(e),
        "locals": {},
        "globals": {}
    })
finally:
    sys.settrace(None)

print("---TRACE_DATA_START---")
print(json.dumps(tracer_inst.steps))
print("---TRACE_DATA_END---")
`;

  try {
    await py.runPythonAsync(wrapperCode);
  } catch (e: any) {
    stderr += String(e);
  } finally {
    Object.keys(files).forEach((name) => {
      try {
        py.FS.unlink(name);
      } catch (err) {}
    });
  }

  let steps: any[] = [];
  let cleanStdout = '';
  const lines = stdout.split('\n');
  let inTrace = false;
  let traceJson = '';

  for (const line of lines) {
    if (line.includes('---TRACE_DATA_START---')) {
      inTrace = true;
      continue;
    }
    if (line.includes('---TRACE_DATA_END---')) {
      inTrace = false;
      continue;
    }
    if (inTrace) {
      traceJson += line;
    } else {
      cleanStdout += line + '\n';
    }
  }

  if (traceJson) {
    try {
      steps = JSON.parse(traceJson);
    } catch (err) {
      console.error('Failed to parse trace JSON:', err);
    }
  }

  const outputLines: OutputLine[] = [];
  if (cleanStdout.trim()) cleanStdout.trim().split('\n').forEach(t => outputLines.push({ text: t, type: 'out' }));
  if (stderr.trim()) stderr.trim().split('\n').forEach(t => outputLines.push({ text: t, type: 'err' }));
  if (outputLines.length === 0) outputLines.push({ text: '(no output)', type: 'info' });

  return { steps, output: outputLines };
}

interface Props {
  prefilledCode?: string | null;
  courseId?: string;
}

export function Playground({ prefilledCode, courseId }: Props) {
  const isCloud = courseId === 'cloud';
  const isDataAnalyst = courseId?.startsWith('data-analyst');

  // ── Workspace State ──
  const [activeLang, setActiveLang] = useState<'python' | 'sql'>('python');
  const [files, setFiles] = useState<Record<string, string>>({
    'main.py': '# Write Python here and press ▶ Run (Ctrl+Enter)\nprint("Hello from 1% Dev Academy!")\nx = [1, 2]\ny = x\ny.append(3)\nprint("x =", x)\n',
    'query.sql': '-- Write SQL here and press ▶ Run (Ctrl+Enter)\n-- A mock database (employees, sales) is pre-loaded for you!\nSELECT * FROM employees;\n'
  });
  const [activeFile, setActiveFile] = useState('main.py');
  const [newFileName, setNewFileName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // ── Linux Terminal State ──
  const [terminalHistory, setTerminalHistory] = useState<Array<{ text: string; type: 'prompt' | 'out' | 'err' | 'info' }>>([
    { text: 'Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-88-generic x86_64)', type: 'info' },
    { text: '', type: 'info' },
    { text: ' * Documentation:  https://help.ubuntu.com', type: 'info' },
    { text: ' * Management:     https://landscape.canonical.com', type: 'info' },
    { text: ' * Support:        https://ubuntu.com/pro', type: 'info' },
    { text: '', type: 'info' },
    { text: 'Welcome to 1% Dev Academy Cloud Sandbox.', type: 'info' },
    { text: 'Type "help" to view diagnostic commands.', type: 'info' },
    { text: '', type: 'info' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalDir, setTerminalDir] = useState('~');

  // ── Console Output State ──
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runCount, setRunCount] = useState(0);

  // ── Sound & Matrix Preferences ──
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanlines, setScanlines] = useState(true);

  // ── Tracer State ──
  const [isTracing, setIsTracing] = useState(false);
  const [traceSteps, setTraceSteps] = useState<any[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [hoveredHeapId, setHoveredHeapId] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);

  // Sync prefilled notes code
  useEffect(() => {
    if (prefilledCode) {
      setFiles(prev => ({ ...prev, [activeFile]: prefilledCode }));
      setOutput([]);
      setIsTracing(false);
      textareaRef.current?.focus();
    }
  }, [prefilledCode]);

  useEffect(() => {
    if (outputRef.current && output.length > 0) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    if (soundEnabled) playClick(600, 0.03);

    const promptText = `admin@onepercent-cloud:${terminalDir}$ ${cmd}`;
    const newHistory = [...terminalHistory, { text: promptText, type: 'prompt' as const }];

    const args = cmd.split(/\s+/);
    const baseCmd = args[0].toLowerCase();

    let outputText = '';
    let outputType: 'out' | 'err' | 'info' = 'out';

    switch (baseCmd) {
      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;
      case 'help':
        outputText = `Available Commands:
  ls               - List files in current directory
  cd [dir]         - Change directory
  pwd              - Print working directory
  cat [file]       - Display file contents
  whoami           - Show active user
  hostname         - Show machine hostname
  docker ps        - List active docker containers
  systemctl status - View nginx web server status
  ping [host]      - Ping network address
  curl [url]       - Send HTTP request
  clear            - Clear console screen`;
        break;
      case 'whoami':
        outputText = 'admin';
        break;
      case 'hostname':
        outputText = 'onepercent-cloud-node-01';
        break;
      case 'pwd':
        outputText = terminalDir === '~' ? '/home/admin' : `/home/admin/${terminalDir.replace('~/', '')}`;
        break;
      case 'ls':
        if (terminalDir === '~') {
          outputText = 'Dockerfile   nginx.conf   README.md   app/';
        } else if (terminalDir === '~/app') {
          outputText = 'app.py   requirements.txt';
        } else {
          outputText = '';
        }
        break;
      case 'cd':
        const target = args[1];
        if (!target || target === '~' || target === '/') {
          setTerminalDir('~');
        } else if (target === 'app' && terminalDir === '~') {
          setTerminalDir('~/app');
        } else if (target === '..') {
          setTerminalDir('~');
        } else {
          outputText = `cd: no such file or directory: ${target}`;
          outputType = 'err';
        }
        break;
      case 'cat':
        const file = args[1];
        if (!file) {
          outputText = 'cat: missing file operand';
          outputType = 'err';
        } else if (file === 'Dockerfile' && terminalDir === '~') {
          outputText = 'FROM nginx:alpine\nCOPY dist/ /usr/share/nginx/html/\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]';
        } else if (file === 'nginx.conf' && terminalDir === '~') {
          outputText = 'server {\n    listen 80;\n    location / {\n        root /usr/share/nginx/html;\n        index index.html;\n    }\n}';
        } else if (file === 'README.md' && terminalDir === '~') {
          outputText = '# 1% Cloud Node Deployment\nWelcome to your cloud sandbox. Practice Linux CLI operations here.\nTry running \'docker ps\', \'systemctl status nginx\', or \'curl localhost:80\'.';
        } else if (file === 'app.py' && terminalDir === '~/app') {
          outputText = 'import os\nprint("App running in containerized environment")';
        } else if (file === 'requirements.txt' && terminalDir === '~/app') {
          outputText = 'flask==3.0.0\ngunicorn==21.2.0';
        } else {
          outputText = `cat: ${file}: No such file or directory`;
          outputType = 'err';
        }
        break;
      case 'docker':
        if (args[1] === 'ps') {
          outputText = 'CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                NAMES\nd4b9b78a9c2b   nginx:alpine   "/docker-entrypoint.…"   2 hours ago     Up 2 hours     0.0.0.0:80->80/tcp   web-proxy';
        } else {
          outputText = 'docker: usage: docker ps';
        }
        break;
      case 'systemctl':
        if (args[1] === 'status') {
          outputText = '● nginx.service - Nginx HTTP Web Server\n     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)\n     Active: active (running) since Fri 2026-06-19 12:00:00 UTC; 2h ago\n   Main PID: 1234 (nginx)\n      Tasks: 2 (limit: 1153)\n     Memory: 8.2M\n        CPU: 120ms';
        } else {
          outputText = 'systemctl: usage: systemctl status';
        }
        break;
      case 'ping':
        if (!args[1]) {
          outputText = 'ping: missing host operand';
          outputType = 'err';
        } else {
          outputText = `PING ${args[1]} (142.250.190.46) 56(84) bytes of data.\n64 bytes from ${args[1]}: icmp_seq=1 ttl=115 time=14.2 ms\n64 bytes from ${args[1]}: icmp_seq=2 ttl=115 time=12.8 ms\n\n--- ${args[1]} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`;
        }
        break;
      case 'curl':
        if (!args[1]) {
          outputText = 'curl: missing URL';
          outputType = 'err';
        } else {
          outputText = 'HTTP/1.1 200 OK\nServer: nginx/1.25.1\nContent-Type: text/html\nContent-Length: 120\n\n<html>\n<head><title>1% Dev Academy Node</title></head>\n<body><h1>Proxy Node Active</h1></body>\n</html>';
        }
        break;
      default:
        outputText = `bash: command not found: ${baseCmd}`;
        outputType = 'err';
    }

    const lines = outputText.split('\n').map(l => ({ text: l, type: outputType }));
    setTerminalHistory([...newHistory, ...lines]);
    setTerminalInput('');
  };

  const updateFileCode = (filename: string, codeVal: string) => {
    setFiles(prev => ({ ...prev, [filename]: codeVal }));
  };

  const handleKeyPress = () => {
    if (soundEnabled) playClick();
  };

  // ── Run Command ──
  const run = useCallback(async () => {
    if (running) return;
    setIsTracing(false);
    setRunning(true);
    setLoading(true);
    setOutput([{ text: activeLang === 'sql' ? '⚡ Initializing SQL Engine...' : '⚡ Initializing Hacker Environment...', type: 'info' }]);

    try {
      let result;
      if (activeLang === 'sql') {
        result = await runSQLWorkspace(files[activeFile] || '');
      } else {
        result = await runWorkspace(files, activeFile);
      }
      setOutput(result);
      setRunCount(c => c + 1);

      // Play success/failure indicator synth notes
      const hasError = result.some(line => line.type === 'err');
      if (hasError) {
        playErrorBeep();
      } else {
        playSuccessBeep();
      }
    } catch (e: any) {
      setOutput([{ text: `Execution Error: ${e.message}`, type: 'err' }]);
      playErrorBeep();
    } finally {
      setRunning(false);
      setLoading(false);
    }
  }, [files, activeFile, running, activeLang]);

  // ── Trace Command ──
  const runTrace = async () => {
    if (running) return;
    setRunning(true);
    setLoading(true);
    setOutput([{ text: '📡 Loading Variable Tracer...', type: 'info' }]);

    try {
      const { steps, output: trOut } = await traceWorkspace(files, activeFile);
      setOutput(trOut);
      if (steps.length > 0) {
        setTraceSteps(steps);
        setCurrentStepIdx(0);
        setIsTracing(true);
        playSuccessBeep();
      } else {
        setOutput(prev => [...prev, { text: '⚠️ No lines traced. Make sure variables are declared and executed.', type: 'err' }]);
        playErrorBeep();
      }
    } catch (e: any) {
      setOutput([{ text: `Trace Error: ${e.message}`, type: 'err' }]);
      playErrorBeep();
    } finally {
      setRunning(false);
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget as HTMLTextAreaElement;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const codeVal = files[activeFile] || '';
      const newCode = codeVal.substring(0, start) + '    ' + codeVal.substring(end);
      updateFileCode(activeFile, newCode);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
    }
  };

  // Add File Dialog
  const addNewFile = () => {
    let name = newFileName.trim();
    if (!name) return;
    if (name.includes('/') || name.includes('\\')) {
      alert('Directories are not supported. Filenames must be simple basenames.');
      return;
    }
    if (!name.endsWith('.py')) name += '.py';
    if (files[name] !== undefined) {
      alert('File already exists!');
      return;
    }
    setFiles(prev => ({ ...prev, [name]: '# New file\n' }));
    setActiveFile(name);
    setNewFileName('');
    setShowAddModal(false);
    if (soundEnabled) playClick(1000, 0.05);
  };

  const deleteFile = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (filename === 'main.py') return;
    if (confirm(`Delete ${filename}?`)) {
      const nextFiles = { ...files };
      delete nextFiles[filename];
      setFiles(nextFiles);
      if (activeFile === filename) {
        setActiveFile('main.py');
      }
      if (soundEnabled) playClick(500, 0.08);
    }
  };

  const activeCode = files[activeFile] || '';
  const lineCount = activeCode.split('\n').length;

  // ── Trace step rendering helpers ──
  const currentStep = traceSteps[currentStepIdx];
  const highlightedLine = currentStep ? currentStep.line : -1;

  // Extract heap objects from serialization tree
  const heapObjects: Record<number, { type: string; val: any; class?: string }> = {};
  const collectHeapObjects = (obj: any) => {
    if (obj && typeof obj === 'object' && obj.id) {
      heapObjects[obj.id] = { type: obj.type, val: obj.val, class: obj.class };
      if (Array.isArray(obj.val)) {
        obj.val.forEach((item: any) => collectHeapObjects(item));
      } else if (obj.type === 'dict' && obj.val) {
        Object.values(obj.val).forEach((item: any) => collectHeapObjects(item));
      }
    }
  };

  if (currentStep) {
    Object.values(currentStep.locals).forEach(collectHeapObjects);
    Object.values(currentStep.globals).forEach(collectHeapObjects);
  }

  return (
    <div className={`playground hacker-theme ${scanlines ? 'crt-scanlines' : ''}`}>
      {/* Dynamic Stylings */}
      <style>{`
        .hacker-theme {
          background: #000000 !important;
          border: 2px solid #333333 !important;
          box-shadow: none !important;
          color: #ffffff !important;
          position: relative;
        }
        .crt-scanlines::after {
          display: none;
        }
        .hacker-header {
          background: #000000 !important;
          border-bottom: 1px solid #333333 !important;
          padding: 0 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          height: 38px !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
        }
        .hacker-title-text {
          color: #ffffff !important;
          textShadow: "none",
          font-family: 'Space Mono', monospace !important;
          font-weight: bold;
          font-size: 0.72rem !important;
          white-space: nowrap !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .lang-switcher {
          display: flex;
          background: #222;
          border-radius: 4px;
          overflow: hidden;
          margin-left: 10px;
        }
        .lang-tab {
          padding: 2px 10px;
          font-size: 0.7rem;
          cursor: pointer;
          font-family: 'Space Mono', monospace;
          color: #888;
          transition: 0.2s;
        }
        .lang-tab.active {
          background: #444;
          color: #fff;
        }
        .playground-controls {
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
          height: 100% !important;
        }
        .hacker-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 26px !important;
          box-sizing: border-box !important;
          background: transparent !important;
          border: 1px solid #444444 !important;
          color: #ffffff !important;
          textShadow: "none",
          padding: 0 8px !important;
          font-size: 0.7rem !important;
          font-family: 'Space Mono', monospace !important;
          white-space: nowrap !important;
          cursor: pointer !important;
          transition: all 0.1s ease !important;
          border-radius: 4px !important;
        }
        .hacker-btn:hover:not(:disabled) {
          background: #333333 !important;
          color: #ffffff !important;
          box-shadow: none;
        }
        .hacker-btn:disabled {
          opacity: 0.4;
          border-color: #333333 !important;
          color: #555555 !important;
          textShadow: "none",
          cursor: not-allowed;
        }
        .hacker-btn.active-run {
          border-color: #ffffff !important;
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow: none;
        }
        /* Tab Styles */
        .workspace-tab-row {
          display: flex;
          background: #000000;
          border-bottom: 1px solid #333333;
          align-items: center;
          padding: 0 8px;
          overflow-x: auto;
        }
        .w-tab {
          padding: 6px 12px;
          font-size: 0.75rem;
          color: #999999;
          border-right: 1px solid #333333;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
          background: transparent;
          border-bottom: 2px solid transparent;
        }
        .w-tab.active {
          color: #ffffff;
          textShadow: "none",
          background: #111111;
          border-bottom: 2px solid #ffffff;
        }
        .w-tab:hover:not(.active) {
          background: #111111;
          color: #ffffff;
        }
        .w-tab-close {
          border: none;
          background: transparent;
          color: #005500;
          cursor: pointer;
          font-weight: bold;
          font-size: 0.7rem;
        }
        .w-tab-close:hover {
          color: #ff4444;
        }
        .w-tab-add {
          padding: 4px 8px;
          color: #ffffff;
          cursor: pointer;
          font-weight: bold;
          background: none;
          border: none;
        }
        .w-tab-add:hover {
          textShadow: "none",
        }
        
        /* Layout Grid */
        .hacker-workspace {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        
        /* Trace Grid split */
        .tracer-grid-split {
          display: grid;
          grid-template-columns: 50% 50%;
          flex: 1;
          min-height: 0;
        }
        .tracer-left-code {
          border-right: 2px solid #333333;
          overflow-y: auto;
          background: #000000;
          padding: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          line-height: 1.6;
        }
        .trace-line-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          opacity: 0.55;
          transition: all 0.1s ease;
        }
        .trace-line-item.active {
          background: #222222;
          border-left: 3px solid #ffffff;
          opacity: 1;
          color: #ffffff;
          textShadow: "none",
          padding-left: 5px;
        }
        .trace-line-num {
          color: #666666;
          width: 24px;
          text-align: right;
          flex-shrink: 0;
          user-select: none;
        }
        .trace-line-content {
          white-space: pre-wrap;
        }
        
        /* Trace Visualizer side */
        .tracer-visuals {
          overflow-y: auto;
          padding: 12px;
          background: #000000;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .visual-panel-card {
          border: 1px solid #ffffff;
          background: rgba(0, 30, 0, 0.3);
          box-shadow: 0 0 6px rgba(0, 255, 0, 0.1);
          padding: 8px;
        }
        .visual-panel-title {
          font-size: 0.7rem;
          font-weight: bold;
          text-transform: uppercase;
          color: #ffffff;
          border-bottom: 1px dashed #ffffff;
          padding-bottom: 4px;
          margin-bottom: 8px;
          letter-spacing: 0.08em;
        }
        .vars-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .var-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          background: rgba(0, 255, 0, 0.03);
          padding: 4px 8px;
          border: 1px solid #333333;
        }
        .var-name {
          color: #ffffff;
          font-weight: bold;
        }
        .var-val-primitive {
          color: #dddddd;
        }
        .var-val-ref {
          color: #a3b2be;
          cursor: pointer;
          text-decoration: underline;
        }
        .heap-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .heap-box {
          border: 1px solid #a3b2be;
          background: rgba(0, 40, 40, 0.2);
          padding: 6px;
          font-size: 0.72rem;
          min-width: 90px;
          transition: all 0.2s ease;
        }
        .heap-box.highlighted {
          border-color: #ffffff;
          box-shadow: 0 0 10px #ffffff;
          transform: scale(1.05);
        }
        .heap-box-title {
          font-size: 0.65rem;
          color: #a3b2be;
          font-weight: bold;
          border-bottom: 1px dashed #555555;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .heap-box.highlighted .heap-box-title {
          color: #ffffff;
          border-color: #ffffff;
        }
        .heap-cells {
          display: flex;
          gap: 4px;
        }
        .heap-cell {
          border: 1px solid #555555;
          padding: 2px 5px;
          text-align: center;
          background: rgba(0,0,0,0.4);
        }
        .heap-box.highlighted .heap-cell {
          border-color: #ffffff;
        }
        .heap-dict-row {
          display: flex;
          justify-content: space-between;
          gap: 6px;
          font-size: 0.65rem;
        }
        
        /* Modal */
        .hacker-modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .hacker-modal {
          border: 2px solid #ffffff;
          background: #000000;
          padding: 16px;
          width: 80%;
          max-width: 300px;
          box-shadow: 0 0 20px rgba(0,255,0,0.3);
        }
        .hacker-input {
          width: 100%;
          background: #111111;
          border: 1px solid #ffffff;
          color: #ffffff;
          padding: 4px 8px;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          outline: none;
          margin: 12px 0;
        }
      `}</style>

      {/* Header & Workspace Conditionally Rendered */}
      {isCloud ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000000', border: '2px solid #000000', borderRadius: '0', minHeight: 0 }}>
          <div className="playground-header hacker-header" style={{ background: '#000000', borderBottom: '1px solid #333333', flexShrink: 0 }}>
            <div className="playground-title">
              <span className="playground-icon hacker-title-text" style={{ color: '#ffffff', textShadow: 'none' }}>⚡ LINUX TERMINAL Sandbox</span>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', overflowY: 'auto' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', flexShrink: 0 }}>
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            <h3 style={{ color: '#ffffff', fontFamily: 'var(--font-ui)', marginBottom: '6px', fontSize: '1.1rem' }}>Practice Linux Commands</h3>
            <p style={{ color: '#a3b2be', fontFamily: 'var(--font-content)', fontSize: '0.85rem', marginBottom: '16px', maxWidth: '300px' }}>
              We recommend using WebTerm for a full, free Linux terminal experience right in your browser.
            </p>
            <a 
              href="https://webterm.app/en/free-play" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hacker-btn"
              style={{ padding: '8px 24px', height: 'auto', fontSize: '0.85rem', background: '#ffffff', color: '#000000', textDecoration: 'none', fontWeight: 'bold', flexShrink: 0 }}
            >
              Launch Terminal ↗
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* ── HEADER ── */}
          <div className="hacker-header">
            <div className="hacker-title-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              1% DEV PLAYGROUND
              
              {isDataAnalyst && (
                <div className="lang-switcher">
                  <div 
                    className={`lang-tab ${activeLang === 'python' ? 'active' : ''}`}
                    onClick={() => { setActiveLang('python'); setActiveFile('main.py'); }}
                  >
                    Python
                  </div>
                  <div 
                    className={`lang-tab ${activeLang === 'sql' ? 'active' : ''}`}
                    onClick={() => { setActiveLang('sql'); setActiveFile('query.sql'); }}
                  >
                    SQL
                  </div>
                </div>
              )}
            </div>
            <div className="playground-controls">
              <button
                className="hacker-btn"
                style={{ opacity: soundEnabled ? 1 : 0.4 }}
                onClick={() => setSoundEnabled(prev => !prev)}
                title="Toggle Typing Sound Effects"
              >
                {soundEnabled ? '🔊 Sound' : '🔇 Sound'}
              </button>
              <button
                className="hacker-btn"
                style={{ opacity: scanlines ? 1 : 0.4 }}
                onClick={() => setScanlines(prev => !prev)}
                title="Toggle Retro Screen Filter"
              >
                {scanlines ? '📺 CRT' : '📺 CRT'}
              </button>
              <button
                className="hacker-btn"
                onClick={() => {
                  if (typeof window === 'undefined') return;
                  const content = files[activeFile] || '';
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = activeFile;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  if (soundEnabled) playClick(800, 0.05);
                }}
                title="Download active file"
              >
                📥 Download
              </button>
              <button
                className="hacker-btn pg-clear"
                onClick={() => {
                  setFiles({ 'main.py': '# Cleared\n' });
                  setActiveFile('main.py');
                  setOutput([]);
                  setIsTracing(false);
                  if (soundEnabled) playClick(400, 0.1);
                }}
                title="Clear current workspace and log"
              >
                Reset
              </button>
              <button
                className="hacker-btn"
                style={{ borderColor: '#a3b2be', color: '#a3b2be', textShadow: '0 0 3px #a3b2be' }}
                onClick={isTracing ? () => setIsTracing(false) : runTrace}
                disabled={running}
                title="Step-by-step memory trace visualizer"
              >
                {isTracing ? '📝 Editor' : '🔍 Trace'}
              </button>
              <button
                className="hacker-btn active-run"
                onClick={() => run()}
                disabled={running}
                title="Run active script (Ctrl+Enter)"
              >
                {running ? '⏳ Executing' : '▶ Execute'}
              </button>
            </div>
          </div>

          {/* Workspace Area */}
          <div className="hacker-workspace">
            {/* Workspace Tab bar (Only in Editor Mode) */}
            {!isTracing && (
              <div className="workspace-tab-row">
                {Object.keys(files).map(name => (
                  <div
                    key={name}
                    className={`w-tab ${activeFile === name ? 'active' : ''}`}
                    onClick={() => {
                      setActiveFile(name);
                      if (soundEnabled) playClick(1200, 0.02);
                    }}
                  >
                    <span>📄 {name}</span>
                    {name !== 'main.py' && name !== 'query.sql' && (
                      <button className="w-tab-close" onClick={(e) => deleteFile(name, e)}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button className="w-tab-add" onClick={() => setShowAddModal(true)} title="Add custom helper file">
                  + [Add File]
                </button>
                <label className="w-tab-add" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} title="Upload code files from your system">
                  📂 [Upload File]
                  <input
                    type="file"
                    accept=".py,.txt,.js,.json,.sh"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        setFiles(prev => ({ ...prev, [file.name]: content }));
                        setActiveFile(file.name);
                        if (soundEnabled) playClick(1000, 0.05);
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>
            )}

            {/* Dynamic Inner Layout */}
            {!isTracing ? (
              /* 1. EDITOR MODE */
              <div className="editor-area">
                <div className="line-numbers" aria-hidden="true" style={{ background: '#030803', borderColor: '#333333' }}>
                  {Array.from({ length: lineCount }, (_, i) => (
                    <span key={i} style={{ color: '#006600' }}>{i + 1}</span>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  value={files[activeFile] || ''}
                  onChange={(e) => updateFileCode(activeFile, e.target.value)}
                  onKeyDown={onKeyDown}
                  className="editor-textarea"
                  spellCheck="false"
                />
              </div>
            ) : (
              /* 2. TRACER MEMORY VISUALIZER MODE */
              <div className="tracer-grid-split">
                <div className="tracer-left-code">
                  {(files[activeFile] || '').split('\n').map((lineText, idx) => {
                    const isCurrentLine = traceSteps[currentStepIdx]?.line === idx + 1;
                    return (
                      <div key={idx} className={`trace-line-item ${isCurrentLine ? 'active' : ''}`}>
                        <span className="trace-line-num">{idx + 1}</span>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{lineText}</pre>
                      </div>
                    );
                  })}
                </div>
                <div className="tracer-right-visuals">
                  {/* Step Control Buttons */}
                  <div className="trace-controls">
                    <button
                      className="hacker-btn mini"
                      onClick={() => setCurrentStepIdx(0)}
                      disabled={currentStepIdx === 0}
                    >
                      ⏮ First
                    </button>
                    <button
                      className="hacker-btn mini"
                      onClick={() => setCurrentStepIdx(idx => Math.max(0, idx - 1))}
                      disabled={currentStepIdx === 0}
                    >
                      ◀ Prev
                    </button>
                    <span style={{ fontSize: '0.7rem', color: '#ffffff', fontWeight: 'bold' }}>
                      Step {currentStepIdx + 1} / {traceSteps.length}
                    </span>
                    <button
                      className="hacker-btn mini"
                      onClick={() => setCurrentStepIdx(idx => Math.min(traceSteps.length - 1, idx + 1))}
                      disabled={currentStepIdx === traceSteps.length - 1}
                    >
                      Next ▶
                    </button>
                    <button
                      className="hacker-btn mini"
                      onClick={() => setCurrentStepIdx(traceSteps.length - 1)}
                      disabled={currentStepIdx === traceSteps.length - 1}
                    >
                      Last ⏭
                    </button>
                  </div>

                  <div className="visuals-canvas">
                    {/* Heap/Memory visual cards */}
                    {traceSteps.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto' }}>
                        {/* 1. Global Frame panel */}
                        <div className="visual-panel">
                          <div className="visual-panel-title">Globals Frame</div>
                          <div className="vars-grid">
                            {Object.entries(traceSteps[currentStepIdx]?.globals || {}).map(([name, item]: [string, any]) => (
                              <div key={name} className="var-row">
                                <span className="var-name">{name}</span>
                                {item.type === 'primitive' ? (
                                  <span className="var-val-primitive">{JSON.stringify(item.val)}</span>
                                ) : (
                                  <span
                                    className="var-val-ref"
                                    onMouseEnter={() => setHoveredHeapId(item.id)}
                                    onMouseLeave={() => setHoveredHeapId(null)}
                                  >
                                    ref:0x{item.id.toString(16)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Heap memory structures panel */}
                        <div className="visual-panel" style={{ flex: 1 }}>
                          <div className="visual-panel-title">Heap Memory Objects</div>
                          <div className="heap-grid">
                            {Object.entries(traceSteps[currentStepIdx]?.heap || {}).map(([idStr, info]: [string, any]) => {
                              const id = parseInt(idStr);
                              const isHighlighted = hoveredHeapId === id;
                              return (
                                <div key={id} className={`heap-box ${isHighlighted ? 'highlighted' : ''}`}>
                                  <div className="heap-box-title">
                                    {info.type.toUpperCase()} @0x{id.toString(16)}
                                  </div>

                                  {/* List details */}
                                  {info.type === 'list' && Array.isArray(info.val) && (
                                    <div className="heap-cells">
                                      {info.val.map((item: any, idx: number) => (
                                        <div key={idx} className="heap-cell">
                                          {item.type === 'primitive' ? (
                                            <span style={{ color: '#dddddd' }}>{JSON.stringify(item.val)}</span>
                                          ) : (
                                            <span
                                              style={{ color: '#a3b2be', cursor: 'pointer', textDecoration: 'underline' }}
                                              onMouseEnter={() => setHoveredHeapId(item.id)}
                                              onMouseLeave={() => setHoveredHeapId(null)}
                                            >
                                              ref:0x{item.id.toString(16)}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Dict details */}
                                  {info.type === 'dict' && typeof info.val === 'object' && info.val !== null && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      {Object.entries(info.val).map(([k, item]: [string, any]) => (
                                        <div key={k} className="heap-dict-row">
                                          <span style={{ color: '#dddddd' }}>{k}:</span>
                                          {item.type === 'primitive' ? (
                                            <span style={{ color: '#ffffff' }}>{JSON.stringify(item.val)}</span>
                                          ) : (
                                            <span
                                              style={{ color: '#a3b2be', cursor: 'pointer', textDecoration: 'underline' }}
                                              onMouseEnter={() => setHoveredHeapId(item.id)}
                                              onMouseLeave={() => setHoveredHeapId(null)}
                                            >
                                              ref:0x{item.id.toString(16)}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Tuples details */}
                                  {info.type === 'tuple' && Array.isArray(info.val) && (
                                    <div style={{ color: '#ffffff' }}>
                                      {'(' + info.val.map((item: any) => (item.type === 'primitive' ? item.val : `ref:0x${item.id.toString(16)}`)).join(', ') + ')'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Output Console Panel */}
          <div className="output-panel" style={{ borderTopColor: '#333333' }}>
            <div className="output-header hacker-header">
              <span className="output-label hacker-title-text">&gt;_ OUTPUT</span>
              {runCount > 0 && (
                <span className="output-runs" style={{ color: '#666666', textShadow: 'none' }}>
                  COMPILER EXECUTION: {runCount} COMPLETE
                </span>
              )}
              {output.length > 0 && (
                <button
                  className="output-clear-btn hacker-btn"
                  onClick={() => {
                    setOutput([]);
                    if (soundEnabled) playClick(300, 0.05);
                  }}
                >
                  Clear Logs
                </button>
              )}
            </div>
            <div
              className="output-body"
              ref={outputRef}
              style={{ background: '#000000', padding: '10px 14px', fontFamily: 'Space Mono, monospace' }}
            >
              {output.length === 0 ? (
                <span className="output-placeholder" style={{ color: '#666666' }}>
                  System idle. Write code and press ▶ Execute to compile...
                </span>
              ) : (
                output.map((line, i) => (
                  <div
                    key={i}
                    className={`output-line output-${line.type}`}
                    style={{
                      color: line.type === 'err' ? '#ff4444' : line.type === 'info' ? '#a3b2be' : '#ffffff',
                      textShadow: 'none',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.75rem',
                      lineHeight: '1.4'
                    }}
                  >
                    {line.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Add File Modal popup */}
      {showAddModal && (
        <div className="hacker-modal-overlay">
          <div className="hacker-modal">
            <div style={{ color: '#ffffff', textShadow: '0 0 5px #ffffff', fontSize: '0.75rem', fontWeight: 'bold' }}>
              📂 INITIALIZE NEW HELPER MODULE
            </div>
            <input
              type="text"
              className="hacker-input"
              placeholder="e.g. math_ops.py"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addNewFile();
                if (e.key === 'Escape') setShowAddModal(false);
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                className="hacker-btn"
                style={{ borderColor: '#ff4444', color: '#ff4444' }}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="hacker-btn active-run" onClick={addNewFile}>
                Create File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
