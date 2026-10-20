import { formatNumber } from '@/shared/lib';
import type { Ingredient } from '../model/types';

export interface IngredientPreviewProps {
  ingredients: Ingredient[];
  limit?: number;
}

/** Compact one-line summary of ingredients for cards. */
export function IngredientPreview({ ingredients, limit = 4 }: IngredientPreviewProps) {
  if (ingredients.length === 0) {
    return <p className="text-xs text-ink-300">Ингредиенты не указаны</p>;
  }
  const visible = ingredients.slice(0, limit);
  const rest = ingredients.length - visible.length;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {visible.map((item) => (
        <li key={item.id} className="rounded-lg bg-cream-100 px-2 py-1 text-xs text-ink-700">
          {item.name}
          {item.amount > 0 && (
            <span className="text-ink-500">
              {' '}
              · {formatNumber(item.amount)} {item.unit}
            </span>
          )}
        </li>
      ))}
      {rest > 0 && <li className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-500">+{rest}</li>}
    </ul>
  );
}
