<template>
  <div class="skeleton" :class="[`skeleton--${variant}`, className]">
    <div v-if="variant === 'table'">
      <div class="skeleton-toolbar">
        <div class="skeleton-line w-64" />
        <div class="skeleton-line w-24" />
      </div>
      <div v-for="i in rows" :key="i" class="skeleton-row">
        <div class="skeleton-line w-32" />
        <div class="skeleton-line w-24" />
        <div class="skeleton-line w-20" />
        <div class="skeleton-line w-16" />
      </div>
    </div>
    <div v-else-if="variant === 'card'">
      <div v-for="i in rows" :key="i" class="skeleton-card-item">
        <div class="skeleton-line w-24" />
        <div class="skeleton-line w-16 h-8" />
      </div>
    </div>
    <div v-else>
      <div v-for="i in rows" :key="i" class="skeleton-line-wrapper">
        <div class="skeleton-line" :style="{ width: (60 + Math.random() * 30) + '%' }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'table' | 'card' | 'text';
  rows?: number;
  className?: string;
}>(), {
  variant: 'text',
  rows: 5,
  className: '',
});
</script>

<style scoped>
.skeleton { width: 100%; }
.skeleton-line-wrapper { margin-bottom: 0.625rem; }
.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, var(--color-bg-tertiary) 25%, #e5e7eb 50%, var(--color-bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.w-16 { width: 4rem; } .w-20 { width: 5rem; } .w-24 { width: 6rem; } .w-32 { width: 8rem; } .w-64 { width: 16rem; }
.h-8 { height: 2rem; }
.skeleton-toolbar { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
.skeleton-row { display: flex; gap: 2rem; padding: 0.75rem 0; border-bottom: 1px solid var(--color-border-light); }
.skeleton-card-item { padding: 1rem; border: 1px solid var(--color-border-light); border-radius: var(--radius-lg); margin-bottom: 0.75rem; }
</style>
