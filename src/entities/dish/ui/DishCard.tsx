import { forwardRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Flame, NotebookPen, Repeat, Utensils } from 'lucide-react';
import { IngredientPreview } from '@/entities/ingredient/@x/dish';
import { formatKcal, plural } from '@/shared/lib';
import { LinkifiedText } from '@/shared/ui';
import { PROTEIN_META } from '../model/protein';
import { COURSE_META } from '../model/course';
import type { Dish } from '../model/types';
import { ProteinBadge } from './ProteinBadge';

export interface DishCardProps {
  dish: Dish;
  /** Names of side dishes the dish may be served with (resolved by the caller). */
  sideNames: string[];
  actions?: ReactNode;
  /** Show calories per serving (experimental calorie mode). */
  showCalories?: boolean;
  /** Re-measure the layout only when this changes (e.g. the visible list), not on every render. */
  layoutDependency?: unknown;
  onClick?: () => void;
}

export const DishCard = forwardRef<HTMLElement, DishCardProps>(function DishCard({ dish, sideNames, actions, showCalories, layoutDependency, onClick }, ref) {
  const meta = PROTEIN_META[dish.protein];
  const sideLabel = !dish.requiresSide
    ? 'Подаётся без гарнира'
    : sideNames.length > 0
      ? `Гарнир: ${sideNames.join(', ')}`
      : 'Гарнир: любой';

  return (
    <motion.article
      ref={ref}
      layout
      layoutDependency={layoutDependency}
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onClick={onClick}
      className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-900/5 transition-shadow hover:shadow-lift"
    >
      <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-25 [-webkit-mask-image:radial-gradient(closest-side,#000,transparent)] [mask-image:radial-gradient(closest-side,#000,transparent)] ${meta.solid}`} />
      <div className="relative flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-3xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
          {dish.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-ink-900">{dish.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <ProteinBadge protein={dish.protein} />
            <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-ink-700">
              <Repeat className="h-3 w-3" />
              до {dish.maxPerWeek} {plural(dish.maxPerWeek, ['раза', 'раз', 'раз'])}/нед
            </span>
            {showCalories && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-ink-700">
                <Flame className="h-3 w-3" />
                {dish.calories !== null ? formatKcal(dish.calories) : 'ккал не указаны'}
              </span>
            )}
            {dish.courses.map((course) => (
              <span key={course} className="inline-flex items-center gap-1 rounded-full bg-ink-900/5 px-2.5 py-1 text-xs font-semibold text-ink-700">
                {COURSE_META[course].emoji} {COURSE_META[course].label}
              </span>
            ))}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      <p className="relative flex items-center gap-2 text-xs font-medium text-ink-500">
        <Utensils className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{sideLabel}</span>
      </p>
      <div className="relative">
        <IngredientPreview ingredients={dish.ingredients} />
      </div>
      {dish.notes && (
        <p className="relative flex gap-2 rounded-2xl bg-cream-100/60 px-3 py-2 text-xs leading-relaxed text-ink-700">
          <NotebookPen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
          <LinkifiedText text={dish.notes} shortLinks className="line-clamp-3" />
        </p>
      )}
    </motion.article>
  );
});
