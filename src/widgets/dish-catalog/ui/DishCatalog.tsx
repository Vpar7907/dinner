import { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Pencil, Plus } from 'lucide-react';
import {
  COURSES,
  COURSE_META,
  DishCard,
  PROTEIN_META,
  PROTEIN_TYPES,
  useDishStore,
  type Dish,
  type DishCourse,
  type ProteinType,
} from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { useCalorieSettings } from '@/entities/menu';
import { DeleteDishButton, DishFormModal } from '@/features/manage-dish';
import { normalizeText } from '@/shared/lib';
import { Button, Chip, EmptyState, IconButton, PageHeader, SearchInput } from '@/shared/ui';

type Filter = ProteinType | 'all';
type CourseFilter = DishCourse | 'all';

export function DishCatalog() {
  const dishes = useDishStore((s) => s.dishes);
  const sides = useSideDishStore((s) => s.sides);
  const caloriesEnabled = useCalorieSettings().enabled;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
  const [editor, setEditor] = useState<{ open: boolean; dish: Dish | null }>({ open: false, dish: null });

  const sideNames = useMemo(() => new Map(sides.map((s) => [s.id, s.name])), [sides]);
  const presentProteins = PROTEIN_TYPES.filter((p) => dishes.some((d) => d.protein === p));

  const visible = useMemo(() => {
    const q = normalizeText(query);
    return dishes.filter(
      (d) =>
        (filter === 'all' || d.protein === filter) &&
        (courseFilter === 'all' || d.courses.includes(courseFilter)) &&
        (!q || normalizeText(d.name).includes(q) || d.ingredients.some((i) => normalizeText(i.name).includes(q))),
    );
  }, [dishes, query, filter, courseFilter]);

  const openEditor = (dish: Dish | null) => setEditor({ open: true, dish });

  return (
    <div>
      <PageHeader
        eyebrow="База блюд"
        title="Ваши блюда"
        actions={
          <Button size="lg" icon={<Plus className="h-5 w-5" />} onClick={() => openEditor(null)}>
            Добавить блюдо
          </Button>
        }
      />

      {dishes.length > 0 && (
        <LayoutGroup id="course-filter">
          <div className="mb-3 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            <Chip active={courseFilter === 'all'} onClick={() => setCourseFilter('all')} layoutGroup="course-filter">
              Все категории
            </Chip>
            {COURSES.map((course) => (
              <Chip key={course} active={courseFilter === course} onClick={() => setCourseFilter(course)} layoutGroup="course-filter">
                <span>{COURSE_META[course].emoji}</span>
                {COURSE_META[course].plural}
                <span className="opacity-60">{dishes.filter((d) => d.courses.includes(course)).length}</span>
              </Chip>
            ))}
          </div>
        </LayoutGroup>
      )}

      {dishes.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Поиск по названию или ингредиенту…" className="lg:w-80" />
          <LayoutGroup id="protein-filter">
            <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
              <Chip active={filter === 'all'} onClick={() => setFilter('all')} layoutGroup="protein-filter">
                Все
              </Chip>
              {presentProteins.map((protein) => (
                <Chip key={protein} active={filter === protein} onClick={() => setFilter(protein)} layoutGroup="protein-filter">
                  <span>{PROTEIN_META[protein].emoji}</span>
                  {PROTEIN_META[protein].label}
                </Chip>
              ))}
            </div>
          </LayoutGroup>
        </div>
      )}

      {dishes.length === 0 ? (
        <EmptyState
          emoji="👩‍🍳"
          title="В базе пока нет блюд"
          description="Добавьте любимые блюда, чтобы генератор смог составить меню на неделю."
          action={
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => openEditor(null)}>
              Добавить первое блюдо
            </Button>
          }
        />
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                showCalories={caloriesEnabled}
                sideNames={dish.allowedSideIds.map((id) => sideNames.get(id)).filter((n): n is string => Boolean(n))}
                onClick={() => openEditor(dish)}
                actions={
                  <>
                    <IconButton label="Редактировать" onClick={() => openEditor(dish)}>
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <DeleteDishButton dish={dish} />
                  </>
                }
              />
            ))}
          </AnimatePresence>
          {visible.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-ink-500">По вашему запросу ничего не найдено</p>
          )}
        </motion.div>
      )}

      <DishFormModal open={editor.open} dish={editor.dish} onClose={() => setEditor((e) => ({ ...e, open: false }))} />
    </div>
  );
}
