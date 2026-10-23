import { COURSE_META, COURSES, type Dish, type DishCourse, type ProteinType } from '@/entities/dish';
import type { SideDish } from '@/entities/side-dish';
import { createPantryLedger, type PantryItem, type PantryLedger } from '@/entities/pantry';
import {
  MEAL_META,
  activeSlotKeys,
  calorieBand,
  parseSlotKey,
  slotKey,
  type CalorieMode,
  type CalorieStrictness,
  type DayIndex,
  type EnabledMeals,
  type MenuSlots,
  type SlotKey,
} from '@/entities/menu';
import { formatNumber, plural, weightedPick } from '@/shared/lib';

/** Daily calorie goal of the experimental calorie mode. */
export interface CalorieGoal {
  mode: CalorieMode;
  /** The target or the ceiling, depending on `mode`. */
  dailyTarget: number;
  /** ± percent around the target. */
  tolerance: number;
  strictness: CalorieStrictness;
}

export interface GeneratorInput {
  dishes: Dish[];
  sides: SideDish[];
  slots: MenuSlots;
  enabledMeals: EnabledMeals;
  /** Ingredients at home: dishes that use them are preferred. */
  pantry?: PantryItem[];
  /** Slots to (re)fill. Defaults to every active unlocked slot; all other slots are treated as fixed. */
  targets?: SlotKey[];
  /** Omitted or `null` — calories are ignored and the generator behaves exactly as without them. */
  calories?: CalorieGoal | null;
}

export interface GeneratorResult {
  slots: MenuSlots;
  warnings: string[];
  emptySlots: number;
}

interface Attempt {
  slots: MenuSlots;
  penalty: number;
  /** Sum of pantry coverage of every placed dish — higher means less shopping. */
  pantryScore: number;
  emptyByCourse: Map<DishCourse, number>;
  proteinRepeat: boolean;
  missingSide: boolean;
  /** Days whose calories ended up outside the target band. */
  calorieDaysOff: number;
  /** Slots left empty because no dish fitted the strict calorie limit. */
  calorieEmpty: number;
  /** Some placed dish or side has no calories set. */
  unknownCalories: boolean;
  /** Servings that could not be placed because a dish's run did not fit its weekly count. */
  shortServings: number;
}

const ATTEMPTS = 120;

const PENALTY = {
  emptySlot: 100,
  proteinRepeat: 12,
  missingSide: 8,
  sideRepeat: 1,
  /** Per serving a dish falls short of its weekly count. */
  shortServing: 20,
  calorieDaySoft: 3,
  calorieDeviationSoft: 40,
  calorieDayStrict: 20,
  calorieDeviationStrict: 200,
} as const;

/** Rough share of the daily calories each course is expected to take. */
const CALORIE_SHARE: Record<DishCourse, number> = { breakfast: 0.25, main: 0.35, salad: 0.15 };

/**
 * Lunch and dinner form the "main" chain where the protein must alternate
 * strictly. Breakfasts and salads are separate chains: they only prefer
 * variety, because e.g. most breakfasts are naturally vegetarian.
 */
const STRICT_ROTATION: Record<DishCourse, boolean> = { breakfast: false, main: true, salad: false };

export function courseOfSlot(key: SlotKey): DishCourse {
  return MEAL_META[parseSlotKey(key).meal].course;
}

function isBetter(a: Attempt, b: Attempt | null): boolean {
  if (!b) return true;
  if (a.penalty !== b.penalty) return a.penalty < b.penalty;
  return a.pantryScore > b.pantryScore;
}

/**
 * Greedy randomized generator with restarts.
 *
 * Each attempt walks the active slots chronologically. For every empty slot it
 * picks, by weighted random, a dish that suits the meal's course, has weekly
 * and daily usage left and — for lunch/dinner — does not share a protein with
 * the neighbouring main meals. Dishes that use ingredients from the pantry get
 * a higher weight. A dish is served exactly as many times a week as its
 * `maxPerWeek` says: it is repeated on the following days at the same meal
 * (cook once, eat N days), so repeats are always on consecutive days. Dishes
 * whose whole run fits are preferred; a run cut short (end of the week, a
 * fixed slot, no side left) is penalised. The attempt with the lowest
 * penalty (and, on a tie, the best pantry usage) wins.
 */
