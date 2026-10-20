import type { CalorieSettings } from './types';

export const DEFAULT_CALORIE_SETTINGS: CalorieSettings = {
  enabled: false,
  mode: 'target',
  dailyTarget: 2000,
  tolerance: 10,
  strictness: 'soft',
};

export const CALORIE_TARGET_RANGE = { min: 800, max: 6000 } as const;
export const CALORIE_TOLERANCE_RANGE = { min: 5, max: 30 } as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeCalorieSettings(value: Partial<CalorieSettings> | undefined): CalorieSettings {
  const merged = { ...DEFAULT_CALORIE_SETTINGS, ...value };
  return {
    enabled: merged.enabled === true,
    mode: merged.mode === 'ceiling' ? 'ceiling' : 'target',
    dailyTarget: Number.isFinite(merged.dailyTarget)
      ? Math.round(clamp(merged.dailyTarget, CALORIE_TARGET_RANGE.min, CALORIE_TARGET_RANGE.max))
      : DEFAULT_CALORIE_SETTINGS.dailyTarget,
    tolerance: Number.isFinite(merged.tolerance)
      ? Math.round(clamp(merged.tolerance, CALORIE_TOLERANCE_RANGE.min, CALORIE_TOLERANCE_RANGE.max))
      : DEFAULT_CALORIE_SETTINGS.tolerance,
    strictness: merged.strictness === 'strict' ? 'strict' : 'soft',
  };
}

/** Acceptable calories per day: target ± tolerance, or anything up to the ceiling. */
export function calorieBand({ mode, dailyTarget, tolerance }: Pick<CalorieSettings, 'mode' | 'dailyTarget' | 'tolerance'>): {
  min: number;
  max: number;
} {
  if (mode === 'ceiling') return { min: 0, max: dailyTarget };
  return { min: Math.round(dailyTarget * (1 - tolerance / 100)), max: Math.round(dailyTarget * (1 + tolerance / 100)) };
}
