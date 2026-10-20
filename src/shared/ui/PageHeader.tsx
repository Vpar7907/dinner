import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, actions }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
    >
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </motion.header>
  );
}
