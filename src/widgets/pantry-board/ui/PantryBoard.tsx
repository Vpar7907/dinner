import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { usePantryStore, stockKey, type PantryItem } from '@/entities/pantry';
import { CATEGORY_ORDER, INGREDIENT_CATEGORIES, type IngredientCategory } from '@/entities/ingredient';
import { AddPantryItemForm, PantryItemRow } from '@/features/manage-pantry';
import { useShoppingList } from '@/features/shopping-list';
import { cn, normalizeText, pluralWithCount } from '@/shared/lib';
import { EmptyState, PageHeader, SearchInput } from '@/shared/ui';

export function PantryBoard() {
  const items = usePantryStore((s) => s.items);
  const { groups, inStock } = useShoppingList();
  const [query, setQuery] = useState('');

  // Keys of every ingredient the current menu needs, to highlight useful stock.
  const menuKeys = useMemo(() => new Set([...groups.flatMap((g) => g.items), ...inStock].map((i) => i.key)), [groups, inStock]);
  const usedCount = items.filter((i) => menuKeys.has(stockKey(i.name, i.unit))).length;

  const grouped = useMemo(() => {
    const q = normalizeText(query);
    const visible = q ? items.filter((i) => normalizeText(i.name).includes(q)) : items;
    const map = new Map<IngredientCategory, PantryItem[]>();
    for (const item of visible) map.set(item.category, [...(map.get(item.category) ?? []), item]);
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((category) => ({ category, items: map.get(category)! }));
  }, [items, query]);
  // Sections and rows animate their layout only when items are added, removed or filtered.
  const layoutKey = grouped.map((g) => `${g.category}:${g.items.map((i) => i.id).join(',')}`).join('|');

  return (
    <div>
      <PageHeader
        eyebrow="Что есть дома"
        title="Запасы"
      />

      <div className="mb-6 flex flex-col gap-4">
        <AddPantryItemForm />
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="inline-flex items-center gap-2 text-sm text-ink-500">
              <Sparkles className="h-4 w-4 text-brand-500" />
              {pluralWithCount(items.length, ['продукт', 'продукта', 'продуктов'])} в запасах,{' '}
              <span className="font-semibold text-sage-600">{usedCount} используются в текущем меню</span>
            </p>
            <SearchInput value={query} onChange={setQuery} placeholder="Найти в запасах…" className="sm:w-72" />
          </motion.div>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          emoji="🧺"
          title="Запасов пока нет"
          description="Добавьте то, что лежит в холодильнике и на полках, — меню подстроится, а лишнее не попадёт в список покупок."
        />
      ) : (
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
          {grouped.map(({ category, items: list }, index) => {
            const meta = INGREDIENT_CATEGORIES[category];
            return (
              <motion.section
                key={category}
                layout
                layoutDependency={layoutKey}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 26 }}
                className="mb-4 break-inside-avoid rounded-3xl bg-white p-3 shadow-soft ring-1 ring-ink-900/5"
              >
                <header className="flex items-center gap-2.5 px-2 pb-2 pt-1">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-lg', meta.tint)}>{meta.emoji}</span>
                  <h2 className="text-sm font-bold text-ink-900">{meta.label}</h2>
                  <span className="ml-auto rounded-full bg-cream-100 px-2.5 py-1 text-xs font-bold tabular-nums text-ink-700">{list.length}</span>
                </header>
                <ul className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {list.map((item) => (
                      <PantryItemRow
                        key={item.id}
                        item={item}
                        usedInMenu={menuKeys.has(stockKey(item.name, item.unit))}
                        layoutDependency={layoutKey}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </motion.section>
            );
          })}
          {grouped.length === 0 && <p className="py-8 text-center text-sm text-ink-500">Ничего не найдено</p>}
        </div>
      )}
    </div>
  );
}
