import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true);
  const toasts = ref<Toast[]>([]);

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function addToast(message: string, type: ToastType = 'info', duration = 4000) {
    const id = Date.now().toString();
    toasts.value.push({ id, message, type });
    setTimeout(() => removeToast(id), duration);
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { sidebarOpen, toasts, toggleSidebar, addToast, removeToast };
});
