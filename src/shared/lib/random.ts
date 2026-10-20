export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Picks one item with probability proportional to its weight. */
export function weightedPick<T>(items: readonly T[], weight: (item: T) => number): T | undefined {
  const weights = items.map((item) => Math.max(0, weight(item)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (items.length === 0) return undefined;
  if (total <= 0) return items[Math.floor(Math.random() * items.length)];
  let threshold = Math.random() * total;
  for (let i = 0; i < items.length; i += 1) {
    threshold -= weights[i];
    if (threshold <= 0) return items[i];
  }
  return items[items.length - 1];
}
