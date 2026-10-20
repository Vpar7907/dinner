import { useState } from 'react';
import { Eraser } from 'lucide-react';
import { useMenuStore } from '@/entities/menu';
import { Button, ConfirmDialog, toast } from '@/shared/ui';

export function ClearMenuButton({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const clearUnlocked = useMenuStore((s) => s.clearUnlocked);

  const confirm = async () => {
    setOpen(false);
    await clearUnlocked();
    toast.info('Меню очищено', 'Закреплённые блюда остались на месте.');
  };

  return (
    <>
      <Button variant="secondary" size="lg" icon={<Eraser className="h-4 w-4" />} disabled={disabled} onClick={() => setOpen(true)}>
        Очистить
      </Button>
      <ConfirmDialog
        open={open}
        title="Очистить меню?"
        message="Все незакреплённые приёмы пищи будут очищены. Закреплённые блюда останутся без изменений."
        confirmLabel="Очистить"
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
