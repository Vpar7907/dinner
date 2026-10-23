import changelogSource from '../../../CHANGELOG.md?raw';

/** Version of the running build, from package.json (injected by Vite). */
export const APP_VERSION: string = __APP_VERSION__;

export interface Release {
  version: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  changes: string[];
}

const RELEASE_HEADING = /^##\s+\[?v?(\d+\.\d+\.\d+)\]?\s*(?:[—–-]\s*(\d{4}-\d{2}-\d{2}))?\s*$/;
const LIST_ITEM = /^\s*[-*]\s+(.*)$/;

/**
 * Parses CHANGELOG.md: `## 1.2.0 — 2026-10-23` starts a release, `- …` items are its changes.
 * An indented line without a marker continues the previous item; everything else is ignored.
 */
export function parseChangelog(source: string): Release[] {
  const releases: Release[] = [];
  let current: Release | null = null;
  for (const line of source.split(/\r?\n/)) {
    const heading = RELEASE_HEADING.exec(line);
    if (heading) {
      current = { version: heading[1], date: heading[2] ?? '', changes: [] };
      releases.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith('#')) {
      current = null;
      continue;
    }
    const item = LIST_ITEM.exec(line);
    if (item) current.changes.push(item[1].trim());
    else if (/^\s+\S/.test(line) && current.changes.length > 0) {
      current.changes[current.changes.length - 1] += ` ${line.trim()}`;
    }
  }
  return releases;
}

/** Newest first, built from CHANGELOG.md in the repository root. */
export const CHANGELOG: Release[] = parseChangelog(changelogSource);

/** Releases newer than `version` (newest first); all of them for an unknown version. */
export function releasesSince(version: string | undefined): Release[] {
  const index = CHANGELOG.findIndex((release) => release.version === version);
  return index === -1 ? CHANGELOG : CHANGELOG.slice(0, index);
}

export function formatReleaseDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

if (import.meta.env.DEV && CHANGELOG[0]?.version !== APP_VERSION) {
  console.warn(`CHANGELOG.md: нет записи для версии ${APP_VERSION} из package.json`);
}
