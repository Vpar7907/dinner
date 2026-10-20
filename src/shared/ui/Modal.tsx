import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib';
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

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
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
            className="absolute inset-0 bg-ink-900/50"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={{
              hidden: { opacity: 0, y: 40, scale: 0.96 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'relative flex max-h-[92vh] supports-[height:100dvh]:max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-4xl bg-white shadow-lift sm:rounded-4xl',
              widths[size],
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-ink-900/5 px-6 pb-4 pt-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
              </div>
              <IconButton label="Закрыть" onClick={onClose}>
                <X className="h-5 w-5" />
              </IconButton>
            </header>
            {/* On phones the modal is a bottom sheet: its last block keeps clear of the iPhone home indicator. */}
            <div
              className={cn(
                'scrollbar-thin flex-1 overflow-y-auto px-6 py-5',
                !footer && 'pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] sm:pb-5',
              )}
            >
              {children}
            </div>
            {footer && (
              <footer className="flex flex-wrap justify-end gap-2 border-t border-ink-900/5 bg-cream-50/60 px-6 pb-[calc(1rem_+_env(safe-area-inset-bottom))] pt-4 sm:pb-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
