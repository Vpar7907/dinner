import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
}

export function Badge({ children, className, icon, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', className)}
    >
      {icon}
      {children}
    </span>
  );
}
