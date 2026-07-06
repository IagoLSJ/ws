<template>
  <section class="section-card">
    <div v-if="title || $slots.header" class="section-card__header">
      <h2 v-if="title" class="section-card__title">{{ title }}</h2>
      <slot name="header" />
    </div>
    <div class="section-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<style scoped>
.section-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}
.section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.02), transparent);
}
.section-card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}
.section-card__body {
  padding: 1.5rem;
}
</style>
