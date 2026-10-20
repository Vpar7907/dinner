import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDishStore, type Dish } from '@/entities/dish';
import { useMenuStore } from '@/entities/menu';
import { ConfirmDialog, IconButton, toast } from '@/shared/ui';

export function DeleteDishButton({ dish }: { dish: Dish }) {
  const [open, setOpen] = useState(false);
  const remove = useDishStore((s) => s.remove);
  const detachDish = useMenuStore((s) => s.detachDish);

  const confirm = async () => {
    setOpen(false);
    await remove(dish.id);
    await detachDish(dish.id);
    toast.info('Блюдо удалено', dish.name);
  };

  return (
    <>
      <IconButton label="Удалить блюдо" tone="danger" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </IconButton>
      <ConfirmDialog
        open={open}
        title="Удалить блюдо?"
        message={`«${dish.name}» будет удалено из базы и из текущего меню. Это действие нельзя отменить.`}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
