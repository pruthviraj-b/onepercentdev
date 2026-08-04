import type { HTMLAttributes } from 'react';
export function Badge({ className = '', tone = 'neutral', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'error' }) { return <span className={`ds-badge ds-badge--${tone} ${className}`} {...props} />; }
