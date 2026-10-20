import { create } from 'zustand';
import { createId, normalizeCalories } from '@/shared/lib';
import { dishRepository } from '../api/dishRepository';
import { normalizeDish } from './course';
import type { Dish, DishDraft } from './types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface DishState {
  dishes: Dish[];
  status: Status;
  load: () => Promise<void>;
  save: (draft: DishDraft) => Promise<Dish>;
  remove: (id: string) => Promise<void>;
  /** Drops a deleted side dish from every dish's allowed list. */
  detachSide: (sideId: string) => Promise<void>;
  /**
   * Sets which dishes a side is served with, from the side's point of view.
   * A dish with an empty list accepts "any side": to unlink it, its list is made
   * explicit (all other sides) so the other pairings stay as they were.
   */
  linkSide: (sideId: string, linkedDishIds: string[], allSideIds: string[]) => Promise<void>;
}

const byCreation = (a: Dish, b: Dish) => a.createdAt - b.createdAt;

export const useDishStore = create<DishState>((set, get) => ({
  dishes: [],
  status: 'idle',

  load: async () => {
    set({ status: 'loading' });
    try {
      const dishes = await dishRepository.getAll();
      set({ dishes: dishes.map(normalizeDish).sort(byCreation), status: 'ready' });
    } catch (error) {
      console.error('Не удалось загрузить блюда', error);
      set({ status: 'error' });
    }
  },

  save: async (draft) => {
    const now = Date.now();
    const existing = draft.id ? get().dishes.find((d) => d.id === draft.id) : undefined;
    const dish: Dish = {
      ...draft,
      id: existing?.id ?? createId('dish'),
      name: draft.name.trim(),
      courses: draft.courses.length > 0 ? draft.courses : ['main'],
      maxPerDay: Math.max(1, draft.maxPerDay || 1),
      notes: (draft.notes ?? '').trim(),
      calories: normalizeCalories(draft.calories),
      allowedSideIds: draft.requiresSide ? draft.allowedSideIds : [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await dishRepository.put(dish);
    set({
      dishes: existing ? get().dishes.map((d) => (d.id === dish.id ? dish : d)) : [...get().dishes, dish],
    });
    return dish;
  },

  remove: async (id) => {
    await dishRepository.remove(id);
    set({ dishes: get().dishes.filter((d) => d.id !== id) });
  },

  detachSide: async (sideId) => {
    const affected = get().dishes.filter((d) => d.allowedSideIds.includes(sideId));
    if (affected.length === 0) return;
    const updated = affected.map((d) => ({ ...d, allowedSideIds: d.allowedSideIds.filter((id) => id !== sideId) }));
    await dishRepository.putMany(updated);
    const map = new Map(updated.map((d) => [d.id, d]));
    set({ dishes: get().dishes.map((d) => map.get(d.id) ?? d) });
  },

  linkSide: async (sideId, linkedDishIds, allSideIds) => {
    const linked = new Set(linkedDishIds);
    const updated: Dish[] = [];
    for (const dish of get().dishes) {
      if (!dish.requiresSide) continue;
      const anySide = dish.allowedSideIds.length === 0;
      const has = anySide || dish.allowedSideIds.includes(sideId);
      if (linked.has(dish.id) === has) continue;
      const allowedSideIds = linked.has(dish.id)
        ? [...dish.allowedSideIds, sideId]
        : (anySide ? allSideIds : dish.allowedSideIds).filter((id) => id !== sideId);
      updated.push({ ...dish, allowedSideIds, updatedAt: Date.now() });
    }
    if (updated.length === 0) return;
    await dishRepository.putMany(updated);
    const map = new Map(updated.map((d) => [d.id, d]));
    set({ dishes: get().dishes.map((d) => map.get(d.id) ?? d) });
  },
}));

export function useDishMap(): Map<string, Dish> {
  const dishes = useDishStore((s) => s.dishes);
  return new Map(dishes.map((d) => [d.id, d]));
}
