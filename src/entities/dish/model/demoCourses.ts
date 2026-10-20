import { ingredientsFromTuples, type IngredientTuple } from '@/entities/ingredient/@x/dish';
import type { Dish, DishCourse, ProteinType } from './types';
import { DEMO_DISH_CALORIES } from './demoCalories';

interface DemoSpec {
  id: string;
  name: string;
  emoji: string;
  protein: ProteinType;
  maxPerWeek: number;
  ingredients: IngredientTuple[];
}

function build(course: DishCourse, specs: DemoSpec[], orderOffset: number): Dish[] {
  return specs.map((spec, index) => {
    const createdAt = Date.now() - (100 - orderOffset - index) * 1000;
    return {
      ...spec,
      courses: [course],
      maxPerDay: 1,
      notes: '',
      calories: DEMO_DISH_CALORIES[spec.id] ?? null,
      requiresSide: false,
      allowedSideIds: [],
      ingredients: ingredientsFromTuples(spec.ingredients),
      createdAt,
      updatedAt: createdAt,
    };
  });
}

export function createDemoBreakfasts(): Dish[] {
  return build(
    'breakfast',
    [
      {
        id: 'dish-syrniki',
        name: 'Сырники со сметаной',
        emoji: '🥞',
        protein: 'vegetarian',
        maxPerWeek: 2,
        ingredients: [
          ['Творог 5%', 500, 'г', 'dairy'],
          ['Яйцо куриное', 1, 'шт', 'dairy'],
          ['Мука пшеничная', 4, 'ст. л.', 'grocery'],
          ['Сахар', 2, 'ст. л.', 'grocery'],
          ['Сметана', 100, 'г', 'dairy'],
        ],
      },
      {
        id: 'dish-oatmeal',
        name: 'Овсянка с ягодами',
        emoji: '🥣',
        protein: 'vegetarian',
        maxPerWeek: 3,
        ingredients: [
          ['Овсяные хлопья', 200, 'г', 'grocery'],
          ['Молоко', 500, 'мл', 'dairy'],
          ['Ягоды замороженные', 150, 'г', 'fruits'],
          ['Мёд', 2, 'ст. л.', 'grocery'],
        ],
      },
      {
        id: 'dish-omelette',
        name: 'Омлет с овощами',
        emoji: '🍳',
        protein: 'vegetarian',
        maxPerWeek: 2,
        ingredients: [
          ['Яйцо куриное', 6, 'шт', 'dairy'],
          ['Молоко', 100, 'мл', 'dairy'],
          ['Помидоры', 2, 'шт', 'vegetables'],
          ['Перец болгарский', 1, 'шт', 'vegetables'],
          ['Хлеб тостовый', 4, 'шт', 'bakery'],
        ],
      },
      {
        id: 'dish-buckwheat-porridge',
        name: 'Гречневая каша с молоком',
        emoji: '🌾',
        protein: 'vegetarian',
        maxPerWeek: 2,
        ingredients: [
          ['Гречневая крупа', 150, 'г', 'grocery'],
          ['Молоко', 600, 'мл', 'dairy'],
          ['Масло сливочное', 20, 'г', 'dairy'],
        ],
      },
      {
        id: 'dish-eggs-bacon',
        name: 'Яичница с беконом',
        emoji: '🥓',
        protein: 'pork',
        maxPerWeek: 1,
        ingredients: [
          ['Яйцо куриное', 6, 'шт', 'dairy'],
          ['Бекон', 150, 'г', 'meat'],
          ['Хлеб тостовый', 4, 'шт', 'bakery'],
        ],
      },
    ],
    20,
  );
}

export function createDemoSalads(): Dish[] {
  return build(
    'salad',
    [
      {
        id: 'dish-salad-greek',
        name: 'Греческий салат',
        emoji: '🥗',
        protein: 'vegetarian',
        maxPerWeek: 2,
        ingredients: [
          ['Огурцы', 2, 'шт', 'vegetables'],
          ['Помидоры', 3, 'шт', 'vegetables'],
          ['Перец болгарский', 1, 'шт', 'vegetables'],
          ['Сыр фета', 150, 'г', 'dairy'],
          ['Маслины', 1, 'упак.', 'grocery'],
          ['Масло оливковое', 2, 'ст. л.', 'grocery'],
        ],
      },
      {
        id: 'dish-salad-caesar',
        name: 'Цезарь с курицей',
        emoji: '🥬',
        protein: 'chicken',
        maxPerWeek: 2,
        ingredients: [
          ['Куриное филе', 300, 'г', 'meat'],
          ['Салат романо', 1, 'шт', 'vegetables'],
          ['Помидоры черри', 200, 'г', 'vegetables'],
          ['Сыр пармезан', 40, 'г', 'dairy'],
          ['Сухарики', 1, 'упак.', 'bakery'],
          ['Соус цезарь', 3, 'ст. л.', 'spices'],
        ],
      },
      {
        id: 'dish-salad-vinaigrette',
        name: 'Винегрет',
        emoji: '🥗',
        protein: 'vegetarian',
        maxPerWeek: 2,
        ingredients: [
          ['Свёкла', 2, 'шт', 'vegetables'],
          ['Картофель', 300, 'г', 'vegetables'],
          ['Морковь', 1, 'шт', 'vegetables'],
          ['Огурцы солёные', 3, 'шт', 'grocery'],
          ['Горошек консервированный', 1, 'шт', 'grocery'],
          ['Масло подсолнечное', 2, 'ст. л.', 'grocery'],
        ],
      },
      {
        id: 'dish-salad-fresh',
        name: 'Салат из свежих овощей',
        emoji: '🥒',
        protein: 'vegetarian',
        maxPerWeek: 3,
        ingredients: [
          ['Огурцы', 2, 'шт', 'vegetables'],
          ['Помидоры', 2, 'шт', 'vegetables'],
          ['Укроп', 1, 'пучок', 'vegetables'],
          ['Сметана', 100, 'г', 'dairy'],
        ],
      },
      {
        id: 'dish-salad-tuna',
        name: 'Салат с тунцом',
        emoji: '🐟',
        protein: 'fish',
        maxPerWeek: 1,
        ingredients: [
          ['Тунец консервированный', 1, 'шт', 'fish'],
          ['Яйцо куриное', 3, 'шт', 'dairy'],
          ['Огурцы', 1, 'шт', 'vegetables'],
          ['Кукуруза консервированная', 1, 'шт', 'grocery'],
          ['Майонез', 2, 'ст. л.', 'spices'],
        ],
      },
      {
        id: 'dish-salad-olivier',
        name: 'Оливье',
        emoji: '🥔',
        protein: 'chicken',
        maxPerWeek: 1,
        ingredients: [
          ['Куриное филе', 300, 'г', 'meat'],
          ['Картофель', 400, 'г', 'vegetables'],
          ['Морковь', 1, 'шт', 'vegetables'],
          ['Яйцо куриное', 3, 'шт', 'dairy'],
          ['Огурцы солёные', 3, 'шт', 'grocery'],
          ['Горошек консервированный', 1, 'шт', 'grocery'],
          ['Майонез', 3, 'ст. л.', 'spices'],
        ],
      },
    ],
    40,
  );
}
