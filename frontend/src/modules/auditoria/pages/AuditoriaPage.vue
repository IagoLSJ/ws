<template>
  <div>
    <PageHeader title="Auditoria" subtitle="Registro de atividades do negócio" />

    <div v-if="loading" class="loading">Carregando...</div>

    <template v-else>
      <FilterBar>
        <div class="filter-row">
          <AppInput v-model="filtro.acao" label="Ação" placeholder="Filtrar por ação..." />
          <AppInput v-model="filtro.usuarioId" label="Usuário ID" placeholder="ID do usuário..." />
          <AppButton variant="secondary" size="sm" @click="fetchLogs">Filtrar</AppButton>
          <AppButton variant="ghost" size="sm" @click="filtro.acao = ''; filtro.usuarioId = ''; fetchLogs()">Limpar</AppButton>
        </div>
      </FilterBar>

      <AppCard>
        <AppTable :columns="colunas" :data="logs" empty-text="Nenhum registro de auditoria.">
          <template #cell-usuario="{ row }">
            {{ row.usuario?.nome || row.usuarioId || '-' }}
          </template>
          <template #cell-acao="{ row }">
            <code class="acao-code">{{ row.acao }}</code>
          </template>
          <template #cell-payload="{ row }">
            <span v-if="!row.payload" class="text-muted">-</span>
            <button v-else class="btn-payload" @click="verPayload(row)">Ver</button>
          </template>
          <template #cell-criadoEm="{ row }">
            {{ formatDate(row.criadoEm) }}
          </template>
        </AppTable>

        <div v-if="totalPages > 1" class="pagination">
          <button :disabled="page <= 1" @click="setPage(page - 1)" class="page-btn">Anterior</button>
          <span class="page-info">{{ page }} de {{ totalPages }}</span>
          <button :disabled="page >= totalPages" @click="setPage(page + 1)" class="page-btn">Próximo</button>
        </div>
      </AppCard>
    </template>

    <!-- Payload Modal -->
    <AppModal :open="!!payloadModal" title="Payload" @close="payloadModal = null">
      <pre class="payload-json">{{ payloadModal }}</pre>
      <div class="modal-footer-buttons">
        <AppButton variant="ghost" @click="payloadModal = null">Fechar</AppButton>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import api from '@/shared/utils/api';
import { useBusinessStore } from '@/app/stores/business.store';
import PageHeader from '@/shared/components/layout/PageHeader.vue';
import FilterBar from '@/shared/components/layout/FilterBar.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppTable from '@/shared/components/ui/AppTable.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';

const businessStore = useBusinessStore();
const bid = businessStore.businessId;

const loading = ref(true);
const logs = ref<any[]>([]);
const page = ref(1);
const totalPages = ref(1);
const payloadModal = ref<any>(null);
const filtro = reactive({ acao: '', usuarioId: '' });

const colunas = [
  { key: 'criadoEm', label: 'Data' },
  { key: 'usuario', label: 'Usuário' },
  { key: 'acao', label: 'Ação' },
  { key: 'payload', label: 'Payload' },
];

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR');
}

function verPayload(row: any) {
  payloadModal.value = row.payload;
}

function setPage(p: number) {
  page.value = p;
  fetchLogs();
}

async function fetchLogs() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: page.value, limit: 50 };
    if (filtro.acao) params.acao = filtro.acao;
    if (filtro.usuarioId) params.usuarioId = filtro.usuarioId;
    const { data } = await api.get(`/negocios/${bid()}/auditoria`, { params });
    logs.value = data.data;
    totalPages.value = data.totalPages;
  } catch {
    logs.value = [];
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
}

fetchLogs();
</script>

<style scoped>
.loading { color: var(--color-text-muted); text-align: center; padding: 2rem; }
.filter-row { display: flex; align-items: flex-end; gap: 0.75rem; flex-wrap: wrap; }
.acao-code { font-size: 0.75rem; background: var(--color-bg-tertiary); padding: 0.125rem 0.375rem; border-radius: var(--radius-sm); }
.btn-payload { font-size: 0.75rem; color: var(--color-primary); cursor: pointer; background: none; border: none; padding: 0; font-family: inherit; }
.btn-payload:hover { text-decoration: underline; }
.text-muted { color: var(--color-text-muted); font-size: 0.8125rem; }
.payload-json { font-size: 0.75rem; background: var(--color-bg-tertiary); padding: 1rem; border-radius: var(--radius-md); overflow-x: auto; max-height: 400px; white-space: pre-wrap; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border-light); }
.page-btn { padding: 0.375rem 0.75rem; font-size: 0.8125rem; border: 1px solid var(--color-border-medium); border-radius: var(--radius-md); background: var(--color-bg-secondary); color: var(--color-text-secondary); cursor: pointer; }
.page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 0.8125rem; color: var(--color-text-muted); }
.modal-footer-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
</style>
