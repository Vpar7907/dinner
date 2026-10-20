import type { Dish } from '@/entities/dish';
import type { SideDish } from '@/entities/side-dish';
import { activeSlotKeys, extraKey, type EnabledMeals, type ExtraShoppingItem, type MenuSlots } from '@/entities/menu';
import { stockKey, type PantryItem } from '@/entities/pantry';
import {
  CATEGORY_ORDER,
  roundAmount,
  toBaseUnit,
  toDisplayUnit,
  type Ingredient,
  type IngredientCategory,
  type IngredientUnit,
} from '@/entities/ingredient';
import { formatNumber, normalizeText } from '@/shared/lib';

export type StockStatus =
  /** Nothing at home. */
  | { kind: 'none' }
  /** Some at home, the rest has to be bought. */
  | { kind: 'partial'; label: string }
  /** Enough at home — nothing to buy. */
  | { kind: 'full'; label: string }
  /** At home in a unit that cannot be converted (шт vs г): the user should check. */
  | { kind: 'unknown'; label: string };

export interface ShoppingItem {
  /** Stable key: normalized name + base unit (or `extra:<id>`). Used to persist the "bought" state. */
  key: string;
  /** `menu` — needed by dishes in the menu; `extra` — added to the list by hand. */
  origin: 'menu' | 'extra';
  /** Id of the hand-added item (for editing and removal). */
  extraId?: string;
  name: string;
  /** Amount still to buy (display unit). */
  amount: number;
  unit: IngredientUnit;
  /** Total amount the menu needs (display unit). */
  needed: string;
  category: IngredientCategory;
  stock: StockStatus;
  /** Dishes and sides that need this ingredient, with how many times they appear. */
  sources: { name: string; count: number }[];
}

export interface ShoppingGroup {
  category: IngredientCategory;
  items: ShoppingItem[];
}

export interface ShoppingListResult {
  /** What to buy, grouped by category. */
  groups: ShoppingGroup[];
  /** Ingredients fully covered by the pantry. */
  inStock: ShoppingItem[];
}

interface Accumulator {
  key: string;
  name: string;
  amount: number;
  unit: IngredientUnit;
  category: IngredientCategory;
  sources: Map<string, number>;
}

const formatQuantity = (amount: number, unit: IngredientUnit) => {
  const display = toDisplayUnit(amount, unit);
  return `${formatNumber(roundAmount(display.amount))} ${display.unit}`;
};

/**
 * Collects ingredients of every dish and side dish in the active menu, merges
 * duplicates by name (case/ё-insensitive) and compatible unit (г/кг, мл/л),
 * sums quantities, subtracts what is already in the pantry and groups the
 * result by category. Disabled meal types and excluded meals are ignored.
 * Hand-added extras are listed as they are: the pantry is not subtracted from
 * them, because the user added them on purpose.
 */
