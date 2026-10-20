import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDishStore } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import {
  CALORIE_TARGET_RANGE,
  CALORIE_TOLERANCE_RANGE,
  calorieBand,
  useCalorieSettings,
  useMenuStore,
  type CalorieMode,
  type CalorieStrictness,
} from '@/entities/menu';
import { cn, formatNumber, pluralWithCount } from '@/shared/lib';
import { Field, Input, Stepper, Switch } from '@/shared/ui';

const MODES: { value: CalorieMode; label: string; hint: string }[] = [
  { value: 'target', label: 'Цель', hint: 'Попасть в коридор вокруг значения: и перебор, и недобор плохо' },
  { value: 'ceiling', label: 'Потолок', hint: 'Главное — не превысить, лёгкий день считается нормальным' },
];

const STRICTNESS: { value: CalorieStrictness; label: string; hint: string }[] = [
  { value: 'soft', label: 'Мягко', hint: 'Старается уложиться, но день заполняется всегда' },
  { value: 'strict', label: 'Жёстко', hint: 'Блюдо, с которым день превысит максимум, не ставится' },
];

function OptionCards<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; hint: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <motion.button
            key={option.value}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'flex flex-col gap-1 rounded-2xl px-4 py-3 text-left ring-1 transition-all duration-200',
              active ? 'bg-brand-50 ring-2 ring-brand-400' : 'bg-cream-50 ring-ink-900/10 hover:ring-ink-900/20',
            )}
          >
            <span className="text-sm font-bold text-ink-900">{option.label}</span>
            <span className="text-xs text-ink-500">{option.hint}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Experimental calorie mode: on/off, target or ceiling, tolerance and strictness. */
export function CalorieSettingsPanel() {
  const settings = useCalorieSettings();
  const setCalorieSettings = useMenuStore((s) => s.setCalorieSettings);
  const missingDishes = useDishStore((s) => s.dishes.filter((d) => d.calories === null).length);
  const missingSides = useSideDishStore((s) => s.sides.filter((side) => side.calories === null).length);
  const band = calorieBand(settings);
  const ceiling = settings.mode === 'ceiling';

  // The target is committed on blur, so typing "2" on the way to "2000" is not clamped to the minimum.
  const [targetText, setTargetText] = useState(String(settings.dailyTarget));
  useEffect(() => setTargetText(String(settings.dailyTarget)), [settings.dailyTarget]);
  const commitTarget = () => {
    const value = Number.parseInt(targetText.replace(/\s/g, ''), 10);
    if (Number.isFinite(value)) void setCalorieSettings({ dailyTarget: value });
    else setTargetText(String(settings.dailyTarget));
  };

  return (
    <div className="flex flex-col gap-4">
      <Switch checked={settings.enabled} onChange={(enabled) => void setCalorieSettings({ enabled })} label="Учитывать калории" />

      <AnimatePresence initial={false}>
        {settings.enabled && (
          <motion.div
            // Clipping is needed only while the height animates; afterwards it would cut off the rings
            // of the option cards and inputs, which are drawn outside their boxes. The -mx/px pair keeps
            // room for them during the animation too.
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', transitionEnd: { overflow: 'visible' } }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="-mx-1 px-1"
          >
            <div className="flex flex-col gap-5 pb-1 pt-1">
              <Field label="Как считать">
                <OptionCards options={MODES} value={settings.mode} onChange={(mode) => void setCalorieSettings({ mode })} />
              </Field>

              <div className={cn('grid gap-4', !ceiling && 'sm:grid-cols-[1fr_auto]')}>
                <Field label={ceiling ? 'Лимит на день, ккал' : 'Цель на день, ккал'}>
                  <Input
                    inputMode="numeric"
                    value={targetText}
                    onChange={(event) => setTargetText(event.target.value.replace(/[^\d\s]/g, ''))}
                    onBlur={commitTarget}
                    onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
                    aria-label={`От ${CALORIE_TARGET_RANGE.min} до ${CALORIE_TARGET_RANGE.max} ккал`}
                  />
                </Field>
                {!ceiling && (
                  <Field label="Допуск, ±%">
                    <Stepper
                      value={settings.tolerance}
                      min={CALORIE_TOLERANCE_RANGE.min}
                      max={CALORIE_TOLERANCE_RANGE.max}
                      onChange={(tolerance) => void setCalorieSettings({ tolerance })}
                    />
                  </Field>
                )}
              </div>

              <p className="rounded-2xl bg-sage-50 px-4 py-2.5 text-sm font-semibold text-sage-600">
                {ceiling
                  ? `Не больше ${formatNumber(band.max)} ккал в день`
                  : `Коридор: ${formatNumber(band.min)}–${formatNumber(band.max)} ккал в день`}
              </p>

              <Field label="Строгость">
                <OptionCards
                  options={STRICTNESS}
                  value={settings.strictness}
                  onChange={(strictness) => void setCalorieSettings({ strictness })}
                />
              </Field>

              {missingDishes + missingSides > 0 && (
                <p className="rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
                  Калории не указаны у{' '}
                  {[
                    missingDishes > 0 && pluralWithCount(missingDishes, ['блюда', 'блюд', 'блюд']),
                    missingSides > 0 && pluralWithCount(missingSides, ['гарнира', 'гарниров', 'гарниров']),
                  ]
                    .filter(Boolean)
                    .join(' и ')}{' '}
                  — они считаются как 0 ккал. Заполните их в карточках блюд и гарниров.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
