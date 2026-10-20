import { useId, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { useDishStore } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { useMenuStore } from '@/entities/menu';
import {
  CATEGORY_ORDER,
  INGREDIENT_CATEGORIES,
  INGREDIENT_UNITS,
  collectSuggestions,
  type IngredientCategory,
  type IngredientUnit,
} from '@/entities/ingredient';
import { cn, normalizeText } from '@/shared/lib';
import { Button, DecimalInput, Input, Select, toast } from '@/shared/ui';

interface QuickItem {
  name: string;
  unit: IngredientUnit;
  category: IngredientCategory;
}

/** Everyday purchases that are rarely part of a recipe. */
const QUICK_ITEMS: QuickItem[] = [
  { name: 'Хлеб', unit: 'шт', category: 'bakery' },
  { name: 'Молоко', unit: 'л', category: 'dairy' },
  { name: 'Яйцо куриное', unit: 'шт', category: 'dairy' },
  { name: 'Бананы', unit: 'кг', category: 'fruits' },
  { name: 'Яблоки', unit: 'кг', category: 'fruits' },
  { name: 'Кофе', unit: 'упак.', category: 'grocery' },
  { name: 'Чай', unit: 'упак.', category: 'grocery' },
  { name: 'Бумажные полотенца', unit: 'упак.', category: 'household' },
  { name: 'Средство для посуды', unit: 'шт', category: 'household' },
  { name: 'Губки', unit: 'упак.', category: 'household' },
];

export function AddExtraItemForm() {
  const listId = useId();
  const dishes = useDishStore((s) => s.dishes);
  const sides = useSideDishStore((s) => s.sides);
  const extras = useMenuStore((s) => s.menu.extraItems);
  const addExtra = useMenuStore((s) => s.addExtra);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [amountValid, setAmountValid] = useState(true);
  const [unit, setUnit] = useState<IngredientUnit>('шт');
  const [category, setCategory] = useState<IngredientCategory>('other');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const suggestions = useMemo(() => {
    const known = collectSuggestions([...dishes.map((d) => d.ingredients), ...sides.map((s) => s.ingredients)]);
    const seen = new Set(known.map((s) => normalizeText(s.name)));
    const quick = QUICK_ITEMS.filter((q) => !seen.has(normalizeText(q.name)));
    return [...known, ...quick];
  }, [dishes, sides]);

  const alreadyAdded = useMemo(() => new Set(extras.map((e) => normalizeText(e.name))), [extras]);
  const quickLeft = QUICK_ITEMS.filter((q) => !alreadyAdded.has(normalizeText(q.name))).slice(0, 8);

  const handleName = (value: string) => {
    setName(value);
    const known = suggestions.find((s) => normalizeText(s.name) === normalizeText(value));
    if (known) {
      setUnit(known.unit);
      setCategory(known.category);
    }
  };

  const add = async (item: { name: string; amount: number | null; unit: IngredientUnit; category: IngredientCategory }) => {
    await addExtra(item);
    toast.success('Добавлено в список', item.name);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !amountValid) return;
    await add({ name: name.trim(), amount: amount !== null && amount > 0 ? amount : null, unit, category });
    setName('');
    setAmount(null);
  };

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-ink-900/5">
      <form onSubmit={submit} className="flex flex-col gap-2">
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s.name} value={s.name} />
          ))}
        </datalist>
        {/* Widths live on wrappers: Input always has w-full, so a width class on it would lose to it. */}
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Input
              value={name}
              list={listId}
              placeholder="Что купить? Хлеб, салфетки…"
              onChange={(e) => handleName(e.target.value)}
              aria-label="Название покупки"
            />
          </div>
          <div className="w-[4.5rem] shrink-0 sm:w-28">
            <DecimalInput
              value={amount}
              placeholder="Кол-во"
              onValueChange={setAmount}
              onValidityChange={setAmountValid}
              className="px-2 text-center tabular-nums sm:px-4"
              aria-label="Количество"
            />
          </div>
          <Button type="submit" icon={<Plus className="h-4 w-4" />} disabled={!name.trim() || !amountValid} className="shrink-0" aria-label="Добавить в список">
            <span className="hidden sm:inline">Добавить</span>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="inline-flex items-center gap-1 self-start text-xs font-semibold text-ink-500 transition hover:text-ink-900"
        >
          {INGREDIENT_CATEGORIES[category].emoji} {INGREDIENT_CATEGORIES[category].label} · {unit}
          <motion.span animate={{ rotate: detailsOpen ? 180 : 0 }}>
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {detailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-[110px_1fr] gap-2 overflow-hidden"
            >
              <Select value={unit} onChange={(e) => setUnit(e.target.value as IngredientUnit)} aria-label="Единица">
                {INGREDIENT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
              <Select value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)} aria-label="Категория">
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {INGREDIENT_CATEGORIES[c].emoji} {INGREDIENT_CATEGORIES[c].label}
                  </option>
                ))}
              </Select>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {quickLeft.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-ink-500">Быстро:</span>
          <AnimatePresence initial={false}>
            {quickLeft.map((item) => (
              <motion.button
                key={item.name}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => void add({ ...item, amount: null })}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full bg-cream-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-brand-50 hover:text-brand-700',
                )}
              >
                <span>{INGREDIENT_CATEGORIES[item.category].emoji}</span>
                {item.name}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
