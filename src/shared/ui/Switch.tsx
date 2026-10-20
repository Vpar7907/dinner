import { motion } from 'framer-motion';
import { cn } from '@/shared/lib';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

export function Switch({ checked, onChange, label, description, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-4 rounded-2xl bg-cream-50 px-4 py-3 text-left ring-1 ring-ink-900/10 transition hover:ring-ink-900/20',
        className,
      )}
    >
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-semibold text-ink-900">{label}</span>}
          {description && <span className="text-xs text-ink-500">{description}</span>}
        </span>
      )}
      <span
        className={cn(
          'relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300',
          checked ? 'justify-end bg-brand-500' : 'justify-start bg-ink-300/60',
        )}
      >
        <motion.span layout transition={{ type: 'spring', stiffness: 700, damping: 35 }} className="h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}
