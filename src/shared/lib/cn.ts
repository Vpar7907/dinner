import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names; conflicting Tailwind utilities are resolved in favour of the
 * later one, so `cn('w-full px-4', 'w-24 px-2')` gives `w-24 px-2` regardless of CSS order.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
