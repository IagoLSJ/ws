<template>
  <div>
    <div class="page-header">
      <div class="page-header__left">
        <h1>Estoque</h1>
        <span class="header-count">{{ estoque.length }} itens</span>
      </div>
      <div class="header-actions">
        <AppButton v-if="can(RoleNegocio.GERENTE)" variant="ghost" @click="showAlertas = !showAlertas">
          {{ showAlertas ? 'Ver Estoque' : 'Alertas' }}
        </AppButton>
        <AppButton v-if="can(RoleNegocio.GERENTE)" variant="secondary" @click="exportarRelatorio">
          Exportar
        </AppButton>
        <AppButton v-if="can(RoleNegocio.GERENTE)" variant="secondary" @click="openTransferir">
          Transferir
        </AppButton>
        <AppButton v-if="can(RoleNegocio.GERENTE)" @click="openCriar">
          Novo Item
        </AppButton>
      </div>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>

    <!-- Alertas -->
    <template v-else-if="showAlertas">
      <AppCard class="section">
        <h2>Alertas de Ruptura</h2>
        <div v-if="!alertas.length" class="empty">Nenhum alerta.</div>
        <div v-for="item in alertas" :key="item.id" class="alerta-item">
          <strong>{{ item.nome }}</strong>
          <span class="text-danger">Estoque: {{ item.quantidadeAtual }} {{ item.unidade }}</span>
        </div>
      </AppCard>
    </template>

    <!-- Tabela -->
    <template v-else>
      <div class="table-toolbar">
        <div class="search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input v-model="estoqueBusca" placeholder="Buscar no estoque..." class="search-input" />
        </div>
      </div>

      <AppTable
        :columns="columns"
        :data="paginatedItems"
        empty-text="Nenhum item de estoque."
      >
        <template #cell-nome="{ row }">
          <div class="item-cell">
            <strong>{{ row.nome }}</strong>
            <AppBadge :variant="row.ehAvulso ? 'neutral' : 'info'" size="sm">
              {{ row.ehAvulso ? 'Avulso' : 'Catálogo' }}
            </AppBadge>
          </div>
        </template>
        <template #cell-quantidadeAtual="{ row }">
          <span :class="{ 'text-danger': row.quantidadeAtual <= row.estoqueMinimo }">
            {{ row.quantidadeAtual }} {{ row.unidade }}
          </span>
        </template>
        <template #cell-estoqueMinimo="{ row }">
          {{ row.estoqueMinimo }} {{ row.unidade }}
        </template>
        <template #actions="{ row }">
          <AppButton
            v-if="can(RoleNegocio.GERENTE) && (row as any).ehAvulso"
            size="sm"
            variant="ghost"
            @click="openEditar(row as unknown as EstoqueItem)"
          >
            Editar
          </AppButton>
          <AppButton
            v-if="can(RoleNegocio.OPERADOR_ESTOQUE)"
            size="sm"
            variant="secondary"
            @click="openMovimentar(row as unknown as EstoqueItem)"
          >
            Movimentar
          </AppButton>
          <AppButton
            size="sm"
            variant="ghost"
            @click="router.push(`/estoque/${(row as any).id}/historico`)"
          >
            Histórico
          </AppButton>
          <AppButton
            v-if="can(RoleNegocio.GERENTE)"
            size="sm"
            variant="danger"
            @click="confirmarExclusao(row as unknown as EstoqueItem)"
          >
            Remover
          </AppButton>
        </template>
      </AppTable>

      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page <= 1" @click="setPage(page - 1)" class="page-btn">Anterior</button>
        <span class="page-info">{{ page }} de {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="setPage(page + 1)" class="page-btn">Próximo</button>
      </div>
    </template>

    <!-- Modal Criar/Editar -->
    <AppModal :open="showForm" :title="editandoId ? 'Editar Item' : 'Novo Item de Estoque'" @close="fecharForm">
      <form @submit.prevent="handleSalvarItem">
        <AppInput v-model="itemForm.nome" label="Nome" :error="formErrors.nome" />
        <AppInput v-model="itemForm.sku" label="SKU" />
        <div class="form-grid">
          <AppInput v-model="itemForm.quantidadeAtual" label="Qtd. Inicial" type="number" min="0" />
          <AppInput v-model="itemForm.estoqueMinimo" label="Estoque Mínimo" type="number" min="0" />
        </div>
        <AppInput v-model="itemForm.unidade" label="Unidade" />
        <p v-if="formErrors.geral" class="error-msg">{{ formErrors.geral }}</p>
        <div class="modal-footer-buttons">
          <AppButton variant="ghost" @click="fecharForm">Cancelar</AppButton>
          <AppButton type="submit" :loading="savingItem">
            {{ editandoId ? 'Salvar' : 'Criar' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Transfer Modal -->
    <AppModal :open="showTransferir" title="Transferir Estoque" @close="showTransferir = false">
      <form @submit.prevent="handleTransferir">
        <AppSelect v-model="transfForm.itemOrigemId" label="Item de Origem" :options="produtoOptions" />
        <AppSelect v-model="transfForm.negocioDestinoId" label="Negócio de Destino" :options="negocioOptions" />
        <AppInput v-model="transfForm.quantidade" label="Quantidade" type="number" min="1" />
        <AppInput v-model="transfForm.motivo" label="Motivo" />
        <p v-if="transfError" class="error-msg">{{ transfError }}</p>
        <div class="modal-footer-buttons">
          <AppButton variant="ghost" @click="showTransferir = false">Cancelar</AppButton>
          <AppButton type="submit" :loading="transfLoading">Transferir</AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Movimentar Modal -->
    <AppModal :open="!!movimentarItem" title="Lançar Movimentação" @close="movimentarItem = null">
      <form @submit.prevent="handleMovimentar">
        <p><strong>{{ movimentarItem?.nome }}</strong></p>
        <p class="text-muted">Saldo atual: {{ movimentarItem?.quantidadeAtual }} {{ movimentarItem?.unidade }}</p>
        <AppSelect v-model="movForm.tipo" label="Tipo" :options="tipoOptions" />
        <AppInput v-model="movForm.quantidade" label="Quantidade" type="number" min="1" />
        <AppInput v-model="movForm.motivo" label="Motivo" />
        <p v-if="movError" class="error-msg">{{ movError }}</p>
        <div class="modal-footer-buttons">
          <AppButton variant="ghost" @click="movimentarItem = null">Cancelar</AppButton>
          <AppButton type="submit" :loading="movLoading">Lançar</AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Confirm Delete -->
    <ConfirmDialog
      :open="showConfirm"
      title="Remover Item"
      :message="`Remover ${itemParaRemover?.nome} do estoque?`"
      confirm-text="Remover"
      confirm-variant="danger"
      :loading="removendo"
      @confirm="handleDelete"
      @cancel="showConfirm = false; itemParaRemover = null"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import { usePermissions } from '@/shared/composables/usePermissions';
import { usePagination } from '@/shared/composables/usePagination';
import { useBusinessStore } from '@/app/stores/business.store';
import { RoleNegocio, TipoMovimentacao, type EstoqueItem } from '@/shared/utils/types';
import { useUiStore } from '@/app/stores/ui.store';
import AppTable from '@/shared/components/ui/AppTable.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog.vue';

const router = useRouter();
const { can } = usePermissions();
const ui = useUiStore();
const businessStore = useBusinessStore();

const estoque = ref<EstoqueItem[]>([]);
const estoqueBusca = ref('');
const alertas = ref<EstoqueItem[]>([]);
const negocios = ref<{ id: string; nome: string }[]>([]);
const loading = ref(true);
const showAlertas = ref(false);

const estoqueFiltrado = computed(() => {
  if (!estoqueBusca.value) return estoque.value;
  const q = estoqueBusca.value.toLowerCase();
  return estoque.value.filter((e) => e.nome.toLowerCase().includes(q));
});
const { page, totalPages, paginatedItems, setPage } = usePagination(estoqueFiltrado, 10);

// --- Criar / Editar ---
const showForm = ref(false);
const editandoId = ref<string | null>(null);
const savingItem = ref(false);
const itemForm = ref({ nome: '', sku: '', quantidadeAtual: '0', estoqueMinimo: '5', unidade: 'un' });
const formErrors = ref({ nome: '', geral: '' });

function openCriar() {
  editandoId.value = null;
  itemForm.value = { nome: '', sku: '', quantidadeAtual: '0', estoqueMinimo: '5', unidade: 'un' };
  formErrors.value = { nome: '', geral: '' };
  showForm.value = true;
}

function openEditar(item: EstoqueItem) {
  editandoId.value = item.id;
  itemForm.value = {
    nome: item.nome,
    sku: item.sku ?? '',
    quantidadeAtual: String(item.quantidadeAtual),
    estoqueMinimo: String(item.estoqueMinimo),
    unidade: item.unidade,
  };
  formErrors.value = { nome: '', geral: '' };
  showForm.value = true;
}

function fecharForm() {
  showForm.value = false;
  editandoId.value = null;
}

async function handleSalvarItem() {
  formErrors.value = { nome: '', geral: '' };
  if (!itemForm.value.nome) { formErrors.value.nome = 'Nome obrigatório'; return; }
  savingItem.value = true;
  try {
    const bid = businessStore.businessId();
    if (editandoId.value) {
      await api.patch(`/negocios/${bid}/estoque/${editandoId.value}`, {
        nome: itemForm.value.nome,
        sku: itemForm.value.sku || undefined,
        estoqueMinimo: parseInt(itemForm.value.estoqueMinimo) || 0,
        unidade: itemForm.value.unidade || 'un',
      });
      ui.addToast('Item atualizado!', 'success');
    } else {
      await api.post(`/negocios/${bid}/estoque`, {
        nome: itemForm.value.nome,
        sku: itemForm.value.sku || undefined,
        quantidadeAtual: parseInt(itemForm.value.quantidadeAtual) || 0,
        estoqueMinimo: parseInt(itemForm.value.estoqueMinimo) || 5,
        unidade: itemForm.value.unidade || 'un',
      });
      ui.addToast('Item criado!', 'success');
    }
    fecharForm();
    await fetchData();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao salvar';
    formErrors.value.geral = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    savingItem.value = false;
  }
}

// --- Delete ---
const showConfirm = ref(false);
const itemParaRemover = ref<EstoqueItem | null>(null);
const removendo = ref(false);

function confirmarExclusao(item: EstoqueItem) {
  itemParaRemover.value = item;
  showConfirm.value = true;
}

async function handleDelete() {
  if (!itemParaRemover.value) return;
  removendo.value = true;
  try {
    const bid = businessStore.businessId();
    await api.delete(`/negocios/${bid}/estoque/${itemParaRemover.value.id}`);
    ui.addToast('Item removido.', 'success');
    showConfirm.value = false;
    itemParaRemover.value = null;
    await fetchData();
  } catch {
    ui.addToast('Erro ao remover item.', 'error');
  } finally {
    removendo.value = false;
  }
}

// --- Movimentar ---
const movimentarItem = ref<EstoqueItem | null>(null);
const movLoading = ref(false);
const movError = ref('');
const movForm = ref({ tipo: TipoMovimentacao.ENTRADA, quantidade: '1', motivo: '' });

function openMovimentar(item: EstoqueItem) {
  movimentarItem.value = item;
  movForm.value = { tipo: TipoMovimentacao.ENTRADA, quantidade: '1', motivo: '' };
  movError.value = '';
}

async function handleMovimentar() {
  if (!movimentarItem.value) return;
  movError.value = '';
  movLoading.value = true;
  try {
    const bid = businessStore.businessId();
    await api.post(`/negocios/${bid}/estoque/${movimentarItem.value.id}/movimentar`, {
      tipo: movForm.value.tipo,
      quantidade: parseInt(movForm.value.quantidade),
      motivo: movForm.value.motivo || undefined,
    });
    ui.addToast('Movimentação lançada!', 'success');
    movimentarItem.value = null;
    await fetchData();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao movimentar';
    movError.value = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    movLoading.value = false;
  }
}

// --- Transferir ---
const showTransferir = ref(false);
const transfLoading = ref(false);
const transfError = ref('');
const transfForm = ref({ itemOrigemId: '', negocioDestinoId: '', quantidade: '1', motivo: '' });

const produtoOptions = computed(() =>
  estoque.value.map((e) => ({ value: e.id, label: e.nome })),
);

const negocioOptions = computed(() =>
  negocios.value.filter((n) => n.id !== businessStore.businessId()).map((n) => ({ value: n.id, label: n.nome })),
);

function openTransferir() {
  transfForm.value = { itemOrigemId: '', negocioDestinoId: '', quantidade: '1', motivo: '' };
  transfError.value = '';
  showTransferir.value = true;
}

async function handleTransferir() {
  transfError.value = '';
  transfLoading.value = true;
  try {
    const bid = businessStore.businessId();
    const itemOrigem = estoque.value.find((e) => e.id === transfForm.value.itemOrigemId);
    if (!itemOrigem || !itemOrigem.produtoId) {
      transfError.value = 'Apenas itens vinculados a produtos do catálogo podem ser transferidos.';
      transfLoading.value = false;
      return;
    }
    await api.post(`/negocios/${bid}/estoque/transferir`, {
      itemOrigemId: transfForm.value.itemOrigemId,
      negocioDestinoId: transfForm.value.negocioDestinoId,
      produtoDestinoId: itemOrigem.produtoId,
      quantidade: parseInt(transfForm.value.quantidade),
      motivo: transfForm.value.motivo || undefined,
    });
    ui.addToast('Transferência realizada!', 'success');
    showTransferir.value = false;
    await fetchData();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao transferir';
    transfError.value = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    transfLoading.value = false;
  }
}

// --- Relatório ---
async function exportarRelatorio() {
  try {
    const bid = businessStore.businessId();
    const { data } = await api.get(`/negocios/${bid}/relatorios/inventario`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventario-${bid}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    ui.addToast('Relatório baixado!', 'success');
  } catch {
    ui.addToast('Erro ao exportar relatório.', 'error');
  }
}

// --- Data ---
const columns = [
  { key: 'nome', label: 'Item' },
  { key: 'quantidadeAtual', label: 'Saldo' },
  { key: 'estoqueMinimo', label: 'Estoque Mínimo' },
];

const tipoOptions = [
  { value: TipoMovimentacao.ENTRADA, label: 'Entrada' },
  { value: TipoMovimentacao.SAIDA_VENDA, label: 'Saída (Venda)' },
  { value: TipoMovimentacao.SAIDA_AJUSTE, label: 'Saída (Ajuste)' },
  { value: TipoMovimentacao.PERDA, label: 'Perda' },
  { value: TipoMovimentacao.TRANSFERENCIA_ENTRADA, label: 'Transferência (Entrada)' },
  { value: TipoMovimentacao.TRANSFERENCIA_SAIDA, label: 'Transferência (Saída)' },
  { value: TipoMovimentacao.INVENTARIO, label: 'Inventário' },
];

async function fetchData() {
  loading.value = true;
  try {
    const bid = businessStore.businessId();
    const [estqRes, alertRes, negRes] = await Promise.all([
      api.get(`/negocios/${bid}/estoque`),
      api.get(`/negocios/${bid}/estoque/alertas`),
      api.get('/negocios'),
    ]);
    estoque.value = estqRes.data;
    alertas.value = alertRes.data;
    negocios.value = negRes.data;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.5rem; }
.page-header__left { display: flex; align-items: baseline; gap: 0.75rem; }
.header-count { font-size: 0.8125rem; color: var(--color-text-muted); }
.header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.loading { color: var(--color-text-muted); text-align: center; padding: 2rem; }
.text-muted { color: var(--color-text-muted); font-size: 0.8125rem; }
.text-danger { color: var(--color-danger); font-weight: 600; }
.section { margin-bottom: 1.5rem; }
.section h2 { font-size: 1rem; margin-bottom: 1rem; }
.empty { color: var(--color-text-muted); font-size: 0.875rem; padding: 1rem 0; }
.alerta-item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--color-border-light); }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); }
.modal-footer-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
.item-cell { display: flex; align-items: center; gap: 0.5rem; }
.table-toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.search-wrapper { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-bg-secondary); flex: 1; max-width: 320px; }
.search-wrapper:focus-within { border-color: var(--color-primary); }
.search-icon { flex-shrink: 0; color: var(--color-text-muted); }
.search-input { border: none; outline: none; font-size: 0.8125rem; width: 100%; background: transparent; color: var(--color-text-primary); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border-light); }
.page-btn { padding: 0.375rem 0.75rem; font-size: 0.8125rem; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-bg-secondary); color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 0.8125rem; color: var(--color-text-muted); }
</style>
