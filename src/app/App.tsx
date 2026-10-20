import { MotionConfig } from 'framer-motion';
import { AppInitializer } from './providers/AppInitializer';
import { AppRouter } from './providers/AppRouter';
import { PwaManager } from './providers/PwaManager';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppInitializer>
        <AppRouter />
      </AppInitializer>
      <PwaManager />
    </MotionConfig>
  );
}
