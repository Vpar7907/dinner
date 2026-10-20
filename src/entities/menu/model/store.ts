import { create } from 'zustand';
import { createId } from '@/shared/lib';
import { menuRepository } from '../api/menuRepository';
import { createEmptyMenu, createEmptySlot, normalizeMenu } from '../lib/factory';
import { SLOT_ORDER } from './constants';
import { normalizeCalorieSettings } from './calories';
import type { CalorieSettings, ExtraShoppingDraft, ExtraShoppingItem, MealSlot, MealType, MenuSlots, SlotKey, WeeklyMenu } from './types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface MenuState {
  menu: WeeklyMenu;
  status: Status;
  load: () => Promise<void>;
  setSlot: (key: SlotKey, slot: Partial<MealSlot>) => Promise<void>;
  toggleLock: (key: SlotKey) => Promise<void>;
  /** Excludes a meal from the plan (or brings it back). Excluding clears the dish. */
  toggleSkip: (key: SlotKey) => Promise<void>;
  /** Includes or excludes a meal type (e.g. breakfasts) for the whole week. */
  setMealEnabled: (meal: MealType, enabled: boolean) => Promise<void>;
  setCalorieSettings: (patch: Partial<CalorieSettings>) => Promise<void>;
  /** Replaces all slots at once (used by the generator). */
  applyGenerated: (slots: MenuSlots) => Promise<void>;
  /** Empties every slot that is neither locked nor excluded. */
  clearUnlocked: () => Promise<void>;
  toggleChecked: (itemKey: string) => Promise<void>;
  resetChecked: () => Promise<void>;
  addExtra: (draft: ExtraShoppingDraft) => Promise<ExtraShoppingItem>;
  updateExtra: (id: string, patch: Partial<ExtraShoppingDraft>) => Promise<void>;
  removeExtra: (id: string) => Promise<void>;
  /** Removes hand-added items that are already marked as bought. */
  removeBoughtExtras: () => Promise<number>;
  /** Appends imported hand-added items whose ids are not in the list yet; returns how many were added. */
  mergeExtras: (items: ExtraShoppingItem[]) => Promise<number>;
  /** Clears every slot referencing a deleted dish. */
  detachDish: (dishId: string) => Promise<void>;
  /** Removes a deleted side dish from every slot. */
  detachSide: (sideId: string) => Promise<void>;
}

/** Shopping-list key of a hand-added item; shares the "bought" state with menu items. */
export function extraKey(id: string): string {
  return `extra:${id}`;
}

export const useMenuStore = create<MenuState>((set, get) => {
  const persist = async (next: WeeklyMenu) => {
    const menu = { ...next, updatedAt: Date.now() };
    set({ menu });
    await menuRepository.put(menu);
  };

  const mapSlots = (fn: (slot: MealSlot, key: SlotKey) => MealSlot): MenuSlots => {
    const { slots } = get().menu;
    return Object.fromEntries(SLOT_ORDER.map((key) => [key, fn(slots[key], key)])) as MenuSlots;
  };

  const updateSlot = (key: SlotKey, fn: (slot: MealSlot) => MealSlot) => {
    const { menu } = get();
    return persist({ ...menu, slots: { ...menu.slots, [key]: fn(menu.slots[key]) } });
  };

  return {
    menu: createEmptyMenu(),
    status: 'idle',

    load: async () => {
      set({ status: 'loading' });
      try {
        const stored = await menuRepository.getById('active');
        const menu = stored ? normalizeMenu(stored) : createEmptyMenu();
        await menuRepository.put(menu);
        set({ menu, status: 'ready' });
      } catch (error) {
        console.error('Не удалось загрузить меню', error);
        set({ status: 'error' });
      }
    },

    setSlot: (key, slot) => updateSlot(key, (current) => ({ ...current, ...slot })),

    toggleLock: (key) => updateSlot(key, (current) => ({ ...current, locked: !current.locked })),

    toggleSkip: (key) =>
      updateSlot(key, (current) => (current.skipped ? createEmptySlot() : { ...createEmptySlot(), skipped: true })),

    setMealEnabled: async (meal, enabled) => {
      const { menu } = get();
      await persist({ ...menu, enabledMeals: { ...menu.enabledMeals, [meal]: enabled } });
    },

    setCalorieSettings: async (patch) => {
      const { menu } = get();
      await persist({ ...menu, calories: normalizeCalorieSettings({ ...menu.calories, ...patch }) });
    },

    applyGenerated: async (slots) => {
      await persist({ ...get().menu, slots, generatedAt: Date.now() });
    },

    clearUnlocked: async () => {
      await persist({ ...get().menu, slots: mapSlots((slot) => (slot.locked || slot.skipped ? slot : createEmptySlot())) });
    },

    toggleChecked: async (itemKey) => {
      const { menu } = get();
      const checked = new Set(menu.checkedItems);
      if (checked.has(itemKey)) checked.delete(itemKey);
      else checked.add(itemKey);
      await persist({ ...menu, checkedItems: [...checked] });
    },

    resetChecked: async () => {
      await persist({ ...get().menu, checkedItems: [] });
    },

    addExtra: async (draft) => {
      const item: ExtraShoppingItem = { ...draft, name: draft.name.trim(), id: createId('extra'), createdAt: Date.now() };
      const { menu } = get();
      await persist({ ...menu, extraItems: [...menu.extraItems, item] });
      return item;
    },

    updateExtra: async (id, patch) => {
      const { menu } = get();
      await persist({ ...menu, extraItems: menu.extraItems.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
    },

    removeExtra: async (id) => {
      const { menu } = get();
      await persist({
        ...menu,
        extraItems: menu.extraItems.filter((item) => item.id !== id),
        checkedItems: menu.checkedItems.filter((key) => key !== extraKey(id)),
      });
    },

    removeBoughtExtras: async () => {
      const { menu } = get();
      const checked = new Set(menu.checkedItems);
      const bought = menu.extraItems.filter((item) => checked.has(extraKey(item.id)));
      if (bought.length === 0) return 0;
      const boughtKeys = new Set(bought.map((item) => extraKey(item.id)));
      await persist({
        ...menu,
        extraItems: menu.extraItems.filter((item) => !boughtKeys.has(extraKey(item.id))),
        checkedItems: menu.checkedItems.filter((key) => !boughtKeys.has(key)),
      });
      return bought.length;
    },

    mergeExtras: async (items) => {
      const { menu } = get();
      const known = new Set(menu.extraItems.map((item) => item.id));
      const fresh = items.filter((item) => !known.has(item.id));
      if (fresh.length > 0) await persist({ ...menu, extraItems: [...menu.extraItems, ...fresh] });
      return fresh.length;
    },

    detachDish: async (dishId) => {
      await persist({
        ...get().menu,
        slots: mapSlots((slot) => (slot.dishId === dishId ? { ...createEmptySlot(), skipped: slot.skipped } : slot)),
      });
    },

    detachSide: async (sideId) => {
      await persist({ ...get().menu, slots: mapSlots((slot) => (slot.sideId === sideId ? { ...slot, sideId: null } : slot)) });
    },
  };
});

/** Settings of the experimental calorie mode. */
export function useCalorieSettings() {
  return useMenuStore((s) => s.menu.calories);
}
