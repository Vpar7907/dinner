import type { IngredientCategory, IngredientUnit } from '@/entities/ingredient/@x/pantry';

export interface PantryItem {
  id: string;
  name: string;
  /** `null` means "there is some, the amount does not matter" (salt, spices, oil…). */
  amount: number | null;
  unit: IngredientUnit;
  category: IngredientCategory;
  updatedAt: number;
}

export type PantryDraft = Omit<PantryItem, 'id' | 'updatedAt'>;
