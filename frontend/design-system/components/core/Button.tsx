import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg' }>(function Button({ className = '', variant = 'primary', size = 'md', ...props }, ref) {
  return <button ref={ref} className={`ds-button ds-button--${variant} ds-button--${size} ${className}`} {...props} />;
});