export function generateWeeklyMenu(input: GeneratorInput): GeneratorResult {
  const active = activeSlotKeys(input.slots, input.enabledMeals);
  const activeSet = new Set(active);
  const targets = new Set(
    (input.targets ?? active.filter((key) => !input.slots[key].locked)).filter((key) => activeSet.has(key)),
  );
  const hasPantry = (input.pantry?.length ?? 0) > 0;

  let best: Attempt | null = null;
  for (let i = 0; i < ATTEMPTS; i += 1) {
    const attempt = runAttempt(input, active, targets);
    if (isBetter(attempt, best)) best = attempt;
    // Without a pantry there is nothing left to optimise once the rules hold.
    if (best && best.penalty === 0 && !hasPantry) break;
  }
  const result = best ?? runAttempt(input, active, targets);
  const emptySlots = [...result.emptyByCourse.values()].reduce((sum, n) => sum + n, 0) + result.calorieEmpty;

  return { slots: result.slots, emptySlots, warnings: describeIssues(result, input.dishes, input.calories ?? null) };
}

function isContiguous(days: Iterable<number>): boolean {
  const unique = [...new Set(days)];
  if (unique.length <= 1) return true;
  return Math.max(...unique) - Math.min(...unique) + 1 === unique.length;
}

function runAttempt(
  { dishes, sides, slots, pantry = [], calories: goal = null }: GeneratorInput,
  active: SlotKey[],
  targets: Set<SlotKey>,
): Attempt {
  const dishMap = new Map(dishes.map((d) => [d.id, d]));
  const sideMap = new Map(sides.map((s) => [s.id, s]));
  const allSideIds = sides.map((s) => s.id);
  const activeSet = new Set(active);
  const result = structuredClone(slots);
  const ledger: PantryLedger = createPantryLedger(pantry);

  const usage = new Map<string, number>();
  const dayUsage = new Map<string, number>();
  const dishDays = new Map<string, Set<number>>();
  /** Re-rolling a single slot leaves no room for a run, so weekly counts are enforced only when filling several slots. */
  const fullRuns = targets.size > 1;
  let shortServings = 0;
  const sideUsage = new Map<string, number>();
  /** Dishes the generator has started (and possibly repeated): they are not used again later in the week. */
  const closed = new Set<string>();
  const emptyByCourse = new Map<DishCourse, number>();
  let proteinRepeat = false;
  let missingSide = false;
  let penalty = 0;
  let pantryScore = 0;

  // Calorie mode: everything below is skipped when `goal` is null.
  const band = goal ? calorieBand(goal) : null;
  const strictCalories = goal?.strictness === 'strict';
  const dayKcal = [0, 0, 0, 0, 0, 0, 0];
  /** Days with at least one dish of known calories: only those are judged. */
  const dayKnown = [false, false, false, false, false, false, false];
  let calorieEmpty = 0;
  let unknownCalories = false;
  const sideKcal = (sideId: string | null) => (sideId ? (sideMap.get(sideId)?.calories ?? 0) : 0);

  // Each course forms its own chain of consecutive meals.
  const chains: Record<DishCourse, SlotKey[]> = { breakfast: [], main: [], salad: [] };
  const chainPos = new Map<SlotKey, number>();
  for (const key of active) {
    const chain = chains[courseOfSlot(key)];
    chainPos.set(key, chain.length);
    chain.push(key);
  }
  const chainOf = (key: SlotKey) => chains[courseOfSlot(key)];

  const record = (key: SlotKey, dish: Dish, sideId: string | null) => {
    const { day } = parseSlotKey(key);
    usage.set(dish.id, (usage.get(dish.id) ?? 0) + 1);
    dayUsage.set(`${dish.id}|${day}`, (dayUsage.get(`${dish.id}|${day}`) ?? 0) + 1);
    const days = dishDays.get(dish.id);
    if (days) days.add(day);
    else dishDays.set(dish.id, new Set([day]));
    ledger.consume(dish.ingredients);
    if (goal) {
      const servedSide = dish.requiresSide ? sideId : null;
      dayKcal[day] += (dish.calories ?? 0) + sideKcal(servedSide);
      if (dish.calories !== null || (servedSide && sideMap.get(servedSide)?.calories != null)) dayKnown[day] = true;
    }
    if (sideId) {
      sideUsage.set(sideId, (sideUsage.get(sideId) ?? 0) + 1);
      const side = sideMap.get(sideId);
      if (side) ledger.consume(side.ingredients);
    }
  };

  const place = (key: SlotKey, dish: Dish, sideId: string | null) => {
    pantryScore += ledger.coverage(dish.ingredients);
    if (goal && (dish.calories === null || (sideId !== null && sideMap.get(sideId)?.calories == null))) unknownCalories = true;
    result[key] = { ...result[key], dishId: dish.id, sideId };
    record(key, dish, sideId);
  };

  // Clear targets so fixed slots are the only initial context.
  for (const key of targets) result[key] = { ...slots[key], dishId: null, sideId: null };
  for (const key of active) {
    const dish = result[key].dishId ? dishMap.get(result[key].dishId!) : undefined;
    if (dish) record(key, dish, result[key].sideId);
  }

  const proteinAt = (chain: SlotKey[], pos: number): ProteinType | null => {
    const key = chain[pos];
    const id = key ? result[key].dishId : null;
    return id ? (dishMap.get(id)?.protein ?? null) : null;
  };

  const neighbourProteins = (key: SlotKey): [ProteinType | null, ProteinType | null] => {
    const chain = chainOf(key);
    const pos = chainPos.get(key)!;
    return [proteinAt(chain, pos - 1), proteinAt(chain, pos + 1)];
  };

  const rotationOk = (key: SlotKey, dish: Dish): boolean => {
    if (!STRICT_ROTATION[courseOfSlot(key)]) return true;
    const [prev, next] = neighbourProteins(key);
    return dish.protein !== prev && dish.protein !== next;
  };

  const canUse = (dish: Dish, key: SlotKey): boolean => {
    const { day } = parseSlotKey(key);
    const used = usage.get(dish.id) ?? 0;
    return (
      dish.courses.includes(courseOfSlot(key)) &&
      !closed.has(dish.id) &&
      used < dish.maxPerWeek &&
      (dayUsage.get(`${dish.id}|${day}`) ?? 0) < dish.maxPerDay &&
      // A repeat is only allowed on a day adjacent to the dish's other days.
      (used === 0 || isContiguous([...(dishDays.get(dish.id) ?? []), day]))
    );
  };

  /** Sides of the previous and next side-bearing meals in the chain. */
  const neighbourSides = (key: SlotKey): Set<string> => {
    const chain = chainOf(key);
    const pos = chainPos.get(key)!;
    const near = new Set<string>();
    for (const step of [-1, 1]) {
      for (let j = pos + step; j >= 0 && j < chain.length; j += step) {
        const sideId = result[chain[j]].sideId;
        if (sideId) {
          near.add(sideId);
          break;
        }
      }
    }
    return near;
  };

  /** Sides the dish may be served with that are switched on and still have weekly servings left. */
  const availableSides = (dish: Dish): string[] => {
    const explicit = dish.allowedSideIds.filter((id) => sideMap.has(id));
    return (explicit.length > 0 ? explicit : allSideIds).filter((id) => {
      const side = sideMap.get(id)!;
      return side.enabled && (sideUsage.get(id) ?? 0) < side.maxPerWeek;
    });
  };
  const sideRemaining = (sideId: string) => sideMap.get(sideId)!.maxPerWeek - (sideUsage.get(sideId) ?? 0);

  /** Calories this slot should ideally take: what is left of the day, split among its still empty meals. */
  const idealKcal = (key: SlotKey): number => {
    const { day } = parseSlotKey(key);
    let openShare = 0;
    for (const k of active) {
      if (parseSlotKey(k).day === day && targets.has(k) && !result[k].dishId) openShare += CALORIE_SHARE[courseOfSlot(k)];
    }
    const share = openShare > 0 ? CALORIE_SHARE[courseOfSlot(key)] / openShare : 1;
    return (goal!.dailyTarget - dayKcal[day]) * share;
  };
  /** 0…1: how close a serving is to the ideal; strict mode is less forgiving. Under a ceiling, lighter is always fine. */
  const kcalCloseness = (kcal: number, ideal: number): number => {
    if (goal!.mode === 'ceiling' && kcal <= ideal) return 1;
    const spread = Math.max(80, Math.abs(ideal) * (strictCalories ? 0.2 : 0.25));
    return Math.exp(-(((kcal - ideal) / spread) ** 2));
  };
  /** Calories of the lightest and the average side the dish could get. */
  const sideKcalRange = (dish: Dish): { min: number; avg: number } => {
    if (!dish.requiresSide) return { min: 0, avg: 0 };
    const values = availableSides(dish).map((id) => sideMap.get(id)!.calories ?? 0);
    if (values.length === 0) return { min: 0, avg: 0 };
    return { min: Math.min(...values), avg: values.reduce((sum, v) => sum + v, 0) / values.length };
  };
  const fitsDay = (dish: Dish, day: number): boolean => dayKcal[day] + (dish.calories ?? 0) + sideKcalRange(dish).min <= band!.max;

  /** `servings` — how many days the dish (and so its side) will be served in a row. */
  const pickSide = (dish: Dish, key: SlotKey, servings: number): string | null => {
    if (!dish.requiresSide) return null;
    let allowed = availableSides(dish);
    if (allowed.length === 0) {
      missingSide = true;
      penalty += PENALTY.missingSide;
      return null;
    }
    // Leftovers keep the side: prefer sides with enough servings left for the whole run.
    const lasting = allowed.filter((id) => sideRemaining(id) >= servings);
    if (lasting.length > 0) allowed = lasting;
    const near = neighbourSides(key);
    const fresh = allowed.filter((id) => !near.has(id));
    if (fresh.length === 0 && allowed.length > 1) penalty += PENALTY.sideRepeat;
    let candidates = fresh.length > 0 ? fresh : allowed;
    if (!goal) {
      return (
        weightedPick(candidates, (id) => (1 + 2 * ledger.coverage(sideMap.get(id)!.ingredients)) / (1 + (sideUsage.get(id) ?? 0) * 2)) ??
        null
      );
    }
    const { day } = parseSlotKey(key);
    const sideIdeal = idealKcal(key) - (dish.calories ?? 0);
    if (strictCalories) {
      const fitting = candidates.filter((id) => dayKcal[day] + (dish.calories ?? 0) + sideKcal(id) <= band!.max);
      candidates = fitting.length > 0 ? fitting : [...candidates].sort((a, b) => sideKcal(a) - sideKcal(b)).slice(0, 1);
    }
    return (
      weightedPick(candidates, (id) => {
        const side = sideMap.get(id)!;
        const base = (1 + 2 * ledger.coverage(side.ingredients)) / (1 + (sideUsage.get(id) ?? 0) * 2);
        return base * (side.calories === null ? 0.3 : 0.02 + kcalCloseness(side.calories, sideIdeal));
      }) ?? null
    );
  };

  /** Following days at the same meal where a freshly cooked dish can be repeated. */
  const runSlots = (key: SlotKey, dish: Dish, servingKcal: number): SlotKey[] => {
    const { day, meal } = parseSlotKey(key);
    const slotsAhead: SlotKey[] = [];
    for (let d = day + 1; d <= 6; d += 1) {
      const next = slotKey(d as DayIndex, meal);
      const ok =
        activeSet.has(next) &&
        targets.has(next) &&
        !result[next].dishId &&
        (dayUsage.get(`${dish.id}|${d}`) ?? 0) < dish.maxPerDay &&
        rotationOk(next, dish) &&
        (!strictCalories || dayKcal[d] + servingKcal <= band!.max);
      if (!ok) break;
      slotsAhead.push(next);
    }
    return slotsAhead.slice(0, Math.max(0, dish.maxPerWeek - (usage.get(dish.id) ?? 0)));
  };

  for (const key of active) {
    if (!targets.has(key) || result[key].dishId) continue; // filled already by a repeat
    const course = courseOfSlot(key);
    const strict = STRICT_ROTATION[course];
    const available = dishes.filter((d) => canUse(d, key));

    if (available.length === 0) {
      penalty += PENALTY.emptySlot;
      emptyByCourse.set(course, (emptyByCourse.get(course) ?? 0) + 1);
      continue;
    }

    let pool = available;
    if (strict) {
      pool = available.filter((d) => rotationOk(key, d));
      if (pool.length === 0) {
        pool = available;
        penalty += PENALTY.proteinRepeat;
        proteinRepeat = true;
      }
    }

    // Prefer dishes that can still get a side; fall back only if nothing else fits.
    const withSide = pool.filter((d) => !d.requiresSide || availableSides(d).length > 0);
    if (withSide.length > 0) pool = withSide;

    if (strictCalories) {
      const { day } = parseSlotKey(key);
      const fitting = pool.filter((d) => fitsDay(d, day));
      if (fitting.length === 0) {
        penalty += PENALTY.emptySlot;
        calorieEmpty += 1;
        continue;
      }
      pool = fitting;
    }
    // Weekly counts are strict: prefer dishes whose whole run of `maxPerWeek` days fits from here.
    if (fullRuns) {
      const fitting = pool.filter((d) => {
        if ((usage.get(d.id) ?? 0) > 0 || d.maxPerWeek <= 1) return true;
        if (d.requiresSide && !availableSides(d).some((id) => sideRemaining(id) >= d.maxPerWeek)) return false;
        const servingKcal = goal ? (d.calories ?? 0) + sideKcalRange(d).min : 0;
        return runSlots(key, d, servingKcal).length >= d.maxPerWeek - 1;
      });
      if (fitting.length > 0) pool = fitting;
    }
    const ideal = goal ? idealKcal(key) : 0;

    const chain = chainOf(key);
    const pos = chainPos.get(key)!;
    const [prevProtein, nextProtein] = neighbourProteins(key);
    const dish = weightedPick(pool, (d) => {
      // A dish already in a fixed slot next door still owes servings: continuing it keeps its count.
      let weight = (usage.get(d.id) ?? 0) === 0 ? 1.5 : fullRuns ? 3 : 0.5;
      weight *= 1 + 6 * ledger.coverage(d.ingredients); // strong preference for what is already at home
      if (!strict && (d.protein === prevProtein || d.protein === nextProtein)) weight *= 0.6;
      if (proteinAt(chain, pos - 2) === d.protein) weight *= 0.55;
      if (goal) weight *= d.calories === null ? 0.3 : 0.02 + kcalCloseness(d.calories + sideKcalRange(d).avg, ideal);
      return weight;
    });
    if (!dish) continue;

    const isNew = (usage.get(dish.id) ?? 0) === 0;
    const sideId = pickSide(dish, key, isNew ? dish.maxPerWeek : 1);
    place(key, dish, sideId);

    if (isNew) {
      // The rest of the weekly count goes to the following days. Leftovers keep the same side,
      // so the run is also capped by the side's weekly limit.
      const ahead = runSlots(key, dish, goal ? (dish.calories ?? 0) + sideKcal(sideId) : 0).slice(0, sideId ? Math.max(0, sideRemaining(sideId)) : undefined);
      for (const next of ahead) place(next, dish, sideId);
      const short = dish.maxPerWeek - 1 - ahead.length;
      if (fullRuns && short > 0) {
        shortServings += short;
        penalty += PENALTY.shortServing * short;
      }
      closed.add(dish.id);
    }
  }

  let calorieDaysOff = 0;
  if (band && goal) {
    for (let day = 0; day < 7; day += 1) {
      if (!dayKnown[day]) continue;
      const kcal = dayKcal[day];
      const deviation = kcal < band.min ? (band.min - kcal) / goal.dailyTarget : kcal > band.max ? (kcal - band.max) / goal.dailyTarget : 0;
      if (deviation === 0) continue;
      calorieDaysOff += 1;
      penalty += strictCalories
        ? PENALTY.calorieDayStrict + deviation * PENALTY.calorieDeviationStrict
        : PENALTY.calorieDaySoft + deviation * PENALTY.calorieDeviationSoft;
    }
  }

  return {
    slots: result,
    penalty,
    pantryScore,
    emptyByCourse,
    proteinRepeat,
    missingSide,
    calorieDaysOff,
    calorieEmpty,
    unknownCalories,
    shortServings,
  };
}

