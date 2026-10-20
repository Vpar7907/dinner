import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useSideDishStore, type SideDish } from '@/entities/side-dish';
import { useDishStore } from '@/entities/dish';
import { useMenuStore } from '@/entities/menu';
import { ConfirmDialog, IconButton, toast } from '@/shared/ui';

export function DeleteSideButton({ side }: { side: SideDish }) {
  const [open, setOpen] = useState(false);
  const remove = useSideDishStore((s) => s.remove);
  const detachFromDishes = useDishStore((s) => s.detachSide);
  const detachFromMenu = useMenuStore((s) => s.detachSide);

  const confirm = async () => {
    setOpen(false);
    await remove(side.id);
    await Promise.all([detachFromDishes(side.id), detachFromMenu(side.id)]);
    toast.info('Гарнир удалён', side.name);
  };

  return (
    <>
      <IconButton label="Удалить гарнир" tone="danger" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </IconButton>
      <ConfirmDialog
        open={open}
        title="Удалить гарнир?"
        message={`«${side.name}» будет удалён из настроек блюд и из текущего меню.`}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
