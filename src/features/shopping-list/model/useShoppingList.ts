import { useMemo } from 'react';
import { useDishStore } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { extraKey, useMenuStore } from '@/entities/menu';
import { usePantryStore } from '@/entities/pantry';
import { aggregateShoppingList } from '../lib/aggregateShoppingList';

export function useShoppingList() {
  const dishes = useDishStore((s) => s.dishes);
  const sides = useSideDishStore((s) => s.sides);
  const pantry = usePantryStore((s) => s.items);
  const slots = useMenuStore((s) => s.menu.slots);
  const enabledMeals = useMenuStore((s) => s.menu.enabledMeals);
  const checkedItems = useMenuStore((s) => s.menu.checkedItems);
  const extraItems = useMenuStore((s) => s.menu.extraItems);
  const toggleChecked = useMenuStore((s) => s.toggleChecked);
  const resetChecked = useMenuStore((s) => s.resetChecked);

  const { groups, inStock } = useMemo(() => {
    const dishMap = new Map(dishes.map((d) => [d.id, d]));
    const sideMap = new Map(sides.map((s) => [s.id, s]));
    return aggregateShoppingList(slots, enabledMeals, dishMap, sideMap, pantry, extraItems);
  }, [dishes, sides, slots, enabledMeals, pantry, extraItems]);

  const checked = useMemo(() => new Set(checkedItems), [checkedItems]);
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  const done = groups.reduce((sum, g) => sum + g.items.filter((i) => checked.has(i.key)).length, 0);

  const extrasCount = extraItems.length;
  const boughtExtras = extraItems.filter((item) => checked.has(extraKey(item.id))).length;

  return { groups, inStock, checked, total, done, extrasCount, boughtExtras, toggleChecked, resetChecked };
}
