import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { MenuPage } from '@/pages/menu';
import { DishesPage } from '@/pages/dishes';
import { SidesPage } from '@/pages/sides';
import { ShoppingPage } from '@/pages/shopping';
import { PantryPage } from '@/pages/pantry';
import { SettingsPage } from '@/pages/settings';
import { SettingsLimitsPage } from '@/pages/settings-limits';
import { SettingsDataPage } from '@/pages/settings-data';
import { SettingsCaloriesPage } from '@/pages/settings-calories';
import { AppHeader } from '@/widgets/app-header';
import { ROUTES } from '@/shared/config';
import { Toaster } from '@/shared/ui';

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-7xl px-4 pb-[calc(8rem_+_env(safe-area-inset-bottom))] pt-8 sm:px-6 md:pb-16 lg:px-8"
      >
        <Routes location={location}>
          <Route path={ROUTES.menu} element={<MenuPage />} />
          <Route path={ROUTES.dishes} element={<DishesPage />} />
          <Route path={ROUTES.sides} element={<SidesPage />} />
          <Route path={ROUTES.pantry} element={<PantryPage />} />
          <Route path={ROUTES.shopping} element={<ShoppingPage />} />
          <Route path={ROUTES.settings} element={<SettingsPage />} />
          <Route path={ROUTES.settingsLimits} element={<SettingsLimitsPage />} />
          {/* Side dishes used to live in Settings; the old address keeps working. */}
          <Route path={ROUTES.settingsSides} element={<Navigate to={ROUTES.sides} replace />} />
          <Route path={ROUTES.settingsData} element={<SettingsDataPage />} />
          <Route path={ROUTES.settingsCalories} element={<SettingsCaloriesPage />} />
          <Route path="*" element={<Navigate to={ROUTES.menu} replace />} />
        </Routes>
      </motion.main>
    </AnimatePresence>
  );
}

/** Hash routing keeps the app fully static: it works from any file host without server rewrites. */
export function AppRouter() {
  return (
    <HashRouter>
      <div className="min-h-screen">
        <AppHeader />
        <AnimatedRoutes />
      </div>
      <Toaster />
    </HashRouter>
  );
}
