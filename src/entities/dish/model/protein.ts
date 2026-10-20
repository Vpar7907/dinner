import type { ProteinType } from './types';

export interface ProteinMeta {
  label: string;
  emoji: string;
  /** Badge surface classes. */
  badge: string;
  /** Solid color for charts and indicators. */
  solid: string;
}

export const PROTEIN_META: Record<ProteinType, ProteinMeta> = {
  chicken: { label: 'Курица', emoji: '🐔', badge: 'bg-amber-100 text-amber-800', solid: 'bg-amber-400' },
  turkey: { label: 'Индейка', emoji: '🦃', badge: 'bg-orange-100 text-orange-800', solid: 'bg-orange-400' },
  beef: { label: 'Говядина', emoji: '🐄', badge: 'bg-rose-100 text-rose-800', solid: 'bg-rose-500' },
  pork: { label: 'Свинина', emoji: '🐖', badge: 'bg-pink-100 text-pink-800', solid: 'bg-pink-400' },
  lamb: { label: 'Баранина', emoji: '🐑', badge: 'bg-violet-100 text-violet-800', solid: 'bg-violet-400' },
  fish: { label: 'Рыба', emoji: '🐟', badge: 'bg-sky-100 text-sky-800', solid: 'bg-sky-500' },
  vegetarian: { label: 'Вегетарианское', emoji: '🥦', badge: 'bg-emerald-100 text-emerald-800', solid: 'bg-emerald-500' },
};

export const PROTEIN_TYPES = Object.keys(PROTEIN_META) as ProteinType[];

export const DISH_EMOJIS = ['🍳', '🥞', '🥣', '🥓', '🥗', '🥬', '🥒', '🍗', '🍖', '🥩', '🐟', '🍤', '🍲', '🍝', '🥘', '🧆', '🍛', '🌯', '🥟', '🍔', '🍕', '🫕'];
