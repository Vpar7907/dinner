import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib';

export interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Chips sharing a group animate a single background pill between them. */
  layoutGroup?: string;
}

export function Chip({ active, onClick, children, layoutGroup = 'chip' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-200',
        active ? 'text-white' : 'text-ink-700 hover:bg-ink-900/5',
      )}
    >
      {active && (
        <motion.span
          layoutId={`${layoutGroup}-bg`}
          className="absolute inset-0 rounded-full bg-ink-900"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    </button>
  );
}
