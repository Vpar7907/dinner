import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { House, PencilLine, X } from 'lucide-react';
import { cn, formatNumber } from '@/shared/lib';
import { Checkbox } from '@/shared/ui';
import type { ShoppingItem } from '../lib/aggregateShoppingList';

export interface ShoppingItemRowProps {
  item: ShoppingItem;
  checked: boolean;
  onToggle: (key: string) => void;
  /** Marks the item as already at home: it is added to the pantry and leaves the list. */
  onHaveAtHome: (item: ShoppingItem) => void;
  /** Removes a hand-added item from the list. */
  onRemove: (item: ShoppingItem) => void;
  /** Re-measure the layout only when this changes (order of the group), not on every render. */
  layoutDependency?: unknown;
}

export const ShoppingItemRow = forwardRef<HTMLLIElement, ShoppingItemRowProps>(function ShoppingItemRow(
  { item, checked, onToggle, onHaveAtHome, onRemove, layoutDependency },
  ref,
) {
  const sources = item.sources.map((s) => (s.count > 1 ? `${s.name} ×${s.count}` : s.name)).join(', ');
  const stockNote = item.stock.kind === 'partial' || item.stock.kind === 'unknown' ? item.stock.label : null;

  return (
    <motion.li
      ref={ref}
      layout
      layoutDependency={layoutDependency}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      onClick={() => onToggle(item.key)}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200',
        checked ? 'bg-sage-50/70' : 'hover:bg-cream-100/70',
      )}
    >
      {/* The whole row is clickable; stop the checkbox click from toggling twice. */}
      <span onClick={(event) => event.stopPropagation()} className="flex">
        <Checkbox checked={checked} onChange={() => onToggle(item.key)} label={item.name} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="relative inline-block max-w-full">
          <span className={cn('block truncate text-sm font-semibold transition-colors duration-300', checked ? 'text-ink-300' : 'text-ink-900')}>
            {item.name}
          </span>
          <motion.span
            className="absolute left-0 top-1/2 h-[2px] w-full origin-left rounded bg-ink-300"
            initial={false}
            animate={{ scaleX: checked ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        {item.origin === 'extra' ? (
          <p className="inline-flex items-center gap-1 text-xs font-medium text-brand-600">
            <PencilLine className="h-3 w-3" />
            добавлено вручную
          </p>
        ) : (
          <p className="truncate text-xs text-ink-500" title={sources}>
            {stockNote && <span className="font-semibold text-sage-600">🏠 {stockNote} · </span>}
            {sources}
          </p>
        )}
      </div>
      {item.origin === 'extra' ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(item);
          }}
          title="Убрать из списка"
          aria-label={`Убрать «${item.name}» из списка`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-ink-300 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onHaveAtHome(item);
          }}
          title="Уже есть дома — добавить в запасы"
          aria-label="Уже есть дома"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-ink-300 transition hover:bg-sage-50 hover:text-sage-600 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <House className="h-4 w-4" />
        </button>
      )}
      {item.amount > 0 && (
        <span
          className={cn(
            'shrink-0 rounded-xl px-2.5 py-1 text-sm font-bold tabular-nums transition-colors duration-300',
            checked ? 'bg-transparent text-ink-300' : 'bg-cream-100 text-ink-900',
          )}
          title={item.stock.kind === 'partial' ? `Нужно всего ${item.needed}` : undefined}
        >
          {formatNumber(item.amount)} {item.unit}
        </span>
      )}
    </motion.li>
  );
});
