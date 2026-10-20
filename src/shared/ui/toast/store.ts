import { create } from 'zustand';
import { createId } from '@/shared/lib';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (item) => {
    const id = createId('toast');
    set({ toasts: [...get().toasts, { ...item, id }].slice(-4) });
    window.setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

const push = (tone: ToastTone) => (title: string, description?: string) =>
  useToastStore.getState().push({ title, description, tone });

export const toast = {
  success: push('success'),
  info: push('info'),
  warning: push('warning'),
  error: push('error'),
};
