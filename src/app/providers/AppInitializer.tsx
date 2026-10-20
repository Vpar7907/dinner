import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from '@/shared/ui';
import { initializeApp } from '../init/initializeApp';

type State = 'loading' | 'ready' | 'error';

function Splash() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-cream-50"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0], y: [0, -8, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-4xl shadow-glow"
      >
        🍲
      </motion.div>
      <p className="font-display text-lg font-semibold text-ink-900">Готовим ваше меню…</p>
    </motion.div>
  );
}

export function AppInitializer({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    let cancelled = false;
    initializeApp()
      .then(({ seeded, addedCourses }) => {
        if (cancelled) return;
        setState('ready');
        if (seeded) {
          toast.success('Добро пожаловать!', 'Мы добавили демо-блюда и гарниры и собрали первое меню.');
        } else if (addedCourses) {
          toast.info('Новое: завтраки и салаты', 'В базу добавлены демо-блюда — включите их в меню над календарём.');
        }
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-50 px-6 text-center">
        <span className="text-5xl">😔</span>
        <h1 className="font-display text-xl font-semibold text-ink-900">Не удалось открыть базу данных</h1>
        <p className="max-w-md text-sm text-ink-500">
          Приложение хранит данные в IndexedDB вашего браузера. Проверьте, что вы не в режиме инкогнито с запретом хранилища, и
          обновите страницу.
        </p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>{state === 'loading' && <Splash />}</AnimatePresence>
      {state === 'ready' && children}
    </>
  );
}
