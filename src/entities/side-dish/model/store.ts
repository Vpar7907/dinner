import { create } from 'zustand';
import { createId, normalizeCalories } from '@/shared/lib';
import { sideDishRepository } from '../api/sideDishRepository';
import { normalizeSide, type SideDish, type SideDishDraft } from './types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface SideDishState {
  sides: SideDish[];
  status: Status;
  load: () => Promise<void>;
  save: (draft: SideDishDraft) => Promise<SideDish>;
  /** Quick change of a single field (limit, on/off) without opening the form. */
  update: (id: string, patch: Partial<SideDishDraft>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useSideDishStore = create<SideDishState>((set, get) => ({
  sides: [],
  status: 'idle',

  load: async () => {
    set({ status: 'loading' });
    try {
      const sides = await sideDishRepository.getAll();
      set({ sides: sides.map(normalizeSide).sort((a, b) => a.createdAt - b.createdAt), status: 'ready' });
    } catch (error) {
      console.error('Не удалось загрузить гарниры', error);
      set({ status: 'error' });
    }
  },

  save: async (draft) => {
    const now = Date.now();
    const existing = draft.id ? get().sides.find((s) => s.id === draft.id) : undefined;
    const side: SideDish = {
      ...draft,
      id: existing?.id ?? createId('side'),
      name: draft.name.trim(),
      maxPerWeek: Math.max(1, draft.maxPerWeek || 1),
      calories: normalizeCalories(draft.calories),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await sideDishRepository.put(side);
    set({ sides: existing ? get().sides.map((s) => (s.id === side.id ? side : s)) : [...get().sides, side] });
    return side;
  },

  update: async (id, patch) => {
    const current = get().sides.find((s) => s.id === id);
    if (!current) return;
    const side: SideDish = { ...current, ...patch, id, updatedAt: Date.now() };
    await sideDishRepository.put(side);
    set({ sides: get().sides.map((s) => (s.id === id ? side : s)) });
  },

  remove: async (id) => {
    await sideDishRepository.remove(id);
    set({ sides: get().sides.filter((s) => s.id !== id) });
  },
}));

export function useSideDishMap(): Map<string, SideDish> {
  const sides = useSideDishStore((s) => s.sides);
  return new Map(sides.map((s) => [s.id, s]));
}
