import type { CSSProperties, ReactNode } from 'react';
export function Stack({ children, gap = 16, direction = 'column', className = '' }: { children: ReactNode; gap?: number; direction?: 'row' | 'column'; className?: string }) { return <div className={`ds-stack ${className}`} style={{ '--ds-stack-gap': `${gap}px`, '--ds-stack-direction': direction } as CSSProperties}>{children}</div>; }
