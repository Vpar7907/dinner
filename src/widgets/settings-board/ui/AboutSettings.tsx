import { History, Sparkles } from 'lucide-react';
import { APP_VERSION, CHANGELOG, formatReleaseDate } from '@/shared/config';
import { ReleaseNotes } from '@/shared/ui';
import { SettingsSection } from './SettingsSection';
import { SettingsSubpage } from './SettingsSubpage';

export function AboutSettings() {
  const [current, ...previous] = CHANGELOG;
  return (
    <SettingsSubpage title="О приложении">
      <div className="flex flex-col gap-6">
        <SettingsSection icon={<Sparkles className="h-5 w-5" />} title="Что нового">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-700">
              Версия <b className="text-ink-900">{APP_VERSION}</b>
              {current && current.version === APP_VERSION && current.date && (
                <span className="text-ink-500"> · {formatReleaseDate(current.date)}</span>
              )}
            </p>
            {current && (
              <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-ink-900/5">
                <ReleaseNotes release={current} hideHeading />
              </div>
            )}
          </div>
        </SettingsSection>

        {previous.length > 0 && (
          <SettingsSection icon={<History className="h-5 w-5" />} title="История версий" delay={0.06}>
            <div className="flex flex-col gap-5">
              {previous.map((release) => (
                <ReleaseNotes key={release.version} release={release} />
              ))}
            </div>
          </SettingsSection>
        )}
      </div>
    </SettingsSubpage>
  );
}
