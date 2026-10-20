import { createId } from '@/shared/lib';
import type { Ingredient, IngredientCategory, IngredientUnit } from '../model/types';

export function createIngredient(
  name = '',
  amount = 0,
  unit: IngredientUnit = 'г',
  category: IngredientCategory = 'other',
): Ingredient {
  return { id: createId('ing'), name, amount, unit, category };
}

/** Compact tuple form used to describe demo data: [name, amount, unit, category]. */
export type IngredientTuple = [string, number, IngredientUnit, IngredientCategory];

export function ingredientsFromTuples(tuples: IngredientTuple[]): Ingredient[] {
  return tuples.map(([name, amount, unit, category]) => createIngredient(name, amount, unit, category));
}
