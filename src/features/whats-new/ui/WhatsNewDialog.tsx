import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getMeta, setMeta } from '@/shared/api';
import { APP_VERSION, CHANGELOG, releasesSince, type Release } from '@/shared/config';
import { Button, Modal, ReleaseNotes } from '@/shared/ui';

/** Meta key with the version whose changes the user has already seen. */
export const LAST_SEEN_VERSION_KEY = 'last-seen-version';

/**
 * Shows once after an update what changed since the version the user saw last.
 * Fresh installs are marked as seen during initialization, so they get no dialog.
 */
export function WhatsNewDialog() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getMeta<string>(LAST_SEEN_VERSION_KEY).then((seen) => {
      if (cancelled || seen === APP_VERSION) return;
      // Users from before versioning, or with a version this build does not know, see the latest release only.
      const known = seen !== undefined && CHANGELOG.some((r) => r.version === seen);
      const fresh = known ? releasesSince(seen) : CHANGELOG.slice(0, 1);
      if (fresh.length === 0) return;
      setReleases(fresh);
      setOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => {
    setOpen(false);
    void setMeta(LAST_SEEN_VERSION_KEY, APP_VERSION);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Что нового в версии ${APP_VERSION}`}
      size="sm"
      footer={
        <Button icon={<Sparkles className="h-4 w-4" />} onClick={close}>
          Понятно
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {releases.map((release) => (
          <ReleaseNotes key={release.version} release={release} hideHeading={releases.length === 1} />
        ))}
      </div>
    </Modal>
  );
}
