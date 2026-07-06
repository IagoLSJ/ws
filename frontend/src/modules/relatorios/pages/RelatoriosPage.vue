<template>
  <div>
    <PageHeader title="Relatórios">
      <template #actions>
        <div class="filter-row">
          <label class="filter-label">De</label>
          <input v-model="filtro.dataInicio" type="date" class="filter-input" />
          <label class="filter-label">Até</label>
          <input v-model="filtro.dataFim" type="date" class="filter-input" />
          <AppButton size="sm" variant="secondary" @click="carregarResumo">Filtrar</AppButton>
        </div>
      </template>
    </PageHeader>

    <!-- Resumo Financeiro -->
    <SectionCard title="Resumo Financeiro" v-if="resumo">
      <div class="resumo-grid">
        <div class="resumo-card">
          <span class="resumo-label">Faturamento</span>
          <span class="resumo-value">{{ formatCurrency(resumo.totalFaturamento) }}</span>
        </div>
        <div class="resumo-card">
          <span class="resumo-label">Pedidos</span>
          <span class="resumo-value">{{ resumo.totalPedidos }}</span>
        </div>
        <div class="resumo-card">
          <span class="resumo-label">Ticket Médio</span>
          <span class="resumo-value">{{ formatCurrency(resumo.ticketMedio) }}</span>
        </div>
        <div class="resumo-card" v-for="m in resumo.porMetodoPagamento" :key="m.metodo">
          <span class="resumo-label">{{ m.metodo }}</span>
          <span class="resumo-value">{{ formatCurrency(m.valor) }}</span>
        </div>
      </div>
    </SectionCard>

    <!-- Downloads -->
    <SectionCard title="Exportar Relatórios">
      <div class="download-grid">
        <AppButton variant="secondary" @click="download('vendas')">
          Vendas (CSV)
        </AppButton>
        <AppButton variant="secondary" @click="download('financeiro')">
          Financeiro (CSV)
        </AppButton>
        <AppButton variant="secondary" @click="download('pedidos')">
          Pedidos (CSV)
        </AppButton>
        <AppButton variant="secondary" @click="download('estoque')">
          Estoque Resumido (CSV)
        </AppButton>
        <AppButton variant="secondary" @click="download('inventario')">
          Inventário Completo (CSV)
        </AppButton>
      </div>
    </SectionCard>

    <p v-if="erro" class="error-msg">{{ erro }}</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import api from '@/shared/utils/api';
import { useBusinessStore } from '@/app/stores/business.store';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import PageHeader from '@/shared/components/layout/PageHeader.vue';
import SectionCard from '@/shared/components/layout/SectionCard.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const businessStore = useBusinessStore();
const bid = businessStore.businessId;

const filtro = reactive({ dataInicio: '', dataFim: '' });
const resumo = ref<any>(null);
const erro = ref('');

async function carregarResumo() {
  erro.value = '';
  try {
    const params: Record<string, string> = {};
    if (filtro.dataInicio) params.dataInicio = filtro.dataInicio;
    if (filtro.dataFim) params.dataFim = filtro.dataFim;
    const { data } = await api.get(`/negocios/${bid()}/relatorios/resumo-financeiro`, { params });
    resumo.value = data;
  } catch {
    erro.value = 'Erro ao carregar resumo financeiro.';
    resumo.value = null;
  }
}

async function download(tipo: string) {
  erro.value = '';
  try {
    const params: Record<string, string> = {};
    if (filtro.dataInicio) params.dataInicio = filtro.dataInicio;
    if (filtro.dataFim) params.dataFim = filtro.dataFim;
    const { data } = await api.get(`/negocios/${bid()}/relatorios/${tipo}`, {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tipo}-${bid()}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    erro.value = `Erro ao exportar ${tipo}.`;
  }
}
</script>

<style scoped>
.filter-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.filter-label { font-size: 0.75rem; color: var(--color-text-secondary); font-weight: 500; }
.filter-input { padding: 0.375rem 0.625rem; font-size: 0.8125rem; border: 1px solid var(--color-border-medium); border-radius: var(--radius-md); background: var(--color-bg-secondary); color: var(--color-text-primary); outline: none; }
.filter-input:focus { border-color: var(--color-primary); }

.resumo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
.resumo-card { background: var(--color-bg-secondary); border: 1px solid var(--color-border-strong); border-radius: var(--radius-lg); padding: 1rem; text-align: center; }
.resumo-label { display: block; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-secondary); margin-bottom: 0.25rem; }
.resumo-value { display: block; font-size: 1.125rem; font-weight: 700; }

.download-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); margin-top: 0.5rem; }
</style>
