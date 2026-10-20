import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChefHat, CloudOff, Download, Refrigerator, Salad, ShoppingBasket, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { useShoppingList } from '@/features/shopping-list';
import { ROUTES } from '@/shared/config';
import { cn, useInstallPrompt, useOnlineStatus } from '@/shared/lib';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

function useNavItems(): NavItem[] {
  const { total, done } = useShoppingList();
  return [
    { to: ROUTES.menu, label: 'Меню', icon: CalendarDays },
    { to: ROUTES.dishes, label: 'Блюда', icon: ChefHat },
    { to: ROUTES.sides, label: 'Гарниры', icon: Salad },
    { to: ROUTES.pantry, label: 'Запасы', icon: Refrigerator },
    { to: ROUTES.shopping, label: 'Покупки', icon: ShoppingBasket, badge: total - done },
    { to: ROUTES.settings, label: 'Настройки', icon: SlidersHorizontal },
  ];
}

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

function CountBadge({ value, className }: { value?: number; className?: string }) {
  // AnimatePresence only handles the badge appearing/disappearing. Keying the badge itself by value
  // would keep the old and the new badge mounted side by side during the exit, widening the tab.
  return (
    <AnimatePresence>
      {value !== undefined && value > 0 && (
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 25 }}
          className={cn(
            'flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold tabular-nums text-white',
            className,
          )}
        >
          {/* A changed number just pops in place. */}
          <motion.span
            key={value}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 25 }}
          >
            {value > 99 ? '99+' : value}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function StatusCluster() {
  const online = useOnlineStatus();
  const { canInstall, install } = useInstallPrompt();
  return (
    <div className="flex items-center gap-2 md:order-last">
      <AnimatePresence>
        {!online && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white"
            title="Нет подключения к интернету. Всё работает: данные хранятся на устройстве."
          >
            <CloudOff className="h-3.5 w-3.5" />
            Офлайн
          </motion.span>
        )}
      </AnimatePresence>
      {canInstall && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => void install()}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
          title="Установить приложение на устройство"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Установить</span>
        </motion.button>
      )}
    </div>
  );
}

export function AppHeader() {
  const { pathname } = useLocation();
  const items = useNavItems();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-900/5 bg-cream-50/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <NavLink to={ROUTES.menu} className="group flex items-center gap-2.5">
            <motion.span
              whileHover={{ rotate: -12, scale: 1.08 }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-xl shadow-glow"
            >
              🍲
            </motion.span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-semibold text-ink-900">Меню недели</span>
              <span className="mt-1 text-[11px] font-medium text-ink-500">планировщик рациона</span>
            </span>
          </NavLink>

          <StatusCluster />

          <nav className="hidden items-center gap-1 rounded-2xl bg-white/70 p-1 shadow-soft ring-1 ring-ink-900/5 md:flex">
            {items.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={cn(
                    'relative flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 lg:px-4',
                    active ? 'text-white' : 'text-ink-700 hover:text-ink-900',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="desktop-nav-pill"
                      className="absolute inset-0 rounded-xl bg-ink-900"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    />
                  )}
                  <item.icon className="relative h-4 w-4" />
                  <span className="relative hidden lg:inline">{item.label}</span>
                  <CountBadge value={item.badge} className="relative" />
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-around rounded-3xl bg-ink-900/95 p-1 shadow-lift backdrop-blur-xl md:hidden">
        {items.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <NavLink key={item.to} to={item.to} className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl py-2">
              {active && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 rounded-2xl bg-white/10"
                  transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                />
              )}
              <span className="relative">
                <item.icon className={cn('h-5 w-5 transition-colors', active ? 'text-brand-300' : 'text-white/60')} />
                <CountBadge value={item.badge} className="absolute -right-3 -top-2" />
              </span>
              <span className={cn('relative max-w-full truncate px-0.5 text-[10px] font-semibold transition-colors', active ? 'text-white' : 'text-white/60')}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
