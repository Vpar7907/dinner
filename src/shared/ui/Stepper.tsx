import { Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/shared/lib';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function Stepper({ value, min = 0, max = 99, onChange, className }: StepperProps) {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  const buttonClass =
    'flex h-9 w-9 items-center justify-center rounded-xl text-ink-700 transition hover:bg-white disabled:opacity-30';

  return (
    <div className={cn('inline-flex h-11 items-center gap-1 rounded-2xl bg-cream-50 p-1 ring-1 ring-ink-900/10', className)}>
      <motion.button type="button" whileTap={{ scale: 0.85 }} disabled={value <= min} onClick={() => set(value - 1)} className={buttonClass} aria-label="Уменьшить">
        <Minus className="h-4 w-4" />
      </motion.button>
      <div className="relative h-6 w-8 overflow-hidden text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 35 }}
            className="absolute inset-0 text-base font-bold tabular-nums text-ink-900"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <motion.button type="button" whileTap={{ scale: 0.85 }} disabled={value >= max} onClick={() => set(value + 1)} className={buttonClass} aria-label="Увеличить">
        <Plus className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
