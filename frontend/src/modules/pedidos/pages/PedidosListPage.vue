<template>
  <div>
    <PageHeader title="Pedidos">
      <template #actions>
        <AppButton variant="secondary" size="sm" @click="fetchData">
          Atualizar
        </AppButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="loading">Carregando...</div>

    <template v-else>
      <FilterBar>
        <div class="search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input v-model="pedidosBusca" placeholder="Buscar por ID ou contato..." class="search-input" />
        </div>
        <select v-model="filtroStatus" class="filter-select">
          <option v-for="o in filtroStatusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <select v-model="filtroEntrega" class="filter-select">
          <option value="">Toda entrega</option>
          <option value="ENTREGA">Entrega</option>
          <option value="RETIRADA">Retirada</option>
        </select>
      </FilterBar>

      <AppTable
        :columns="columns"
        :data="paginatedItems"
        empty-text="Nenhum pedido ainda."
      >
        <template #cell-id="{ row }">
          <span class="cell-id">#{{ (row as Pedido).id.slice(0, 8) }}</span>
        </template>
        <template #cell-status="{ row }">
          <AppBadge :variant="statusVariant((row as Pedido).status)">{{ (row as Pedido).status }}</AppBadge>
        </template>
        <template #cell-tipoEntrega="{ row }">
          <span class="cell-tipo">{{ (row as Pedido).tipoEntrega || '-' }}</span>
        </template>
        <template #cell-contato="{ row }">
          <span class="cell-contato">{{ (row as Pedido).contato || '-' }}</span>
        </template>
        <template #cell-agendadoPara="{ row }">
          <span v-if="(row as Pedido).agendadoPara" class="cell-agendado">{{ formatDate((row as Pedido).agendadoPara!) }}</span>
          <span v-else class="text-muted">-</span>
        </template>
        <template #cell-total="{ row }">
          <strong>{{ formatCurrency(Number((row as Pedido).total)) }}</strong>
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
          <h3>Informações</h3>
          <div class="detalhe-row">
            <span class="label">Pedido</span>
            <strong>#{{ pedidoDetalhe.id }}</strong>
          </div>
          <div class="detalhe-row">
            <span class="label">Status</span>
            <AppBadge :variant="statusVariant(pedidoDetalhe.status)">{{ pedidoDetalhe.status }}</AppBadge>
          </div>
          <div class="detalhe-row">
            <span class="label">Data</span>
            <span>{{ formatDate(pedidoDetalhe.criadoEm) }}</span>
          </div>
          <div class="detalhe-row">
            <span class="label">Tipo</span>
            <span>{{ pedidoDetalhe.tipoEntrega === 'ENTREGA' ? 'Entrega' : pedidoDetalhe.tipoEntrega === 'RETIRADA' ? 'Retirada' : '-' }}</span>
          </div>
          <div v-if="pedidoDetalhe.taxaFrete" class="detalhe-row">
            <span class="label">Taxa de Frete</span>
            <span>{{ formatCurrency(Number(pedidoDetalhe.taxaFrete)) }}</span>
          </div>
          <div class="detalhe-row">
            <span class="label">Subtotal</span>
            <span>{{ formatCurrency(Number(pedidoDetalhe.total) - Number(pedidoDetalhe.taxaFrete ?? 0)) }}</span>
          </div>
          <div class="detalhe-row">
            <span class="label">Total</span>
            <strong>{{ formatCurrency(Number(pedidoDetalhe.total)) }}</strong>
          </div>
          <div v-if="pedidoDetalhe.agendadoPara" class="detalhe-row">
            <span class="label">Agendado para</span>
            <span class="text-highlight">{{ formatDate(pedidoDetalhe.agendadoPara) }}</span>
          </div>
        </div>

        <div v-if="pedidoDetalhe.endereco" class="modal-section">
          <h3>Endereço de Entrega</h3>
          <div class="endereco-box">
            <p v-if="pedidoDetalhe.endereco.logradouro">
              <strong>{{ pedidoDetalhe.endereco.logradouro }}{{ pedidoDetalhe.endereco.numero ? ', ' + pedidoDetalhe.endereco.numero : '' }}</strong>
              <span v-if="pedidoDetalhe.endereco.complemento"> - {{ pedidoDetalhe.endereco.complemento }}</span>
            </p>
            <p v-if="pedidoDetalhe.endereco.bairro">{{ pedidoDetalhe.endereco.bairro }}</p>
            <p v-if="pedidoDetalhe.endereco.cidade || pedidoDetalhe.endereco.estado">
              {{ pedidoDetalhe.endereco.cidade }}{{ pedidoDetalhe.endereco.estado ? ' - ' + pedidoDetalhe.endereco.estado : '' }}
            </p>
            <p v-if="pedidoDetalhe.endereco.cep">CEP: {{ pedidoDetalhe.endereco.cep }}</p>
          </div>
        </div>

        <div v-if="pedidoDetalhe.contato" class="modal-section">
          <h3>Contato</h3>
          <p class="contato-text">{{ pedidoDetalhe.contato }}</p>
        </div>

        <div v-if="pedidoDetalhe.observacao" class="modal-section">
          <h3>Observação</h3>
          <p class="obs-text">{{ pedidoDetalhe.observacao }}</p>
        </div>

        <div class="modal-section">
          <h3>Pagamento</h3>
          <div v-if="pedidoDetalhe.pagamentos?.length" class="pagamento-list">
            <div v-for="pg in pedidoDetalhe.pagamentos" :key="pg.id" class="detalhe-row">
              <span class="label">{{ pg.metodo }}</span>
              <AppBadge>{{ pg.status }}</AppBadge>
            </div>
          </div>
          <p v-else class="text-muted">Nenhum pagamento registrado</p>
        </div>

        <div class="modal-section">
          <h3>Itens ({{ pedidoDetalhe.itens.length }})</h3>
          <div v-for="item in pedidoDetalhe.itens" :key="item.id" class="item-row">
            <div class="item-info">
              <span class="item-name">{{ item.produtoNome }}</span>
              <span class="item-qty">× {{ item.quantidade }}</span>
              <span class="item-unit">{{ formatCurrency(Number(item.precoUnitario)) }} un</span>
            </div>
            <span class="item-total">{{ formatCurrency(Number(item.precoUnitario) * item.quantidade) }}</span>
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
import PageHeader from '@/shared/components/layout/PageHeader.vue';
import FilterBar from '@/shared/components/layout/FilterBar.vue';
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
const filtroEntrega = ref('');
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
  if (filtroEntrega.value) {
    result = result.filter((p) => p.tipoEntrega === filtroEntrega.value);
  }
  if (pedidosBusca.value) {
    const q = pedidosBusca.value.toLowerCase();
    result = result.filter(
      (p) => p.id.toLowerCase().includes(q) || p.contato?.toLowerCase().includes(q),
    );
  }
  return result;
});

