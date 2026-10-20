import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Download, FileJson, GitMerge, RefreshCcw, Upload } from 'lucide-react';
import { cn, pluralWithCount } from '@/shared/lib';
import { Button, Modal } from '@/shared/ui';
import type { ImportMode, ImportPreview } from '../model/importData';

export interface ImportDialogProps {
  preview: ImportPreview | null;
  busy: boolean;
  onConfirm: (mode: ImportMode) => void;
  onBackup: () => Promise<boolean>;
  onClose: () => void;
}

const MODES: { mode: ImportMode; icon: typeof GitMerge; title: string; text: string }[] = [
  {
    mode: 'merge',
    icon: GitMerge,
    title: 'Объединить',
    text: 'Новые блюда, гарниры и запасы добавятся, более свежие версии заменят старые. Текущее меню останется, свои покупки из файла добавятся в список.',
  },
  {
    mode: 'replace',
    icon: RefreshCcw,
    title: 'Заменить всё',
    text: 'Данные на устройстве будут полностью заменены содержимым файла — как восстановление из резервной копии.',
  },
];

export function ImportDialog({ preview, busy, onConfirm, onBackup, onClose }: ImportDialogProps) {
  const [mode, setMode] = useState<ImportMode>('merge');
  const [backedUp, setBackedUp] = useState(false);

  useEffect(() => {
    if (!preview) return;
    setMode('merge');
    setBackedUp(false);
  }, [preview]);

  const c = preview?.counts;
  const summary = c
    ? [
        pluralWithCount(c.dishes, ['блюдо', 'блюда', 'блюд']),
        pluralWithCount(c.sides, ['гарнир', 'гарнира', 'гарниров']),
        `${pluralWithCount(c.pantry, ['продукт', 'продукта', 'продуктов'])} в запасах`,
        `меню: ${pluralWithCount(c.meals, ['приём', 'приёма', 'приёмов'])} пищи`,
        c.extras > 0 ? pluralWithCount(c.extras, ['своя покупка', 'свои покупки', 'своих покупок']) : null,
      ].filter(Boolean)
    : [];

  return (
    <Modal
      open={preview !== null}
      onClose={onClose}
      title="Импорт данных"
      subtitle="Проверьте содержимое файла и выберите, как его применить"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant={mode === 'replace' ? 'danger' : 'primary'}
            icon={<Upload className="h-4 w-4" />}
            loading={busy}
            onClick={() => onConfirm(mode)}
          >
            {mode === 'replace' ? 'Заменить данные' : 'Импортировать'}
          </Button>
        </>
      }
    >
      {preview && (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-2xl bg-cream-100/70 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600">
              <FileJson className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-900">{preview.fileName}</p>
              <p className="text-xs text-ink-500">
                {preview.exportedAt
                  ? `Экспорт от ${preview.exportedAt.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}`
                  : 'Дата экспорта не указана'}
              </p>
              <p className="mt-1 text-xs text-ink-700">{summary.join(' · ')}</p>
              {preview.skipped > 0 && (
                <p className="mt-1 text-xs font-medium text-amber-600">
                  {pluralWithCount(preview.skipped, ['запись пропущена', 'записи пропущены', 'записей пропущено'])} — повреждены или неполные.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            {MODES.map(({ mode: value, icon: Icon, title, text }) => {
              const active = mode === value;
              return (
                <motion.button
                  key={value}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(value)}
                  aria-pressed={active}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl p-4 text-left ring-1 transition-colors duration-200',
                    active
                      ? value === 'replace'
                        ? 'bg-red-50 ring-2 ring-red-400'
                        : 'bg-brand-50 ring-2 ring-brand-400'
                      : 'bg-white ring-ink-900/10 hover:bg-cream-50',
                  )}
                >
                  <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', value === 'replace' ? 'text-red-500' : 'text-brand-600')} />
                  <span>
                    <span className="block text-sm font-bold text-ink-900">{title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{text}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          {mode === 'replace' && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 rounded-2xl bg-red-50 p-3">
              <p className="flex gap-2 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Текущие блюда, гарниры, запасы и меню на этом устройстве будут удалены.
              </p>
              <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => void onBackup().then((ok) => ok && setBackedUp(true))}>
                {backedUp ? 'Копия текущих данных скачана ✓' : 'Сначала скачать копию текущих данных'}
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </Modal>
  );
}
