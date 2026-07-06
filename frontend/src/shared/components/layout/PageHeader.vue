<template>
  <div class="page-header">
    <div class="page-header__left">
      <h1 class="page-header__title">{{ title }}</h1>
      <span v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</span>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.page-header__left {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  min-width: 0;
}
.page-header__title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}
.page-header__subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.page-header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
