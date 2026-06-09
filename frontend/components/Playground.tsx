'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type OutputLine = { text: string; type: 'out' | 'err' | 'info' };

// ── Pyodide (real CPython in browser, loads once then cached) ─────
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

async function runCode(code: string): Promise<OutputLine[]> {
  const py = await getPyodide();
  const lines: OutputLine[] = [];
  let stdout = '';
  let stderr = '';

  py.setStdout({ batched: (s: string) => { stdout += s + '\n'; } });
  py.setStderr({ batched: (s: string) => { stderr += s + '\n'; } });

  try {
    await py.runPythonAsync(code);
  } catch (e: any) {
    stderr += String(e);
  }

  if (stdout.trim()) stdout.trim().split('\n').forEach(t => lines.push({ text: t, type: 'out' }));
  if (stderr.trim()) stderr.trim().split('\n').forEach(t => lines.push({ text: t, type: 'err' }));
  if (lines.length === 0) lines.push({ text: '(no output)', type: 'info' });
  return lines;
}

interface Props {
  prefilledCode?: string | null;
}

export function Playground({ prefilledCode }: Props) {
  const [code, setCode] = useState('# Write Python here and press ▶ Run (Ctrl+Enter)\nprint("Hello from 1% Dev Academy!")');
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefilledCode) {
      setCode(prefilledCode);
      setOutput([]);
      textareaRef.current?.focus();
    }
  }, [prefilledCode]);

  useEffect(() => {
    if (outputRef.current && output.length > 0) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const run = useCallback(async () => {
    if (running || !code.trim()) return;
    setRunning(true);
    setLoading(true);
    setOutput([{ text: '▶ Running…', type: 'info' }]);
    try {
      const result = await runCode(code);
      setOutput(result);
      setRunCount(c => c + 1);
    } catch (e: any) {
      setOutput([{ text: `Error: ${e.message}`, type: 'err' }]);
    } finally {
      setRunning(false);
      setLoading(false);
    }
  }, [code, running]);

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
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4; });
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="playground">
      {/* Header */}
      <div className="playground-header">
        <div className="playground-title">
          <span className="playground-icon">⟩_</span>
          <span>Python Playground</span>
        </div>
        <div className="playground-controls">
          <button
            className="pg-btn pg-clear"
            onClick={() => { setCode(''); setOutput([]); }}
            title="Clear"
          >
            Clear
          </button>
          <button
            className="pg-btn pg-run"
            onClick={run}
            disabled={running}
            title="Run (Ctrl+Enter)"
          >
            {running ? (
              <span className="pg-running">
                <span className="pg-spinner" />
                {loading ? 'Loading…' : 'Running…'}
              </span>
            ) : (
              <>▶ Run</>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="editor-area">
        <div className="line-numbers" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="code-editor"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="# Write Python here…"
        />
      </div>

      {/* Output */}
      <div className="output-panel">
        <div className="output-header">
          <span className="output-label">OUTPUT</span>
          {runCount > 0 && (
            <span className="output-runs">{runCount} run{runCount > 1 ? 's' : ''}</span>
          )}
          {output.length > 0 && (
            <button className="output-clear-btn" onClick={() => setOutput([])}>Clear</button>
          )}
        </div>
        <div className="output-body" ref={outputRef}>
          {output.length === 0 ? (
            <span className="output-placeholder">Press ▶ Run or Ctrl+Enter to execute</span>
          ) : (
            output.map((line, i) => (
              <div key={i} className={`output-line output-${line.type}`}>
                {line.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
