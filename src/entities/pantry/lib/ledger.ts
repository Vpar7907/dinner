import { toBaseUnit, type Ingredient } from '@/entities/ingredient/@x/pantry';
import type { PantryItem } from '../model/types';
import { stockKey } from './keys';

export interface PantryLedger {
  /** Share of the ingredients (0…1) that the remaining stock covers. Spices weigh less than main products. */
  coverage: (ingredients: Ingredient[]) => number;
  /** Takes the ingredients out of the remaining stock `times` times. */
  consume: (ingredients: Ingredient[], times?: number) => void;
  isEmpty: boolean;
}

const CATEGORY_WEIGHT: Partial<Record<Ingredient['category'], number>> = { spices: 0.2, other: 0.5 };

/**
 * A mutable view of the pantry used while building a menu: every planned
 * dish consumes stock, so the same 500 г of rice is not credited twice.
 */
export function createPantryLedger(items: PantryItem[]): PantryLedger {
  const remaining = new Map<string, number>();
  for (const item of items) {
    const key = stockKey(item.name, item.unit);
    const amount = item.amount === null ? Infinity : toBaseUnit(item.amount, item.unit).amount;
    remaining.set(key, (remaining.get(key) ?? 0) + amount);
  }

  return {
    isEmpty: remaining.size === 0,

    coverage(ingredients) {
      let total = 0;
      let covered = 0;
      for (const ingredient of ingredients) {
        const weight = CATEGORY_WEIGHT[ingredient.category] ?? 1;
        const stock = remaining.get(stockKey(ingredient.name, ingredient.unit)) ?? 0;
        const need = toBaseUnit(ingredient.amount, ingredient.unit).amount;
        total += weight;
        if (stock > 0) covered += weight * (need > 0 ? Math.min(1, stock / need) : 1);
      }
      return total > 0 ? covered / total : 0;
    },

    consume(ingredients, times = 1) {
      for (const ingredient of ingredients) {
        const key = stockKey(ingredient.name, ingredient.unit);
        const stock = remaining.get(key);
        if (stock === undefined || stock === Infinity) continue;
        const need = toBaseUnit(ingredient.amount, ingredient.unit).amount * times;
        remaining.set(key, Math.max(0, stock - need));
      }
    },
  };
}
