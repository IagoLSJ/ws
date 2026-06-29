<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Histórico de Movimentações</h1>
        <p v-if="item" class="text-muted">{{ item.produto?.nome }}</p>
      </div>
      <AppButton variant="ghost" @click="router.back()">Voltar</AppButton>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>

    <AppTable
      v-else
      :columns="columns"
      :data="movimentacoes"
      empty-text="Nenhuma movimentação."
    >
      <template #cell-tipo="{ row }">
        <AppBadge :variant="tipoVariant(row.tipo)">{{ row.tipo }}</AppBadge>
      </template>
      <template #cell-quantidade="{ row }">
        {{ row.quantidade }} ({{ row.quantidadeAntes }} → {{ row.quantidadeApos }})
      </template>
      <template #cell-usuario="{ row }">
        {{ row.usuario?.nome || '-' }}
      </template>
      <template #cell-criadoEm="{ row }">
        {{ formatDate(row.criadoEm) }}
      </template>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import { useBusinessStore } from '@/app/stores/business.store';
import type { MovimentacaoEstoque, EstoqueItem } from '@/shared/utils/types';
import { formatDate } from '@/shared/utils/formatDate';
import AppTable from '@/shared/components/ui/AppTable.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const route = useRoute();
const router = useRouter();
const businessStore = useBusinessStore();

const item = ref<EstoqueItem | null>(null);
const movimentacoes = ref<MovimentacaoEstoque[]>([]);
const loading = ref(true);

const columns = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'quantidade', label: 'Qtd (antes → após)' },
  { key: 'motivo', label: 'Motivo' },
  { key: 'usuario', label: 'Responsável' },
  { key: 'criadoEm', label: 'Data' },
];

function tipoVariant(tipo: string) {
  const map: Record<string, any> = {
    ENTRADA: 'success', SAIDA_VENDA: 'warning', SAIDA_AJUSTE: 'warning',
    PERDA: 'danger', TRANSFERENCIA_ENTRADA: 'info', TRANSFERENCIA_SAIDA: 'info',
    INVENTARIO: 'neutral',
  };
  return map[tipo] || 'neutral';
}

onMounted(async () => {
  loading.value = true;
  try {
    const bid = businessStore.businessId();
    const itemId = route.params.itemId as string;
    const [movRes, itemRes] = await Promise.all([
      api.get(`/negocios/${bid}/estoque/${itemId}/historico`),
      api.get(`/negocios/${bid}/estoque/${itemId}`),
    ]);
    movimentacoes.value = movRes.data;
    item.value = itemRes.data;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
.text-muted { color: var(--color-text-muted); font-size: 0.875rem; }
.loading { color: var(--color-text-muted); text-align: center; padding: 2rem; }
</style>
