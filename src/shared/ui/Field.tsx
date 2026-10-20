import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib';

const controlBase =
  'w-full rounded-2xl bg-cream-50 px-4 text-sm text-ink-900 ring-1 ring-ink-900/10 transition-all duration-200 placeholder:text-ink-300 hover:ring-ink-900/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</span>}
      {children}
      {error ? (
        <span className="text-xs font-medium text-red-500">{error}</span>
      ) : (
        hint && <span className="text-xs text-ink-500">{hint}</span>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, invalid, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn(controlBase, 'h-11', invalid && 'ring-2 ring-red-400 focus:ring-red-400', className)}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(controlBase, 'h-11 cursor-pointer appearance-none pr-10', className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 3, ...rest },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(controlBase, 'resize-y py-3 leading-relaxed', className)} {...rest} />;
});
