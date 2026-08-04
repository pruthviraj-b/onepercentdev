export function Spinner({ label = 'Loading', className = '' }: { label?: string; className?: string }) { return <span className={`ds-spinner ${className}`} role="status" aria-label={label} />; }
