import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface SettingsSectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  delay?: number;
}

/** White card with an icon header, used on the settings hub and its subpages. */
export function SettingsSection({ icon, title, children, delay = 0 }: SettingsSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 26 }}
      className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-900/5 sm:p-6"
    >
      <header className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">{icon}</span>
        <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
      </header>
      {children}
    </motion.section>
  );
}
