import type { ReactNode } from 'react';
export function VisuallyHidden({ children }: { children: ReactNode }) { return <span className="ds-visually-hidden">{children}</span>; }
