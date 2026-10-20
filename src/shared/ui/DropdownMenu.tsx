import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  triggerClassName?: string;
}

const MENU_WIDTH = 224;
const GAP = 6;
/** Room kept free at the bottom of the screen: the mobile tab bar and the home indicator. */
const BOTTOM_RESERVE = 96;

/**
 * The menu is rendered in a portal with fixed positioning: it never gets clipped or covered by
 * neighbouring cards, and opening it does not re-render (or re-layer) the card it belongs to.
 */
export function DropdownMenu({ items, label = 'Действия', triggerClassName }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visible = items.filter((item) => !item.hidden);

  // Placed before paint: below the trigger, or above it when there is not enough room.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const height = menuRef.current?.offsetHeight ?? visible.length * 40 + 12;
    const right = Math.max(8, window.innerWidth - rect.right);
    const fitsBelow = rect.bottom + GAP + height <= window.innerHeight - BOTTOM_RESERVE;
    setPosition(
      fitsBelow
        ? { top: rect.bottom + GAP, right, transformOrigin: 'top right' }
        : { bottom: window.innerHeight - rect.top + GAP, right, transformOrigin: 'bottom right' },
    );
  }, [open, visible.length]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) close();
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close();
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    // A fixed menu would drift away from its trigger while the page scrolls.
    window.addEventListener('scroll', close, { passive: true, capture: true });
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-200 active:scale-90',
          open ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-900/5 hover:text-ink-900',
          triggerClassName,
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{ ...position, width: MENU_WIDTH }}
              onClick={(event) => event.stopPropagation()}
              className="fixed z-[45] rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-ink-900/10"
            >
              {visible.map((item, index) => (
                <div key={item.label}>
                  {item.separated && index > 0 && <div className="my-1 h-px bg-ink-900/5" />}
                  <button
                    type="button"
                    role="menuitem"
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
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
