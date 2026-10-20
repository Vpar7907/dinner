import { createDemoDishes, dishRepository, useDishStore } from '@/entities/dish';
import { createDemoSides, sideDishRepository, useSideDishStore } from '@/entities/side-dish';
import { useMenuStore } from '@/entities/menu';
import { createDemoPantry, pantryRepository, usePantryStore } from '@/entities/pantry';
import { generateWeeklyMenu } from '@/features/generate-menu';
import { getMeta, setMeta } from '@/shared/api';
import { APP_VERSION } from '@/shared/config';
import { LAST_SEEN_VERSION_KEY } from '@/features/whats-new';

const SEEDED_FLAG = 'demo-seeded';
/** Second wave of demo data: breakfasts and salads, added for databases seeded before courses existed. */
const COURSES_SEEDED_FLAG = 'demo-seeded-courses';
/** Demo pantry with kitchen staples, added once to new and existing databases. */
const PANTRY_SEEDED_FLAG = 'demo-seeded-pantry';
/** Calories for demo dishes and sides seeded before the calorie mode; only empty values are filled. */
const CALORIES_SEEDED_FLAG = 'demo-seeded-calories';

/** Fills `calories` of stored records that match a demo record by id and have none yet. */
function withDemoCalories<T extends { id: string; calories?: number | null }>(stored: T[], demo: T[]): T[] {
  const byId = new Map(demo.map((item) => [item.id, item.calories ?? null]));
  return stored.flatMap((item) => {
    const calories = byId.get(item.id);
    return item.calories == null && calories != null ? [{ ...item, calories }] : [];
  });
}

export interface InitResult {
  seeded: boolean;
  addedCourses: boolean;
}

/**
 * Seeds demo data on the very first launch (empty database, no seed flag),
 * then loads every store. Flags prevent re-seeding after the user
 * intentionally deletes dishes.
 */
async function run(): Promise<InitResult> {
  const [flag, coursesFlag, pantryFlag, caloriesFlag, dishCount, sideCount, pantryCount] = await Promise.all([
    getMeta<boolean>(SEEDED_FLAG),
    getMeta<boolean>(COURSES_SEEDED_FLAG),
    getMeta<boolean>(PANTRY_SEEDED_FLAG),
    getMeta<boolean>(CALORIES_SEEDED_FLAG),
    dishRepository.count(),
    sideDishRepository.count(),
    pantryRepository.count(),
  ]);

  const shouldSeed = !flag && dishCount === 0 && sideCount === 0;
  let addedCourses = false;

  if (shouldSeed) {
    await sideDishRepository.putMany(createDemoSides());
    await dishRepository.putMany(createDemoDishes());
  } else if (flag && !coursesFlag) {
    const existing = new Set((await dishRepository.getAll()).map((d) => d.id));
    const extra = createDemoDishes().filter((d) => !d.courses.includes('main') && !existing.has(d.id));
    if (extra.length > 0) {
      await dishRepository.putMany(extra);
      addedCourses = true;
    }
  }
  if (!pantryFlag) {
    if (pantryCount === 0) await pantryRepository.putMany(createDemoPantry());
    await setMeta(PANTRY_SEEDED_FLAG, true);
  }
  if (!caloriesFlag) {
    if (!shouldSeed) {
      await dishRepository.putMany(withDemoCalories(await dishRepository.getAll(), createDemoDishes()));
      await sideDishRepository.putMany(withDemoCalories(await sideDishRepository.getAll(), createDemoSides()));
    }
    await setMeta(CALORIES_SEEDED_FLAG, true);
  }
  // A fresh install has nothing to announce: its first version counts as already seen.
  if (shouldSeed) await setMeta(LAST_SEEN_VERSION_KEY, APP_VERSION);
  if (!flag) await setMeta(SEEDED_FLAG, true);
  if (!coursesFlag) await setMeta(COURSES_SEEDED_FLAG, true);

  await Promise.all([
    useDishStore.getState().load(),
    useSideDishStore.getState().load(),
    useMenuStore.getState().load(),
    usePantryStore.getState().load(),
  ]);

  if (shouldSeed) {
    const { menu, applyGenerated } = useMenuStore.getState();
    const result = generateWeeklyMenu({
      dishes: useDishStore.getState().dishes,
      sides: useSideDishStore.getState().sides,
      slots: menu.slots,
      enabledMeals: menu.enabledMeals,
      pantry: usePantryStore.getState().items,
    });
    await applyGenerated(result.slots);
  }

  return { seeded: shouldSeed, addedCourses };
}

let pending: Promise<InitResult> | null = null;

/** Idempotent: React StrictMode mounts effects twice in development. */
export function initializeApp(): Promise<InitResult> {
  pending ??= run();
  return pending;
}
