import type { Dish } from '@/entities/dish';
import type { SideDish } from '@/entities/side-dish';
import { DAYS, activeSlotKeys, parseSlotKey, slotKey, type EnabledMeals, type MenuSlots, type SlotKey } from '@/entities/menu';
import { courseOfSlot } from './generateWeeklyMenu';
import { slotCalories } from './calories';

export type SlotIssue =
  | 'protein-repeat'
  | 'over-limit'
  | 'over-day-limit'
  | 'not-consecutive'
  | 'missing-side'
  | 'side-over-limit'
  | 'side-disabled'
  | 'wrong-course';

export const SLOT_ISSUE_LABELS: Record<SlotIssue, string> = {
  'protein-repeat': 'Тот же белок, что и в соседний приём пищи',
  'over-limit': 'Превышен лимит повторов в неделю',
  'over-day-limit': 'Превышен лимит повторов в день',
  'not-consecutive': 'Повторы блюда стоят не в соседние дни',
  'missing-side': 'Блюду нужен гарнир',
  'side-over-limit': 'Гарнир встречается чаще своего лимита',
  'side-disabled': 'Гарнир отключён в настройках',
  'wrong-course': 'Блюдо не отмечено как подходящее для этого приёма пищи',
};

/** Position of a slot inside a streak of the same dish at the same meal on consecutive days. */
export interface RunInfo {
  index: number;
  length: number;
}

export interface MenuAnalysis {
  issues: Partial<Record<SlotKey, SlotIssue[]>>;
  usage: Map<string, number>;
  /** Servings of each side dish in the active menu. */
  sideUsage: Map<string, number>;
  runs: Partial<Record<SlotKey, RunInfo>>;
  /** Calories of the filled active slots of each day (Mon…Sun). */
  dayCalories: number[];
  /** Days where some dish or side has no calories set. */
  dayCaloriesIncomplete: boolean[];
  /** Slots that take part in the plan (enabled meal types, not excluded). */
  active: number;
  filled: number;
}

/** Checks the menu against the generator rules — useful after manual edits. */
export function analyzeMenu(
  slots: MenuSlots,
  enabledMeals: EnabledMeals,
  dishMap: Map<string, Dish>,
  sideMap: Map<string, SideDish> = new Map(),
): MenuAnalysis {
  const active = activeSlotKeys(slots, enabledMeals);
  const activeSet = new Set(active);
  const usage = new Map<string, number>();
  const dayUsage = new Map<string, number>();
  const dishDays = new Map<string, Set<number>>();
  const issues: Partial<Record<SlotKey, SlotIssue[]>> = {};
  const addIssue = (key: SlotKey, issue: SlotIssue) => {
    const list = issues[key] ?? [];
    if (!list.includes(issue)) list.push(issue);
    issues[key] = list;
  };
  const dishAt = (key: SlotKey | undefined) => (key && slots[key].dishId ? dishMap.get(slots[key].dishId!) : undefined);

  let filled = 0;
  for (const key of active) {
    const dish = dishAt(key);
    if (!dish) continue;
    const { day } = parseSlotKey(key);
    filled += 1;
    usage.set(dish.id, (usage.get(dish.id) ?? 0) + 1);
    dayUsage.set(`${dish.id}|${day}`, (dayUsage.get(`${dish.id}|${day}`) ?? 0) + 1);
    dishDays.set(dish.id, new Set([...(dishDays.get(dish.id) ?? []), day]));
    if (dish.requiresSide && !slots[key].sideId) addIssue(key, 'missing-side');
    if (!dish.courses.includes(courseOfSlot(key))) addIssue(key, 'wrong-course');
  }

  // Protein rotation is checked along the chain of consecutive main meals.
  const mains = active.filter((key) => courseOfSlot(key) === 'main');
  mains.forEach((key, index) => {
    const dish = dishAt(key);
    const prevKey = mains[index - 1];
    const prev = dishAt(prevKey);
    if (dish && prev && prev.protein === dish.protein) {
      addIssue(key, 'protein-repeat');
      addIssue(prevKey, 'protein-repeat');
    }
  });

  for (const key of active) {
    const dish = dishAt(key);
    if (!dish) continue;
    const { day } = parseSlotKey(key);
    const days = [...(dishDays.get(dish.id) ?? [])];
    if ((usage.get(dish.id) ?? 0) > dish.maxPerWeek) addIssue(key, 'over-limit');
    if ((dayUsage.get(`${dish.id}|${day}`) ?? 0) > dish.maxPerDay) addIssue(key, 'over-day-limit');
    if (Math.max(...days) - Math.min(...days) + 1 !== days.length) addIssue(key, 'not-consecutive');
  }

  const sideUsage = new Map<string, number>();
  for (const key of active) {
    const id = slots[key].sideId;
    if (id && dishAt(key)?.requiresSide) sideUsage.set(id, (sideUsage.get(id) ?? 0) + 1);
  }
  for (const key of active) {
    const id = slots[key].sideId;
    const side = id ? sideMap.get(id) : undefined;
    if (!side || !dishAt(key)?.requiresSide) continue;
    if ((sideUsage.get(side.id) ?? 0) > side.maxPerWeek) addIssue(key, 'side-over-limit');
    if (!side.enabled) addIssue(key, 'side-disabled');
  }

  // Streaks: the same dish at the same meal on consecutive days.
  const runs: Partial<Record<SlotKey, RunInfo>> = {};
  for (const key of active) {
    const { day, meal } = parseSlotKey(key);
    const id = slots[key].dishId;
    if (!id) continue;
    const prevKey = day > 0 ? slotKey(DAYS[day - 1].index, meal) : null;
    if (prevKey && activeSet.has(prevKey) && slots[prevKey].dishId === id) continue; // not the start of a streak
    const streak: SlotKey[] = [key];
    for (let d = day + 1; d <= 6; d += 1) {
      const next = slotKey(DAYS[d].index, meal);
      if (!activeSet.has(next) || slots[next].dishId !== id) break;
      streak.push(next);
    }
    if (streak.length > 1) streak.forEach((k, index) => (runs[k] = { index: index + 1, length: streak.length }));
  }

  const dayCalories = [0, 0, 0, 0, 0, 0, 0];
  const dayCaloriesIncomplete = [false, false, false, false, false, false, false];
  for (const key of active) {
    const dish = dishAt(key);
    if (!dish) continue;
    const { day } = parseSlotKey(key);
    const { kcal, complete } = slotCalories(dish, slots[key].sideId ? sideMap.get(slots[key].sideId!) : undefined);
    dayCalories[day] += kcal;
    if (!complete) dayCaloriesIncomplete[day] = true;
  }

  return { issues, usage, sideUsage, runs, dayCalories, dayCaloriesIncomplete, active: active.length, filled };
}
