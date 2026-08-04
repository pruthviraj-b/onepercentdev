import type { CSSProperties } from 'react';

export function ProgressRing({ value, label }: { value: number; label?: string }) { const safe = Math.max(0, Math.min(100, value)); return <div className="ds-progress-ring" style={{ '--ds-progress': `${safe}%` } as CSSProperties} aria-label={label} role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}><span>{safe}%</span></div>; }
