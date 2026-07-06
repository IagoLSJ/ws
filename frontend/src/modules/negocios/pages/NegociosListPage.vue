<template>
  <div>
    <PageHeader title="Negócios">
      <template #actions>
        <AppButton v-if="canCreate" @click="router.push('/negocios/novo')">
          Novo Negócio
        </AppButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="loading">Carregando...</div>

    <FilterBar v-else>
      <div class="search-wrapper">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input v-model="busca" placeholder="Buscar negócios..." class="search-input" />
      </div>
    </FilterBar>

    <AppTable
      :columns="columns"
      :data="paginatedItems"
      empty-text="Nenhum negócio encontrado."
    >
      <template #cell-logoUrl="{ row }">
        <img v-if="row.logoUrl" :src="row.logoUrl" class="cell-logo" />
        <div v-else class="cell-logo-placeholder">{{ row.nome.charAt(0).toUpperCase() }}</div>
      </template>
      <template #cell-ativo="{ row }">
        <AppBadge :variant="row.ativo ? 'success' : 'danger'">
          {{ row.ativo ? 'Ativo' : 'Inativo' }}
        </AppBadge>
      </template>
      <template #cell-_count="{ row }">
        <div class="cell-info">
          <span>{{ row._count?.membros ?? 0 }} membros</span>
          <span>{{ row._count?.produtos ?? 0 }} produtos</span>
          <span>{{ row._count?.pedidos ?? 0 }} pedidos</span>
        </div>
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
import PageHeader from '@/shared/components/layout/PageHeader.vue';
import FilterBar from '@/shared/components/layout/FilterBar.vue';
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
  { key: 'logoUrl', label: '' },
  { key: 'nome', label: 'Nome' },
  { key: 'slug', label: 'Slug' },
  { key: 'ativo', label: 'Status' },
  { key: '_count', label: 'Info' },
];

onMounted(() => businessStore.fetchAll());
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
.cell-logo { width: 32px; height: 32px; border-radius: var(--radius-full); object-fit: cover; }
.cell-logo-placeholder { width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--color-brand-soft); color: var(--color-brand); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
.cell-info { display: flex; gap: 0.75rem; font-size: 0.8125rem; color: var(--color-text-2); }
.cell-info span + span::before { content: '·'; margin-right: 0.75rem; color: var(--color-text-3); }
</style>
