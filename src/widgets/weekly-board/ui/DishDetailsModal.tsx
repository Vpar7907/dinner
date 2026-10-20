import { BookOpen, ExternalLink, Pencil, Repeat } from 'lucide-react';
import { COURSE_META, ProteinBadge, type Dish } from '@/entities/dish';
import type { SideDish } from '@/entities/side-dish';
import type { Ingredient } from '@/entities/ingredient';
import { describeSlot, type SlotKey } from '@/entities/menu';
import { slotCalories } from '@/features/generate-menu';
import { cn, firstLink, formatKcal, formatNumber, linkLabel } from '@/shared/lib';
import { Button, LinkifiedText, Modal } from '@/shared/ui';

export interface DishDetailsModalProps {
  open: boolean;
  /** Slot the dish was opened from; kept after closing so the content stays during the exit animation. */
  slotKey: SlotKey | null;
  dish?: Dish;
  side?: SideDish;
  showCalories: boolean;
  onClose: () => void;
  onReplace: (key: SlotKey) => void;
  onEdit: (dish: Dish) => void;
}

function IngredientList({ title, items }: { title?: string; items: Ingredient[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {title && <p className="px-1 text-xs font-bold text-ink-500">{title}</p>}
      <ul className="divide-y divide-ink-900/5 rounded-2xl bg-cream-50 px-3 ring-1 ring-ink-900/5">
        {items.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="text-ink-900">{item.name}</span>
            {item.amount > 0 && (
              <span className="shrink-0 tabular-nums text-ink-500">
                {formatNumber(item.amount)} {item.unit}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Read-only dish card opened from the menu: the recipe first, then ingredients. */
export function DishDetailsModal({ open, slotKey, dish, side, showCalories, onClose, onReplace, onEdit }: DishDetailsModalProps) {
  const recipeUrl = dish?.notes ? firstLink(dish.notes) : null;
  const serving = dish && showCalories ? slotCalories(dish, side) : null;
  const servedSide = dish?.requiresSide ? side : undefined;

  return (
    <Modal
      open={open && dish !== undefined}
      onClose={onClose}
      title={dish ? `${dish.emoji} ${dish.name}` : ''}
      subtitle={slotKey ? describeSlot(slotKey) : undefined}
      footer={
        dish &&
        slotKey && (
          <>
            <Button variant="ghost" icon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(dish)}>
              Изменить
            </Button>
            <Button variant="secondary" icon={<Repeat className="h-4 w-4" />} onClick={() => onReplace(slotKey)}>
              Заменить
            </Button>
          </>
        )
      }
    >
      {dish && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <ProteinBadge protein={dish.protein} />
            {dish.courses.map((course) => (
              <span key={course} className="rounded-full bg-ink-900/5 px-2.5 py-1 text-xs font-semibold text-ink-700">
                {COURSE_META[course].emoji} {COURSE_META[course].label}
              </span>
            ))}
            {serving && serving.kcal > 0 && (
              <span className="rounded-full bg-ink-900/5 px-2.5 py-1 text-xs font-semibold tabular-nums text-ink-700">
                {formatKcal(serving.kcal)}
                {!serving.complete && '*'}
              </span>
            )}
          </div>

          {dish.requiresSide && (
            <p className={cn('text-sm font-semibold', servedSide ? 'text-sage-600' : 'text-amber-600')}>
              {servedSide ? `Гарнир: ${servedSide.emoji} ${servedSide.name}` : 'Гарнир не выбран'}
            </p>
          )}

          <section
            className={cn(
              'flex flex-col gap-3 rounded-3xl p-4',
              dish.notes ? 'bg-brand-50/70 ring-1 ring-brand-100' : 'bg-cream-50 ring-1 ring-ink-900/5',
            )}
          >
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <BookOpen className={cn('h-4 w-4', dish.notes ? 'text-brand-600' : 'text-ink-300')} />
              Рецепт
            </h3>
            {dish.notes ? (
              <>
                <LinkifiedText text={dish.notes} shortLinks className="text-[15px] leading-relaxed text-ink-900" />
                {recipeUrl && (
                  <a
                    href={recipeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-2xl bg-brand-500 px-4 text-sm font-bold text-white shadow-glow transition hover:bg-brand-600"
                  >
                    Открыть рецепт · {linkLabel(recipeUrl)}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-500">Описание не добавлено. Нажмите «Изменить», чтобы записать рецепт или вставить ссылку.</p>
            )}
          </section>

          {dish.ingredients.length + (servedSide?.ingredients.length ?? 0) > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-ink-900">Ингредиенты</h3>
              <IngredientList items={dish.ingredients} />
              {servedSide && <IngredientList title={`${servedSide.emoji} ${servedSide.name}`} items={servedSide.ingredients} />}
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
