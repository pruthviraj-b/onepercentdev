import type { HTMLAttributes } from 'react';
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={`ds-card ${className}`} {...props} />; }
