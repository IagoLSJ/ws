<template>
  <span class="app-badge" :class="`app-badge--${variant}`">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}>(), { variant: 'neutral' });
</script>

<style scoped>
.app-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.app-badge--success { background: var(--color-success-soft); color: var(--color-success); }
.app-badge--warning { background: var(--color-warning-soft); color: var(--color-warning); }
.app-badge--danger { background: var(--color-danger-soft); color: var(--color-danger); }
.app-badge--info { background: var(--color-info-soft); color: var(--color-info); }
.app-badge--neutral { background: var(--color-surface-2); color: var(--color-text-2); }
</style>
