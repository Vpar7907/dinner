import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib';

export interface GenerateMenuButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
  hasMenu: boolean;
  className?: string;
}

export function GenerateMenuButton({ onGenerate, isGenerating, hasMenu, className }: GenerateMenuButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onGenerate}
      disabled={isGenerating}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={cn(
        'relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 px-6 text-base font-bold text-white shadow-glow',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 disabled:cursor-wait',
        className,
      )}
    >
      <motion.span
        className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{ x: ['0%', '400%'] }}
        transition={{ duration: isGenerating ? 0.9 : 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: isGenerating ? 0 : 2 }}
      />
      <motion.span
        animate={isGenerating ? { rotate: 360 } : { rotate: 0 }}
        transition={isGenerating ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
        className="relative"
      >
        <Sparkles className="h-5 w-5" />
      </motion.span>
      <span className="relative">{isGenerating ? 'Подбираем блюда…' : hasMenu ? 'Пересобрать меню' : 'Сгенерировать меню'}</span>
    </motion.button>
  );
}
