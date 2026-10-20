import { ingredientsFromTuples } from '@/entities/ingredient/@x/side-dish';
import type { SideDish } from './types';

/** Approximate calories per serving, for the experimental calorie mode. */
const DEMO_SIDE_CALORIES: Record<string, number> = {
  'side-rice': 200,
  'side-buckwheat': 180,
  'side-mash': 210,
  'side-pasta': 220,
  'side-vegetables': 90,
};

function demo(side: Omit<SideDish, 'createdAt' | 'updatedAt' | 'calories'>, order: number): SideDish {
  const createdAt = Date.now() - (100 - order) * 1000;
  return { ...side, calories: DEMO_SIDE_CALORIES[side.id] ?? null, createdAt, updatedAt: createdAt };
}

export function createDemoSides(): SideDish[] {
  return [
    demo(
      {
        id: 'side-rice',
        maxPerWeek: 3,
        enabled: true,
        name: 'Рис',
        emoji: '🍚',
        ingredients: ingredientsFromTuples([
          ['Рис длиннозёрный', 250, 'г', 'grocery'],
          ['Масло сливочное', 20, 'г', 'dairy'],
          ['Соль', 0.5, 'ч. л.', 'spices'],
        ]),
      },
      1,
    ),
    demo(
      {
        id: 'side-buckwheat',
        maxPerWeek: 3,
        enabled: true,
        name: 'Гречка',
        emoji: '🌾',
        ingredients: ingredientsFromTuples([
          ['Гречневая крупа', 250, 'г', 'grocery'],
          ['Масло сливочное', 20, 'г', 'dairy'],
          ['Соль', 0.5, 'ч. л.', 'spices'],
        ]),
      },
      2,
    ),
    demo(
      {
        id: 'side-mash',
        maxPerWeek: 3,
        enabled: true,
        name: 'Картофельное пюре',
        emoji: '🥔',
        ingredients: ingredientsFromTuples([
          ['Картофель', 1, 'кг', 'vegetables'],
          ['Молоко', 150, 'мл', 'dairy'],
          ['Масло сливочное', 40, 'г', 'dairy'],
          ['Соль', 1, 'ч. л.', 'spices'],
        ]),
      },
      3,
    ),
    demo(
      {
        id: 'side-pasta',
        maxPerWeek: 2,
        enabled: true,
        name: 'Макароны',
        emoji: '🍝',
        ingredients: ingredientsFromTuples([
          ['Макароны (рожки)', 300, 'г', 'grocery'],
          ['Масло сливочное', 20, 'г', 'dairy'],
        ]),
      },
      4,
    ),
    demo(
      {
        id: 'side-vegetables',
        maxPerWeek: 3,
        enabled: true,
        name: 'Овощи на пару',
        emoji: '🥦',
        ingredients: ingredientsFromTuples([
          ['Брокколи', 300, 'г', 'vegetables'],
          ['Морковь', 2, 'шт', 'vegetables'],
          ['Стручковая фасоль', 200, 'г', 'vegetables'],
          ['Масло оливковое', 1, 'ст. л.', 'grocery'],
        ]),
      },
      5,
    ),
  ];
}
