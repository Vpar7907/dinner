import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/shared/lib';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  label: string;
  children: ReactNode;
  tone?: 'neutral' | 'danger' | 'brand' | 'active';
}

const tones = {
  neutral: 'text-ink-500 hover:text-ink-900 hover:bg-ink-900/5',
  danger: 'text-ink-500 hover:text-red-600 hover:bg-red-50',
  brand: 'text-brand-600 hover:bg-brand-50',
  active: 'text-white bg-ink-900 hover:bg-ink-700',
};

export function IconButton({ label, children, tone = 'neutral', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.88 }}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
