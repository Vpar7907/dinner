import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', callback);
      return () => list.removeEventListener('change', callback);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

let scrollLocks = 0;

/**
 * Locks page scrolling while at least one modal is open. Counted, so two modals swapping
 * (one closing while the next opens) never unlock the page in between.
 */
export function lockPageScroll(): () => void {
  scrollLocks += 1;
  if (scrollLocks === 1) {
    document.body.style.overflow = 'hidden';
    // No pull-to-refresh or scroll chaining to the page behind the sheet (Chrome on Android).
    document.documentElement.style.overscrollBehavior = 'none';
  }
  return () => {
    scrollLocks -= 1;
    if (scrollLocks === 0) {
      document.body.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
    }
  };
}
