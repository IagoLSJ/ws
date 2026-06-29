<template>
  <div>
    <div class="page-header">
      <h1>Negócios</h1>
      <AppButton v-if="canCreate" @click="router.push('/negocios/novo')">
        Novo Negócio
      </AppButton>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>

    <div v-else class="table-toolbar">
      <div class="search-wrapper">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input v-model="busca" placeholder="Buscar negócios..." class="search-input" />
      </div>
    </div>

    <AppTable
      :columns="columns"
      :data="paginatedItems"
      empty-text="Nenhum negócio encontrado."
    >
      <template #cell-ativo="{ row }">
        <AppBadge :variant="row.ativo ? 'success' : 'danger'">
          {{ row.ativo ? 'Ativo' : 'Inativo' }}
        </AppBadge>
      </template>
      <template #cell-_count="{ row }">
        {{ row._count?.membros ?? 0 }} membros · {{ row._count?.produtos ?? 0 }} produtos
      </template>
      <template #actions="{ row }">
        <AppButton size="sm" variant="ghost" @click="router.push(`/negocios/${row.id}`)">
          Ver
        </AppButton>
        <AppButton size="sm" variant="ghost" @click="router.push(`/negocios/${row.id}/membros`)">
          Membros
        </AppButton>
      </template>
    </AppTable>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @click="setPage(page - 1)" class="page-btn">Anterior</button>
      <span class="page-info">{{ page }} de {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="setPage(page + 1)" class="page-btn">Próximo</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBusinessStore } from '@/app/stores/business.store';
import { usePermissions } from '@/shared/composables/usePermissions';
import { usePagination } from '@/shared/composables/usePagination';
import { RoleNegocio } from '@/shared/utils/types';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppTable from '@/shared/components/ui/AppTable.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';

const router = useRouter();
const businessStore = useBusinessStore();
const { can } = usePermissions();

const canCreate = computed(() => can(RoleNegocio.SUPER_ADMIN));
const loading = computed(() => businessStore.loading);
const busca = ref('');

const negociosFiltrados = computed(() => {
  if (!busca.value) return businessStore.businesses;
  const q = busca.value.toLowerCase();
  return businessStore.businesses.filter((b) => b.nome.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q));
});

const { page, totalPages, paginatedItems, setPage } = usePagination(negociosFiltrados, 10);

const columns = [
  { key: 'nome', label: 'Nome' },
  { key: 'slug', label: 'Slug' },
  { key: 'ativo', label: 'Status' },
  { key: '_count', label: 'Info' },
];

onMounted(() => businessStore.fetchAll());
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.loading { color: var(--color-text-muted); text-align: center; padding: 2rem; }
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
