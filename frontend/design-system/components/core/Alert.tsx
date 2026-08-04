import type { ReactNode } from 'react';
export function Alert({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'success' | 'warning' | 'error' }) { return <div className={`ds-alert ds-alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>; }
