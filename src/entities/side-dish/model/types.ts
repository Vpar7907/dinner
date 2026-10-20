import { normalizeCalories } from '@/shared/lib';
import type { Ingredient } from '@/entities/ingredient/@x/side-dish';

export interface SideDish {
  id: string;
  name: string;
  emoji: string;
  /** How many times the side may be served in a week. */
  maxPerWeek: number;
  /** Disabled sides stay in the database but are not picked by the generator. */
  enabled: boolean;
  ingredients: Ingredient[];
  /** Calories per serving; `null` when unknown. Used only by the experimental calorie mode. */
  calories: number | null;
  createdAt: number;
  updatedAt: number;
}

export type SideDishDraft = Omit<SideDish, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export const SIDE_EMOJIS = ['🍚', '🌾', '🥔', '🍝', '🥦', '🥗', '🌽', '🫘', '🍠', '🥬', '🍞', '🫛'];

/** Without a limit set, a side may appear at every meal of the week. */
export const DEFAULT_SIDE_LIMIT = 7;

/** Fills fields missing from records saved before limits existed. */
export function normalizeSide(side: SideDish): SideDish {
  return {
    ...side,
    maxPerWeek: Number.isFinite(side.maxPerWeek) && side.maxPerWeek > 0 ? side.maxPerWeek : DEFAULT_SIDE_LIMIT,
    enabled: side.enabled ?? true,
    calories: normalizeCalories(side.calories),
  };
}
