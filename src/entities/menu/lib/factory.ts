import { DEFAULT_ENABLED_MEALS, SLOT_ORDER } from '../model/constants';
import { DEFAULT_CALORIE_SETTINGS, normalizeCalorieSettings } from '../model/calories';
import type { MealSlot, MenuSlots, WeeklyMenu } from '../model/types';

export function createEmptySlot(): MealSlot {
  return { dishId: null, sideId: null, locked: false, skipped: false };
}

export function createEmptySlots(): MenuSlots {
  return Object.fromEntries(SLOT_ORDER.map((key) => [key, createEmptySlot()])) as MenuSlots;
}

export function createEmptyMenu(): WeeklyMenu {
  return {
    id: 'active',
    slots: createEmptySlots(),
    enabledMeals: { ...DEFAULT_ENABLED_MEALS },
    generatedAt: null,
    updatedAt: Date.now(),
    checkedItems: [],
    extraItems: [],
    calories: { ...DEFAULT_CALORIE_SETTINGS },
  };
}

/** Fills fields missing from older stored records so the shape is always complete. */
export function normalizeMenu(menu: WeeklyMenu): WeeklyMenu {
  const slots = createEmptySlots();
  for (const key of SLOT_ORDER) {
    if (menu.slots?.[key]) slots[key] = { ...createEmptySlot(), ...menu.slots[key] };
  }
  return {
    ...createEmptyMenu(),
    ...menu,
    slots,
    enabledMeals: { ...DEFAULT_ENABLED_MEALS, ...menu.enabledMeals },
    checkedItems: menu.checkedItems ?? [],
    extraItems: Array.isArray(menu.extraItems) ? menu.extraItems : [],
    calories: normalizeCalorieSettings(menu.calories),
  };
}
