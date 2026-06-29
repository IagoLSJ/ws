<template>
  <div class="app-card" :class="{ 'app-card--clickable': clickable }" @click="$emit('click')">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  clickable?: boolean;
}>(), { clickable: false });

defineEmits<{ click: [] }>();
</script>

<style scoped>
.app-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}
.app-card--clickable { cursor: pointer; transition: box-shadow var(--transition-fast); }
.app-card--clickable:hover { box-shadow: var(--shadow-md); }
</style>
