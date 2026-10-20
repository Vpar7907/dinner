import { forwardRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { usePantryStore, type PantryItem } from '@/entities/pantry';
import { INGREDIENT_UNITS, type IngredientUnit } from '@/entities/ingredient';
import { cn, formatDecimal, parseDecimal } from '@/shared/lib';
import { IconButton } from '@/shared/ui';

export interface PantryItemRowProps {
  item: PantryItem;
  /** The current menu needs this ingredient. */
  usedInMenu: boolean;
}

export const PantryItemRow = forwardRef<HTMLLIElement, PantryItemRowProps>(function PantryItemRow({ item, usedInMenu }, ref) {
  const update = usePantryStore((s) => s.update);
  const remove = usePantryStore((s) => s.remove);
  const [amount, setAmount] = useState(formatDecimal(item.amount));
  const invalid = parseDecimal(amount) === undefined;

  useEffect(() => setAmount(formatDecimal(item.amount)), [item.amount]);

  // Saved on blur / Enter. Empty or 0 means "есть, количество неважно"; invalid text reverts.
  const commit = () => {
    const parsed = parseDecimal(amount);
    if (parsed === undefined) {
      setAmount(formatDecimal(item.amount));
      return;
    }
    const next = parsed !== null && parsed > 0 ? parsed : null;
    if (next !== item.amount) void update(item.id, { amount: next });
    else setAmount(formatDecimal(item.amount));
  };

  return (
    <motion.li
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, height: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="group flex items-center gap-2 rounded-2xl px-2 py-1.5 transition-colors hover:bg-cream-100/70"
    >
      <div className="min-w-0 flex-1 pl-1">
        <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
        {usedInMenu && <p className="text-[11px] font-semibold text-sage-600">используется в меню</p>}
      </div>
      <input
        value={amount}
        inputMode="decimal"
        placeholder="есть"
        onChange={(e) => setAmount(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label={`Количество: ${item.name}`}
        aria-invalid={invalid || undefined}
        title={invalid ? 'Введите число: 0,5 · 1.5 · 1/2' : undefined}
        className={cn(
          'h-9 w-20 rounded-xl bg-cream-50 px-2 text-right text-sm font-bold tabular-nums text-ink-900 ring-1 ring-ink-900/10 transition placeholder:font-semibold placeholder:text-sage-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400',
          invalid && 'ring-2 ring-red-400 focus:ring-red-400',
        )}
      />
      <select
        value={item.unit}
        onChange={(e) => void update(item.id, { unit: e.target.value as IngredientUnit })}
        aria-label={`Единица: ${item.name}`}
        className="h-9 w-[76px] cursor-pointer rounded-xl bg-cream-50 px-2 text-sm text-ink-700 ring-1 ring-ink-900/10 focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        {INGREDIENT_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
      <IconButton label="Убрать из запасов" tone="danger" onClick={() => void remove(item.id)} className="sm:opacity-0 sm:group-hover:opacity-100">
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </motion.li>
  );
});
