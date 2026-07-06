<template>
  <div>
    <PageHeader title="Usuários">
      <template #actions>
        <AppButton v-if="can(RoleNegocio.SUPER_ADMIN)" @click="router.push('/usuarios/novo')">
          Novo Usuário
        </AppButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="loading">Carregando...</div>

    <FilterBar v-else>
      <div class="search-wrapper">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input v-model="usuariosBusca" placeholder="Buscar usuários..." class="search-input" />
      </div>
    </FilterBar>

    <AppTable
      :columns="columns"
      :data="paginatedItems"
      empty-text="Nenhum usuário encontrado."
    >
      <template #cell-ativo="{ row }">
        <AppBadge :variant="row.ativo ? 'success' : 'danger'">
          {{ row.ativo ? 'Ativo' : 'Inativo' }}
        </AppBadge>
      </template>
      <template #cell-criadoEm="{ row }">
        {{ formatDateShort(row.criadoEm) }}
      </template>
      <template #actions="{ row }">
        <AppButton size="sm" variant="ghost" @click="router.push(`/usuarios/${row.id}/editar`)">
          Editar
        </AppButton>
        <AppButton
          v-if="can(RoleNegocio.SUPER_ADMIN)"
          size="sm"
          variant="danger"
          @click="confirmarExclusao(row)"
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

    <ConfirmDialog
      :open="showConfirm"
      title="Remover Usuário"
      :message="`Remover ${usuarioParaRemover?.nome}?`"
      confirm-text="Remover"
      confirm-variant="danger"
      :loading="removendo"
      @confirm="handleRemove"
      @cancel="showConfirm = false; usuarioParaRemover = null"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import { usePermissions } from '@/shared/composables/usePermissions';
import { usePagination } from '@/shared/composables/usePagination';
import { useUiStore } from '@/app/stores/ui.store';
import { RoleNegocio } from '@/shared/utils/types';
import { formatDateShort } from '@/shared/utils/formatDate';
import PageHeader from '@/shared/components/layout/PageHeader.vue';
import FilterBar from '@/shared/components/layout/FilterBar.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppTable from '@/shared/components/ui/AppTable.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog.vue';

const router = useRouter();
const { can } = usePermissions();
const ui = useUiStore();

const usuarios = ref<any[]>([]);
const usuariosBusca = ref('');
const loading = ref(true);
const showConfirm = ref(false);
const usuarioParaRemover = ref<any | null>(null);
const removendo = ref(false);

const usuariosFiltrados = computed(() => {
  if (!usuariosBusca.value) return usuarios.value;
  const q = usuariosBusca.value.toLowerCase();
  return usuarios.value.filter((u) => u.nome?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
});

const { page, totalPages, paginatedItems, setPage } = usePagination(usuariosFiltrados, 10);

const columns = [
  { key: 'nome', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'ativo', label: 'Status' },
  { key: 'criadoEm', label: 'Criado em' },
];

function confirmarExclusao(user: any) {
  usuarioParaRemover.value = user;
  showConfirm.value = true;
}

async function handleRemove() {
  if (!usuarioParaRemover.value) return;
  removendo.value = true;
  try {
    await api.delete(`/usuarios/${usuarioParaRemover.value.id}`);
    ui.addToast('Usuário removido.', 'success');
    showConfirm.value = false;
    usuarioParaRemover.value = null;
    usuarios.value = usuarios.value.filter((u) => u.id !== usuarioParaRemover.value?.id);
  } catch {
    ui.addToast('Erro ao remover usuário.', 'error');
  } finally {
    removendo.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/usuarios');
    usuarios.value = data;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.loading { color: var(--color-text-3); text-align: center; padding: 2rem; }
.search-wrapper { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); flex: 1; max-width: 320px; }
.search-wrapper:focus-within { border-color: var(--color-brand); }
.search-icon { flex-shrink: 0; color: var(--color-text-3); }
.search-input { border: none; outline: none; font-size: 0.8125rem; width: 100%; background: transparent; color: var(--color-text); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
.page-btn { padding: 0.375rem 0.75rem; font-size: 0.8125rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text-2); cursor: pointer; transition: all var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--color-brand); color: var(--color-brand); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 0.8125rem; color: var(--color-text-3); }
</style>
