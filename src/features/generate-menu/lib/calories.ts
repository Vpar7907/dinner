import type { Dish } from '@/entities/dish';
import type { SideDish } from '@/entities/side-dish';

export interface SlotCalories {
  kcal: number;
  /** False when the dish or its side has no calories set (counted as 0). */
  complete: boolean;
}

/** Calories of one serving: the dish plus its side, if the dish takes one. */
export function slotCalories(dish: Dish, side: SideDish | undefined): SlotCalories {
  const withSide = dish.requiresSide && side;
  return {
    kcal: (dish.calories ?? 0) + (withSide ? (side.calories ?? 0) : 0),
    complete: dish.calories !== null && (!withSide || side.calories !== null),
  };
}
