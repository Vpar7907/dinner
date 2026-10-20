import { useCallback } from 'react';
import { describeSlot, useMenuStore, type SlotKey } from '@/entities/menu';
import { toast } from '@/shared/ui';

/** Excludes a single meal from the plan (eating out, guests, fasting…) or brings it back. */
export function useSkipMeal() {
  return useCallback(async (key: SlotKey) => {
    const { menu, toggleSkip } = useMenuStore.getState();
    const wasSkipped = menu.slots[key].skipped;
    await toggleSkip(key);
    if (wasSkipped) {
      toast.info('Приём пищи возвращён', describeSlot(key));
    } else {
      toast.info('Приём пищи исключён', `${describeSlot(key)} — не попадёт в генерацию и список покупок.`);
    }
  }, []);
}
