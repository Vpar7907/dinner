import type { IngredientUnit } from '../model/types';

interface BaseQuantity {
  amount: number;
  /** Unit after normalization: kilograms become grams, litres become millilitres. */
  unit: IngredientUnit;
}

export function toBaseUnit(amount: number, unit: IngredientUnit): BaseQuantity {
  if (unit === 'кг') return { amount: amount * 1000, unit: 'г' };
  if (unit === 'л') return { amount: amount * 1000, unit: 'мл' };
  return { amount, unit };
}

/** Converts back to a human-friendly unit (1500 г → 1.5 кг). */
export function toDisplayUnit(amount: number, unit: IngredientUnit): BaseQuantity {
  if (unit === 'г' && amount >= 1000) return { amount: amount / 1000, unit: 'кг' };
  if (unit === 'мл' && amount >= 1000) return { amount: amount / 1000, unit: 'л' };
  return { amount, unit };
}

export function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}
