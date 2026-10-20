const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatKcal(value: number): string {
  return `${numberFormatter.format(Math.round(value))} ккал`;
}

/** Calories per serving as stored: a positive whole number or `null` when unknown. */
export function normalizeCalories(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
