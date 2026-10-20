import { normalizeCalories } from '@/shared/lib';
import type { Dish, DishCourse } from './types';

export interface CourseMeta {
  label: string;
  plural: string;
  emoji: string;
  hint: string;
}

export const COURSE_META: Record<DishCourse, CourseMeta> = {
  breakfast: { label: 'Завтрак', plural: 'Завтраки', emoji: '🍳', hint: 'Подаётся утром' },
  main: { label: 'Основное', plural: 'Основные', emoji: '🍲', hint: 'Для обеда и ужина' },
  salad: { label: 'Салат', plural: 'Салаты', emoji: '🥗', hint: 'Отдельный приём — салат дня' },
};

export const COURSES = Object.keys(COURSE_META) as DishCourse[];

/** Fills fields missing from older records: no courses → main dish, no daily limit → once a day, no notes, no calories. */
export function normalizeDish(dish: Dish): Dish {
  const courses = Array.isArray(dish.courses) && dish.courses.length > 0 ? dish.courses : (['main'] as DishCourse[]);
  const maxPerDay = Number.isFinite(dish.maxPerDay) && dish.maxPerDay > 0 ? dish.maxPerDay : 1;
  return {
    ...dish,
    courses,
    maxPerDay,
    notes: typeof dish.notes === 'string' ? dish.notes : '',
    calories: normalizeCalories(dish.calories),
  };
}
