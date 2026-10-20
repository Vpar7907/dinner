import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  hidden?: boolean;
  /** Draws a divider above the item. */
  separated?: boolean;
}

export interface DropdownMenuProps {
  items: DropdownItem[];
  label?: string;
  /** Notifies the parent so it can raise its z-index while the menu is open. */
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
}

export function DropdownMenu({ items, label = 'Действия', onOpenChange, triggerClassName }: DropdownMenuProps) {
  const [open, setOpenState] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const setOpen = (value: boolean) => {
    setOpenState(value);
    onOpenChange?.(value);
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
    // setOpen is stable enough for this listener's lifetime
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = items.filter((item) => !item.hidden);

  return (
    <div ref={rootRef} className="relative" onClick={(event) => event.stopPropagation()}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-200',
          open ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-900/5 hover:text-ink-900',
          triggerClassName,
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="absolute right-0 top-full z-30 mt-1.5 w-56 origin-top-right rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-ink-900/10"
          >
            {visible.map((item, index) => (
              <div key={item.label}>
                {item.separated && index > 0 && <div className="my-1 h-px bg-ink-900/5" />}
                <motion.button
                  type="button"
                  role="menuitem"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.025 }}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors',
                    item.tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-ink-700 hover:bg-cream-100 hover:text-ink-900',
                  )}
                >
                  {item.icon && <span className="flex h-4 w-4 items-center justify-center">{item.icon}</span>}
                  {item.label}
                </motion.button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
