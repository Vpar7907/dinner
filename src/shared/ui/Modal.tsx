import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Transition, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { cn, lockPageScroll, useMediaQuery } from '@/shared/lib';
import { IconButton } from './IconButton';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

/**
 * Phones: the sheet only slides (a pure transform, no scale or opacity), so Chrome on Android
 * moves an already rasterized layer instead of repainting the rounded, clipped sheet every frame.
 */
const sheetVariants: Variants = {
  hidden: { y: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
  visible: { y: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } },
};

const dialogVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};
const dialogTransition: Transition = { type: 'spring', stiffness: 380, damping: 32 };

interface ModalContent {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  // While closing, the sheet keeps showing what it had when it was open: callers often reset their
  // state on close (e.g. the slot becomes null), and the sheet would otherwise collapse mid-animation.
  const shown = useRef<ModalContent>({ title, subtitle, children, footer });
  if (open) shown.current = { title, subtitle, children, footer };
  const content = shown.current;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const unlock = lockPageScroll();
    window.addEventListener('keydown', onKey);
    return () => {
      unlock();
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-ink-900/50 will-change-[opacity]"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={content.title}
            variants={isDesktop ? dialogVariants : sheetVariants}
            transition={isDesktop ? dialogTransition : undefined}
            className={cn(
              // svh, not dvh: the small viewport height does not change while Android's address bar
              // slides in or out, so the sheet is not re-laid out mid-animation; it still fits the screen.
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-4xl bg-white will-change-transform [backface-visibility:hidden] supports-[height:100svh]:max-h-[92svh] sm:rounded-4xl sm:shadow-lift',
              widths[size],
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-ink-900/5 px-6 pb-4 pt-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">{content.title}</h2>
                {content.subtitle && <p className="mt-1 text-sm text-ink-500">{content.subtitle}</p>}
              </div>
              <IconButton label="Закрыть" onClick={onClose}>
                <X className="h-5 w-5" />
              </IconButton>
            </header>
            {/* On phones the modal is a bottom sheet: its last block keeps clear of the iPhone home indicator. */}
            <div
              className={cn(
                'scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-6 py-5',
                !content.footer && 'pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] sm:pb-5',
              )}
            >
              {content.children}
            </div>
            {content.footer && (
              <footer className="flex flex-wrap justify-end gap-2 border-t border-ink-900/5 bg-cream-50/60 px-6 pb-[calc(1rem_+_env(safe-area-inset-bottom))] pt-4 sm:pb-4">
                {content.footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
