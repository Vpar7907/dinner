import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COURSES, COURSE_META, ProteinBadge, useDishStore, type Dish, type DishCourse } from '@/entities/dish';
import { normalizeText } from '@/shared/lib';
import { SearchInput, Stepper } from '@/shared/ui';

const MAX_PER_WEEK = 7;
const MAX_PER_DAY = 4;

function LimitRow({
  dish,
  layoutKey,
  onChange,
}: {
  dish: Dish;
  /** Rows re-measure only when the visible list changes, not on every stepper click. */
  layoutKey: string;
  onChange: (patch: Pick<Dish, 'maxPerWeek'> | Pick<Dish, 'maxPerDay'>) => void;
}) {
  return (
    <motion.li
      layout
      layoutDependency={layoutKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-2xl px-2 py-2 transition-colors hover:bg-cream-100/60 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
    >
      <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-xl">{dish.emoji}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink-900">{dish.name}</p>
          <ProteinBadge protein={dish.protein} className="mt-0.5" />
        </div>
      </div>
      <div className="flex flex-col items-start gap-1 sm:items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500 sm:hidden">В неделю</span>
        <Stepper value={dish.maxPerWeek} min={1} max={MAX_PER_WEEK} onChange={(maxPerWeek) => onChange({ maxPerWeek })} />
      </div>
      <div className="flex flex-col items-end gap-1 sm:items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500 sm:hidden">В день</span>
        <Stepper value={dish.maxPerDay} min={1} max={MAX_PER_DAY} onChange={(maxPerDay) => onChange({ maxPerDay })} />
      </div>
    </motion.li>
  );
}

/** Quick editing of weekly and daily limits for every dish, grouped by course. */
export function DishLimitsTable() {
  const dishes = useDishStore((s) => s.dishes);
  const save = useDishStore((s) => s.save);
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = normalizeText(query);
    const visible = q ? dishes.filter((d) => normalizeText(d.name).includes(q)) : dishes;
    // A dish with several courses is listed under its first one.
    const byCourse = new Map<DishCourse, Dish[]>();
    for (const dish of visible) byCourse.set(dish.courses[0], [...(byCourse.get(dish.courses[0]) ?? []), dish]);
    return COURSES.filter((c) => byCourse.has(c)).map((course) => ({
      course,
      dishes: byCourse.get(course)!.sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    }));
  }, [dishes, query]);

  const change = (dish: Dish, patch: Partial<Dish>) => void save({ ...dish, ...patch });
  const layoutKey = grouped.map((g) => g.dishes.map((d) => d.id).join(',')).join('|');

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={query} onChange={setQuery} placeholder="Найти блюдо…" className="sm:w-80" />
      <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 px-2 text-[11px] font-bold uppercase tracking-wider text-ink-500 sm:grid">
        <span>Блюдо</span>
        <span className="w-[120px] text-center">В неделю</span>
        <span className="w-[120px] text-center">В день</span>
      </div>
      {grouped.map(({ course, dishes: list }) => (
        <section key={course}>
          <h3 className="mb-1 px-2 text-xs font-bold text-ink-700">
            {COURSE_META[course].emoji} {COURSE_META[course].plural}
          </h3>
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {list.map((dish) => (
                <LimitRow key={dish.id} dish={dish} layoutKey={layoutKey} onChange={(patch) => change(dish, patch)} />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      ))}
      {grouped.length === 0 && <p className="py-8 text-center text-sm text-ink-500">Ничего не найдено</p>}
    </div>
  );
}
