<template>
  <div class="filter-bar">
    <div v-if="$slots.default" class="filter-bar__group">
      <slot />
    </div>
    <div v-if="$slots.actions" class="filter-bar__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.filter-bar__group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  flex: 1;
}
.filter-bar__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
