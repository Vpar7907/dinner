import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * Low-level IndexedDB access. The shared layer knows nothing about domain
 * types: every store holds records with a string `id`, and entities bind
 * their own types through `createRepository<T>()`.
 */

const DB_NAME = 'weekly-menu-planner';
const DB_VERSION = 2;

export type StoreName = 'dishes' | 'sides' | 'menus' | 'pantry';

export interface Identifiable {
  id: string;
}

interface MetaRecord {
  key: string;
  value: unknown;
}

interface PlannerDB extends DBSchema {
  dishes: { key: string; value: Identifiable };
  sides: { key: string; value: Identifiable };
  menus: { key: string; value: Identifiable };
  pantry: { key: string; value: Identifiable };
  meta: { key: string; value: MetaRecord };
}

let dbPromise: Promise<IDBPDatabase<PlannerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<PlannerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PlannerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('dishes')) db.createObjectStore('dishes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sides')) db.createObjectStore('sides', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('menus')) db.createObjectStore('menus', { keyPath: 'id' });
        // v2: ingredients the user already has at home
        if (!db.objectStoreNames.contains('pantry')) db.createObjectStore('pantry', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export interface Repository<T extends Identifiable> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  put(item: T): Promise<T>;
  putMany(items: T[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
  count(): Promise<number>;
}

export function createRepository<T extends Identifiable>(store: StoreName): Repository<T> {
  return {
    async getAll() {
      const db = await getDB();
      return (await db.getAll(store)) as T[];
    },
    async getById(id) {
      const db = await getDB();
      return (await db.get(store, id)) as T | undefined;
    },
    async put(item) {
      const db = await getDB();
      await db.put(store, item);
      return item;
    },
    async putMany(items) {
      const db = await getDB();
      const tx = db.transaction(store, 'readwrite');
      await Promise.all([...items.map((item) => tx.store.put(item)), tx.done]);
    },
    async remove(id) {
      const db = await getDB();
      await db.delete(store, id);
    },
    async clear() {
      const db = await getDB();
      await db.clear(store);
    },
    async count() {
      const db = await getDB();
      return db.count(store);
    },
  };
}

export async function getMeta<V>(key: string): Promise<V | undefined> {
  const db = await getDB();
  const record = await db.get('meta', key);
  return record?.value as V | undefined;
}

export async function setMeta<V>(key: string, value: V): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key, value });
}

const DATA_STORES: StoreName[] = ['dishes', 'sides', 'menus', 'pantry'];

export interface DatabaseDump {
  app: typeof DB_NAME;
  schemaVersion: number;
  exportedAt: string;
  stores: Record<StoreName, Identifiable[]>;
  meta: { key: string; value: unknown }[];
}

/** Reads every store in one transaction, so the snapshot is consistent. */
export async function exportDatabase(): Promise<DatabaseDump> {
  const db = await getDB();
  const tx = db.transaction([...DATA_STORES, 'meta'], 'readonly');
  const [dishes, sides, menus, pantry, meta] = await Promise.all([
    tx.objectStore('dishes').getAll(),
    tx.objectStore('sides').getAll(),
    tx.objectStore('menus').getAll(),
    tx.objectStore('pantry').getAll(),
    tx.objectStore('meta').getAll(),
  ]);
  await tx.done;
  return {
    app: DB_NAME,
    schemaVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    stores: { dishes, sides, menus, pantry },
    meta,
  };
}

/**
 * Deletes all user data in one transaction. Service flags in `meta` (such as
 * "demo data already added") are kept so the demo set does not come back.
 */
export async function clearDatabase(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(DATA_STORES, 'readwrite');
  await Promise.all([...DATA_STORES.map((store) => tx.objectStore(store).clear()), tx.done]);
}

export class ImportError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Parses and structurally validates an exported file. Records without a string
 * `id` are dropped (and counted); domain-level checks are left to the caller.
 */
export function parseDump(text: string): { dump: DatabaseDump; dropped: number } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError('Файл повреждён или это не JSON.');
  }
  if (!isRecord(raw) || raw.app !== DB_NAME || !isRecord(raw.stores)) {
    throw new ImportError('Это не файл экспорта «Меню недели».');
  }
  const schemaVersion = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (schemaVersion > DB_VERSION) {
    throw new ImportError('Файл создан более новой версией приложения — обновите приложение и повторите.');
  }
  const rawStores = raw.stores;
  let dropped = 0;
  const stores = Object.fromEntries(
    DATA_STORES.map((name) => {
      const list = Array.isArray(rawStores[name]) ? (rawStores[name] as unknown[]) : [];
      const valid = list.filter((item): item is Identifiable => isRecord(item) && typeof item.id === 'string' && item.id.length > 0);
      dropped += list.length - valid.length;
      return [name, valid];
    }),
  ) as Record<StoreName, Identifiable[]>;
  return {
    dump: {
      app: DB_NAME,
      schemaVersion,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      stores,
      meta: [],
    },
    dropped,
  };
}

/** Replaces all user data with the given records in one transaction (all or nothing). */
export async function replaceDatabase(stores: Record<StoreName, Identifiable[]>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(DATA_STORES, 'readwrite');
  await Promise.all(DATA_STORES.map((name) => tx.objectStore(name).clear()));
  await Promise.all([...DATA_STORES.flatMap((name) => stores[name].map((item) => tx.objectStore(name).put(item))), tx.done]);
}

export interface MergeStats {
  added: number;
  updated: number;
  kept: number;
}

/**
 * Adds records that do not exist yet; for existing ids the newer version wins
 * (by `updatedAt`, when both records have it). One transaction for all stores.
 */
export async function mergeIntoDatabase(stores: Partial<Record<StoreName, Identifiable[]>>): Promise<MergeStats> {
  const names = DATA_STORES.filter((name) => stores[name]?.length);
  const stats: MergeStats = { added: 0, updated: 0, kept: 0 };
  if (names.length === 0) return stats;
  const db = await getDB();
  const tx = db.transaction(names, 'readwrite');
  for (const name of names) {
    const store = tx.objectStore(name);
    for (const item of stores[name]!) {
      const existing = (await store.get(item.id)) as (Identifiable & { updatedAt?: unknown }) | undefined;
      const incoming = item as Identifiable & { updatedAt?: unknown };
      if (!existing) {
        await store.put(item);
        stats.added += 1;
      } else if (typeof incoming.updatedAt === 'number' && typeof existing.updatedAt === 'number' && incoming.updatedAt > existing.updatedAt) {
        await store.put(item);
        stats.updated += 1;
      } else {
        stats.kept += 1;
      }
    }
  }
  await tx.done;
  return stats;
}
