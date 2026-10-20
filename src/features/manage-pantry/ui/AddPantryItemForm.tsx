import { useId, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useDishStore } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { usePantryStore, stockKey } from '@/entities/pantry';
import {
  CATEGORY_ORDER,
  INGREDIENT_CATEGORIES,
  INGREDIENT_UNITS,
  collectSuggestions,
  type IngredientCategory,
  type IngredientUnit,
} from '@/entities/ingredient';
import { normalizeText } from '@/shared/lib';
import { Button, DecimalInput, Input, Select, toast } from '@/shared/ui';

const STAPLES: { name: string; unit: IngredientUnit; category: IngredientCategory }[] = [
  { name: 'Соль', unit: 'ч. л.', category: 'spices' },
  { name: 'Сахар', unit: 'ст. л.', category: 'grocery' },
  { name: 'Масло подсолнечное', unit: 'ст. л.', category: 'grocery' },
  { name: 'Масло оливковое', unit: 'ст. л.', category: 'grocery' },
  { name: 'Мука пшеничная', unit: 'ст. л.', category: 'grocery' },
  { name: 'Перец чёрный молотый', unit: 'ч. л.', category: 'spices' },
  { name: 'Томатная паста', unit: 'ст. л.', category: 'spices' },
  { name: 'Майонез', unit: 'ст. л.', category: 'spices' },
];

export function AddPantryItemForm() {
  const listId = useId();
  const dishes = useDishStore((s) => s.dishes);
  const sides = useSideDishStore((s) => s.sides);
  const items = usePantryStore((s) => s.items);
  const add = usePantryStore((s) => s.add);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [amountValid, setAmountValid] = useState(true);
  const [unit, setUnit] = useState<IngredientUnit>('г');
  const [category, setCategory] = useState<IngredientCategory>('other');

  const suggestions = useMemo(
    () => collectSuggestions([...dishes.map((d) => d.ingredients), ...sides.map((s) => s.ingredients)]),
    [dishes, sides],
  );
  const owned = useMemo(() => new Set(items.map((i) => stockKey(i.name, i.unit))), [items]);
  const missingStaples = STAPLES.filter((s) => !owned.has(stockKey(s.name, s.unit)));

  const handleName = (value: string) => {
    setName(value);
    const known = suggestions.find((s) => normalizeText(s.name) === normalizeText(value));
    if (known) {
      setUnit(known.unit);
      setCategory(known.category);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !amountValid) return;
    await add({ name, amount: amount !== null && amount > 0 ? amount : null, unit, category });
    toast.success('Добавлено в запасы', name.trim());
    setName('');
    setAmount(null);
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-ink-900/5 sm:p-5">
      <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_110px_110px_minmax(0,1.5fr)_auto]">
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s.name} value={s.name} />
          ))}
        </datalist>
        <Input value={name} list={listId} placeholder="Что есть дома? Например, Морковь" onChange={(e) => handleName(e.target.value)} />
        <DecimalInput
          value={amount}
          placeholder="Сколько"
          title="Оставьте пустым, если количество неважно. Можно дробное: 0,5 или 1/2"
          aria-label="Количество"
          onValueChange={setAmount}
          onValidityChange={setAmountValid}
          className="tabular-nums"
        />
        <Select value={unit} onChange={(e) => setUnit(e.target.value as IngredientUnit)}>
          {INGREDIENT_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)}>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {INGREDIENT_CATEGORIES[c].emoji} {INGREDIENT_CATEGORIES[c].label}
            </option>
          ))}
        </Select>
        <Button type="submit" icon={<Plus className="h-4 w-4" />} disabled={!name.trim() || !amountValid}>
          Добавить
        </Button>
      </form>
      <p className="text-xs text-ink-500">Без количества — значит «есть, хватит»: такие продукты никогда не попадут в список покупок.</p>

      {missingStaples.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-ink-500">Быстро:</span>
          {missingStaples.map((staple) => (
            <motion.button
              key={staple.name}
              type="button"
              layout
              whileTap={{ scale: 0.92 }}
              onClick={() => void add({ ...staple, amount: null })}
              className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-brand-50 hover:text-brand-700"
            >
              <Plus className="h-3 w-3" />
              {staple.name}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
