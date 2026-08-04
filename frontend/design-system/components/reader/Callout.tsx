import type { ReactNode } from 'react';
export function Callout({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'tip' | 'warning' }) { return <aside className={`ds-callout ds-callout--${tone}`}>{children}</aside>; }
