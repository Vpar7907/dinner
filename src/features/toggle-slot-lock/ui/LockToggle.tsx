import { AnimatePresence, motion } from 'framer-motion';
import { Lock, LockOpen } from 'lucide-react';
import { useMenuStore, type SlotKey } from '@/entities/menu';
import { cn } from '@/shared/lib';

export interface LockToggleProps {
  slotKey: SlotKey;
  className?: string;
}

export function LockToggle({ slotKey, className }: LockToggleProps) {
  const locked = useMenuStore((s) => s.menu.slots[slotKey].locked);
  const toggleLock = useMenuStore((s) => s.toggleLock);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(event) => {
        event.stopPropagation();
        void toggleLock(slotKey);
      }}
      aria-pressed={locked}
      aria-label={locked ? 'Открепить блюдо' : 'Закрепить блюдо'}
      title={locked ? 'Закреплено: генератор не изменит этот слот' : 'Закрепить, чтобы генератор не менял слот'}
      className={cn(
        'relative inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-200',
        locked ? 'bg-ink-900 text-white shadow-soft' : 'text-ink-300 hover:bg-ink-900/5 hover:text-ink-700',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={locked ? 'locked' : 'open'}
          initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.4, rotate: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 28 }}
        >
          {locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
