import { useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useDishStore } from '@/entities/dish';
import { useSideDishStore, type SideDish } from '@/entities/side-dish';
import { useCalorieSettings, useMenuStore } from '@/entities/menu';
import { createPantryLedger, usePantryStore } from '@/entities/pantry';
import { analyzeMenu } from '@/features/generate-menu';
import { DeleteSideButton, SideFormModal } from '@/features/manage-side-dish';
import { SideLimitsTable } from '@/features/adjust-side-limits';
import { formatKcal, plural } from '@/shared/lib';
import { Button, EmptyState, IconButton } from '@/shared/ui';

/** Full side-dish management: list, limits, on/off, add / edit / delete. */
export function SideDishesSection() {
  const dishes = useDishStore((s) => s.dishes);
  const sides = useSideDishStore((s) => s.sides);
  const pantry = usePantryStore((s) => s.items);
  const slots = useMenuStore((s) => s.menu.slots);
  const enabledMeals = useMenuStore((s) => s.menu.enabledMeals);
  const caloriesEnabled = useCalorieSettings().enabled;
  const [editor, setEditor] = useState<{ open: boolean; side: SideDish | null }>({ open: false, side: null });

  // A dish with an empty list accepts any side, so it counts for every side.
  const linkCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const dish of dishes.filter((d) => d.requiresSide)) {
      const ids = dish.allowedSideIds.length > 0 ? dish.allowedSideIds : sides.map((s) => s.id);
      for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [dishes, sides]);

  const sideUsage = useMemo(
    () => analyzeMenu(slots, enabledMeals, new Map(dishes.map((d) => [d.id, d]))).sideUsage,
    [slots, enabledMeals, dishes],
  );
  const coverage = useMemo(() => {
    const ledger = createPantryLedger(pantry);
    return new Map(sides.map((s) => [s.id, Math.round(ledger.coverage(s.ingredients) * 100)]));
  }, [pantry, sides]);

  const openEditor = (side: SideDish | null) => setEditor({ open: true, side });

  const meta = (side: SideDish) => {
    const used = sideUsage.get(side.id) ?? 0;
    const linked = linkCounts.get(side.id) ?? 0;
    const parts = [
      `в меню ${used}/${side.maxPerWeek}${used > side.maxPerWeek ? ' ⚠' : ''}`,
      linked > 0 ? `к ${linked} ${plural(linked, ['блюду', 'блюдам', 'блюдам'])}` : 'не привязан к блюдам',
    ];
    const home = coverage.get(side.id) ?? 0;
    if (home > 0) parts.push(`🏠 ${home}% дома`);
    if (caloriesEnabled) parts.push(side.calories !== null ? formatKcal(side.calories) : 'ккал не указаны');
    if (!side.enabled) parts.unshift('выключен');
    return parts.join(' · ');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="hidden gap-3 px-2 text-[11px] font-bold uppercase tracking-wider text-ink-500 sm:flex">
          <span>Лимит в неделю · вкл./выкл.</span>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => openEditor(null)}>
          Добавить гарнир
        </Button>
      </div>

      <SideLimitsTable
        onOpen={openEditor}
        renderMeta={meta}
        renderActions={(side) => (
          <>
            <IconButton label="Редактировать гарнир" onClick={() => openEditor(side)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <DeleteSideButton side={side} />
          </>
        )}
        empty={
          <EmptyState
            emoji="🍚"
            title="Гарниров пока нет"
            description="Добавьте рис, гречку или пюре — генератор будет подбирать их к основным блюдам."
            action={
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => openEditor(null)}>
                Добавить гарнир
              </Button>
            }
          />
        }
      />

      <SideFormModal open={editor.open} side={editor.side} onClose={() => setEditor((e) => ({ ...e, open: false }))} />
    </div>
  );
}