function describeIssues(attempt: Attempt, dishes: Dish[], goal: CalorieGoal | null): string[] {
  const warnings: string[] = [];
  for (const course of COURSES) {
    const n = attempt.emptyByCourse.get(course) ?? 0;
    if (n === 0) continue;
    const label = COURSE_META[course].label;
    const hasAny = dishes.some((d) => d.courses.includes(course));
    warnings.push(
      hasAny
        ? `Не хватает блюд категории «${label}»: ${n} ${plural(n, ['приём пищи остался', 'приёма пищи остались', 'приёмов пищи остались'])} пустыми. Добавьте блюда или увеличьте лимиты.`
        : `В базе нет блюд категории «${label}» — добавьте их или отключите этот приём пищи в настройках.`,
    );
  }
  if (attempt.proteinRepeat) {
    warnings.push('Не удалось полностью избежать одинакового белка подряд — добавьте основные блюда с другим видом мяса.');
  }
  if (attempt.shortServings > 0) {
    const n = attempt.shortServings;
    warnings.push(
      `Не все блюда встали в меню столько раз, сколько указано в неделю: не хватило ${n} ${plural(n, ['порции', 'порций', 'порций'])} — мало свободных дней подряд или гарниров. Добавьте блюда с меньшим числом раз в неделю.`,
    );
  }
  if (attempt.missingSide) {
    warnings.push('Для некоторых блюд не хватило гарниров — включите гарниры, увеличьте их лимиты или добавьте новые.');
  }
  if (goal) {
    const { min, max } = calorieBand(goal);

    if (attempt.calorieEmpty > 0) {
      const n = attempt.calorieEmpty;
      warnings.push(
        `Жёсткий лимит калорий: ${n} ${plural(n, ['приём пищи остался', 'приёма пищи остались', 'приёмов пищи остались'])} пустыми — не нашлось блюд, чтобы день уложился в ${formatNumber(max)} ккал.`,
      );
    }
    if (attempt.calorieDaysOff > 0) {
      const n = attempt.calorieDaysOff;
      const days = `${n} ${plural(n, ['день', 'дня', 'дней'])}`;
      warnings.push(
        goal.mode === 'ceiling'
          ? `${days} выше лимита ${formatNumber(max)} ккал — добавьте более лёгкие блюда или поднимите лимит.`
          : `${days} вне коридора ${formatNumber(min)}–${formatNumber(max)} ккал — добавьте блюда подходящей калорийности или расширьте допуск.`,
      );
    }
    if (attempt.unknownCalories) warnings.push('У части блюд или гарниров не указаны калории — они считаются как 0 ккал.');
  }
  return warnings;
}
