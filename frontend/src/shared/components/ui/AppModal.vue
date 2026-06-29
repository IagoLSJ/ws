<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content" :style="`max-width: ${maxWidth}px`">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="modal-close" @click="$emit('close')">&times;</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean;
  title: string;
  maxWidth?: number;
}>(), { maxWidth: 480 });

defineEmits<{ close: [] }>();
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-content {
  width: 100%;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}
.modal-title { font-size: 1.125rem; font-weight: 600; }
.modal-close {
  font-size: 1.5rem;
  color: var(--color-text-muted);
  padding: 0.25rem;
  line-height: 1;
}
.modal-close:hover { color: var(--color-text-primary); }
.modal-body { padding: 1.5rem; overflow-y: auto; }
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.modal-enter-active, .modal-leave-active { transition: opacity var(--transition-base); }
.modal-enter-active .modal-content,
.modal-leave-active .modal-content { transition: transform var(--transition-base); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content { transform: translateY(1rem); }
.modal-leave-to .modal-content { transform: translateY(1rem); }
</style>
