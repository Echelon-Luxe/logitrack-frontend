import * as React from 'react';
import { cn } from '@/lib/utils';

const control =
  'w-full rounded-[var(--radius-field)] border border-line bg-surface px-3.5 text-sm text-fg placeholder:text-faint transition-[box-shadow,border-color] hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(control, 'h-11', className)} {...props} />,
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(control, 'min-h-20 py-2.5', className)} {...props} />,
);
Textarea.displayName = 'Textarea';

// Native select, styled: accessible and mobile-friendly for free.
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(control, 'h-11 cursor-pointer appearance-none pr-9', className)}
        {...props}
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  ),
);
Select.displayName = 'Select';

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('text-[13px] font-medium text-fg', className)} {...props} />
);

export const Field = ({ label, htmlFor, hint, error, children }: {
  label: string; htmlFor: string; hint?: string; error?: string | null; children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {error ? <p className="text-xs text-rose-600">{error}</p>
      : hint ? <p className="text-xs text-muted">{hint}</p> : null}
  </div>
);
