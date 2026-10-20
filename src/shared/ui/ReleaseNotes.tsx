import { Check } from 'lucide-react';
import { formatReleaseDate, type Release } from '@/shared/config';

export interface ReleaseNotesProps {
  release: Release;
  /** Hide the "version · date" line, e.g. when the caller already shows it. */
  hideHeading?: boolean;
}

export function ReleaseNotes({ release, hideHeading }: ReleaseNotesProps) {
  return (
    <div className="flex flex-col gap-2">
      {!hideHeading && (
        <p className="text-sm font-bold text-ink-900">
          Версия {release.version} <span className="font-medium text-ink-500">· {formatReleaseDate(release.date)}</span>
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {release.changes.map((change) => (
          <li key={change} className="flex gap-2 text-sm text-ink-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-500" />
            <span>{change}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
