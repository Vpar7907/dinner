import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { DEFAULT_SIDE_LIMIT, SIDE_EMOJIS, useSideDishStore, type SideDish, type SideDishDraft } from '@/entities/side-dish';
import { useDishStore, type Dish } from '@/entities/dish';
import { useCalorieSettings } from '@/entities/menu';
import { IngredientsEditor, collectSuggestions, sanitizeIngredients } from '@/entities/ingredient';
import { cn } from '@/shared/lib';
import { Button, DecimalInput, EmojiPicker, Field, Input, Modal, Stepper, Switch, toast } from '@/shared/ui';

export interface SideFormModalProps {
  open: boolean;
  side: SideDish | null;
  onClose: () => void;
}

const emptyDraft = (): SideDishDraft => ({
  name: '',
  emoji: SIDE_EMOJIS[0],
  maxPerWeek: 3,
  enabled: true,
  ingredients: [],
  calories: null,
});

/** Dishes that are currently served with the side: an empty list on a dish means "any side". */
function linkedDishIds(dishes: Dish[], sideId: string | null): string[] {
  return dishes
    .filter((d) => d.requiresSide && (d.allowedSideIds.length === 0 || (sideId !== null && d.allowedSideIds.includes(sideId))))
    .map((d) => d.id);
}

export function SideFormModal({ open, side, onClose }: SideFormModalProps) {
  const sides = useSideDishStore((s) => s.sides);
  const save = useSideDishStore((s) => s.save);
  const dishes = useDishStore((s) => s.dishes);
  const linkSide = useDishStore((s) => s.linkSide);
  const caloriesEnabled = useCalorieSettings().enabled;

  const [draft, setDraft] = useState<SideDishDraft>(emptyDraft);
  const [linked, setLinked] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    setDraft(
      side
        ? {
            id: side.id,
            name: side.name,
            emoji: side.emoji,
            maxPerWeek: side.maxPerWeek ?? DEFAULT_SIDE_LIMIT,
            enabled: side.enabled ?? true,
            ingredients: side.ingredients.map((i) => ({ ...i })),
            calories: side.calories,
          }
        : emptyDraft(),
    );
    setLinked(linkedDishIds(dishes, side?.id ?? null));
    // Dishes are read once per opening; edits made elsewhere meanwhile are not expected.
  }, [open, side]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo(
    () => collectSuggestions([...sides.map((s) => s.ingredients), ...dishes.map((d) => d.ingredients)]),
    [sides, dishes],
  );
  const dishesWithSide = dishes.filter((d) => d.requiresSide);
  const patch = (value: Partial<SideDishDraft>) => setDraft((d) => ({ ...d, ...value }));
  const toggleLinked = (id: string) => setLinked((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const nameError = submitted && !draft.name.trim() ? 'Введите название гарнира' : undefined;

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    setSubmitted(true);
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const saved = await save({ ...draft, ingredients: sanitizeIngredients(draft.ingredients) });
      const allSideIds = [...new Set([...sides.map((s) => s.id), saved.id])];
      await linkSide(saved.id, linked, allSideIds);
      toast.success(side ? 'Гарнир обновлён' : 'Гарнир добавлен', saved.name);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось сохранить гарнир');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={side ? 'Редактирование гарнира' : 'Новый гарнир'}
      subtitle="Ингредиенты гарнира попадут в список покупок вместе с блюдом"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button icon={<Check className="h-4 w-4" />} loading={saving} onClick={() => void handleSubmit()}>
            {side ? 'Сохранить' : 'Добавить гарнир'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Название" error={nameError}>
            <Input
              autoFocus
              value={draft.name}
              invalid={Boolean(nameError)}
              placeholder="Например, Булгур"
              onChange={(event) => patch({ name: event.target.value })}
            />
          </Field>
          <Field label="Макс. раз в неделю">
            <Stepper value={draft.maxPerWeek} min={1} max={14} onChange={(maxPerWeek) => patch({ maxPerWeek })} />
          </Field>
        </div>

        {caloriesEnabled && (
          <Field label="Калории на порцию">
            <DecimalInput
              value={draft.calories}
              placeholder="Например, 200"
              onValueChange={(calories) => patch({ calories })}
              className="sm:max-w-[200px]"
            />
          </Field>
        )}

        <Field label="Иконка">
          <EmojiPicker options={SIDE_EMOJIS} value={draft.emoji} onChange={(emoji) => patch({ emoji })} />
        </Field>

        <Switch
          checked={draft.enabled}
          onChange={(enabled) => patch({ enabled })}
          label="Использовать в генерации"
          description="Выключите, чтобы временно не предлагать этот гарнир, не удаляя его"
        />

        <Field label="Подходит к блюдам" hint="Показаны блюда, которым нужен гарнир. Связь сохраняется и в настройках самих блюд.">
          {dishesWithSide.length === 0 ? (
            <p className="rounded-2xl bg-cream-100/70 px-4 py-3 text-sm text-ink-500">Нет блюд, которым нужен гарнир.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dishesWithSide.map((dish) => {
                const active = linked.includes(dish.id);
                return (
                  <motion.button
                    key={dish.id}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleLinked(dish.id)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200',
                      active ? 'bg-sage-500 text-white shadow-soft' : 'bg-white text-ink-700 ring-1 ring-ink-900/10 hover:ring-sage-400',
                    )}
                  >
                    <span>{dish.emoji}</span>
                    {dish.name}
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
        </Field>

        <IngredientsEditor value={draft.ingredients} onChange={(ingredients) => patch({ ingredients })} suggestions={suggestions} />
        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Modal>
  );
}
