<template>
  <div class="app-input" :class="{ 'app-input--error': error }">
    <label v-if="label" class="app-input__label">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      class="app-input__field"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur', $event)"
    />
    <span v-if="error" class="app-input__error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  label?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}>();

defineEmits<{
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
}>();
</script>

<style scoped>
.app-input { display: flex; flex-direction: column; gap: 0.25rem; }
.app-input__label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
.app-input__field {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
  outline: none;
}
.app-input__field:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }
.app-input__field::placeholder { color: var(--color-text-muted); }
.app-input--error .app-input__field { border-color: var(--color-danger); }
.app-input__error { font-size: 0.75rem; color: var(--color-danger); }
</style>
