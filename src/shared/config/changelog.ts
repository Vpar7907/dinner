/** Version of the running build, from package.json (injected by Vite). */
export const APP_VERSION: string = __APP_VERSION__;

export interface Release {
  version: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  changes: string[];
}

/**
 * Newest first. When releasing: bump "version" in package.json and add an entry here with the same
 * version — the settings page and the "what's new" dialog show it.
 */
export const CHANGELOG: Release[] = [
  {
    version: '1.2.0',
    date: '2026-10-23',
    changes: [
      'Число «раз в неделю» у блюда теперь строгое: генератор ставит блюдо ровно столько раз, подряд в соседние дни',
      'Окна снизу экрана больше не мелькают на Android',
      'Меню и переходы между разделами работают плавнее на Android',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-10-20',
    changes: [
      'Гарниры вынесены в отдельную вкладку',
      'Нажатие на блюдо в меню открывает его карточку с рецептом и ингредиентами',
      'Меню «⋯» у блюда больше не мелькает и не перекрывается соседними днями',
      'Анимации и модалки работают плавнее, особенно на телефонах',
      'Учёт калорий: цель или потолок на день, мягкий или жёсткий режим',
      'Модалки на iPhone не заходят под нижнюю полоску',
      'Список изменений и номер версии в настройках',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-20',
    changes: [
      'Генератор меню на неделю: чередование белка, повторы в соседние дни, подбор гарниров',
      'База блюд и гарниров с ингредиентами, лимитами и рецептами',
      'Запасы и список покупок с учётом того, что уже есть дома',
      'Экспорт, импорт и очистка данных',
      'Работа без интернета и установка на телефон',
    ],
  },
];

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
  console.warn(`changelog.ts: нет записи для версии ${APP_VERSION} из package.json`);
}
