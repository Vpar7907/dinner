import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ArrowRight, Ban, Check, House, Trash2 } from 'lucide-react';
import { COURSE_META, ProteinBadge, useDishStore, type Dish } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { usePantryStore } from '@/entities/pantry';
import { MEAL_META, activeSlotKeys, calorieBand, describeSlot, parseSlotKey, useMenuStore, type SlotKey } from '@/entities/menu';
import { slotCalories } from '@/features/generate-menu';
import { cn, formatKcal, normalizeText } from '@/shared/lib';
import { Button, Chip, Modal, SearchInput, Switch, toast } from '@/shared/ui';
import { candidateWarning, hasWarnings, rankCandidates, type Candidate } from '../lib/rankCandidates';

export type PickerStep = 'dish' | 'side';

export interface SlotPickerModalProps {
  slotKey: SlotKey | null;
  /** Open directly on the side step to change only the side dish. */
  initialStep?: PickerStep;
  onClose: () => void;
}

const NO_SIDE = '__none__';

function sideOptionsFor<T extends { id: string }>(dish: Dish | null, sides: T[]): T[] {
  if (!dish) return [];
  const explicit = sides.filter((s) => dish.allowedSideIds.includes(s.id));
  return explicit.length > 0 ? explicit : sides;
}

function CandidateRow({
  candidate,
  active,
  showCalories,
  onSelect,
}: {
  candidate: Candidate;
  active: boolean;
  showCalories: boolean;
  onSelect: () => void;
}) {
  const { dish, used, limitReached, wrongCourse, isCurrent, pantryCoverage } = candidate;
  const warning = wrongCourse ? `Отмечено как «${dish.courses.map((c) => COURSE_META[c].label).join(', ')}»` : candidateWarning(candidate);
  const coveragePercent = Math.round(pantryCoverage * 100);

  // A plain button with CSS transitions: the list mounts while the modal animates in,
  // and dozens of motion components per row made the opening stutter.
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.98]',
        active ? 'bg-brand-50 ring-2 ring-brand-400' : 'bg-white ring-ink-900/5 hover:bg-cream-50 hover:ring-ink-900/15',
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-2xl">{dish.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-ink-900">{dish.name}</span>
          {isCurrent && <span className="shrink-0 rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold text-white">сейчас</span>}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <ProteinBadge protein={dish.protein} />
          <span className={cn('text-xs font-semibold tabular-nums', limitReached ? 'text-red-500' : 'text-ink-500')}>
            {used}/{dish.maxPerWeek} в неделю
          </span>
          {showCalories && dish.calories !== null && (
            <span className="text-xs font-semibold tabular-nums text-ink-500">· {formatKcal(dish.calories)}</span>
          )}
          {coveragePercent > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5 text-[11px] font-bold text-sage-600" title="Доля ингредиентов, которые уже есть дома">
              <House className="h-3 w-3" />
              {coveragePercent}% дома
            </span>
          )}
        </span>
        {warning && (
          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {warning}
          </span>
        )}
      </span>
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-transform duration-200',
          active ? 'scale-100' : 'scale-0',
        )}
      >
        <Check className="h-4 w-4" />
      </span>
    </button>
  );
}

