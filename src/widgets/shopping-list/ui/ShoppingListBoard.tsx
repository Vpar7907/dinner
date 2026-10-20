import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, Copy, House, ListX, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { INGREDIENT_CATEGORIES } from '@/entities/ingredient';
import { ShoppingItemRow, formatShoppingList, useHaveAtHome, useShoppingList, type ShoppingItem } from '@/features/shopping-list';
import { AddExtraItemForm } from '@/features/shopping-extras';
import { useMenuStore } from '@/entities/menu';
import { ROUTES } from '@/shared/config';
import { cn, plural } from '@/shared/lib';
import { Button, EmptyState, PageHeader, toast } from '@/shared/ui';

function ProgressRing({ value }: { value: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
      <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="7" className="stroke-cream-200" />
      <motion.circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        className="stroke-sage-500"
        strokeDasharray={circumference}
        initial={false}
        animate={{ strokeDashoffset: circumference * (1 - value) }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      />
    </svg>
  );
}

function InStockSection({ items }: { items: ShoppingItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <motion.section layout className="mt-2 rounded-3xl bg-sage-50/70 p-3 ring-1 ring-sage-100">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-2 py-1 text-left">
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sage-600">
            <House className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-bold text-ink-900">Есть дома — покупать не нужно</span>
            <span className="block text-xs text-ink-500">
              {items.length} {plural(items.length, ['продукт', 'продукта', 'продуктов'])} из запасов
            </span>
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-ink-500">
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="grid gap-1 overflow-hidden pt-2 sm:grid-cols-2"
          >
            {items.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2 text-sm">
                <span className="truncate font-semibold text-ink-700">{item.name}</span>
                <span className="shrink-0 text-xs text-ink-500">
                  нужно {item.needed} · {item.stock.kind === 'full' ? item.stock.label : ''}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export function ShoppingListBoard() {
  const { groups, inStock, checked, total, done, boughtExtras, toggleChecked, resetChecked } = useShoppingList();
  const haveAtHome = useHaveAtHome();
  const removeExtra = useMenuStore((s) => s.removeExtra);
  const removeBoughtExtras = useMenuStore((s) => s.removeBoughtExtras);

  const removeItem = async (item: ShoppingItem) => {
    if (!item.extraId) return;
    await removeExtra(item.extraId);
    toast.info('Убрано из списка', item.name);
  };

  const clearBoughtExtras = async () => {
    const removed = await removeBoughtExtras();
    if (removed > 0) toast.info('Купленное убрано', `${removed} ${plural(removed, ['позиция', 'позиции', 'позиций'])}, добавленных вручную.`);
  };
  const navigate = useNavigate();
  const progress = total > 0 ? done / total : 1;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatShoppingList(groups, checked));
      toast.success('Список скопирован', 'Можно вставить в мессенджер или заметки.');
    } catch {
      toast.error('Не удалось скопировать', 'Браузер запретил доступ к буферу обмена.');
    }
  };

  if (total === 0 && inStock.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Список покупок" title="Что купить" />
        <div className="mb-6">
          <AddExtraItemForm />
        </div>
        <EmptyState
          emoji="🧺"
          title="Список пока пуст"
          description="Он соберётся автоматически из блюд и гарниров меню. А что-то своё можно добавить прямо сейчас — полем выше."
          action={
            <Button icon={<CalendarDays className="h-4 w-4" />} onClick={() => navigate(ROUTES.menu)}>
              Составить меню
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Список покупок"
        title="Что купить"
        actions={
          <>
            {boughtExtras > 0 && (
              <Button variant="secondary" icon={<ListX className="h-4 w-4" />} onClick={() => void clearBoughtExtras()}>
                Убрать купленное ({boughtExtras})
              </Button>
            )}
            <Button variant="secondary" icon={<House className="h-4 w-4" />} onClick={() => navigate(ROUTES.pantry)}>
              Запасы
            </Button>
            <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} disabled={done === 0} onClick={() => void resetChecked()}>
              Сбросить отметки
            </Button>
            <Button icon={<Copy className="h-4 w-4" />} onClick={() => void copy()}>
              Скопировать
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <AddExtraItemForm />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-ink-900/5"
      >
        <div className="relative">
          <ProgressRing value={progress} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold tabular-nums text-ink-900">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">
            {total === 0 ? 'Всё есть дома! 🎉' : done === total ? 'Всё куплено! 🎉' : `Куплено ${done} из ${total}`}
          </p>
          <p className="text-sm text-ink-500">
            {total === 0
              ? 'Для этого меню ничего покупать не нужно.'
              : done === total
              ? 'Можно приступать к готовке.'
              : `Осталось ${total - done} ${plural(total - done, ['продукт', 'продукта', 'продуктов'])}`}
          </p>
        </div>
      </motion.div>

      <div className="columns-1 gap-4 lg:columns-2">
        {groups.map((group, index) => {
          const meta = INGREDIENT_CATEGORIES[group.category];
          const groupDone = group.items.filter((i) => checked.has(i.key)).length;
          const complete = groupDone === group.items.length;
          // Unchecked items first; checked ones sink to the bottom with a layout animation.
          const ordered = [...group.items].sort((a, b) => Number(checked.has(a.key)) - Number(checked.has(b.key)));
          return (
            <motion.section
              key={group.category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 26 }}
              className="mb-4 break-inside-avoid rounded-3xl bg-white p-3 shadow-soft ring-1 ring-ink-900/5"
            >
              <header className="flex items-center justify-between px-2 pb-2 pt-1">
                <div className="flex items-center gap-2.5">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-lg', meta.tint)}>{meta.emoji}</span>
                  <h2 className="text-sm font-bold text-ink-900">{meta.label}</h2>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-bold tabular-nums transition-colors duration-300',
                    complete ? 'bg-sage-500 text-white' : 'bg-cream-100 text-ink-700',
                  )}
                >
                  {groupDone}/{group.items.length}
                </span>
              </header>
              <ul className="flex flex-col">
                <AnimatePresence initial={false}>
                  {ordered.map((item) => (
                    <ShoppingItemRow
                      key={item.key}
                      item={item}
                      checked={checked.has(item.key)}
                      onToggle={(key) => void toggleChecked(key)}
                      onHaveAtHome={(i) => void haveAtHome(i)}
                      onRemove={(i) => void removeItem(i)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          );
        })}
      </div>

      <InStockSection items={inStock} />
    </div>
  );
}
