import type { DishCourse } from '@/entities/dish/@x/menu';
import type { DayIndex, EnabledMeals, MealSlot, MealType, MenuSlots, SlotKey } from './types';

export interface DayMeta {
  index: DayIndex;
  short: string;
  full: string;
}

export const DAYS: DayMeta[] = [
  { index: 0, short: 'Пн', full: 'Понедельник' },
  { index: 1, short: 'Вт', full: 'Вторник' },
  { index: 2, short: 'Ср', full: 'Среда' },
  { index: 3, short: 'Чт', full: 'Четверг' },
  { index: 4, short: 'Пт', full: 'Пятница' },
  { index: 5, short: 'Сб', full: 'Суббота' },
  { index: 6, short: 'Вс', full: 'Воскресенье' },
];

export interface MealMeta {
  type: MealType;
  label: string;
  emoji: string;
  /** Which dishes may fill this meal. */
  course: DishCourse;
}

/** Order inside a day. Lunch and dinner share the "main" course and form one rotation chain. */
export const MEALS: MealMeta[] = [
  { type: 'breakfast', label: 'Завтрак', emoji: '🌅', course: 'breakfast' },
  { type: 'lunch', label: 'Обед', emoji: '☀️', course: 'main' },
  { type: 'dinner', label: 'Ужин', emoji: '🌙', course: 'main' },
  { type: 'salad', label: 'Салат', emoji: '🥗', course: 'salad' },
];

export const MEAL_META = Object.fromEntries(MEALS.map((m) => [m.type, m])) as Record<MealType, MealMeta>;

export const DEFAULT_ENABLED_MEALS: EnabledMeals = { breakfast: false, lunch: true, dinner: true, salad: false };

export function slotKey(day: DayIndex, meal: MealType): SlotKey {
  return `${day}-${meal}`;
}

/** All slots in chronological order: Mon breakfast, Mon lunch, Mon dinner, Mon salad, Tue breakfast, … */
export const SLOT_ORDER: SlotKey[] = DAYS.flatMap((day) => MEALS.map((meal) => slotKey(day.index, meal.type)));

export function parseSlotKey(key: SlotKey): { day: DayIndex; meal: MealType } {
  const [day, meal] = key.split('-') as [string, MealType];
  return { day: Number(day) as DayIndex, meal };
}

export function describeSlot(key: SlotKey): string {
  const { day, meal } = parseSlotKey(key);
  return `${DAYS[day].full}, ${MEAL_META[meal].label.toLowerCase()}`;
}

/** A slot takes part in the plan when its meal type is enabled and it is not excluded. */
export function isSlotActive(key: SlotKey, slot: MealSlot, enabledMeals: EnabledMeals): boolean {
  return enabledMeals[parseSlotKey(key).meal] && !slot.skipped;
}

export function activeSlotKeys(slots: MenuSlots, enabledMeals: EnabledMeals): SlotKey[] {
  return SLOT_ORDER.filter((key) => isSlotActive(key, slots[key], enabledMeals));
}
