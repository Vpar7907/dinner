import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  COURSES,
  COURSE_META,
  DISH_EMOJIS,
  PROTEIN_META,
  PROTEIN_TYPES,
  useDishStore,
  type Dish,
  type DishCourse,
  type DishDraft,
} from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { useCalorieSettings } from '@/entities/menu';
import { IngredientsEditor, collectSuggestions, sanitizeIngredients } from '@/entities/ingredient';
import { cn } from '@/shared/lib';
import { Button, DecimalInput, EmojiPicker, Field, Input, LinkifiedText, Modal, Stepper, Switch, Textarea, toast } from '@/shared/ui';

export interface DishFormModalProps {
  open: boolean;
  /** Dish to edit; `null` creates a new one. */
  dish: Dish | null;
  onClose: () => void;
}

const emptyDraft = (): DishDraft => ({
  name: '',
  emoji: DISH_EMOJIS[0],
  protein: 'chicken',
  courses: ['main'],
  maxPerWeek: 2,
  maxPerDay: 1,
  requiresSide: true,
  allowedSideIds: [],
  ingredients: [],
  notes: '',
  calories: null,
});

export function DishFormModal({ open, dish, onClose }: DishFormModalProps) {
  const dishes = useDishStore((s) => s.dishes);
  const save = useDishStore((s) => s.save);
  const sides = useSideDishStore((s) => s.sides);
  const caloriesEnabled = useCalorieSettings().enabled;

  const [draft, setDraft] = useState<DishDraft>(emptyDraft);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    setDraft(
      dish
        ? {
            id: dish.id,
            name: dish.name,
            emoji: dish.emoji,
            protein: dish.protein,
            courses: [...dish.courses],
            maxPerWeek: dish.maxPerWeek,
            maxPerDay: dish.maxPerDay,
            requiresSide: dish.requiresSide,
            allowedSideIds: [...dish.allowedSideIds],
            ingredients: dish.ingredients.map((i) => ({ ...i })),
            notes: dish.notes,
            calories: dish.calories,
          }
        : emptyDraft(),
    );
  }, [open, dish]);

  const suggestions = useMemo(
    () => collectSuggestions([...dishes.map((d) => d.ingredients), ...sides.map((s) => s.ingredients)]),
    [dishes, sides],
  );

  const patch = (value: Partial<DishDraft>) => setDraft((current) => ({ ...current, ...value }));
  const nameError = submitted && !draft.name.trim() ? 'Введите название блюда' : undefined;

  const toggleCourse = (course: DishCourse) => {
    const has = draft.courses.includes(course);
    if (has && draft.courses.length === 1) return; // at least one course is required
    patch({ courses: has ? draft.courses.filter((c) => c !== course) : [...draft.courses, course] });
  };

  const toggleSide = (id: string) =>
    patch({
      allowedSideIds: draft.allowedSideIds.includes(id) ? draft.allowedSideIds.filter((s) => s !== id) : [...draft.allowedSideIds, id],
    });

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    setSubmitted(true);
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const saved = await save({ ...draft, ingredients: sanitizeIngredients(draft.ingredients) });
      toast.success(dish ? 'Блюдо обновлено' : 'Блюдо добавлено', saved.name);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось сохранить блюдо');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={dish ? 'Редактирование блюда' : 'Новое блюдо'}
      subtitle="Параметры используются генератором меню и списком покупок"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button icon={<Check className="h-4 w-4" />} loading={saving} onClick={() => void handleSubmit()}>
            {dish ? 'Сохранить' : 'Добавить блюдо'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <Field label="Название" error={nameError}>
            <Input
              autoFocus
              value={draft.name}
              invalid={Boolean(nameError)}
              placeholder="Например, Котлеты по-киевски"
              onChange={(event) => patch({ name: event.target.value })}
            />
          </Field>
          <Field label="Макс. раз в неделю">
            <Stepper value={draft.maxPerWeek} min={1} max={7} onChange={(maxPerWeek) => patch({ maxPerWeek })} />
          </Field>
          <Field label="Макс. в день">
            <Stepper value={draft.maxPerDay} min={1} max={4} onChange={(maxPerDay) => patch({ maxPerDay })} />
          </Field>
        </div>

        {caloriesEnabled && (
          <Field label="Калории на порцию" hint={draft.requiresSide ? 'Без гарнира: его калории указываются отдельно' : undefined}>
            <DecimalInput
              value={draft.calories}
              placeholder="Например, 450"
              onValueChange={(calories) => patch({ calories })}
              className="sm:max-w-[200px]"
            />
          </Field>
        )}

        {draft.maxPerWeek > 1 && (
          <p className="-mt-3 rounded-2xl bg-sage-50 px-4 py-2.5 text-xs font-medium text-sage-600">
            🔁 Повторы этого блюда генератор поставит в соседние дни — готовите один раз, едите несколько дней.
          </p>
        )}

        <Field label="Иконка">
          <EmojiPicker options={DISH_EMOJIS} value={draft.emoji} onChange={(emoji) => patch({ emoji })} />
        </Field>

        <Field label="Подходит для" hint="Можно выбрать несколько: например, омлет — и завтрак, и основное блюдо">
          <div className="grid grid-cols-3 gap-2">
            {COURSES.map((course) => {
              const meta = COURSE_META[course];
              const active = draft.courses.includes(course);
              return (
                <motion.button
                  key={course}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleCourse(course)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center ring-1 transition-all duration-200',
                    active ? 'bg-brand-50 ring-2 ring-brand-400' : 'bg-cream-50 ring-ink-900/10 hover:ring-ink-900/20',
                  )}
                >
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-sm font-bold text-ink-900">{meta.label}</span>
                  <span className="hidden text-[11px] text-ink-500 sm:block">{meta.hint}</span>
                </motion.button>
              );
            })}
          </div>
        </Field>

        <Field label="Вид мяса / белка">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROTEIN_TYPES.map((protein) => {
              const meta = PROTEIN_META[protein];
              const active = draft.protein === protein;
              return (
                <motion.button
                  key={protein}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => patch({ protein })}
                  className={cn(
                    'relative flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold ring-1 transition-colors duration-200',
                    active ? 'text-ink-900 ring-transparent' : 'bg-cream-50 text-ink-700 ring-ink-900/10 hover:ring-ink-900/20',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="protein-selector"
                      className={cn('absolute inset-0 rounded-2xl ring-2 ring-ink-900', meta.badge)}
                      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className="relative text-lg">{meta.emoji}</span>
                  <span className="relative truncate">{meta.label}</span>
                </motion.button>
              );
            })}
          </div>
        </Field>

        <div className="flex flex-col gap-3">
          <Switch
            checked={draft.requiresSide}
            onChange={(requiresSide) => patch({ requiresSide })}
            label="Нужен гарнир"
            description="Генератор автоматически подберёт гарнир к этому блюду"
          />
          <AnimatePresence initial={false}>
            {draft.requiresSide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl bg-sage-50/70 p-4">
                  <p className="mb-3 text-xs font-medium text-sage-600">
                    Подходящие гарниры. Если ничего не выбрано — подойдёт любой.
                  </p>
                  {sides.length === 0 ? (
                    <p className="text-sm text-ink-500">Гарниров пока нет — добавьте их в разделе «Гарниры».</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sides.map((side) => {
                        const active = draft.allowedSideIds.includes(side.id);
                        return (
                          <motion.button
                            key={side.id}
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => toggleSide(side.id)}
                            aria-pressed={active}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200',
                              active ? 'bg-sage-500 text-white shadow-soft' : 'bg-white text-ink-700 ring-1 ring-ink-900/10 hover:ring-sage-400',
                            )}
                          >
                            <span>{side.emoji}</span>
                            {side.name}
                            <AnimatePresence>
                              {active && (
                                <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}>
                                  <Check className="h-3.5 w-3.5" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Field label="Заметки и рецепт" hint="Вставьте ссылку на рецепт или запишите советы — ссылки станут кликабельными.">
          <Textarea
            value={draft.notes}
            rows={3}
            maxLength={2000}
            placeholder="https://… — рецепт, время готовки, секреты"
            onChange={(event) => patch({ notes: event.target.value })}
          />
          {/https?:\/\/|www\./i.test(draft.notes) && (
            <p className="rounded-xl bg-cream-100/70 px-3 py-2 text-xs text-ink-700">
              <LinkifiedText text={draft.notes} shortLinks />
            </p>
          )}
        </Field>

        <IngredientsEditor value={draft.ingredients} onChange={(ingredients) => patch({ ingredients })} suggestions={suggestions} />
        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Modal>
  );
}
