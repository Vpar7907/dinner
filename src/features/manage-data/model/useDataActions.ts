import { useCallback, useState } from 'react';
import { useDishStore } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { useMenuStore } from '@/entities/menu';
import { usePantryStore } from '@/entities/pantry';
import { clearDatabase, exportDatabase } from '@/shared/api';
import { downloadJson, isoDate, pluralWithCount } from '@/shared/lib';
import { toast } from '@/shared/ui';

async function reloadStores() {
  await Promise.all([
    useDishStore.getState().load(),
    useSideDishStore.getState().load(),
    usePantryStore.getState().load(),
    useMenuStore.getState().load(),
  ]);
}

export function useDataActions() {
  const [busy, setBusy] = useState<'export' | 'clear' | null>(null);

  /** Downloads every store as one JSON file. Returns true when the file was produced. */
  const exportAll = useCallback(async (): Promise<boolean> => {
    setBusy('export');
    try {
      const dump = await exportDatabase();
      downloadJson(`menu-nedeli-${isoDate()}.json`, dump);
      const { dishes, sides, pantry } = dump.stores;
      toast.success(
        'Данные экспортированы',
        `${pluralWithCount(dishes.length, ['блюдо', 'блюда', 'блюд'])}, ${pluralWithCount(sides.length, ['гарнир', 'гарнира', 'гарниров'])}, ${pluralWithCount(pantry.length, ['продукт', 'продукта', 'продуктов'])} в запасах и меню.`,
      );
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Не удалось экспортировать данные');
      return false;
    } finally {
      setBusy(null);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setBusy('clear');
    try {
      await clearDatabase();
      await reloadStores();
      toast.info('Все данные удалены', 'Блюда, гарниры, запасы и меню очищены.');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось очистить данные');
    } finally {
      setBusy(null);
    }
  }, []);

  return { exportAll, clearAll, busy };
}
