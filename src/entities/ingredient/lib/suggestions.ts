import { normalizeText } from '@/shared/lib';
import type { Ingredient } from '../model/types';
import type { IngredientSuggestion } from '../ui/IngredientsEditor';

/** Unique ingredient names across several ingredient lists, for autocomplete. */
export function collectSuggestions(lists: Ingredient[][]): IngredientSuggestion[] {
  const map = new Map<string, IngredientSuggestion>();
  for (const list of lists) {
    for (const item of list) {
      const key = normalizeText(item.name);
      if (key && !map.has(key)) map.set(key, { name: item.name.trim(), unit: item.unit, category: item.category });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

/** Drops blank rows and trims names before saving. */
export function sanitizeIngredients(items: Ingredient[]): Ingredient[] {
  return items
    .map((item) => ({ ...item, name: item.name.trim(), amount: Number.isFinite(item.amount) ? Math.max(0, item.amount) : 0 }))
    .filter((item) => item.name.length > 0);
}
