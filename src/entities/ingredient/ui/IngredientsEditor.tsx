import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { normalizeText } from '@/shared/lib';
import { Button, DecimalInput, IconButton, Input, Select } from '@/shared/ui';
import { CATEGORY_ORDER, INGREDIENT_CATEGORIES, INGREDIENT_UNITS } from '../model/constants';
import type { Ingredient, IngredientCategory, IngredientUnit } from '../model/types';
import { createIngredient } from '../lib/factory';

export interface IngredientSuggestion {
  name: string;
  unit: IngredientUnit;
  category: IngredientCategory;
}

export interface IngredientsEditorProps {
  value: Ingredient[];
  onChange: (value: Ingredient[]) => void;
  /** Known ingredients from the whole database: offered as autocomplete and used to prefill unit/category. */
  suggestions?: IngredientSuggestion[];
  error?: string;
}

export function IngredientsEditor({ value, onChange, suggestions = [], error }: IngredientsEditorProps) {
  const listId = useId();
  // Rows animate their layout only when rows are added or removed, not on every keystroke.
  const layoutKey = value.map((item) => item.id).join('|');

  const update = (id: string, patch: Partial<Ingredient>) => {
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleNameChange = (item: Ingredient, name: string) => {
    const known = suggestions.find((s) => normalizeText(s.name) === normalizeText(name));
    if (known && item.category === 'other') {
      update(item.id, { name, unit: known.unit, category: known.category });
    } else {
      update(item.id, { name });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Ингредиенты <span className="text-ink-300">· {value.length}</span>
        </span>
        <Button size="sm" variant="soft" icon={<Plus className="h-4 w-4" />} onClick={() => onChange([...value, createIngredient()])}>
          Добавить
        </Button>
      </div>

      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s.name} value={s.name} />
        ))}
      </datalist>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {value.map((item) => (
            <motion.div
              key={item.id}
              layout
              layoutDependency={layoutKey}
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl bg-cream-100/60 p-2 sm:grid-cols-[minmax(0,1.6fr)_88px_100px_minmax(0,1.3fr)_auto]">
                <Input
                  value={item.name}
                  list={listId}
                  placeholder="Название"
                  onChange={(event) => handleNameChange(item, event.target.value)}
                  className="col-span-1 bg-white"
                />
                <IconButton label="Удалить ингредиент" tone="danger" className="self-center sm:order-last" onClick={() => onChange(value.filter((i) => i.id !== item.id))}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
                <div className="col-span-2 grid grid-cols-[88px_100px_1fr] gap-2 sm:contents">
                  <DecimalInput
                    value={Number.isFinite(item.amount) && item.amount > 0 ? item.amount : null}
                    placeholder="0,5"
                    aria-label={`Количество: ${item.name || 'ингредиент'}`}
                    onValueChange={(amount) => update(item.id, { amount: amount ?? 0 })}
                    className="bg-white tabular-nums"
                  />
                  <Select value={item.unit} onChange={(event) => update(item.id, { unit: event.target.value as IngredientUnit })} className="bg-white">
                    {INGREDIENT_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={item.category}
                    onChange={(event) => update(item.id, { category: event.target.value as IngredientCategory })}
                    className="bg-white"
                  >
                    {CATEGORY_ORDER.map((category) => (
                      <option key={category} value={category}>
                        {INGREDIENT_CATEGORIES[category].emoji} {INGREDIENT_CATEGORIES[category].label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {value.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-ink-900/10 px-4 py-6 text-center text-sm text-ink-500">
            Пока нет ингредиентов — добавьте первый, чтобы он попал в список покупок.
          </p>
        )}
      </div>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </div>
  );
}
