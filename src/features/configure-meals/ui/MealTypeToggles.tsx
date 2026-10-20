import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { MEALS, useMenuStore, type MealType } from '@/entities/menu';
import { cn } from '@/shared/lib';
import { toast } from '@/shared/ui';

/** Includes or excludes whole meal types (breakfasts, salads, …) from the weekly plan. */
export function MealTypeToggles() {
  const enabledMeals = useMenuStore((s) => s.menu.enabledMeals);
  const setMealEnabled = useMenuStore((s) => s.setMealEnabled);
  const enabledCount = MEALS.filter((m) => enabledMeals[m.type]).length;

  const toggle = (meal: MealType) => {
    const next = !enabledMeals[meal];
    if (!next && enabledCount === 1) {
      toast.warning('Нужен хотя бы один приём пищи', 'Нельзя отключить все приёмы пищи сразу.');
      return;
    }
    void setMealEnabled(meal, next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {MEALS.map((meal) => {
          const active = enabledMeals[meal.type];
          return (
            <motion.button
              key={meal.type}
              type="button"
              layout
              whileTap={{ scale: 0.94 }}
              onClick={() => toggle(meal.type)}
              aria-pressed={active}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors duration-200',
                active
                  ? 'bg-ink-900 text-white shadow-soft'
                  : 'bg-cream-50 text-ink-500 ring-1 ring-ink-900/15 hover:text-ink-900 hover:ring-ink-900/30',
              )}
            >
              <span>{meal.emoji}</span>
              {meal.label}
              <motion.span
                initial={false}
                animate={{ width: active ? 14 : 0, opacity: active ? 1 : 0 }}
                className="inline-flex overflow-hidden"
              >
                <Check className="h-3.5 w-3.5 shrink-0" />
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
