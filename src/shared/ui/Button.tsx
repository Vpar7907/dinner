import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/shared/lib';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white shadow-glow hover:bg-brand-600 disabled:bg-brand-300 disabled:shadow-none',
  secondary: 'bg-white text-ink-900 ring-1 ring-ink-900/10 shadow-soft hover:ring-ink-900/20 hover:bg-cream-50',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-900/5',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-sm gap-2 rounded-2xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-2xl',
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const inactive = disabled || loading;
  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={inactive ? undefined : { y: -1 }}
      whileTap={inactive ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={inactive}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
      {children}
    </motion.button>
  );
});
