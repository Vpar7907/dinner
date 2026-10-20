import { useDishStore } from '@/entities/dish';
import { useSideDishStore } from '@/entities/side-dish';
import { usePantryStore } from '@/entities/pantry';
import { SLOT_ORDER, useMenuStore, type ExtraShoppingItem, type WeeklyMenu } from '@/entities/menu';
import { ImportError, mergeIntoDatabase, parseDump, replaceDatabase, type DatabaseDump, type Identifiable, type StoreName } from '@/shared/api';

export type ImportMode = 'merge' | 'replace';

export interface ImportPreview {
  fileName: string;
  exportedAt: Date | null;
  stores: Record<StoreName, Identifiable[]>;
  counts: { dishes: number; sides: number; pantry: number; meals: number; extras: number };
  /** Records dropped because they do not look like valid data. */
  skipped: number;
}

export interface ImportResult {
  mode: ImportMode;
  added: number;
  updated: number;
  kept: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Loose = Identifiable & Record<string, unknown>;
const hasName = (r: Loose) => typeof r.name === 'string' && r.name.trim().length > 0;

const VALIDATORS: Record<StoreName, (record: Loose) => boolean> = {
  dishes: (r) => hasName(r) && Array.isArray(r.ingredients),
  sides: (r) => hasName(r) && Array.isArray(r.ingredients),
  pantry: (r) => hasName(r) && typeof r.unit === 'string',
  menus: (r) => r.id === 'active' && typeof r.slots === 'object' && r.slots !== null,
};

function validExtras(menu: WeeklyMenu | undefined): ExtraShoppingItem[] {
  if (!menu || !Array.isArray(menu.extraItems)) return [];
  return menu.extraItems.filter(
    (item) => typeof item?.id === 'string' && typeof item.name === 'string' && item.name.trim() && typeof item.unit === 'string',
  );
}

/** Keeps only well-formed ingredient rows, so a hand-edited file cannot break the UI. */
function cleanIngredients(record: Loose): Loose {
  const list = Array.isArray(record.ingredients) ? (record.ingredients as Record<string, unknown>[]) : [];
  return {
    ...record,
    ingredients: list.filter(
      (i) => i && typeof i.id === 'string' && typeof i.name === 'string' && typeof i.unit === 'string' && Number.isFinite(i.amount),
    ),
  };
}

function cleanMenu(menu: WeeklyMenu): WeeklyMenu {
  return {
    ...menu,
    extraItems: validExtras(menu),
    checkedItems: Array.isArray(menu.checkedItems) ? menu.checkedItems.filter((k) => typeof k === 'string') : [],
  };
}

/** Reads a file chosen by the user and checks that it is a valid export. Throws ImportError with a readable message. */
export async function readImportFile(file: File): Promise<ImportPreview> {
  if (file.size > MAX_FILE_SIZE) throw new ImportError('Файл слишком большой для экспорта «Меню недели» (больше 10 МБ).');
  const parsed: { dump: DatabaseDump; dropped: number } = parseDump(await file.text());
  const { dump } = parsed;

  let skipped = parsed.dropped;
  const stores = Object.fromEntries(
    (Object.keys(VALIDATORS) as StoreName[]).map((name) => {
      const valid = dump.stores[name].filter((record) => VALIDATORS[name](record as Loose));
      skipped += dump.stores[name].length - valid.length;
      if (name === 'dishes' || name === 'sides') return [name, valid.map((r) => cleanIngredients(r as Loose))];
      if (name === 'menus') return [name, valid.map((r) => cleanMenu(r as unknown as WeeklyMenu))];
      return [name, valid];
    }),
  ) as Record<StoreName, Identifiable[]>;

  const menu = stores.menus[0] as WeeklyMenu | undefined;
  const counts = {
    dishes: stores.dishes.length,
    sides: stores.sides.length,
    pantry: stores.pantry.length,
    meals: menu ? SLOT_ORDER.filter((key) => menu.slots?.[key]?.dishId).length : 0,
    extras: validExtras(menu).length,
  };
  if (counts.dishes + counts.sides + counts.pantry + counts.meals + counts.extras === 0) {
    throw new ImportError('В файле нет данных для импорта.');
  }

  const exportedAt = dump.exportedAt ? new Date(dump.exportedAt) : null;
  return {
    fileName: file.name,
    exportedAt: exportedAt && !Number.isNaN(exportedAt.getTime()) ? exportedAt : null,
    stores,
    counts,
    skipped,
  };
}

async function reloadStores() {
  await Promise.all([
    useDishStore.getState().load(),
    useSideDishStore.getState().load(),
    usePantryStore.getState().load(),
    useMenuStore.getState().load(),
  ]);
}

/**
 * replace — the device gets exactly the data from the file (backup restore);
 * merge   — new dishes, sides and pantry items are added, newer versions replace
 *           older ones, the current menu stays and imported extra purchases are appended.
 */
export async function applyImport(preview: ImportPreview, mode: ImportMode): Promise<ImportResult> {
  if (mode === 'replace') {
    await replaceDatabase(preview.stores);
    await reloadStores();
    const total = preview.counts.dishes + preview.counts.sides + preview.counts.pantry;
    return { mode, added: total, updated: 0, kept: 0 };
  }

  const stats = await mergeIntoDatabase({
    dishes: preview.stores.dishes,
    sides: preview.stores.sides,
    pantry: preview.stores.pantry,
  });
  await reloadStores();
  const extrasAdded = await useMenuStore.getState().mergeExtras(validExtras(preview.stores.menus[0] as WeeklyMenu | undefined));
  return { mode, added: stats.added + extrasAdded, updated: stats.updated, kept: stats.kept };
}
