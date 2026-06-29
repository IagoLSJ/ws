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
.app-badge--success { background: #D1FAE5; color: #065F46; }
.app-badge--warning { background: #FEF3C7; color: #92400E; }
.app-badge--danger { background: #FEE2E2; color: #991B1B; }
.app-badge--info { background: #DBEAFE; color: #1E40AF; }
.app-badge--neutral { background: var(--color-bg-tertiary); color: var(--color-text-secondary); }
</style>
