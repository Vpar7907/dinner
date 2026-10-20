import type { PantryItem } from './types';

/** Typical kitchen staples, so the "in stock" logic is visible from the first launch. */
export function createDemoPantry(): PantryItem[] {
  const now = Date.now();
  const items: Omit<PantryItem, 'id' | 'updatedAt'>[] = [
    { name: 'Соль', amount: null, unit: 'ч. л.', category: 'spices' },
    { name: 'Перец чёрный молотый', amount: null, unit: 'ч. л.', category: 'spices' },
    { name: 'Масло подсолнечное', amount: null, unit: 'ст. л.', category: 'grocery' },
    { name: 'Сахар', amount: null, unit: 'ст. л.', category: 'grocery' },
    { name: 'Мука пшеничная', amount: null, unit: 'ст. л.', category: 'grocery' },
    { name: 'Рис длиннозёрный', amount: 900, unit: 'г', category: 'grocery' },
    { name: 'Гречневая крупа', amount: 800, unit: 'г', category: 'grocery' },
    { name: 'Яйцо куриное', amount: 10, unit: 'шт', category: 'dairy' },
    { name: 'Лук репчатый', amount: 4, unit: 'шт', category: 'vegetables' },
    { name: 'Картофель', amount: 2, unit: 'кг', category: 'vegetables' },
  ];
  return items.map((item, index) => ({ ...item, id: `pantry-demo-${index}`, updatedAt: now }));
}
