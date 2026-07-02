'use client';

import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Trap focus inside modal and handle Esc
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    // Move focus to close button when modal opens
    setTimeout(() => closeRef.current?.focus(), 50);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const groups = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['Esc'], desc: 'Go to Dashboard from any view' },
        { keys: ['Home icon'], desc: 'Return to Dashboard (header button)' },
        { keys: ['/', 'Ctrl+K'], desc: 'Open reader from landing view' },
      ],
    },
    {
      title: 'Course Reader',
      shortcuts: [
        { keys: ['c'], desc: 'Toggle current part complete/incomplete' },
        { keys: ['b'], desc: 'Toggle bookmark on current part' },
        { keys: ['v'], desc: 'Split: video & playground fullscreen' },
        { keys: ['m'], desc: 'Open/close Il Mentore AI companion' },
      ],
    },
    {
      title: 'Sidebar (Left panel)',
      shortcuts: [
        { keys: ['s'], desc: 'Toggle course navigation sidebar' },
        { keys: ['Sidebar icon'], desc: 'Toggle sidebar (header button)' },
        { keys: ['/'], desc: 'Focus sidebar search bar' },
      ],
    },
    {
      title: 'Global',
      shortcuts: [
        { keys: ['?'], desc: 'Show/hide this shortcuts panel' },
        { keys: ['Tab'], desc: 'Navigate between interactive elements' },
      ],
    },
  ];

  return (
    <div
      className="shortcuts-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="shortcuts-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="shortcuts-header">
          <span id="shortcuts-title">⌨️ Keyboard Shortcuts</span>
          <button
            ref={closeRef}
            className="shortcuts-close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts panel"
          >✕</button>
        </div>

        {/* Shortcuts list — scrollable */}
        <div className="shortcuts-body" style={{ overflowY: 'auto', flex: 1 }}>
          {groups.map((group) => (
            <div key={group.title} className="shortcuts-group">
              <div className="shortcuts-group-title">{group.title}</div>
              {group.shortcuts.map((s, i) => (
                <div key={i} className="shortcut-row">
                  <span className="shortcut-desc">{s.desc}</span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {s.keys.map(k => (
                      <kbd key={k} className="shortcut-key" aria-label={k}>
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{
          padding: '8px 16px 12px',
          fontSize: '0.68rem',
          color: 'var(--win-shadow)',
          fontFamily: 'var(--font-mono)',
          borderTop: '1px solid var(--win-shadow)',
          flexShrink: 0,
        }}>
          Press{' '}
          <kbd style={{ padding: '1px 4px', border: '1px solid var(--win-shadow)', background: 'var(--win-light)', color: 'var(--page-text)' }}>Esc</kbd>
          {' '}or{' '}
          <kbd style={{ padding: '1px 4px', border: '1px solid var(--win-shadow)', background: 'var(--win-light)', color: 'var(--page-text)' }}>?</kbd>
          {' '}to close this panel
        </div>
      </div>
    </div>
  );
}
