<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <slot name="icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </slot>
    </div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string;
  description?: string;
}>(), {
  title: 'Nenhum registro encontrado',
  description: '',
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1.5rem;
  text-align: center;
}
.empty-state__icon { color: var(--color-border-medium); margin-bottom: 1rem; }
.empty-state__title { font-size: 1rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0.375rem; }
.empty-state__desc { font-size: 0.8125rem; color: var(--color-text-muted); max-width: 280px; }
</style>
