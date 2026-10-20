import { INGREDIENT_CATEGORIES } from '@/entities/ingredient';
import { formatNumber } from '@/shared/lib';
import type { ShoppingGroup } from './aggregateShoppingList';

/** Plain-text version of the list for copying into a messenger or notes. */
export function formatShoppingList(groups: ShoppingGroup[], checked: Set<string>): string {
  const lines: string[] = ['🛒 Список покупок на неделю', ''];
  for (const group of groups) {
    const meta = INGREDIENT_CATEGORIES[group.category];
    lines.push(`${meta.emoji} ${meta.label}`);
    for (const item of group.items) {
      const mark = checked.has(item.key) ? '✅' : '▫️';
      const amount = item.amount > 0 ? ` — ${formatNumber(item.amount)} ${item.unit}` : '';
      lines.push(`${mark} ${item.name}${amount}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}
