import { ingredientsFromTuples } from '@/entities/ingredient/@x/dish';
import type { Dish } from './types';
import { createDemoBreakfasts, createDemoSalads } from './demoCourses';
import { DEMO_DISH_CALORIES } from './demoCalories';

/**
 * Side-dish ids are referenced by value: they match the fixed ids of the
 * demo side dishes so that the seeded database is consistent.
 */
const RICE = 'side-rice';
const BUCKWHEAT = 'side-buckwheat';
const MASH = 'side-mash';
const PASTA = 'side-pasta';
const VEGETABLES = 'side-vegetables';

function demo(dish: Omit<Dish, 'createdAt' | 'updatedAt' | 'maxPerDay' | 'notes' | 'calories'> & { notes?: string }, order: number): Dish {
  const createdAt = Date.now() - (100 - order) * 1000;
  return { notes: '', ...dish, maxPerDay: 1, calories: DEMO_DISH_CALORIES[dish.id] ?? null, createdAt, updatedAt: createdAt };
}

export function createDemoDishes(): Dish[] {
  return [...createDemoMains(), ...createDemoBreakfasts(), ...createDemoSalads()];
}

function createDemoMains(): Dish[] {
  return [
    demo(
      {
        id: 'dish-chicken-cutlets',
        name: 'Котлеты из курицы',
        notes: 'Хлеб замочить в молоке на 10 минут. Жарить по 4–5 минут с каждой стороны на среднем огне.',
        emoji: '🍗',
        protein: 'chicken',
        courses: ['main'],
        maxPerWeek: 2,
        requiresSide: true,
        allowedSideIds: [RICE, BUCKWHEAT, MASH, PASTA],
        ingredients: ingredientsFromTuples([
          ['Куриный фарш', 600, 'г', 'meat'],
          ['Лук репчатый', 1, 'шт', 'vegetables'],
          ['Яйцо куриное', 1, 'шт', 'dairy'],
          ['Батон', 2, 'шт', 'bakery'],
          ['Молоко', 100, 'мл', 'dairy'],
          ['Масло подсолнечное', 3, 'ст. л.', 'grocery'],
          ['Соль', 1, 'ч. л.', 'spices'],
        ]),
      },
      1,
    ),
    demo(
      {
        id: 'dish-baked-fish',
        name: 'Запечённая рыба',
        emoji: '🐟',
        protein: 'fish',
        courses: ['main'],
        maxPerWeek: 2,
        requiresSide: true,
        allowedSideIds: [RICE, MASH, VEGETABLES],
        ingredients: ingredientsFromTuples([
          ['Филе трески', 700, 'г', 'fish'],
          ['Лимон', 1, 'шт', 'fruits'],
          ['Чеснок', 2, 'зубчик', 'vegetables'],
          ['Укроп', 1, 'пучок', 'vegetables'],
          ['Масло оливковое', 2, 'ст. л.', 'grocery'],
          ['Соль', 1, 'ч. л.', 'spices'],
        ]),
      },
      2,
    ),
    demo(
      {
        id: 'dish-beef-goulash',
        name: 'Гуляш из говядины',
        emoji: '🍲',
        protein: 'beef',
        courses: ['main'],
        maxPerWeek: 2,
        requiresSide: true,
        allowedSideIds: [BUCKWHEAT, MASH, PASTA],
        ingredients: ingredientsFromTuples([
          ['Говядина', 700, 'г', 'meat'],
          ['Лук репчатый', 2, 'шт', 'vegetables'],
          ['Морковь', 1, 'шт', 'vegetables'],
          ['Перец болгарский', 1, 'шт', 'vegetables'],
          ['Томатная паста', 2, 'ст. л.', 'spices'],
          ['Паприка сладкая', 1, 'ч. л.', 'spices'],
          ['Мука пшеничная', 1, 'ст. л.', 'grocery'],
        ]),
      },
      3,
    ),
    demo(
      {
        id: 'dish-borscht',
        name: 'Борщ',
        notes: 'На второй день ещё вкуснее — удобно готовить сразу на два обеда.\nСвёклу тушить отдельно с ложкой уксуса, чтобы сохранить цвет.',
        emoji: '🥣',
        protein: 'beef',
        courses: ['main'],
        maxPerWeek: 2,
        requiresSide: false,
        allowedSideIds: [],
        ingredients: ingredientsFromTuples([
          ['Говядина на кости', 500, 'г', 'meat'],
          ['Свёкла', 2, 'шт', 'vegetables'],
          ['Капуста белокочанная', 400, 'г', 'vegetables'],
          ['Картофель', 400, 'г', 'vegetables'],
          ['Морковь', 1, 'шт', 'vegetables'],
          ['Лук репчатый', 1, 'шт', 'vegetables'],
          ['Томатная паста', 2, 'ст. л.', 'spices'],
          ['Сметана', 200, 'г', 'dairy'],
          ['Хлеб чёрный', 1, 'шт', 'bakery'],
        ]),
      },
      4,
    ),
    demo(
      {
        id: 'dish-mushroom-pasta',
        name: 'Паста с грибами',
        emoji: '🍝',
        protein: 'vegetarian',
        courses: ['main'],
        maxPerWeek: 2,
        requiresSide: false,
        allowedSideIds: [],
        ingredients: ingredientsFromTuples([
          ['Спагетти', 400, 'г', 'grocery'],
          ['Шампиньоны', 400, 'г', 'vegetables'],
          ['Сливки 20%', 200, 'мл', 'dairy'],
          ['Сыр пармезан', 60, 'г', 'dairy'],
          ['Чеснок', 2, 'зубчик', 'vegetables'],
          ['Масло сливочное', 30, 'г', 'dairy'],
        ]),
      },
      5,
    ),
    demo(
      {
        id: 'dish-pork-chops',
        name: 'Свиные отбивные',
        emoji: '🥩',
        protein: 'pork',
        courses: ['main'],
        maxPerWeek: 1,
        requiresSide: true,
        allowedSideIds: [MASH, BUCKWHEAT, VEGETABLES],
        ingredients: ingredientsFromTuples([
          ['Свиная корейка', 700, 'г', 'meat'],
          ['Яйцо куриное', 2, 'шт', 'dairy'],
          ['Сухари панировочные', 80, 'г', 'grocery'],
          ['Масло подсолнечное', 4, 'ст. л.', 'grocery'],
          ['Перец чёрный молотый', 1, 'ч. л.', 'spices'],
        ]),
      },
      6,
    ),
    demo(
      {
        id: 'dish-turkey-meatballs',
        name: 'Тефтели из индейки в томатном соусе',
        emoji: '🧆',
        protein: 'turkey',
        courses: ['main'],
        maxPerWeek: 2,
        requiresSide: true,
        allowedSideIds: [RICE, PASTA, BUCKWHEAT],
        ingredients: ingredientsFromTuples([
          ['Фарш из индейки', 600, 'г', 'meat'],
          ['Рис круглозёрный', 80, 'г', 'grocery'],
          ['Томаты в собственном соку', 400, 'г', 'grocery'],
          ['Лук репчатый', 1, 'шт', 'vegetables'],
          ['Морковь', 1, 'шт', 'vegetables'],
          ['Сметана', 100, 'г', 'dairy'],
        ]),
      },
      7,
    ),
    demo(
      {
        id: 'dish-chicken-pilaf',
        name: 'Плов с курицей',
        emoji: '🍛',
        protein: 'chicken',
        courses: ['main'],
        maxPerWeek: 1,
        requiresSide: false,
        allowedSideIds: [],
        ingredients: ingredientsFromTuples([
          ['Куриные бёдра', 800, 'г', 'meat'],
          ['Рис длиннозёрный', 400, 'г', 'grocery'],
          ['Морковь', 3, 'шт', 'vegetables'],
          ['Лук репчатый', 2, 'шт', 'vegetables'],
          ['Чеснок', 1, 'шт', 'vegetables'],
          ['Зира', 1, 'ч. л.', 'spices'],
          ['Масло подсолнечное', 5, 'ст. л.', 'grocery'],
        ]),
      },
      8,
    ),
    demo(
      {
        id: 'dish-chickpea-stew',
        name: 'Овощное рагу с нутом',
        emoji: '🥘',
        protein: 'vegetarian',
        courses: ['main'],
        maxPerWeek: 2,
        requiresSide: false,
        allowedSideIds: [],
        ingredients: ingredientsFromTuples([
          ['Нут консервированный', 2, 'шт', 'grocery'],
          ['Кабачок', 1, 'шт', 'vegetables'],
          ['Баклажан', 1, 'шт', 'vegetables'],
          ['Перец болгарский', 2, 'шт', 'vegetables'],
          ['Томаты в собственном соку', 400, 'г', 'grocery'],
          ['Кинза', 1, 'пучок', 'vegetables'],
        ]),
      },
      9,
    ),
    demo(
      {
        id: 'dish-lamb-shurpa',
        name: 'Шурпа из баранины',
        emoji: '🫕',
        protein: 'lamb',
        courses: ['main'],
        maxPerWeek: 1,
        requiresSide: false,
        allowedSideIds: [],
        ingredients: ingredientsFromTuples([
          ['Баранина', 600, 'г', 'meat'],
          ['Картофель', 500, 'г', 'vegetables'],
          ['Помидоры', 3, 'шт', 'vegetables'],
          ['Лук репчатый', 2, 'шт', 'vegetables'],
          ['Перец болгарский', 1, 'шт', 'vegetables'],
          ['Кинза', 1, 'пучок', 'vegetables'],
        ]),
      },
      10,
    ),
  ];
}