export function aggregateShoppingList(
  slots: MenuSlots,
  enabledMeals: EnabledMeals,
  dishMap: Map<string, Dish>,
  sideMap: Map<string, SideDish>,
  pantry: PantryItem[] = [],
  extras: ExtraShoppingItem[] = [],
): ShoppingListResult {
  const items = new Map<string, Accumulator>();

  const addAll = (ingredients: Ingredient[], sourceName: string) => {
    for (const ingredient of ingredients) {
      const base = toBaseUnit(ingredient.amount, ingredient.unit);
      const key = `${normalizeText(ingredient.name)}|${base.unit}`;
      const existing = items.get(key);
      if (existing) {
        existing.amount += base.amount;
        existing.sources.set(sourceName, (existing.sources.get(sourceName) ?? 0) + 1);
      } else {
        items.set(key, {
          key,
          name: ingredient.name.trim(),
          amount: base.amount,
          unit: base.unit,
          category: ingredient.category,
          sources: new Map([[sourceName, 1]]),
        });
      }
    }
  };

  for (const slotKey of activeSlotKeys(slots, enabledMeals)) {
    const { dishId, sideId } = slots[slotKey];
    const dish = dishId ? dishMap.get(dishId) : undefined;
    if (!dish) continue;
    addAll(dish.ingredients, dish.name);
    const side = sideId ? sideMap.get(sideId) : undefined;
    if (side && dish.requiresSide) addAll(side.ingredients, side.name);
  }

  // Pantry stock in base units; `Infinity` = "there is some, amount not tracked".
  const stockByKey = new Map<string, number>();
  const stockByName = new Map<string, PantryItem[]>();
  for (const item of pantry) {
    const key = stockKey(item.name, item.unit);
    const amount = item.amount === null ? Infinity : toBaseUnit(item.amount, item.unit).amount;
    stockByKey.set(key, (stockByKey.get(key) ?? 0) + amount);
    const name = normalizeText(item.name);
    stockByName.set(name, [...(stockByName.get(name) ?? []), item]);
  }

  const grouped = new Map<IngredientCategory, ShoppingItem[]>();
  const inStock: ShoppingItem[] = [];

  for (const acc of items.values()) {
    const have = stockByKey.get(acc.key) ?? 0;
    const toBuy = have === Infinity ? 0 : Math.max(0, acc.amount - have);
    let stock: StockStatus = { kind: 'none' };
    if (have === Infinity) {
      stock = { kind: 'full', label: 'есть дома' };
    } else if (have > 0) {
      stock = toBuy === 0 ? { kind: 'full', label: `дома ${formatQuantity(have, acc.unit)}` } : { kind: 'partial', label: `дома ${formatQuantity(have, acc.unit)}` };
    } else {
      const sameName = stockByName.get(normalizeText(acc.name));
      if (sameName?.length) {
        const label = sameName.map((i) => (i.amount === null ? 'есть' : `${formatNumber(i.amount)} ${i.unit}`)).join(', ');
        stock = { kind: 'unknown', label: `дома: ${label} — проверьте количество` };
      }
    }

    const display = toDisplayUnit(toBuy, acc.unit);
    const item: ShoppingItem = {
      key: acc.key,
      origin: 'menu',
      name: acc.name,
      amount: roundAmount(display.amount),
      unit: display.unit,
      needed: formatQuantity(acc.amount, acc.unit),
      category: acc.category,
      stock,
      sources: [...acc.sources.entries()].map(([name, count]) => ({ name, count })),
    };

    // Ingredients listed without an amount are still bought unless they are in stock.
    if (stock.kind === 'full') inStock.push(item);
    else grouped.set(acc.category, [...(grouped.get(acc.category) ?? []), item]);
  }

  for (const extra of extras) {
    const base = extra.amount !== null && extra.amount > 0 ? toBaseUnit(extra.amount, extra.unit) : null;
    const display = base ? toDisplayUnit(base.amount, base.unit) : null;
    const item: ShoppingItem = {
      key: extraKey(extra.id),
      origin: 'extra',
      extraId: extra.id,
      name: extra.name,
      amount: display ? roundAmount(display.amount) : 0,
      unit: display ? display.unit : extra.unit,
      needed: base ? formatQuantity(base.amount, base.unit) : '',
      category: extra.category,
      stock: { kind: 'none' },
      sources: [],
    };
    grouped.set(extra.category, [...(grouped.get(extra.category) ?? []), item]);
  }

  return {
    groups: CATEGORY_ORDER.filter((category) => grouped.has(category)).map((category) => ({
      category,
      // Menu ingredients first, then hand-added items, each alphabetically.
      items: grouped
        .get(category)!
        .sort((a, b) => Number(a.origin === 'extra') - Number(b.origin === 'extra') || a.name.localeCompare(b.name, 'ru')),
    })),
    inStock: inStock.sort((a, b) => a.name.localeCompare(b.name, 'ru')),
  };
}
