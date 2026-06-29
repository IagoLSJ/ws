<template>
  <nav class="cat-nav">
    <button
      :class="['cat-tab', { 'cat-tab--active': active === '' }]"
      @click="$emit('select', '')"
    >
      Todos
    </button>
    <button
      v-for="cat in categorias"
      :key="cat.id"
      :class="['cat-tab', { 'cat-tab--active': active === cat.id }]"
      @click="$emit('select', cat.id)"
    >
      {{ cat.nome }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { Categoria } from '@/shared/utils/types';

defineProps<{
  categorias: Categoria[];
  active: string;
}>();

defineEmits<{ select: [categoriaId: string] }>();
</script>

<style scoped>
.cat-nav { display: flex; gap: 0.5rem; overflow-x: auto; padding: 1rem 0; }
.cat-tab {
  padding: 0.5rem 1rem; border-radius: var(--radius-full);
  font-size: 0.8125rem; font-weight: 500; white-space: nowrap;
  background: var(--color-bg-tertiary); color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}
.cat-tab--active { background: var(--color-primary); color: #fff; }
</style>