export function SlotPickerModal({ slotKey, initialStep = 'dish', onClose }: SlotPickerModalProps) {
  const dishes = useDishStore((s) => s.dishes);
  const sides = useSideDishStore((s) => s.sides);
  const slots = useMenuStore((s) => s.menu.slots);
  const enabledMeals = useMenuStore((s) => s.menu.enabledMeals);
  const pantry = usePantryStore((s) => s.items);
  const setSlot = useMenuStore((s) => s.setSlot);
  const toggleSkip = useMenuStore((s) => s.toggleSkip);
  const calories = useMenuStore((s) => s.menu.calories);

  const [step, setStep] = useState<PickerStep>('dish');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [dishId, setDishId] = useState<string | null>(null);
  const [sideId, setSideId] = useState<string>(NO_SIDE);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    if (!slotKey) return;
    const slot = slots[slotKey];
    const current = dishes.find((d) => d.id === slot.dishId) ?? null;
    setStep(initialStep === 'side' && current?.requiresSide ? 'side' : 'dish');
    setQuery('');
    setShowAll(false);
    setDishId(slot.dishId);
    setSideId(slot.sideId ?? NO_SIDE);
    setLocked(slot.dishId ? slot.locked : true);
    // Reset only when a slot is opened, not on every menu change.
  }, [slotKey, initialStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const meal = slotKey ? MEAL_META[parseSlotKey(slotKey).meal] : null;
  const course = meal ? COURSE_META[meal.course] : null;
  const currentDish = slotKey ? (dishes.find((d) => d.id === slots[slotKey].dishId) ?? null) : null;

  // Calorie mode: what the rest of the day already takes, so candidates can be checked against the maximum.
  const caloriesLeft = useMemo(() => {
    if (!slotKey || !calories.enabled) return null;
    const { day } = parseSlotKey(slotKey);
    let taken = 0;
    for (const key of activeSlotKeys(slots, enabledMeals)) {
      const dish = slots[key].dishId ? dishes.find((d) => d.id === slots[key].dishId) : undefined;
      if (key === slotKey || !dish || parseSlotKey(key).day !== day) continue;
      taken += slotCalories(dish, sides.find((s) => s.id === slots[key].sideId)).kcal;
    }
    return calorieBand(calories).max - taken;
  }, [slotKey, calories, slots, enabledMeals, dishes, sides]);

  const candidates = useMemo(() => {
    if (!slotKey) return [];
    const q = normalizeText(query);
    return rankCandidates(slotKey, slots, enabledMeals, dishes, pantry, caloriesLeft).filter(
      (c) => (showAll || !c.wrongCourse) && (!q || normalizeText(c.dish.name).includes(q)),
    );
  }, [slotKey, slots, enabledMeals, dishes, pantry, caloriesLeft, query, showAll]);

  const recommended = candidates.filter((c) => !hasWarnings(c));
  const others = candidates.filter((c) => hasWarnings(c));

  const selectedDish = dishes.find((d) => d.id === dishId) ?? null;
  const sideOptions = sideOptionsFor(selectedDish, sides);

  // Servings of each side elsewhere in the active menu, to show remaining weekly limits.
  const sideUsage = useMemo(() => {
    const usage = new Map<string, number>();
    if (!slotKey) return usage;
    for (const key of activeSlotKeys(slots, enabledMeals)) {
      const id = slots[key].sideId;
      if (key !== slotKey && id) usage.set(id, (usage.get(id) ?? 0) + 1);
    }
    return usage;
  }, [slotKey, slots, enabledMeals]);

  const chooseDish = (dish: Dish) => {
    setDishId(dish.id);
    if (dish.requiresSide && sides.length > 0) {
      const options = sideOptionsFor(dish, sides);
      const usable = options.filter((s) => s.enabled && (sideUsage.get(s.id) ?? 0) < s.maxPerWeek);
      setSideId((current) => (options.some((s) => s.id === current) ? current : (usable[0] ?? options[0]).id));
      setStep('side');
    } else {
      setSideId(NO_SIDE);
    }
  };

  const save = async () => {
    if (!slotKey || !selectedDish) return;
    await setSlot(slotKey, {
      dishId: selectedDish.id,
      sideId: selectedDish.requiresSide && sideId !== NO_SIDE ? sideId : null,
      locked,
      skipped: false,
    });
    const replaced = currentDish && currentDish.id !== selectedDish.id;
    toast.success(replaced ? 'Блюдо заменено' : 'Блюдо обновлено', `${describeSlot(slotKey)}: ${selectedDish.name}`);
    onClose();
  };

  const clear = async () => {
    if (!slotKey) return;
    await setSlot(slotKey, { dishId: null, sideId: null, locked: false });
    onClose();
  };

  const exclude = async () => {
    if (!slotKey) return;
    await toggleSkip(slotKey);
    toast.info('Приём пищи исключён', describeSlot(slotKey));
    onClose();
  };

  return (
    <Modal
      open={slotKey !== null}
      onClose={onClose}
      title={step === 'side' ? 'Выберите гарнир' : currentDish ? 'Замена блюда' : 'Выберите блюдо'}
      subtitle={slotKey ? describeSlot(slotKey) : undefined}
      size="md"
      footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" icon={<Ban className="h-4 w-4" />} onClick={exclude}>
              Исключить приём
            </Button>
            {currentDish && (
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" icon={<Trash2 className="h-4 w-4" />} onClick={clear}>
                Очистить
              </Button>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            {step === 'side' ? (
              <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep('dish')}>
                К блюдам
              </Button>
            ) : (
              <Button variant="ghost" onClick={onClose}>
                Отмена
              </Button>
            )}
            <Button icon={<Check className="h-4 w-4" />} disabled={!selectedDish} onClick={save}>
              Сохранить
            </Button>
          </div>
        </div>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === 'dish' ? (
          <motion.div
            key="dish"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {currentDish && selectedDish && currentDish.id !== selectedDish.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 overflow-hidden rounded-2xl bg-cream-100/70 px-3 py-2.5 text-sm"
              >
                <span className="truncate text-ink-500 line-through">
                  {currentDish.emoji} {currentDish.name}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="truncate font-bold text-ink-900">
                  {selectedDish.emoji} {selectedDish.name}
                </span>
              </motion.div>
            )}

            <SearchInput value={query} onChange={setQuery} placeholder="Найти блюдо…" />

            {course && (
              <LayoutGroup id="picker-scope">
                <div className="flex gap-1">
                  <Chip active={!showAll} onClick={() => setShowAll(false)} layoutGroup="picker-scope">
                    {course.emoji} {course.plural}
                  </Chip>
                  <Chip active={showAll} onClick={() => setShowAll(true)} layoutGroup="picker-scope">
                    Все блюда
                  </Chip>
                </div>
              </LayoutGroup>
            )}

            {recommended.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-sage-600">Подходят по правилам</h3>
                {recommended.map((c) => (
                  <CandidateRow
                    key={c.dish.id}
                    candidate={c}
                    active={c.dish.id === dishId}
                    showCalories={calories.enabled}
                    onSelect={() => chooseDish(c.dish)}
                  />
                ))}
              </section>
            )}
            {others.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-600">С оговорками</h3>
                {others.map((c) => (
                  <CandidateRow
                    key={c.dish.id}
                    candidate={c}
                    active={c.dish.id === dishId}
                    showCalories={calories.enabled}
                    onSelect={() => chooseDish(c.dish)}
                  />
                ))}
              </section>
            )}
            {candidates.length === 0 && (
              <div className="py-8 text-center text-sm text-ink-500">
                {query ? 'Ничего не найдено' : `В базе нет блюд категории «${course?.label ?? ''}»`}
                {!showAll && (
                  <button type="button" className="mt-2 block w-full font-semibold text-brand-600" onClick={() => setShowAll(true)}>
                    Показать все блюда
                  </button>
                )}
              </div>
            )}

            {selectedDish && (
              <Switch checked={locked} onChange={setLocked} label="Закрепить блюдо" description="Генератор не будет менять этот приём пищи" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="side"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {selectedDish && (
              <div className="flex items-center gap-3 rounded-2xl bg-cream-100/70 p-3">
                <span className="text-2xl">{selectedDish.emoji}</span>
                <span className="text-sm font-bold text-ink-900">{selectedDish.name}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[...sideOptions, null].map((option) => {
                const id = option?.id ?? NO_SIDE;
                const active = id === sideId;
                const used = option ? (sideUsage.get(option.id) ?? 0) : 0;
                const exhausted = option ? used >= option.maxPerWeek : false;
                const kcal = calories.enabled && option?.calories != null ? ` · ${formatKcal(option.calories)}` : '';
                const note = !option ? null : !option.enabled ? 'отключён' : exhausted ? 'лимит исчерпан' : `${used}/${option.maxPerWeek} в неделю${kcal}`;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSideId(id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-2xl p-4 text-center ring-1 transition-colors duration-200',
                      active ? 'bg-sage-50 ring-2 ring-sage-500' : 'bg-white ring-ink-900/5 hover:bg-cream-50',
                      option && (!option.enabled || exhausted) && !active && 'opacity-60',
                    )}
                  >
                    <span className={cn('text-3xl', option && !option.enabled && 'grayscale')}>{option?.emoji ?? '🚫'}</span>
                    <span className="text-sm font-semibold text-ink-900">{option?.name ?? 'Без гарнира'}</span>
                    {note && (
                      <span className={cn('text-[11px] font-semibold', !option?.enabled || exhausted ? 'text-amber-600' : 'text-ink-500')}>{note}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <Switch checked={locked} onChange={setLocked} label="Закрепить блюдо" description="Генератор не будет менять этот приём пищи" />
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
