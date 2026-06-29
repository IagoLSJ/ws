<template>
  <div class="app-select" :class="{ 'app-select--error': error }">
    <label v-if="label" class="app-select__label">{{ label }}</label>
    <select
      :value="modelValue"
      :disabled="disabled"
      class="app-select__field"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <span v-if="error" class="app-select__error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
interface SelectOption {
  value: string;
  label: string;
}

withDefaults(defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  options: SelectOption[];
}>(), { disabled: false });

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<style scoped>
.app-select { display: flex; flex-direction: column; gap: 0.25rem; }
.app-select__label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
.app-select__field {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  outline: none;
}
.app-select__field:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }
.app-select--error .app-select__field { border-color: var(--color-danger); }
.app-select__error { font-size: 0.75rem; color: var(--color-danger); }
</style>
