import { useCallback, useMemo, useState } from 'react';
import { useDishStore, type Dish } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { DAYS, MEALS, SLOT_ORDER, calorieBand, parseSlotKey, slotKey, useMenuStore, type SlotKey } from '@/entities/menu';
import { GenerateMenuButton, analyzeMenu, useGenerateMenu } from '@/features/generate-menu';
import { ClearMenuButton } from '@/features/clear-menu';
import { SlotPickerModal, type PickerStep } from '@/features/edit-meal-slot';
import { useSkipMeal } from '@/features/skip-meal';
import { DishFormModal } from '@/features/manage-dish';
import { PageHeader } from '@/shared/ui';
import { DayCard } from './DayCard';
import { DishDetailsModal } from './DishDetailsModal';
import { MealSlotCard } from './MealSlotCard';

/** Shared empty list, so memoized slot cards don't see a "new" issues array on every render. */
const NO_ISSUES: never[] = [];

function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

export function WeeklyBoard() {
  const dishes = useDishStore((s) => s.dishes);
  const sides = useSideDishStore((s) => s.sides);
  const menu = useMenuStore((s) => s.menu);
  const setSlot = useMenuStore((s) => s.setSlot);
  const { generate, regenerateSlot, isGenerating } = useGenerateMenu();
  const skipMeal = useSkipMeal();
  const [editing, setEditing] = useState<{ key: SlotKey | null; step: PickerStep }>({ key: null, step: 'dish' });
  const [cascade, setCascade] = useState(false);
  // The slot stays set after closing so the modal keeps its content during the exit animation.
  const [viewing, setViewing] = useState<{ key: SlotKey | null; open: boolean }>({ key: null, open: false });
  const [editingDish, setEditingDish] = useState<{ dish: Dish | null; open: boolean }>({ dish: null, open: false });

  // Stable callbacks: the slot cards are memoized and should re-render only when their own data changes.
  const openDish = useCallback((key: SlotKey) => setViewing({ key, open: true }), []);
  const pick = useCallback((key: SlotKey, step: PickerStep) => setEditing({ key, step }), []);
  const shuffle = useCallback((key: SlotKey) => void regenerateSlot(key), [regenerateSlot]);
  const skip = useCallback((key: SlotKey) => void skipMeal(key), [skipMeal]);
  const clear = useCallback((key: SlotKey) => void setSlot(key, { dishId: null, sideId: null, locked: false }), [setSlot]);

  const handleGenerate = async () => {
    setCascade(true);
    await generate();
    window.setTimeout(() => setCascade(false), 1400);
  };

  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const sideMap = useMemo(() => new Map(sides.map((s) => [s.id, s])), [sides]);
  const analysis = useMemo(() => analyzeMenu(menu.slots, menu.enabledMeals, dishMap, sideMap), [menu.slots, menu.enabledMeals, dishMap, sideMap]);

  const caloriesOn = menu.calories.enabled;
  const band = calorieBand(menu.calories);

  const viewedSlot = viewing.key ? menu.slots[viewing.key] : undefined;

  const visibleMeals = MEALS.filter((meal) => menu.enabledMeals[meal.type]);
  const visibleKeys = SLOT_ORDER.filter((key) => menu.enabledMeals[parseSlotKey(key).meal]);
  const today = todayIndex();

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Генератор рациона"
        title="Меню на неделю"
        actions={
          <>
            <ClearMenuButton disabled={analysis.filled === 0 || isGenerating} />
            <GenerateMenuButton onGenerate={() => void handleGenerate()} isGenerating={isGenerating} hasMenu={analysis.filled > 0} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DAYS.map((day) => (
          <DayCard
            key={day.index}
            day={day}
            isToday={day.index === today}
            calories={
              caloriesOn
                ? { total: analysis.dayCalories[day.index], incomplete: analysis.dayCaloriesIncomplete[day.index], ...band }
                : undefined
            }
          >
            {visibleMeals.map((meal) => {
              const key = slotKey(day.index, meal.type);
              const slot = menu.slots[key];
              return (
                <MealSlotCard
                  key={key}
                  slotKey={key}
                  meal={meal}
                  slot={slot}
                  dish={slot.dishId ? dishMap.get(slot.dishId) : undefined}
                  side={slot.sideId ? sideMap.get(slot.sideId) : undefined}
                  issues={analysis.issues[key] ?? NO_ISSUES}
                  run={analysis.runs[key]}
                  order={visibleKeys.indexOf(key)}
                  generation={menu.generatedAt}
                  isGenerating={isGenerating}
                  cascade={cascade}
                  showCalories={caloriesOn}
                  onOpen={openDish}
                  onPick={pick}
                  onShuffle={shuffle}
                  onSkip={skip}
                  onClear={clear}
                />
              );
            })}
          </DayCard>
        ))}
      </div>

      <DishDetailsModal
        open={viewing.open}
        slotKey={viewing.key}
        dish={viewedSlot?.dishId ? dishMap.get(viewedSlot.dishId) : undefined}
        side={viewedSlot?.sideId ? sideMap.get(viewedSlot.sideId) : undefined}
        showCalories={caloriesOn}
        onClose={() => setViewing((v) => ({ ...v, open: false }))}
        onReplace={(key) => {
          setViewing((v) => ({ ...v, open: false }));
          setEditing({ key, step: 'dish' });
        }}
        onEdit={(dish) => {
          setViewing((v) => ({ ...v, open: false }));
          setEditingDish({ dish, open: true });
        }}
      />
      <DishFormModal open={editingDish.open} dish={editingDish.dish} onClose={() => setEditingDish((e) => ({ ...e, open: false }))} />
      <SlotPickerModal slotKey={editing.key} initialStep={editing.step} onClose={() => setEditing((e) => ({ ...e, key: null }))} />
    </div>
  );
}
