import { useCallback, useState } from 'react';
import { useDishStore } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { useMenuStore, type CalorieSettings, type SlotKey } from '@/entities/menu';
import { usePantryStore } from '@/entities/pantry';
import { toast } from '@/shared/ui';
import { generateWeeklyMenu, type CalorieGoal } from '../lib/generateWeeklyMenu';

const calorieGoal = (settings: CalorieSettings): CalorieGoal | null => (settings.enabled ? settings : null);

/** Short pause so the "shuffling" animation is perceptible. */
const ANIMATION_DELAY = 550;

export function useGenerateMenu() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async () => {
    const { dishes } = useDishStore.getState();
    const { sides } = useSideDishStore.getState();
    const { menu, applyGenerated } = useMenuStore.getState();
    const pantry = usePantryStore.getState().items;

    if (dishes.length === 0) {
      toast.warning('Нет блюд для меню', 'Добавьте блюда в разделе «База блюд».');
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, ANIMATION_DELAY));
      const result = generateWeeklyMenu({
        dishes,
        sides,
        slots: menu.slots,
        enabledMeals: menu.enabledMeals,
        pantry,
        calories: calorieGoal(menu.calories),
      });
      await applyGenerated(result.slots);
      if (result.warnings.length > 0) {
        toast.warning('Меню собрано с оговорками', result.warnings.join(' '));
      } else {
        toast.success(
          'Меню на неделю готово',
          pantry.length > 0
            ? 'Учтены продукты из запасов, повторы стоят в соседние дни, мясо чередуется.'
            : 'Мясо чередуется, повторы стоят в соседние дни, гарниры подобраны.',
        );
      }
    } catch (error) {
      console.error(error);
      toast.error('Не удалось сгенерировать меню');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const regenerateSlot = useCallback(async (key: SlotKey) => {
    const { dishes } = useDishStore.getState();
    const { sides } = useSideDishStore.getState();
    const { menu, setSlot } = useMenuStore.getState();
    const pantry = usePantryStore.getState().items;
    const currentDishId = menu.slots[key].dishId;
    const input = { dishes, sides, slots: menu.slots, enabledMeals: menu.enabledMeals, pantry, targets: [key], calories: calorieGoal(menu.calories) };

    // Try a few times to land on a different dish than the current one.
    let next = generateWeeklyMenu(input).slots[key];
    for (let i = 0; i < 6 && next.dishId === currentDishId && dishes.length > 1; i += 1) {
      next = generateWeeklyMenu(input).slots[key];
    }
    if (!next.dishId) {
      toast.warning(
        'Нет подходящих блюд',
        menu.calories.enabled && menu.calories.strictness === 'strict'
          ? 'Подходящие блюда исчерпали недельный лимит или не укладываются в дневную норму калорий.'
          : 'Все блюда этой категории уже исчерпали недельный лимит.',
      );
      return;
    }
    await setSlot(key, { dishId: next.dishId, sideId: next.sideId });
  }, []);

  return { generate, regenerateSlot, isGenerating };
}
