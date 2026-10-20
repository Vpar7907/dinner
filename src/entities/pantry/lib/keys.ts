import { toBaseUnit, type IngredientUnit } from '@/entities/ingredient/@x/pantry';
import { normalizeText } from '@/shared/lib';

/** Same key format as the shopping list: normalized name + base unit (г/кг → г, мл/л → мл). */
export function stockKey(name: string, unit: IngredientUnit): string {
  return `${normalizeText(name)}|${toBaseUnit(1, unit).unit}`;
}
