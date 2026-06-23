'use client';

import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const shortcuts = [
    { keys: ['/', 'Ctrl+K'], desc: 'Focus search / open reader' },
    { keys: ['c'], desc: 'Toggle complete on current part' },
    { keys: ['b'], desc: 'Toggle bookmark on current part' },
    { keys: ['v'], desc: 'Split Video & Playground / Toggle Notes' },
    { keys: ['Esc'], desc: 'Go back to landing' },
    { keys: ['?'], desc: 'Show this shortcuts panel' },
  ];

  return (
    <div className="shortcuts-backdrop" onClick={onClose}>
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="shortcuts-header">
          <span>Keyboard Shortcuts</span>
          <button className="shortcuts-close" onClick={onClose}>✕</button>
        </div>

        {/* Shortcuts list */}
        <div className="shortcuts-body">
          <div className="shortcuts-group">
            <div className="shortcuts-group-title">General Shortcuts</div>
            {shortcuts.map((s, i) => (
              <div key={i} className="shortcut-row">
                <span className="shortcut-desc">{s.desc}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {s.keys.map(k => (
                    <kbd key={k} className="shortcut-key">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: '8px 16px 12px',
            fontSize: '0.68rem',
            color: 'var(--win-shadow)',
            fontFamily: 'var(--font-mono)',
            borderTop: '1px solid var(--win-shadow)',
          }}
        >
          Press <kbd style={{ padding: '1px 4px', border: '1px solid var(--win-shadow)', background: 'var(--win-light)', color: 'var(--page-text)' }}>?</kbd> or <kbd style={{ padding: '1px 4px', border: '1px solid var(--win-shadow)', background: 'var(--win-light)', color: 'var(--page-text)' }}>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
