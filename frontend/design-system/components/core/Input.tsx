import { forwardRef, type InputHTMLAttributes } from 'react';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(function Input({ className = '', id, label, error, ...props }, ref) {
  const inputId = id ?? (label ? `ds-input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  return <label className="ds-field" htmlFor={inputId}>{label && <span className="ds-field__label">{label}</span>}<input ref={ref} id={inputId} className={`ds-input ${className}`} aria-invalid={Boolean(error)} {...props} />{error && <span className="ds-field__error" role="alert">{error}</span>}</label>;
});
