import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { requestPersistentStorage } from '@/shared/lib';
import { Button, toast } from '@/shared/ui';

/** Checks for a new version every hour while the app is open. */
const UPDATE_INTERVAL = 60 * 60 * 1000;

/**
 * Registers the service worker that precaches the whole app, reports when it
 * is ready to work offline and lets the user apply updates when convenient.
 */
export function PwaManager() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      window.setInterval(() => {
        if (registration.installing || !navigator.onLine) return;
        void fetch(swUrl, { cache: 'no-store' })
          .then((response) => {
            if (response.status === 200) return registration.update();
          })
          .catch(() => undefined);
      }, UPDATE_INTERVAL);
    },
    onRegisterError(error) {
      console.warn('Service worker не зарегистрирован — офлайн-режим недоступен', error);
    },
  });

  useEffect(() => {
    void requestPersistentStorage();
  }, []);

  useEffect(() => {
    if (!offlineReady) return;
    toast.success('Готово к работе офлайн', 'Приложение сохранено на устройстве и откроется без интернета.');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          role="status"
          className="fixed inset-x-3 bottom-[calc(6rem_+_env(safe-area-inset-bottom))] z-[65] mx-auto flex max-w-md items-center gap-3 rounded-3xl bg-ink-900 p-3 pl-4 text-white shadow-lift sm:bottom-6"
        >
          <RefreshCw className="h-5 w-5 shrink-0 text-brand-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Доступна новая версия</p>
            <p className="text-xs text-white/60">Данные сохранятся — обновится только приложение.</p>
          </div>
          <Button size="sm" variant="ghost" className="text-white/70 hover:bg-white/10" onClick={() => setNeedRefresh(false)}>
            Позже
          </Button>
          <Button size="sm" onClick={() => void updateServiceWorker(true)}>
            Обновить
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
