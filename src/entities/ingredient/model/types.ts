export type IngredientUnit = 'г' | 'кг' | 'мл' | 'л' | 'шт' | 'ст. л.' | 'ч. л.' | 'зубчик' | 'пучок' | 'упак.';

export type IngredientCategory =
  | 'meat'
  | 'fish'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'grocery'
  | 'spices'
  | 'bakery'
  | 'household'
  | 'other';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: IngredientUnit;
  category: IngredientCategory;
}
