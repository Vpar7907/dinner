import type { Ingredient } from '@/entities/ingredient/@x/dish';

export type ProteinType = 'chicken' | 'beef' | 'pork' | 'fish' | 'turkey' | 'lamb' | 'vegetarian';

/** What kind of meal the dish is: decides which menu slots it can fill. */
export type DishCourse = 'breakfast' | 'main' | 'salad';

export interface Dish {
  id: string;
  name: string;
  emoji: string;
  protein: ProteinType;
  /** Courses the dish suits, e.g. an omelette can be both breakfast and main. */
  courses: DishCourse[];
  /** How many times the dish may appear in the weekly menu. */
  maxPerWeek: number;
  /** How many times the dish may appear within a single day. */
  maxPerDay: number;
  requiresSide: boolean;
  /** Side dishes the dish can be served with. Empty + requiresSide means "any side". */
  allowedSideIds: string[];
  ingredients: Ingredient[];
  /** Free-form notes: cooking tips, a link to the recipe… Links are rendered clickable. */
  notes: string;
  /** Calories per serving; `null` when unknown. Used only by the experimental calorie mode. */
  calories: number | null;
  createdAt: number;
  updatedAt: number;
}

export type DishDraft = Omit<Dish, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
