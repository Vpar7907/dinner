import type { Dish } from '@/entities/dish';
import { createPantryLedger, type PantryItem } from '@/entities/pantry';
import { MEAL_META, activeSlotKeys, parseSlotKey, type EnabledMeals, type MenuSlots, type SlotKey } from '@/entities/menu';

export interface Candidate {
  dish: Dish;
  /** Times the dish is used in the week outside the edited slot. */
  used: number;
  limitReached: boolean;
  dayLimitReached: boolean;
  /** Already in the menu on days that are not adjacent to this one. */
  notConsecutive: boolean;
  /** Same protein as the neighbouring main meal. */
  proteinClash: boolean;
  /** The dish is not marked as suitable for this meal type. */
  wrongCourse: boolean;
  /** Share of the ingredients (0…1) already at home. */
  pantryCoverage: number;
  /** With this dish the day goes over the calorie maximum (calorie mode only). */
  overCalories: boolean;
  isCurrent: boolean;
}

export function candidateWarning(c: Candidate): string | null {
  if (c.wrongCourse) return 'Не отмечено для этого приёма пищи';
  if (c.limitReached) return 'Лимит на неделю уже исчерпан';
  if (c.dayLimitReached) return 'Лимит на день уже исчерпан';
  if (c.notConsecutive) return 'Уже есть в меню не в соседний день';
  if (c.proteinClash) return 'Такой же белок в соседний приём пищи';
  if (c.overCalories) return 'День выйдет за дневную норму калорий';
  return null;
}

export function hasWarnings(candidate: Candidate): boolean {
  return candidateWarning(candidate) !== null;
}

/**
 * Evaluates every dish as a manual replacement for a slot. Dishes that fit the
 * rules come first — the ones made of what is at home first of all.
 */
export function rankCandidates(
  key: SlotKey,
  slots: MenuSlots,
  enabledMeals: EnabledMeals,
  dishes: Dish[],
  pantry: PantryItem[] = [],
  /** Calories still available on the slot's day; `null` outside the calorie mode. */
  caloriesLeft: number | null = null,
): Candidate[] {
  const { day, meal } = parseSlotKey(key);
  const course = MEAL_META[meal].course;
  const dishMap = new Map(dishes.map((d) => [d.id, d]));
  const active = activeSlotKeys(slots, enabledMeals);
  const ledger = createPantryLedger(pantry);

  const neighbourProteins = new Set<string>();
  if (course === 'main') {
    const chain = active.filter((k) => MEAL_META[parseSlotKey(k).meal].course === 'main');
    const pos = chain.indexOf(key);
    for (const neighbour of [chain[pos - 1], chain[pos + 1]]) {
      const id = neighbour ? slots[neighbour].dishId : null;
      const protein = id ? dishMap.get(id)?.protein : undefined;
      if (protein) neighbourProteins.add(protein);
    }
  }

  const usage = new Map<string, number>();
  const sameDay = new Map<string, number>();
  const days = new Map<string, Set<number>>();
  for (const k of active) {
    const id = slots[k].dishId;
    if (k === key || !id) continue;
    const d = parseSlotKey(k).day;
    usage.set(id, (usage.get(id) ?? 0) + 1);
    if (d === day) sameDay.set(id, (sameDay.get(id) ?? 0) + 1);
    days.set(id, new Set([...(days.get(id) ?? []), d]));
  }

  const currentId = slots[key].dishId;
  const candidates = dishes.map<Candidate>((dish) => {
    const used = usage.get(dish.id) ?? 0;
    const allDays = [...new Set([...(days.get(dish.id) ?? []), day])];
    return {
      dish,
      used,
      limitReached: used >= dish.maxPerWeek,
      dayLimitReached: (sameDay.get(dish.id) ?? 0) >= dish.maxPerDay,
      notConsecutive: used > 0 && Math.max(...allDays) - Math.min(...allDays) + 1 !== allDays.length,
      proteinClash: neighbourProteins.has(dish.protein),
      wrongCourse: !dish.courses.includes(course),
      pantryCoverage: ledger.coverage(dish.ingredients),
      overCalories: caloriesLeft !== null && dish.calories !== null && dish.calories > caloriesLeft,
      isCurrent: dish.id === currentId,
    };
  });

  const score = (c: Candidate) =>
    Number(c.wrongCourse) * 8 + (Number(c.limitReached) + Number(c.dayLimitReached) + Number(c.notConsecutive)) * 2 + Number(c.proteinClash) + Number(c.overCalories);
  return candidates.sort(
    (a, b) => score(a) - score(b) || b.pantryCoverage - a.pantryCoverage || a.used - b.used || a.dish.name.localeCompare(b.dish.name, 'ru'),
  );
}
