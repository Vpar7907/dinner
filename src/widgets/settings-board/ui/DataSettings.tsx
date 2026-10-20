import { motion } from 'framer-motion';
import { DataManagement } from '@/features/manage-data';
import { SettingsSubpage } from './SettingsSubpage';

export function DataSettings() {
  return (
    <SettingsSubpage title="Данные">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-900/5 sm:p-6"
      >
        <DataManagement />
      </motion.div>
    </SettingsSubpage>
  );
}
