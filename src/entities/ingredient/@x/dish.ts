/** Cross-import API of `ingredient` for the `dish` entity (FSD @x notation). */
export type { Ingredient } from '../model/types';
export { ingredientsFromTuples } from '../lib/factory';
export type { IngredientTuple } from '../lib/factory';
export { IngredientPreview } from '../ui/IngredientPreview';
