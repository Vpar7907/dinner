import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { DayMeta } from '@/entities/menu';
import { cn, formatKcal, formatNumber } from '@/shared/lib';

export interface DayCalories {
  total: number;
  min: number;
  max: number;
  /** Some dish of the day has no calories set. */
  incomplete: boolean;
}

export interface DayCardProps {
  day: DayMeta;
  isToday: boolean;
  /** Set only in the experimental calorie mode. */
  calories?: DayCalories;
  children: ReactNode;
}

function CaloriesBadge({ total, min, max, incomplete }: DayCalories) {
  if (total === 0 && !incomplete) return null;
  const tone = total > max ? 'bg-red-50 text-red-600' : total < min ? 'bg-amber-50 text-amber-700' : 'bg-sage-50 text-sage-600';
  const title = [min === 0 ? `Лимит: до ${formatNumber(max)} ккал` : `Цель: ${formatNumber(min)}–${formatNumber(max)} ккал`, incomplete && 'у части блюд калории не указаны'].filter(Boolean).join(', ');
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums', tone)} title={title}>
      {formatKcal(total)}
      {incomplete && '*'}
    </span>
  );
}

export function DayCard({ day, isToday, calories, children }: DayCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: day.index * 0.05 }}
      className={cn(
        // focus-within lifts the card above its neighbours while a slot's action menu is open
        'relative flex flex-col gap-2 rounded-3xl bg-white p-3 shadow-soft ring-1 ring-ink-900/5 focus-within:z-10',
        isToday && 'ring-2 ring-brand-300',
      )}
    >
      <header className="flex items-center justify-between px-1 pb-1 pt-0.5">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-extrabold',
              isToday ? 'bg-brand-500 text-white' : 'bg-cream-100 text-ink-700',
            )}
          >
            {day.short}
          </span>
          <h3 className="text-sm font-bold text-ink-900">{day.full}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {calories && <CaloriesBadge {...calories} />}
          {isToday && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">Сегодня</span>}
        </div>
      </header>
      {children}
    </motion.section>
  );
}
