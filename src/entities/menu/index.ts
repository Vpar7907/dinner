export type {
  MealType,
  DayIndex,
  SlotKey,
  MealSlot,
  MenuSlots,
  EnabledMeals,
  WeeklyMenu,
  ExtraShoppingItem,
  ExtraShoppingDraft,
  CalorieSettings,
  CalorieStrictness,
  CalorieMode,
} from './model/types';
export { DEFAULT_CALORIE_SETTINGS, CALORIE_TARGET_RANGE, CALORIE_TOLERANCE_RANGE, calorieBand } from './model/calories';
export {
  DAYS,
  MEALS,
  MEAL_META,
  DEFAULT_ENABLED_MEALS,
  SLOT_ORDER,
  slotKey,
  parseSlotKey,
  describeSlot,
  isSlotActive,
  activeSlotKeys,
} from './model/constants';
export type { DayMeta, MealMeta } from './model/constants';
export { createEmptyMenu, createEmptySlot, createEmptySlots } from './lib/factory';
export { useMenuStore, useCalorieSettings, extraKey } from './model/store';
export { menuRepository } from './api/menuRepository';
