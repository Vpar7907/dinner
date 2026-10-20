import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/shared/config';
import { PageHeader } from '@/shared/ui';

export interface SettingsSubpageProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** Layout of a settings subsection page: breadcrumb back to the hub + header + content. */
export function SettingsSubpage({ title, actions, children }: SettingsSubpageProps) {
  return (
    <div>
      <motion.nav
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        aria-label="Навигация по настройкам"
        className="mb-4 flex items-center gap-1 text-sm font-semibold text-ink-500"
      >
        <Link
          to={ROUTES.settings}
          className="group inline-flex items-center gap-1 rounded-full py-1 pl-1.5 pr-3 transition hover:bg-ink-900/5 hover:text-ink-900"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Настройки
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
        <span className="text-ink-900" aria-current="page">
          {title}
        </span>
      </motion.nav>
      <PageHeader eyebrow="Настройки" title={title} actions={actions} />
      {children}
    </div>
  );
}
