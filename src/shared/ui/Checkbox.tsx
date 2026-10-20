import { motion } from 'framer-motion';
import { cn } from '@/shared/lib';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label?: string;
}

export function Checkbox({ checked, onChange, className, label }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-2 transition-colors duration-200',
        checked ? 'bg-sage-500 ring-sage-500' : 'bg-white ring-ink-300 hover:ring-sage-400',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </svg>
    </button>
  );
}
