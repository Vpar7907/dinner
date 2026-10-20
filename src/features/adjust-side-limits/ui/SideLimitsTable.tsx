import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSideDishStore, type SideDish } from '@/entities/side-dish';
import { cn } from '@/shared/lib';
import { Stepper } from '@/shared/ui';

export interface SideLimitsTableProps {
  /** Short status line under the name (usage in the menu, linked dishes…), composed by the caller. */
  renderMeta?: (side: SideDish) => ReactNode;
  /** Extra buttons per row (edit, delete), composed by the caller. */
  renderActions?: (side: SideDish) => ReactNode;
  onOpen?: (side: SideDish) => void;
  empty?: ReactNode;
}

/** Weekly limit and on/off switch for every side dish. */
export function SideLimitsTable({ renderMeta, renderActions, onOpen, empty }: SideLimitsTableProps) {
  const sides = useSideDishStore((s) => s.sides);
  const update = useSideDishStore((s) => s.update);

  if (sides.length === 0) {
    return <>{empty ?? <p className="py-6 text-center text-sm text-ink-500">Гарниров пока нет.</p>}</>;
  }

  return (
    <ul className="flex flex-col">
      <AnimatePresence initial={false}>
        {sides.map((side) => (
          <motion.li
            key={side.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -30, height: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className="group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-2 py-2 transition-colors hover:bg-cream-100/60"
          >
            <button
              type="button"
              onClick={() => onOpen?.(side)}
              disabled={!onOpen}
              className="flex min-w-0 flex-1 basis-56 items-center gap-3 text-left"
              title={onOpen ? 'Открыть гарнир' : undefined}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-xl transition-transform group-hover:scale-105',
                  !side.enabled && 'grayscale',
                )}
              >
                {side.emoji}
              </span>
              <span className="min-w-0">
                <span className={cn('block truncate text-sm font-bold', side.enabled ? 'text-ink-900' : 'text-ink-300 line-through')}>
                  {side.name}
                </span>
                {renderMeta && <span className="block truncate text-xs text-ink-500">{renderMeta(side)}</span>}
              </span>
            </button>
            <div className="ml-auto flex items-center gap-3">
              <Stepper value={side.maxPerWeek} min={1} max={14} onChange={(maxPerWeek) => void update(side.id, { maxPerWeek })} />
              <button
                type="button"
                role="switch"
                aria-checked={side.enabled}
                aria-label={`Использовать гарнир «${side.name}»`}
                title={side.enabled ? 'Используется в генерации' : 'Не используется в генерации'}
                onClick={() => void update(side.id, { enabled: !side.enabled })}
                className={cn(
                  'relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300',
                  side.enabled ? 'justify-end bg-sage-500' : 'justify-start bg-ink-300/60',
                )}
              >
                <motion.span layout transition={{ type: 'spring', stiffness: 700, damping: 35 }} className="h-5 w-5 rounded-full bg-white shadow" />
              </button>
              {renderActions && <div className="flex items-center gap-0.5">{renderActions(side)}</div>}
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
