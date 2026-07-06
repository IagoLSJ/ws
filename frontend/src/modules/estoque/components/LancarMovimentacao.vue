<template>
  <AppModal :open="open" title="Lançar Movimentação" @close="$emit('close')">
    <form @submit.prevent="handleSubmit">
      <p class="text-muted">Produto: <strong>{{ item?.produto?.nome }}</strong></p>
      <p class="text-muted">Saldo atual: {{ item?.quantidadeAtual }} {{ item?.unidade }}</p>
      <AppSelect v-model="form.tipo" label="Tipo" :options="tipoOptions" />
      <AppInput v-model="form.quantidade" label="Quantidade" type="number" min="1" :error="errors.quantidade" />
      <AppInput v-model="form.motivo" label="Motivo" />
      <p v-if="errors.geral" class="error-msg">{{ errors.geral }}</p>
      <div class="modal-footer-buttons">
        <AppButton variant="ghost" @click="$emit('close')">Cancelar</AppButton>
        <AppButton type="submit" :loading="loading">Lançar</AppButton>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import api from '@/shared/utils/api';
import { TipoMovimentacao, type EstoqueItem } from '@/shared/utils/types';
import { useBusinessStore } from '@/app/stores/business.store';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const props = defineProps<{
  open: boolean;
  item: EstoqueItem | null;
}>();

const emit = defineEmits<{ close: []; saved: [] }>();

const businessStore = useBusinessStore();
const loading = ref(false);
const form = reactive({
  tipo: TipoMovimentacao.ENTRADA,
  quantidade: '1',
  motivo: '',
});
const errors = reactive({ quantidade: '', geral: '' });

const tipoOptions = [
  { value: TipoMovimentacao.ENTRADA, label: 'Entrada' },
  { value: TipoMovimentacao.SAIDA_VENDA, label: 'Saída (Venda)' },
  { value: TipoMovimentacao.SAIDA_AJUSTE, label: 'Saída (Ajuste)' },
  { value: TipoMovimentacao.PERDA, label: 'Perda' },
  { value: TipoMovimentacao.INVENTARIO, label: 'Inventário' },
];

async function handleSubmit() {
  if (!props.item) return;
  errors.quantidade = '';
  errors.geral = '';

  const qtd = parseInt(form.quantidade);
  if (!qtd || qtd < 1) { errors.quantidade = 'Quantidade inválida'; return; }

  loading.value = true;
  try {
    const bid = businessStore.businessId();
    await api.post(`/negocios/${bid}/estoque/${props.item.id}/movimentar`, {
      tipo: form.tipo,
      quantidade: qtd,
      motivo: form.motivo || undefined,
    });
    emit('saved');
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao movimentar';
    errors.geral = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.text-muted { font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 0.5rem; }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); }
.modal-footer-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
</style>
