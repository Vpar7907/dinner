import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Ban, BookOpen, Pencil, Plus, Repeat2, RotateCcw, Shuffle, Trash2, Utensils } from 'lucide-react';
import { ProteinBadge, type Dish } from '@/entities/dish';
import type { SideDish } from '@/entities/side-dish';
import type { MealMeta, MealSlot, SlotKey } from '@/entities/menu';
import { LockToggle } from '@/features/toggle-slot-lock';
import { SLOT_ISSUE_LABELS, slotCalories, type RunInfo, type SlotIssue } from '@/features/generate-menu';
import type { PickerStep } from '@/features/edit-meal-slot';
import { cn, firstLink, formatKcal, linkLabel } from '@/shared/lib';
import { DropdownMenu, type DropdownItem } from '@/shared/ui';

export interface MealSlotCardProps {
  slotKey: SlotKey;
  meal: MealMeta;
  slot: MealSlot;
  dish?: Dish;
  side?: SideDish;
  issues: SlotIssue[];
  /** Set when the same dish is served at this meal on consecutive days. */
  run?: RunInfo;
  /** Position among visible slots, used to cascade the regeneration animation. */
  order: number;
  generation: number | null;
  isGenerating: boolean;
  /** True right after a full generation: slots flip one after another. */
  cascade: boolean;
  /** Show calories of the serving (experimental calorie mode). */
  showCalories: boolean;
  onPick: (key: SlotKey, step: PickerStep) => void;
  onShuffle: (key: SlotKey) => void;
  onSkip: (key: SlotKey) => void;
  onClear: (key: SlotKey) => void;
}

