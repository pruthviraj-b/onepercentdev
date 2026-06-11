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

// ── Web Audio Synth Sounds ────────────────────────────────────────
function playClick(freq = 900, duration = 0.02) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  }

  if (stdout.trim()) stdout.trim().split('\n').forEach(t => lines.push({ text: t, type: 'out' }));
  if (stderr.trim()) stderr.trim().split('\n').forEach(t => lines.push({ text: t, type: 'err' }));
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
}

export function Playground({ prefilledCode }: Props) {
  // ── Workspace State ──
  const [files, setFiles] = useState<Record<string, string>>({
    'main.py': '# Write Python here and press ▶ Run (Ctrl+Enter)\nprint("Hello from 1% Dev Academy!")\nx = [1, 2]\ny = x\ny.append(3)\nprint("x =", x)\n'
  });
  const [activeFile, setActiveFile] = useState('main.py');
  const [newFileName, setNewFileName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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
    setOutput([{ text: '⚡ Initializing Hacker Environment...', type: 'info' }]);

    try {
      const result = await runWorkspace(files, activeFile);
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
      setOutput([{ text: `Compilation Error: ${e.message}`, type: 'err' }]);
      playErrorBeep();
    } finally {
      setRunning(false);
      setLoading(false);
    }
  }, [files, activeFile, running]);

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
          background: #050a05 !important;
          border: 2px solid #00ff00 !important;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.2) !important;
          color: #00ff00 !important;
          position: relative;
        }
        .crt-scanlines::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 999;
          background-size: 100% 4px, 3px 100%;
          pointer-events: none;
        }
        .hacker-header {
          background: #001f00 !important;
          border-bottom: 2px solid #00ff00 !important;
          padding: 0 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          height: 38px !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
        }
        .hacker-title-text {
          color: #00ff00 !important;
          text-shadow: 0 0 5px #00ff00;
          font-family: 'Space Mono', monospace !important;
          font-weight: bold;
          font-size: 0.72rem !important;
          white-space: nowrap !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
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
          border: 1px solid #00ff00 !important;
          color: #00ff00 !important;
          text-shadow: 0 0 3px #00ff00;
          padding: 0 8px !important;
          font-size: 0.7rem !important;
          font-family: 'Space Mono', monospace !important;
          white-space: nowrap !important;
          cursor: pointer !important;
          transition: all 0.1s ease !important;
        }
        .hacker-btn:hover:not(:disabled) {
          background: #00ff00 !important;
          color: #050a05 !important;
          box-shadow: 0 0 10px #00ff00;
        }
        .hacker-btn:disabled {
          opacity: 0.4;
          border-color: #004400 !important;
          color: #004400 !important;
          text-shadow: none;
          cursor: not-allowed;
        }
        .hacker-btn.active-run {
          border-color: #00ff00 !important;
          background: #00ff00 !important;
          color: #000000 !important;
          box-shadow: 0 0 10px #00ff00;
        }
        /* Tab Styles */
        .workspace-tab-row {
          display: flex;
          background: #001200;
          border-bottom: 1px solid #003a00;
          align-items: center;
          padding: 0 8px;
          overflow-x: auto;
        }
        .w-tab {
          padding: 6px 12px;
          font-size: 0.75rem;
          color: #00aa00;
          border-right: 1px solid #002200;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
          background: transparent;
          border-bottom: 2px solid transparent;
        }
        .w-tab.active {
          color: #00ff00;
          text-shadow: 0 0 4px #00ff00;
          background: #050a05;
          border-bottom: 2px solid #00ff00;
        }
        .w-tab:hover:not(.active) {
          background: rgba(0, 255, 0, 0.05);
          color: #00ff00;
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
          color: #ff3333;
        }
        .w-tab-add {
          padding: 4px 8px;
          color: #00ff00;
          cursor: pointer;
          font-weight: bold;
          background: none;
          border: none;
        }
        .w-tab-add:hover {
          text-shadow: 0 0 5px #00ff00;
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
          border-right: 2px solid #003300;
          overflow-y: auto;
          background: #030603;
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
          background: #002200;
          border-left: 3px solid #00ff00;
          opacity: 1;
          color: #00ff00;
          text-shadow: 0 0 5px #00ff00;
          padding-left: 5px;
        }
        .trace-line-num {
          color: #008800;
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
          background: #050a05;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .visual-panel-card {
          border: 1px solid #00ff00;
          background: rgba(0, 30, 0, 0.3);
          box-shadow: 0 0 6px rgba(0, 255, 0, 0.1);
          padding: 8px;
        }
        .visual-panel-title {
          font-size: 0.7rem;
          font-weight: bold;
          text-transform: uppercase;
          color: #00ff00;
          border-bottom: 1px dashed #00ff00;
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
          border: 1px solid #003300;
        }
        .var-name {
          color: #00ff00;
          font-weight: bold;
        }
        .var-val-primitive {
          color: #88ff88;
        }
        .var-val-ref {
          color: #00ffff;
          cursor: pointer;
          text-decoration: underline;
        }
        .heap-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .heap-box {
          border: 1px solid #00ffff;
          background: rgba(0, 40, 40, 0.2);
          padding: 6px;
          font-size: 0.72rem;
          min-width: 90px;
          transition: all 0.2s ease;
        }
        .heap-box.highlighted {
          border-color: #00ff00;
          box-shadow: 0 0 10px #00ff00;
          transform: scale(1.05);
        }
        .heap-box-title {
          font-size: 0.65rem;
          color: #00ffff;
          font-weight: bold;
          border-bottom: 1px dashed #008888;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .heap-box.highlighted .heap-box-title {
          color: #00ff00;
          border-color: #00ff00;
        }
        .heap-cells {
          display: flex;
          gap: 4px;
        }
        .heap-cell {
          border: 1px solid #008888;
          padding: 2px 5px;
          text-align: center;
          background: rgba(0,0,0,0.4);
        }
        .heap-box.highlighted .heap-cell {
          border-color: #00ff00;
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
          border: 2px solid #00ff00;
          background: #050a05;
          padding: 16px;
          width: 80%;
          max-width: 300px;
          box-shadow: 0 0 20px rgba(0,255,0,0.3);
        }
        .hacker-input {
          width: 100%;
          background: #001a00;
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 4px 8px;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
          outline: none;
          margin: 12px 0;
        }
      `}</style>

      {/* Header */}
      <div className="playground-header hacker-header">
        <div className="playground-title">
          <span className="playground-icon hacker-title-text">⚡ HACKER SHELL 🟩</span>
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
            style={{ borderColor: '#00ffff', color: '#00ffff', textShadow: '0 0 3px #00ffff' }}
            onClick={isTracing ? () => setIsTracing(false) : runTrace}
            disabled={running}
            title="Step-by-step memory trace visualizer"
          >
            {isTracing ? '📝 Editor' : '🔍 Trace'}
          </button>
          <button
            className="hacker-btn active-run"
            onClick={run}
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
                {name !== 'main.py' && (
                  <button className="w-tab-close" onClick={(e) => deleteFile(name, e)}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button className="w-tab-add" onClick={() => setShowAddModal(true)} title="Add custom helper file">
              + [Add File]
            </button>
          </div>
        )}

        {/* Dynamic Inner Layout */}
        {!isTracing ? (
          /* 1. EDITOR MODE */
          <div className="editor-area">
            <div className="line-numbers" aria-hidden="true" style={{ background: '#030803', borderColor: '#003300' }}>
              {Array.from({ length: lineCount }, (_, i) => (
                <span key={i} style={{ color: '#006600' }}>{i + 1}</span>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              className="code-editor"
              style={{ background: '#050a05', color: '#00ff00' }}
              value={activeCode}
              onChange={e => updateFileCode(activeFile, e.target.value)}
              onKeyDown={onKeyDown}
              onKeyPress={handleKeyPress}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder="# Write Python code here..."
            />
          </div>
        ) : (
          /* 2. MEMORY MODEL TRACER MODE */
          <div className="tracer-grid-split">
            {/* Left side: Highlighted Code */}
            <div className="tracer-left-code">
              <div style={{ color: '#00aa00', fontSize: '0.7rem', borderBottom: '1px solid #003300', paddingBottom: 4, marginBottom: 8 }}>
                📍 TRACING INTERACTIVE VIEW: {activeFile}
              </div>
              {activeCode.split('\n').map((lineText, idx) => {
                const isCurrent = (idx + 1) === highlightedLine;
                return (
                  <div key={idx} className={`trace-line-item ${isCurrent ? 'active' : ''}`}>
                    <span className="trace-line-num">{idx + 1}</span>
                    <span className="trace-line-content">{lineText || ' '}</span>
                  </div>
                );
              })}
            </div>

            {/* Right side: Scopes & Pointer diagrams */}
            <div className="tracer-visuals">
              {/* Stepper Control Panel */}
              <div className="visual-panel-card" style={{ background: '#001a00', borderColor: '#00ff00' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>
                    STEP {currentStepIdx + 1} OF {traceSteps.length}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="hacker-btn"
                      onClick={() => {
                        setCurrentStepIdx(i => Math.max(0, i - 1));
                        if (soundEnabled) playClick(700, 0.05);
                      }}
                      disabled={currentStepIdx === 0}
                    >
                      &lt; Back
                    </button>
                    <button
                      className="hacker-btn"
                      onClick={() => {
                        setCurrentStepIdx(i => Math.min(traceSteps.length - 1, i + 1));
                        if (soundEnabled) playClick(1000, 0.05);
                      }}
                      disabled={currentStepIdx === traceSteps.length - 1}
                    >
                      Next &gt;
                    </button>
                    <button
                      className="hacker-btn"
                      style={{ borderColor: '#ff3333', color: '#ff3333' }}
                      onClick={() => {
                        setIsTracing(false);
                        if (soundEnabled) playClick(500, 0.1);
                      }}
                    >
                      Exit Trace
                    </button>
                  </div>
                </div>
              </div>

              {/* Stack Scopes */}
              <div className="visual-panel-card">
                <div className="visual-panel-title">📚 Active Stack Frames</div>
                {currentStep ? (
                  <div className="vars-grid">
                    {/* Global Scope Variables */}
                    {Object.keys(currentStep.globals).length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#00aa00', marginBottom: 2 }}>GLOBAL</div>
                        {Object.entries(currentStep.globals).map(([name, rawObj]) => {
                          const serializedObj = rawObj as any;
                          const isRef = serializedObj.type !== 'primitive';
                          return (
                            <div key={name} className="var-row">
                              <span className="var-name">{name}</span>
                              {isRef ? (
                                <span
                                  className="var-val-ref"
                                  onMouseEnter={() => setHoveredHeapId(serializedObj.id)}
                                  onMouseLeave={() => setHoveredHeapId(null)}
                                >
                                  ref {serializedObj.type} (0x{serializedObj.id.toString(16)})
                                </span>
                              ) : (
                                <span className="var-val-primitive">{serializedObj.val}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Local Scope Variables */}
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: '0.65rem', color: '#00aa00', marginBottom: 2 }}>LOCALS (current execution scope)</div>
                      {Object.keys(currentStep.locals).length === 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#005500', fontStyle: 'italic' }}>(no local variables initialized)</div>
                      )}
                      {Object.keys(currentStep.locals).length > 0 && (
                        Object.entries(currentStep.locals).map(([name, rawObj]) => {
                          const serializedObj = rawObj as any;
                          const isRef = serializedObj.type !== 'primitive';
                          return (
                            <div key={name} className="var-row">
                              <span className="var-name">{name}</span>
                              {isRef ? (
                                <span
                                  className="var-val-ref"
                                  onMouseEnter={() => setHoveredHeapId(serializedObj.id)}
                                  onMouseLeave={() => setHoveredHeapId(null)}
                                >
                                  ref {serializedObj.type} (0x{serializedObj.id.toString(16)})
                                </span>
                              ) : (
                                <span className="var-val-primitive">{serializedObj.val}</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.72rem', color: '#00ff00' }}>No execution trace running.</div>
                )}
              </div>

              {/* Heap Scopes */}
              <div className="visual-panel-card" style={{ borderColor: '#00ffff' }}>
                <div className="visual-panel-title" style={{ color: '#00ffff', borderColor: '#00ffff' }}>
                  💾 Heap Objects (Dynamic References)
                </div>
                <div className="heap-grid">
                  {Object.keys(heapObjects).length === 0 ? (
                    <div style={{ fontSize: '0.7rem', color: '#008888', fontStyle: 'italic' }}>(no dynamic heap objects in memory)</div>
                  ) : (
                    Object.entries(heapObjects).map(([idStr, info]) => {
                      const idNum = Number(idStr);
                      const isHighlighted = hoveredHeapId === idNum;
                      return (
                        <div key={idStr} className={`heap-box ${isHighlighted ? 'highlighted' : ''}`}>
                          <div className="heap-box-title">
                            {info.type.toUpperCase()} (0x{idNum.toString(16)})
                          </div>

                          {/* List elements visual grid */}
                          {info.type === 'list' && Array.isArray(info.val) && (
                            <div className="heap-cells">
                              {info.val.map((rawItem: any, i: number) => {
                                const item = rawItem as any;
                                return (
                                  <div key={i} className="heap-cell">
                                    <div style={{ fontSize: '0.55rem', color: '#00aaaa', marginBottom: 2 }}>{i}</div>
                                    <div style={{ color: '#ffffff' }}>
                                      {item.type === 'primitive' ? item.val : `ref:0x${item.id.toString(16)}`}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Dictionary details visual layout */}
                          {info.type === 'dict' && typeof info.val === 'object' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {Object.entries(info.val).map(([key, rawItem]) => {
                                const item = rawItem as any;
                                return (
                                  <div key={key} className="heap-dict-row">
                                    <span style={{ color: '#00ffff' }}>"{key}":</span>
                                    <span style={{ color: '#ffffff' }}>
                                      {item.type === 'primitive' ? item.val : `ref:0x${item.id.toString(16)}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Sets details visual layout */}
                          {info.type === 'set' && Array.isArray(info.val) && (
                            <div style={{ fontSize: '0.7rem', color: '#ffffff' }}>
                              {'{ ' + info.val.map((item: any) => (item.type === 'primitive' ? item.val : `ref:0x${item.id.toString(16)}`)).join(', ') + ' }'}
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
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Output Console Panel */}
      <div className="output-panel" style={{ borderTopColor: '#00ff00' }}>
        <div className="output-header hacker-header">
          <span className="output-label hacker-title-text">&gt;_ SYSTEM TERMINAL</span>
          {runCount > 0 && (
            <span className="output-runs" style={{ color: '#00ff00', textShadow: '0 0 3px #00ff00' }}>
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
          style={{ background: '#030603', padding: '10px 14px', fontFamily: 'Space Mono, monospace' }}
        >
          {output.length === 0 ? (
            <span className="output-placeholder" style={{ color: '#004400' }}>
              System idle. Write code and press ▶ Execute to compile...
            </span>
          ) : (
            output.map((line, i) => (
              <div
                key={i}
                className={`output-line output-${line.type}`}
                style={{
                  color: line.type === 'err' ? '#ff3333' : line.type === 'info' ? '#00ffff' : '#00ff00',
                  textShadow: line.type === 'err' ? '0 0 3px #ff3333' : line.type === 'info' ? '0 0 3px #00ffff' : '0 0 3px #00ff00',
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

      {/* Add File Modal popup */}
      {showAddModal && (
        <div className="hacker-modal-overlay">
          <div className="hacker-modal">
            <div style={{ color: '#00ff00', textShadow: '0 0 5px #00ff00', fontSize: '0.75rem', fontWeight: 'bold' }}>
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
                style={{ borderColor: '#ff3333', color: '#ff3333' }}
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
