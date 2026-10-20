import { useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, Download, Trash2, Upload } from 'lucide-react';
import { useDishStore } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { usePantryStore } from '@/entities/pantry';
import { SLOT_ORDER, useMenuStore } from '@/entities/menu';
import { normalizeText, plural, pluralWithCount } from '@/shared/lib';
import { ImportError } from '@/shared/api';
import { Button, Input, Modal, toast } from '@/shared/ui';
import { applyImport, readImportFile, type ImportMode, type ImportPreview } from '../model/importData';
import { ImportDialog } from './ImportDialog';
import { useDataActions } from '../model/useDataActions';

const CONFIRM_WORD = 'удалить';

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-cream-50 px-4 py-3 ring-1 ring-ink-900/5">
      <p className="font-display text-xl font-semibold tabular-nums text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}

/** Export of all data to a JSON file and a guarded "delete everything". */
export function DataManagement() {
  const dishes = useDishStore((s) => s.dishes.length);
  const sides = useSideDishStore((s) => s.sides.length);
  const pantry = usePantryStore((s) => s.items.length);
  const meals = useMenuStore((s) => SLOT_ORDER.filter((key) => s.menu.slots[key].dishId).length);
  const { exportAll, clearAll, busy } = useDataActions();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [exported, setExported] = useState(false);
  const confirmed = normalizeText(typed) === CONFIRM_WORD;

  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);

  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // the same file can be chosen again
    if (!file) return;
    try {
      setPreview(await readImportFile(file));
    } catch (error) {
      if (error instanceof ImportError) toast.error('Не удалось прочитать файл', error.message);
      else {
        console.error(error);
        toast.error('Не удалось прочитать файл');
      }
    }
  };

  const runImport = async (mode: ImportMode) => {
    if (!preview) return;
    setImporting(true);
    try {
      const result = await applyImport(preview, mode);
      setPreview(null);
      if (result.mode === 'replace') {
        toast.success('Данные восстановлены из файла', preview.fileName);
      } else {
        const parts = [
          `добавлено: ${result.added}`,
          result.updated > 0 ? `обновлено: ${result.updated}` : null,
          result.kept > 0 ? `без изменений: ${result.kept}` : null,
        ].filter(Boolean);
        toast.success('Импорт завершён', parts.join(', '));
      }
    } catch (error) {
      console.error(error);
      toast.error('Импорт не удался', 'Данные на устройстве не изменились.');
    } finally {
      setImporting(false);
    }
  };

  const openConfirm = () => {
    setTyped('');
    setExported(false);
    setConfirmOpen(true);
  };

  const confirmClear = async () => {
    setConfirmOpen(false);
    await clearAll();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Count value={dishes} label={plural(dishes, ['блюдо', 'блюда', 'блюд'])} />
        <Count value={sides} label={plural(sides, ['гарнир', 'гарнира', 'гарниров'])} />
        <Count value={pantry} label={`${plural(pantry, ['продукт', 'продукта', 'продуктов'])} в запасах`} />
        <Count value={meals} label={`${plural(meals, ['приём', 'приёма', 'приёмов'])} пищи в меню`} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-sage-50/70 p-4 ring-1 ring-sage-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-ink-900">Экспорт всех данных</p>
          <p className="text-xs text-ink-500">Один JSON-файл: блюда, гарниры, запасы, меню и настройки. Работает без интернета.</p>
        </div>
        <Button variant="secondary" icon={<Download className="h-4 w-4" />} loading={busy === 'export'} onClick={() => void exportAll()}>
          Скачать файл
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-brand-50/60 p-4 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-ink-900">Импорт из файла</p>
          <p className="text-xs text-ink-500">Загрузите ранее скачанный файл: объедините с текущими данными или восстановите копию целиком.</p>
        </div>
        <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => fileInput.current?.click()}>
          Выбрать файл
        </Button>
        <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={(e) => void pickFile(e)} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-red-50/60 p-4 ring-1 ring-red-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-red-700">Очистить все данные</p>
          <p className="text-xs text-ink-500">Удаляет блюда, гарниры, запасы и меню на этом устройстве. Отменить нельзя.</p>
        </div>
        <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} loading={busy === 'clear'} onClick={openConfirm}>
          Очистить всё
        </Button>
      </div>

      <ImportDialog
        preview={preview}
        busy={importing}
        onConfirm={(mode) => void runImport(mode)}
        onBackup={exportAll}
        onClose={() => !importing && setPreview(null)}
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Удалить все данные?"
        subtitle="Это действие нельзя отменить"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} disabled={!confirmed} onClick={() => void confirmClear()}>
              Удалить всё
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-2xl bg-red-50 p-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Будут удалены {pluralWithCount(dishes, ['блюдо', 'блюда', 'блюд'])}, {pluralWithCount(sides, ['гарнир', 'гарнира', 'гарниров'])},{' '}
              {pluralWithCount(pantry, ['продукт', 'продукта', 'продуктов'])} из запасов и текущее меню. Демо-данные заново не появятся.
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            loading={busy === 'export'}
            onClick={() => void exportAll().then((ok) => ok && setExported(true))}
          >
            {exported ? 'Копия скачана ✓' : 'Сначала скачать копию'}
          </Button>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-500">
              Чтобы подтвердить, введите слово <b className="text-ink-900">{CONFIRM_WORD}</b>
            </span>
            <Input
              value={typed}
              autoComplete="off"
              placeholder={CONFIRM_WORD}
              onChange={(event) => setTyped(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && confirmed && void confirmClear()}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