export function MealSlotCard({
  slotKey,
  meal,
  slot,
  dish,
  side,
  issues,
  run,
  order,
  generation,
  isGenerating,
  cascade,
  showCalories,
  onPick,
  onShuffle,
  onSkip,
  onClear,
}: MealSlotCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasIssues = issues.length > 0;
  const contentKey = slot.skipped ? 'skipped' : `${slot.dishId ?? 'empty'}-${slot.sideId ?? 'none'}-${generation ?? 0}`;
  const shimmer = isGenerating && !slot.locked && !slot.skipped;
  const recipeUrl = dish?.notes ? firstLink(dish.notes) : null;
  const serving = showCalories && dish ? slotCalories(dish, side) : null;

  const actions: DropdownItem[] = slot.skipped
    ? [{ label: 'Вернуть приём пищи', icon: <RotateCcw className="h-4 w-4" />, onSelect: () => onSkip(slotKey) }]
    : [
        { label: dish ? 'Заменить вручную…' : 'Выбрать блюдо…', icon: <Pencil className="h-4 w-4" />, onSelect: () => onPick(slotKey, 'dish') },
        {
          label: dish ? 'Случайная замена' : 'Подобрать случайно',
          icon: <Shuffle className="h-4 w-4" />,
          onSelect: () => onShuffle(slotKey),
          hidden: slot.locked,
        },
        {
          label: 'Сменить гарнир…',
          icon: <Utensils className="h-4 w-4" />,
          onSelect: () => onPick(slotKey, 'side'),
          hidden: !dish?.requiresSide,
        },
        { label: 'Исключить приём пищи', icon: <Ban className="h-4 w-4" />, onSelect: () => onSkip(slotKey), separated: true },
        {
          label: 'Очистить',
          icon: <Trash2 className="h-4 w-4" />,
          onSelect: () => onClear(slotKey),
          tone: 'danger',
          hidden: !dish,
        },
      ];

  return (
    // No `layout` here or on DayCard: layout projection fights the content swap below and
    // makes cards jump on Android. The shimmer is opacity-only so it stays on the compositor.
    <motion.div
      animate={shimmer ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
      transition={shimmer ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: order * 0.03 } : { duration: 0.2 }}
      className={cn(
        'group relative flex flex-col rounded-2xl p-3 transition-colors duration-300',
        menuOpen && 'z-20',
        slot.skipped
          ? 'min-h-[76px] bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgba(31,29,26,0.035)_8px,rgba(31,29,26,0.035)_16px)] ring-1 ring-ink-900/5'
          : 'min-h-[132px]',
        !slot.skipped && (dish ? 'bg-cream-50 hover:bg-white' : 'border-2 border-dashed border-ink-900/10'),
        !slot.skipped &&
          (slot.locked
            ? 'ring-2 ring-ink-900/80'
            : hasIssues
              ? 'ring-2 ring-amber-300'
              : dish && 'ring-1 ring-ink-900/5 hover:ring-ink-900/10'),
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider', slot.skipped ? 'text-ink-300' : 'text-ink-500')}>
          <span className={cn(slot.skipped && 'grayscale')}>{meal.emoji}</span>
          {meal.label}
        </span>
        <div className="flex items-center gap-0.5">
          {recipeUrl && !slot.skipped && (
            <a
              href={recipeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-brand-500 transition hover:bg-brand-50"
              aria-label={`Рецепт: ${linkLabel(recipeUrl)}`}
              title={`Открыть рецепт (${linkLabel(recipeUrl)})`}
            >
              <BookOpen className="h-4 w-4" />
            </a>
          )}
          {dish && !slot.locked && !slot.skipped && (
            <motion.button
              type="button"
              whileTap={{ rotate: 180, scale: 0.85 }}
              onClick={() => onShuffle(slotKey)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-ink-300 transition hover:bg-ink-900/5 hover:text-ink-700 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Случайная замена"
              title="Случайная замена"
            >
              <Shuffle className="h-4 w-4" />
            </motion.button>
          )}
          {!slot.skipped && <LockToggle slotKey={slotKey} />}
          <DropdownMenu items={actions} label="Действия с приёмом пищи" onOpenChange={setMenuOpen} />
        </div>
      </div>

      {/* Old and new content share one grid cell and cross-fade in place, so nothing reflows mid-animation. */}
      <div className="grid flex-1 [&>*]:[grid-area:1/1]">
        <AnimatePresence initial={false}>
          {slot.skipped ? (
            <motion.button
              key={contentKey}
              type="button"
              onClick={() => onSkip(slotKey)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 text-left text-xs font-semibold text-ink-300 transition-colors hover:text-ink-700"
              title="Вернуть приём пищи"
            >
              <Ban className="h-4 w-4" />
              Исключено · нажмите, чтобы вернуть
            </motion.button>
          ) : (
            <motion.button
              key={contentKey}
              type="button"
              onClick={() => onPick(slotKey, 'dish')}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: cascade ? order * 0.03 : 0 }}
              style={{ willChange: 'transform, opacity' }}
              className="flex flex-col text-left focus-visible:outline-none"
              title={dish ? 'Заменить вручную' : 'Выбрать блюдо'}
            >
              {dish ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl leading-none transition-transform duration-300 group-hover:scale-110">{dish.emoji}</span>
                    <span className="line-clamp-2 text-sm font-bold leading-snug text-ink-900">{dish.name}</span>
                  </div>
                  {dish.requiresSide && (
                    <span className={cn('mt-1.5 pl-[34px] text-xs font-medium', side ? 'text-sage-600' : 'text-amber-600')}>
                      {side ? `+ ${side.emoji} ${side.name}` : '+ гарнир не выбран'}
                    </span>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                    <span className="flex flex-wrap items-center gap-1">
                      <ProteinBadge protein={dish.protein} />
                      {serving && (serving.kcal > 0 || !serving.complete) && (
                        <span
                          className="rounded-full bg-ink-900/5 px-2 py-1 text-[11px] font-bold tabular-nums text-ink-700"
                          title={serving.complete ? 'Калории порции' : 'У блюда или гарнира калории не указаны'}
                        >
                          {serving.kcal > 0 ? formatKcal(serving.kcal) : '? ккал'}
                          {serving.kcal > 0 && !serving.complete && '*'}
                        </span>
                      )}
                      {run && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-sage-50 px-2 py-1 text-[11px] font-bold text-sage-600"
                          title={`Готовится один раз на ${run.length} дн. подряд`}
                        >
                          <Repeat2 className="h-3 w-3" />
                          {run.index === 1 ? 'готовим' : 'доедаем'} {run.index}/{run.length}
                        </span>
                      )}
                    </span>
                    {hasIssues && (
                      <span className="text-amber-500" title={issues.map((i) => SLOT_ISSUE_LABELS[i]).join('\n')}>
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className="flex flex-1 flex-col items-center justify-center gap-1.5 text-ink-300 transition-colors group-hover:text-brand-500">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/5 transition-colors group-hover:bg-brand-50">
                    <Plus className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-semibold">Выбрать блюдо</span>
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