const { page, totalPages, paginatedItems, setPage } = usePagination(pedidosFiltrados, 10);

const columns = [
  { key: 'id', label: 'Pedido' },
  { key: 'status', label: 'Status' },
  { key: 'tipoEntrega', label: 'Tipo' },
  { key: 'contato', label: 'Contato' },
  { key: 'agendadoPara', label: 'Agendado' },
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
.loading { color: var(--color-text-3); text-align: center; padding: 2rem; }
.text-muted { color: var(--color-text-3); font-size: 0.8125rem; }
.text-highlight { color: var(--color-warning); font-weight: 600; }

.modal-section { margin-bottom: 1.25rem; }
.modal-section h3 { font-size: 0.875rem; font-weight: 700; margin-bottom: 0.625rem; color: var(--color-text-2); text-transform: uppercase; letter-spacing: 0.04em; }
.detalhe-row { display: flex; justify-content: space-between; padding: 0.375rem 0; font-size: 0.875rem; border-bottom: 1px solid var(--color-border); }
.detalhe-row:last-child { border-bottom: none; }
.label { color: var(--color-text-3); }
.endereco-box { background: var(--color-bg-tertiary); border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.875rem; }
.endereco-box p { margin: 0.125rem 0; line-height: 1.5; }
.contato-text { font-size: 0.9375rem; font-weight: 600; }
.obs-text { font-size: 0.875rem; font-style: italic; color: var(--color-text-2); }
.pagamento-list .detalhe-row:last-child { border-bottom: none; }
.item-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--color-border); font-size: 0.875rem; }
.item-row:last-child { border-bottom: none; }
.item-info { display: flex; gap: 0.375rem; align-items: baseline; flex-wrap: wrap; }
.item-name { font-weight: 600; }
.item-qty { color: var(--color-text-3); }
.item-unit { font-size: 0.75rem; color: var(--color-text-3); }
.item-total { font-weight: 700; white-space: nowrap; }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); }
.modal-footer-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }

.cell-id { font-family: monospace; font-size: 0.8125rem; font-weight: 700; }
.cell-tipo { font-size: 0.8125rem; }
.cell-contato { font-size: 0.8125rem; }
.cell-agendado { font-size: 0.8125rem; color: var(--color-warning); }

.search-wrapper { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); flex: 1; max-width: 320px; }
.search-wrapper:focus-within { border-color: var(--color-brand); }
.search-icon { flex-shrink: 0; color: var(--color-text-3); }
.search-input { border: none; outline: none; font-size: 0.8125rem; width: 100%; background: transparent; color: var(--color-text); }
.filter-select { padding: 0.375rem 0.625rem; font-size: 0.8125rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); outline: none; cursor: pointer; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
.page-btn { padding: 0.375rem 0.75rem; font-size: 0.8125rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text-2); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--color-brand); color: var(--color-brand); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 0.8125rem; color: var(--color-text-3); }
</style>
