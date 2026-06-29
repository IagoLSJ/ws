<template>
  <AppModal :open="open" :title="title" @close="$emit('cancel')">
    <p>{{ message }}</p>
    <template #footer>
      <AppButton variant="ghost" @click="$emit('cancel')">Cancelar</AppButton>
      <AppButton :variant="confirmVariant" :loading="loading" @click="$emit('confirm')">
        {{ confirmText }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

withDefaults(defineProps<{
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
}>(), {
  title: 'Confirmar',
  message: 'Tem certeza?',
  confirmText: 'Confirmar',
  confirmVariant: 'primary',
  loading: false,
});

defineEmits<{ confirm: []; cancel: [] }>();
</script>
