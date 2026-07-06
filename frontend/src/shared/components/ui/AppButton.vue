<template>
  <button
    :type="type"
    :class="[
      'app-button',
      `app-button--${variant}`,
      `app-button--${size}`,
      { 'app-button--loading': loading, 'app-button--disabled': disabled },
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="app-button__spinner" />
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean;
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'submit',
  loading: false,
  disabled: false,
});

defineEmits<{ click: [event: MouseEvent] }>();
</script>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid transparent;
}
.app-button--sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
.app-button--md { padding: 0.5rem 1rem; font-size: 0.875rem; }
.app-button--lg { padding: 0.75rem 1.5rem; font-size: 1rem; }
.app-button--primary {
  background: var(--color-primary);
  color: #fff;
}
.app-button--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.app-button--secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border-medium);
}
.app-button--secondary:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}
.app-button--success {
  background: var(--color-success);
  color: #fff;
}
.app-button--success:hover:not(:disabled) {
  background: #059669;
}
.app-button--danger {
  background: var(--color-danger);
  color: #fff;
}
.app-button--danger:hover:not(:disabled) {
  background: #DC2626;
}
.app-button--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
.app-button--ghost:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}
.app-button--disabled { opacity: 0.5; cursor: not-allowed; }
.app-button--loading { cursor: wait; }
.app-button__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
