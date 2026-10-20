import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-4xl border-2 border-dashed border-ink-900/10 bg-white/50 px-6 py-16 text-center"
    >
      <motion.div
        className="mb-4 text-5xl"
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5 }}
      >
        {emoji}
      </motion.div>
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
