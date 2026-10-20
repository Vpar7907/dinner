import type { IngredientCategory, IngredientUnit } from '@/entities/ingredient/@x/menu';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'salad';

/** 0 = Monday … 6 = Sunday */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type SlotKey = `${DayIndex}-${MealType}`;

export interface MealSlot {
  dishId: string | null;
  sideId: string | null;
  /** Locked slots are preserved by the generator. */
  locked: boolean;
  /** Excluded meal (eating out, fasting…): never filled, not counted in the shopping list. */
  skipped: boolean;
}

export type MenuSlots = Record<SlotKey, MealSlot>;

export type EnabledMeals = Record<MealType, boolean>;

/** Something to buy that is not needed by the menu (bread, napkins, fruit…). */
export interface ExtraShoppingItem {
  id: string;
  name: string;
  /** `null` — amount not specified. */
  amount: number | null;
  unit: IngredientUnit;
  category: IngredientCategory;
  createdAt: number;
}

export type ExtraShoppingDraft = Omit<ExtraShoppingItem, 'id' | 'createdAt'>;

/** soft — the generator only prefers fitting days; strict — a dish that overshoots the day is never placed. */
export type CalorieStrictness = 'soft' | 'strict';

/** target — aim at the daily value ± tolerance; ceiling — only never go above it. */
export type CalorieMode = 'target' | 'ceiling';

/** Experimental calorie mode. When `enabled` is false nothing calorie-related affects the app. */
export interface CalorieSettings {
  enabled: boolean;
  mode: CalorieMode;
  /** Calories per day: the target or the ceiling, depending on `mode`. */
  dailyTarget: number;
  /** Allowed deviation from the target, in percent (±). Not used for a ceiling. */
  tolerance: number;
  strictness: CalorieStrictness;
}

export interface WeeklyMenu {
  id: 'active';
  slots: MenuSlots;
  /** Which meal types are part of the weekly plan. */
  enabledMeals: EnabledMeals;
  generatedAt: number | null;
  updatedAt: number;
  /** Keys of shopping-list items marked as bought. */
  checkedItems: string[];
  /** Items added to the shopping list by hand. */
  extraItems: ExtraShoppingItem[];
  calories: CalorieSettings;
}
