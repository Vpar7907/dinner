import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarRange, ChevronDown, ChevronRight, Database, Flame, Gauge, Info } from 'lucide-react';
import { useDishStore } from '@/entities/dish';
import { useCalorieSettings } from '@/entities/menu';
import { MealTypeToggles } from '@/features/configure-meals';
import { APP_VERSION, CHANGELOG, ROUTES, formatReleaseDate } from '@/shared/config';
import { formatNumber, pluralWithCount } from '@/shared/lib';
import { PageHeader, ReleaseNotes } from '@/shared/ui';
import { SettingsSection } from './SettingsSection';

interface SubsectionLinkProps {
  to: string;
  icon: ReactNode;
  title: string;
  summary: string;
  delay: number;
}

function SubsectionLink({ to, icon, title, summary, delay }: SubsectionLinkProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 26 }}
      whileHover={{ y: -3 }}
    >
      <Link
        to={to}
        className="group flex h-full items-center gap-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-900/5 transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold text-ink-900">{title}</span>
          <span className="mt-2 inline-block rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-ink-700">{summary}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-brand-500" />
      </Link>
    </motion.div>
  );
}

function AboutSection() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [current, ...previous] = CHANGELOG;
  return (
    <SettingsSection icon={<Info className="h-5 w-5" />} title="О приложении" delay={0.18}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-700">
          Версия <b className="text-ink-900">{APP_VERSION}</b>
          {current && current.version === APP_VERSION && <span className="text-ink-500"> · {formatReleaseDate(current.date)}</span>}
        </p>
        {current && (
          <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-ink-900/5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-500">Что нового</p>
            <ReleaseNotes release={current} hideHeading />
          </div>
        )}
        {previous.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              aria-expanded={historyOpen}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink-900"
            >
              История версий
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`} />
            </button>
            {historyOpen && (
              <div className="mt-3 flex flex-col gap-4">
                {previous.map((release) => (
                  <ReleaseNotes key={release.version} release={release} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SettingsSection>
  );
}

/** Settings hub: meal types on the page itself, larger subsections as separate pages. */
export function SettingsBoard() {
  const dishes = useDishStore((s) => s.dishes);
  const repeating = dishes.filter((d) => d.maxPerWeek > 1).length;
  const calories = useCalorieSettings();
  const caloriesSummary = !calories.enabled
    ? 'Выключено'
    : calories.mode === 'ceiling'
      ? `Не больше ${formatNumber(calories.dailyTarget)} ккал`
      : `${formatNumber(calories.dailyTarget)} ккал ±${calories.tolerance}%`;

  return (
    <div>
      <PageHeader eyebrow="Настройки" title="Параметры меню" />
      <div className="flex flex-col gap-6">
        <SettingsSection icon={<CalendarRange className="h-5 w-5" />} title="Приёмы пищи">
          <MealTypeToggles />
        </SettingsSection>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SubsectionLink
            to={ROUTES.settingsLimits}
            icon={<Gauge className="h-6 w-6" />}
            title="Лимиты блюд"
            summary={`${pluralWithCount(dishes.length, ['блюдо', 'блюда', 'блюд'])} · ${repeating} с повторами`}
            delay={0.06}
          />
          <SubsectionLink
            to={ROUTES.settingsCalories}
            icon={<Flame className="h-6 w-6" />}
            title="Калории"
            summary={caloriesSummary}
            delay={0.1}
          />
          <SubsectionLink
            to={ROUTES.settingsData}
            icon={<Database className="h-6 w-6" />}
            title="Данные"
            summary="Экспорт, импорт, очистка"
            delay={0.14}
          />
        </div>

        <AboutSection />
      </div>
    </div>
  );
}
