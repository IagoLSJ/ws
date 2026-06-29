<template>
  <div>
    <div class="page-header">
      <h1>Pedidos</h1>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>

    <template v-else>
      <div class="table-toolbar">
        <div class="search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input v-model="pedidosBusca" placeholder="Buscar por ID..." class="search-input" />
        </div>
        <select v-model="filtroStatus" class="filter-select">
          <option v-for="o in filtroStatusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>

      <AppTable
        :columns="columns"
        :data="paginatedItems"
        empty-text="Nenhum pedido ainda."
      >
        <template #cell-status="{ row }">
          <AppBadge :variant="statusVariant((row as Pedido).status)">{{ (row as Pedido).status }}</AppBadge>
        </template>
        <template #cell-total="{ row }">
          {{ formatCurrency(Number((row as Pedido).total)) }}
        </template>
        <template #cell-criadoEm="{ row }">
          {{ formatDate((row as Pedido).criadoEm) }}
        </template>
        <template #cell-acoes="{ row }">
          <AppButton size="sm" variant="ghost" @click="abrirDetalhe(row as Pedido)">
            Detalhes
          </AppButton>
          <AppButton
            v-if="can(RoleNegocio.GERENTE) && (row as Pedido).status !== StatusPedido.CANCELADO && (row as Pedido).status !== StatusPedido.ENTREGUE"
            size="sm"
            variant="secondary"
            @click="abrirStatus(row as Pedido)"
          >
            Status
          </AppButton>
        </template>
      </AppTable>
    </template>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @click="setPage(page - 1)" class="page-btn">Anterior</button>
      <span class="page-info">{{ page }} de {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="setPage(page + 1)" class="page-btn">Próximo</button>
    </div>

    <AppModal :open="!!pedidoDetalhe" title="Detalhes do Pedido" @close="pedidoDetalhe = null">
      <template v-if="pedidoDetalhe">
        <div class="modal-section">
          <div class="detalhe-row">
            <span class="label">Status</span>
            <AppBadge :variant="statusVariant(pedidoDetalhe.status)">{{ pedidoDetalhe.status }}</AppBadge>
          </div>
          <div class="detalhe-row">
            <span class="label">Total</span>
            <strong>{{ formatCurrency(Number(pedidoDetalhe.total)) }}</strong>
          </div>
          <div class="detalhe-row">
            <span class="label">Data</span>
            <span>{{ formatDate(pedidoDetalhe.criadoEm) }}</span>
          </div>
          <div class="detalhe-row">
            <span class="label">Pagamento</span>
            <span>{{ pedidoDetalhe.pagamentos?.[0]?.metodo }} - <AppBadge>{{ pedidoDetalhe.pagamentos?.[0]?.status }}</AppBadge></span>
          </div>
          <div v-if="pedidoDetalhe.endereco" class="detalhe-endereco">
            <span class="label">Endereço</span>
            <p v-if="pedidoDetalhe.endereco.logradouro">
              {{ pedidoDetalhe.endereco.logradouro }}, {{ pedidoDetalhe.endereco.numero }}
              <span v-if="pedidoDetalhe.endereco.complemento"> - {{ pedidoDetalhe.endereco.complemento }}</span>
            </p>
            <p v-if="pedidoDetalhe.endereco.bairro">{{ pedidoDetalhe.endereco.bairro }}</p>
            <p v-if="pedidoDetalhe.endereco.cidade">{{ pedidoDetalhe.endereco.cidade }}{{ pedidoDetalhe.endereco.estado ? ' - ' + pedidoDetalhe.endereco.estado : '' }}</p>
            <p v-if="pedidoDetalhe.endereco.cep">CEP: {{ pedidoDetalhe.endereco.cep }}</p>
          </div>
          <div v-if="pedidoDetalhe.contato" class="detalhe-row">
            <span class="label">Contato</span>
            <span>{{ pedidoDetalhe.contato }}</span>
          </div>
        </div>

        <div class="modal-section">
          <h3>Itens</h3>
          <div v-for="item in pedidoDetalhe.itens" :key="item.id" class="item-row">
            <span>{{ item.produtoNome }} × {{ item.quantidade }}</span>
            <span>{{ formatCurrency(Number(item.precoUnitario) * item.quantidade) }}</span>
          </div>
        </div>
      </template>
    </AppModal>

    <AppModal :open="!!pedidoStatus" title="Atualizar Status" @close="pedidoStatus = null">
      <AppSelect
        v-model="novoStatus"
        :options="statusOptions"
        label="Novo status"
      />
      <p v-if="statusError" class="error-msg">{{ statusError }}</p>
      <div class="modal-footer-buttons">
        <AppButton variant="ghost" @click="pedidoStatus = null">Cancelar</AppButton>
        <AppButton :loading="statusLoading" @click="handleAtualizarStatus">Salvar</AppButton>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import api from '@/shared/utils/api';
import { usePermissions } from '@/shared/composables/usePermissions';
import { usePagination } from '@/shared/composables/usePagination';
import { useBusinessStore } from '@/app/stores/business.store';
import { useUiStore } from '@/app/stores/ui.store';
import { RoleNegocio, StatusPedido, type Pedido } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import AppTable from '@/shared/components/ui/AppTable.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';

const { can } = usePermissions();
const businessStore = useBusinessStore();
const ui = useUiStore();

const pedidos = ref<Pedido[]>([]);
const pedidosBusca = ref('');
const filtroStatus = ref('');
const loading = ref(true);
const pedidoDetalhe = ref<Pedido | null>(null);
const pedidoStatus = ref<Pedido | null>(null);
const novoStatus = ref('');
const statusLoading = ref(false);
const statusError = ref('');

const pedidosFiltrados = computed(() => {
  let result = pedidos.value;
  if (filtroStatus.value) {
    result = result.filter((p) => p.status === filtroStatus.value);
  }
  if (pedidosBusca.value) {
    const q = pedidosBusca.value.toLowerCase();
    result = result.filter((p) => p.id.toLowerCase().includes(q));
  }
  return result;
});

const { page, totalPages, paginatedItems, setPage } = usePagination(pedidosFiltrados, 10);

const columns = [
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
  { key: 'criadoEm', label: 'Data' },
  { key: 'acoes', label: '' },
];

const filtroStatusOptions = [
  { value: '', label: 'Todos' },
  ...Object.values(StatusPedido).map((s) => ({ value: s, label: s })),
];

const statusOptions = [
  { value: StatusPedido.PENDENTE, label: 'Pendente' },
  { value: StatusPedido.CONFIRMADO, label: 'Confirmado' },
  { value: StatusPedido.PREPARANDO, label: 'Preparando' },
  { value: StatusPedido.PRONTO, label: 'Pronto' },
  { value: StatusPedido.SAIU_PARA_ENTREGA, label: 'Saiu para entrega' },
  { value: StatusPedido.ENTREGUE, label: 'Entregue' },
  { value: StatusPedido.CANCELADO, label: 'Cancelado' },
];

function statusVariant(status: StatusPedido) {
  const map: Record<string, any> = {
    PENDENTE: 'warning',
    CONFIRMADO: 'info',
    PREPARANDO: 'info',
    PRONTO: 'success',
    SAIU_PARA_ENTREGA: 'info',
    ENTREGUE: 'success',
    CANCELADO: 'danger',
  };
  return map[status] || 'neutral';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function abrirDetalhe(pedido: Pedido) {
  pedidoDetalhe.value = pedido;
}

function abrirStatus(pedido: Pedido) {
  pedidoStatus.value = pedido;
  novoStatus.value = pedido.status;
  statusError.value = '';
}

async function handleAtualizarStatus() {
  if (!pedidoStatus.value || !novoStatus.value) return;
  statusError.value = '';
  statusLoading.value = true;
  try {
    const bid = businessStore.businessId();
    await api.patch(`/negocios/${bid}/pedidos/${pedidoStatus.value.id}/status`, { status: novoStatus.value });
    ui.addToast('Status atualizado!', 'success');
    pedidoStatus.value = null;
    await fetchData();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao atualizar status';
    statusError.value = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    statusLoading.value = false;
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const bid = businessStore.businessId();
    const res = await api.get(`/negocios/${bid}/pedidos`);
    pedidos.value = res.data;
  } finally {
    loading.value = false;
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchData();
  pollTimer = setInterval(() => {
    if (!document.hidden) fetchData();
  }, 10000);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.loading { color: var(--color-text-muted); text-align: center; padding: 2rem; }
.modal-section { margin-bottom: 1rem; }
.modal-section h3 { font-size: 0.9375rem; margin-bottom: 0.5rem; }
.detalhe-row { display: flex; justify-content: space-between; padding: 0.375rem 0; font-size: 0.875rem; border-bottom: 1px solid var(--color-border-light); }
.detalhe-row:last-child { border-bottom: none; }
.detalhe-endereco { padding: 0.375rem 0; font-size: 0.875rem; border-bottom: 1px solid var(--color-border-light); }
.detalhe-endereco p { margin: 0.125rem 0; }
.label { color: var(--color-text-muted); }
.item-row { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.875rem; }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); }
.modal-footer-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.table-toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.search-wrapper { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-bg-secondary); flex: 1; max-width: 320px; }
.search-wrapper:focus-within { border-color: var(--color-primary); }
.search-icon { flex-shrink: 0; color: var(--color-text-muted); }
.search-input { border: none; outline: none; font-size: 0.8125rem; width: 100%; background: transparent; color: var(--color-text-primary); }
.filter-select { padding: 0.375rem 0.625rem; font-size: 0.8125rem; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-bg-secondary); color: var(--color-text-primary); outline: none; cursor: pointer; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border-light); }
.page-btn { padding: 0.375rem 0.75rem; font-size: 0.8125rem; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-bg-secondary); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 0.8125rem; color: var(--color-text-muted); }
</style>
