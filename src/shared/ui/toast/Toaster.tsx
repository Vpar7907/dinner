import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib';
import { useToastStore, type ToastTone } from './store';

const toneMeta: Record<ToastTone, { icon: LucideIcon; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-sage-400' },
  info: { icon: Info, className: 'text-sky-400' },
  warning: { icon: AlertTriangle, className: 'text-amber-400' },
  error: { icon: XCircle, className: 'text-red-400' },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem_+_env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
      <AnimatePresence initial={false}>
        {toasts.map((item) => {
          const { icon: Icon, className } = toneMeta[item.tone];
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink-900 px-4 py-3 text-white shadow-lift"
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', className)} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs text-white/70">{item.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(item.id)} className="text-white/50 hover:text-white" aria-label="Закрыть">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
