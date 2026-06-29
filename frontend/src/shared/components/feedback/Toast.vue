<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-item--${toast.type}`"
      >
        <span>{{ toast.message }}</span>
        <button class="toast-close" @click="ui.removeToast(toast.id)">&times;</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/app/stores/ui.store';

const ui = useUiStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}
.toast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  box-shadow: var(--shadow-lg);
  color: #fff;
}
.toast-item--success { background: var(--color-success); }
.toast-item--error { background: var(--color-danger); }
.toast-item--warning { background: var(--color-warning); }
.toast-item--info { background: var(--color-info); }
.toast-close { font-size: 1.25rem; opacity: 0.7; color: inherit; flex-shrink: 0; }
.toast-close:hover { opacity: 1; }
.toast-enter-active, .toast-leave-active { transition: all var(--transition-base); }
.toast-enter-from { transform: translateX(100%); opacity: 0; }
.toast-leave-to { transform: translateX(100%); opacity: 0; }
</style>
