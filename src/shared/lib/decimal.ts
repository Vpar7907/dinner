const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅛': 1 / 8,
};

/**
 * Parses a quantity typed by a person: "0,5", "0.5", ".5", "1/2", "1 1/2", "½", "1½".
 * Returns `null` for an empty string and `undefined` when the text is not a number.
 */
export function parseDecimal(input: string): number | null | undefined {
  const text = input.trim().replace(/\s+/g, ' ');
  if (text === '') return null;

  const unicode = text.match(/^(\d+)?\s?([½⅓⅔¼¾⅛])$/);
  if (unicode) return Number(unicode[1] ?? 0) + UNICODE_FRACTIONS[unicode[2]];

  const mixed = text.match(/^(\d+) (\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[3]) === 0 ? undefined : Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[2]) === 0 ? undefined : Number(fraction[1]) / Number(fraction[2]);

  // Comma or dot as the decimal separator; a trailing separator ("0,") is fine while typing.
  const decimal = text.replace(',', '.');
  if (/^(\d+\.?\d*|\.\d+)$/.test(decimal)) return Number(decimal);
  return undefined;
}

/** Shows a number the way it is typed in Russian: 0.5 → "0,5". */
export function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  const rounded = Math.round(value * 10_000) / 10_000;
  return String(rounded).replace('.', ',');
}
