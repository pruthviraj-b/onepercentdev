import type { HTMLAttributes } from 'react';
export function Container({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={`ds-container ${className}`} {...props} />; }
