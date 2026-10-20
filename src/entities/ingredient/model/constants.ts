import type { IngredientCategory, IngredientUnit } from './types';

export const INGREDIENT_UNITS: IngredientUnit[] = ['г', 'кг', 'мл', 'л', 'шт', 'ст. л.', 'ч. л.', 'зубчик', 'пучок', 'упак.'];

export interface CategoryMeta {
  label: string;
  emoji: string;
  /** Tailwind classes for tinted surfaces. */
  tint: string;
}

/** Ordered: the shopping list follows a typical walk through a supermarket. */
export const INGREDIENT_CATEGORIES: Record<IngredientCategory, CategoryMeta> = {
  vegetables: { label: 'Овощи и зелень', emoji: '🥕', tint: 'bg-emerald-50 text-emerald-700' },
  fruits: { label: 'Фрукты', emoji: '🍋', tint: 'bg-yellow-50 text-yellow-700' },
  meat: { label: 'Мясо и птица', emoji: '🥩', tint: 'bg-rose-50 text-rose-700' },
  fish: { label: 'Рыба и морепродукты', emoji: '🐟', tint: 'bg-sky-50 text-sky-700' },
  dairy: { label: 'Молочное и яйца', emoji: '🥛', tint: 'bg-indigo-50 text-indigo-700' },
  grocery: { label: 'Бакалея', emoji: '🌾', tint: 'bg-amber-50 text-amber-700' },
  spices: { label: 'Специи и соусы', emoji: '🧂', tint: 'bg-orange-50 text-orange-700' },
  bakery: { label: 'Хлеб и выпечка', emoji: '🥖', tint: 'bg-stone-100 text-stone-700' },
  household: { label: 'Хозтовары', emoji: '🧽', tint: 'bg-cyan-50 text-cyan-700' },
  other: { label: 'Прочее', emoji: '🛒', tint: 'bg-slate-100 text-slate-700' },
};

export const CATEGORY_ORDER = Object.keys(INGREDIENT_CATEGORIES) as IngredientCategory[];
