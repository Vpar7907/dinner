import { useCallback } from 'react';
import { usePantryStore } from '@/entities/pantry';
import { toast } from '@/shared/ui';
import type { ShoppingItem } from '../lib/aggregateShoppingList';

/** "I already have it": moves the missing amount into the pantry so the item leaves the list. */
export function useHaveAtHome() {
  return useCallback(async (item: ShoppingItem) => {
    await usePantryStore.getState().add({
      name: item.name,
      amount: item.amount > 0 ? item.amount : null,
      unit: item.unit,
      category: item.category,
    });
    toast.success('Добавлено в запасы', `${item.name} больше не нужно покупать.`);
  }, []);
}
