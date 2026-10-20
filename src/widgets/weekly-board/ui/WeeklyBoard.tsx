import { useMemo, useState } from 'react';
import { useDishStore } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { DAYS, MEALS, SLOT_ORDER, calorieBand, parseSlotKey, slotKey, useMenuStore, type SlotKey } from '@/entities/menu';
import { GenerateMenuButton, analyzeMenu, useGenerateMenu } from '@/features/generate-menu';
import { ClearMenuButton } from '@/features/clear-menu';
import { SlotPickerModal, type PickerStep } from '@/features/edit-meal-slot';
import { useSkipMeal } from '@/features/skip-meal';
import { PageHeader } from '@/shared/ui';
import { DayCard } from './DayCard';
import { MealSlotCard } from './MealSlotCard';

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
                  issues={analysis.issues[key] ?? []}
                  run={analysis.runs[key]}
                  order={visibleKeys.indexOf(key)}
                  generation={menu.generatedAt}
                  isGenerating={isGenerating}
                  cascade={cascade}
                  showCalories={caloriesOn}
                  onPick={(k, step) => setEditing({ key: k, step })}
                  onShuffle={(k) => void regenerateSlot(k)}
                  onSkip={(k) => void skipMeal(k)}
                  onClear={(k) => void setSlot(k, { dishId: null, sideId: null, locked: false })}
                />
              );
            })}
          </DayCard>
        ))}
      </div>

      <SlotPickerModal slotKey={editing.key} initialStep={editing.step} onClose={() => setEditing((e) => ({ ...e, key: null }))} />
    </div>
  );
}
