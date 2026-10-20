import { create } from 'zustand';
import { toBaseUnit, toDisplayUnit, roundAmount } from '@/entities/ingredient/@x/pantry';
import { createId } from '@/shared/lib';
import { pantryRepository } from '../api/pantryRepository';
import { stockKey } from '../lib/keys';
import type { PantryDraft, PantryItem } from './types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface PantryState {
  items: PantryItem[];
  status: Status;
  load: () => Promise<void>;
  /** Adds stock; an item with the same name and compatible unit is topped up instead of duplicated. */
  add: (draft: PantryDraft) => Promise<PantryItem>;
  update: (id: string, patch: Partial<PantryDraft>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const byName = (a: PantryItem, b: PantryItem) => a.name.localeCompare(b.name, 'ru');

export const usePantryStore = create<PantryState>((set, get) => ({
  items: [],
  status: 'idle',

  load: async () => {
    set({ status: 'loading' });
    try {
      const items = await pantryRepository.getAll();
      set({ items: items.sort(byName), status: 'ready' });
    } catch (error) {
      console.error('Не удалось загрузить запасы', error);
      set({ status: 'error' });
    }
  },

  add: async (draft) => {
    const name = draft.name.trim();
    const key = stockKey(name, draft.unit);
    const existing = get().items.find((item) => stockKey(item.name, item.unit) === key);

    let item: PantryItem;
    if (existing) {
      let amount: number | null = null;
      let unit = existing.unit;
      if (existing.amount !== null && draft.amount !== null) {
        const sum = toBaseUnit(existing.amount, existing.unit).amount + toBaseUnit(draft.amount, draft.unit).amount;
        const display = toDisplayUnit(sum, toBaseUnit(1, existing.unit).unit);
        amount = roundAmount(display.amount);
        unit = display.unit;
      }
      item = { ...existing, amount, unit, updatedAt: Date.now() };
    } else {
      item = { ...draft, name, id: createId('pantry'), updatedAt: Date.now() };
    }

    await pantryRepository.put(item);
    const others = get().items.filter((i) => i.id !== item.id);
    set({ items: [...others, item].sort(byName) });
    return item;
  },

  update: async (id, patch) => {
    const current = get().items.find((i) => i.id === id);
    if (!current) return;
    const item: PantryItem = { ...current, ...patch, updatedAt: Date.now() };
    await pantryRepository.put(item);
    set({ items: get().items.map((i) => (i.id === id ? item : i)).sort(byName) });
  },

  remove: async (id) => {
    await pantryRepository.remove(id);
    set({ items: get().items.filter((i) => i.id !== id) });
  },
}));
