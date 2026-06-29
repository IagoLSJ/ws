<template>
  <div>
    <div class="page-header">
      <h1>Categorias</h1>
      <AppButton v-if="can(RoleNegocio.GERENTE)" @click="openCriar">
        Nova Categoria
      </AppButton>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>

    <div v-else class="table-toolbar">
      <div class="search-wrapper">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input v-model="categoriasBusca" placeholder="Buscar categorias..." class="search-input" />
      </div>
    </div>

    <AppTable
      :columns="columns"
      :data="paginatedItems"
      empty-text="Nenhuma categoria."
    >
      <template #cell-ativo="{ row }">
        <AppBadge :variant="row.ativo ? 'success' : 'danger'">
          {{ row.ativo ? 'Ativo' : 'Inativo' }}
        </AppBadge>
      </template>
      <template #cell-ordem="{ row }">
        {{ row.ordem }}
      </template>
      <template #cell-produtos="{ row }">
        {{ row._count?.produtos ?? 0 }}
      </template>
      <template #actions="{ row }">
        <AppButton size="sm" variant="ghost" @click="openEditar(row as unknown as Categoria)">Editar</AppButton>
        <AppButton v-if="can(RoleNegocio.GERENTE)" size="sm" variant="danger" @click="confirmarExclusao(row as unknown as Categoria)">
          Remover
        </AppButton>
      </template>
    </AppTable>

    <AppModal :open="showModal" :title="editando ? 'Editar Categoria' : 'Nova Categoria'" @close="fecharModal">
      <form @submit.prevent="handleSalvar">
        <AppInput v-model="form.nome" label="Nome" :error="errors.nome" />
        <AppInput v-model="form.descricao" label="Descrição" />
        <AppInput v-model="form.ordem" label="Ordem" type="number" min="0" />
        <label class="checkbox-label" v-if="editando">
          <input v-model="form.ativo" type="checkbox" />
          Ativo
        </label>
        <p v-if="errors.geral" class="error-msg">{{ errors.geral }}</p>
        <div class="modal-footer-buttons">
          <AppButton variant="ghost" @click="fecharModal">Cancelar</AppButton>
          <AppButton type="submit" :loading="saving">{{ editando ? 'Salvar' : 'Criar' }}</AppButton>
        </div>
      </form>
    </AppModal>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @click="setPage(page - 1)" class="page-btn">Anterior</button>
      <span class="page-info">{{ page }} de {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="setPage(page + 1)" class="page-btn">Próximo</button>
    </div>

    <ConfirmDialog
      :open="showConfirm"
      title="Remover Categoria"
      :message="`Remover ${categoriaParaRemover?.nome}?`"
      confirm-text="Remover"
      confirm-variant="danger"
      :loading="removendo"
      @confirm="handleDelete"
      @cancel="showConfirm = false; categoriaParaRemover = null"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue';
import api from '@/shared/utils/api';
import { usePermissions } from '@/shared/composables/usePermissions';
import { usePagination } from '@/shared/composables/usePagination';
import { useBusinessStore } from '@/app/stores/business.store';
import { useUiStore } from '@/app/stores/ui.store';
import { RoleNegocio, type Categoria } from '@/shared/utils/types';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppTable from '@/shared/components/ui/AppTable.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog.vue';

const { can } = usePermissions();
const ui = useUiStore();
const businessStore = useBusinessStore();

const categorias = ref<Categoria[]>([]);
const categoriasBusca = ref('');
const loading = ref(true);

const categoriasFiltradas = computed(() => {
  if (!categoriasBusca.value) return categorias.value;
  const q = categoriasBusca.value.toLowerCase();
  return categorias.value.filter((c) => c.nome.toLowerCase().includes(q));
});

const { page, totalPages, paginatedItems, setPage } = usePagination(categoriasFiltradas, 10);
const showModal = ref(false);
const editando = ref(false);
const editandoId = ref<string | null>(null);
const saving = ref(false);
const showConfirm = ref(false);
const categoriaParaRemover = ref<Categoria | null>(null);
const removendo = ref(false);

const form = reactive({ nome: '', descricao: '', ordem: '0', ativo: true });
const errors = reactive({ nome: '', geral: '' });

const columns = [
  { key: 'nome', label: 'Nome' },
  { key: 'ordem', label: 'Ordem' },
  { key: 'produtos', label: 'Produtos' },
  { key: 'ativo', label: 'Status' },
];

function openCriar() {
  editando.value = false;
  editandoId.value = null;
  form.nome = '';
  form.descricao = '';
  form.ordem = '0';
  form.ativo = true;
  errors.nome = '';
  errors.geral = '';
  showModal.value = true;
}

function openEditar(cat: Categoria) {
  editando.value = true;
  editandoId.value = cat.id;
  form.nome = cat.nome;
  form.descricao = cat.descricao ?? '';
  form.ordem = String(cat.ordem);
  form.ativo = cat.ativo;
  errors.nome = '';
  errors.geral = '';
  showModal.value = true;
}

function fecharModal() {
  showModal.value = false;
  editando.value = false;
  editandoId.value = null;
}

async function handleSalvar() {
  errors.nome = '';
  errors.geral = '';
  if (!form.nome) { errors.nome = 'Nome obrigatório'; return; }

  saving.value = true;
  try {
    const bid = businessStore.businessId();
    const payload = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      ordem: parseInt(form.ordem) || 0,
      ...(editando.value ? { ativo: form.ativo } : {}),
    };

    if (editando.value && editandoId.value) {
      await api.patch(`/negocios/${bid}/categorias/${editandoId.value}`, payload);
      ui.addToast('Categoria atualizada!', 'success');
    } else {
      await api.post(`/negocios/${bid}/categorias`, payload);
      ui.addToast('Categoria criada!', 'success');
    }
    fecharModal();
    await fetchData();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao salvar';
    errors.geral = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    saving.value = false;
  }
}

function confirmarExclusao(cat: Categoria) {
  categoriaParaRemover.value = cat;
  showConfirm.value = true;
}

async function handleDelete() {
  if (!categoriaParaRemover.value) return;
  removendo.value = true;
  try {
    const bid = businessStore.businessId();
    await api.delete(`/negocios/${bid}/categorias/${categoriaParaRemover.value.id}`);
    ui.addToast('Categoria removida.', 'success');
    showConfirm.value = false;
    categoriaParaRemover.value = null;
    await fetchData();
  } catch {
    ui.addToast('Erro ao remover categoria.', 'error');
  } finally {
    removendo.value = false;
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const bid = businessStore.businessId();
    const { data } = await api.get(`/negocios/${bid}/categorias`);
    categorias.value = data;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.loading { color: var(--color-text-muted); text-align: center; padding: 2rem; }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); margin-top: 0.5rem; }
.modal-footer-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-top: 0.75rem; cursor: pointer; }
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
