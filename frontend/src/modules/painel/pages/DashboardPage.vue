<template>
  <div class="dashboard">
    <PageHeader title="Dashboard" :subtitle="`Bem-vindo(a), ${auth.user?.nome || ''}`">
      <template #actions>
        <span class="dashboard__date">{{ dataAtual }}</span>
      </template>
    </PageHeader>

    <div v-if="loading" class="skeleton-grid">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="skeleton-line w-24" />
        <div class="skeleton-line w-16 h-8" />
      </div>
    </div>

    <template v-else-if="resumo">
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" style="border-top-color: var(--color-success)">
          <div class="kpi-header">
            <PhCurrencyDollar :size="20" color="var(--color-success)" weight="bold" />
            <span class="kpi-label">Faturamento Hoje</span>
          </div>
          <span class="kpi-value">{{ formatCurrency(resumo.faturamentoHoje) }}</span>
          <span class="kpi-sub">{{ formatCurrency(resumo.faturamentoSemana) }} nesta semana</span>
        </div>
        <div class="kpi-card" style="border-top-color: var(--color-primary)">
          <div class="kpi-header">
            <PhReceipt :size="20" color="var(--color-primary)" weight="bold" />
            <span class="kpi-label">Pedidos Hoje</span>
          </div>
          <span class="kpi-value">{{ resumo.pedidosHoje }}</span>
          <span class="kpi-sub">{{ resumo.pedidosPendentes > 0 ? `${resumo.pedidosPendentes} pendentes` : 'Nenhum pendente' }}</span>
        </div>
        <div class="kpi-card" style="border-top-color: var(--color-warning)">
          <div class="kpi-header">
            <PhCube :size="20" color="var(--color-warning)" weight="bold" />
            <span class="kpi-label">Produtos</span>
          </div>
          <span class="kpi-value">{{ resumo.totalProdutos }}</span>
          <span class="kpi-sub">{{ resumo.totalCategorias }} categorias</span>
        </div>
        <div class="kpi-card" style="border-top-color: var(--color-info)">
          <div class="kpi-header">
            <PhUsers :size="20" color="var(--color-info)" weight="bold" />
            <span class="kpi-label">Membros</span>
          </div>
          <span class="kpi-value">{{ resumo.totalMembros }}</span>
          <span class="kpi-sub">da equipe</span>
        </div>
        <div class="kpi-card" :style="{ borderTopColor: resumo.alertasCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }">
          <div class="kpi-header">
            <PhBell :size="20" :color="resumo.alertasCount > 0 ? 'var(--color-danger)' : 'var(--color-success)'" weight="bold" />
            <span class="kpi-label">Alertas Estoque</span>
          </div>
          <span class="kpi-value">{{ resumo.alertasCount }}</span>
          <span class="kpi-sub">{{ resumo.alertasCount > 0 ? 'Atenção necessária' : 'Tudo ok' }}</span>
        </div>
        <div class="kpi-card" style="border-top-color: var(--color-brand)">
          <div class="kpi-header">
            <PhChartLine :size="20" color="var(--color-brand)" weight="bold" />
            <span class="kpi-label">Faturamento Mês</span>
          </div>
          <span class="kpi-value">{{ formatCurrency(resumo.faturamentoMes) }}</span>
          <span class="kpi-sub">{{ resumo.pedidosMes }} pedidos no mês</span>
        </div>
      </div>

      <!-- Gráfico de Faturamento Diário -->
      <AppCard class="dash-section">
        <div class="dash-card__header">
          <h2>Faturamento Diário (7 dias)</h2>
        </div>
        <div v-if="!chartData" class="dash-empty">
          <span>Carregando gráfico...</span>
        </div>
        <div v-else class="chart-wrapper">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </AppCard>

      <div class="dashboard-grid">
        <!-- Últimos Pedidos -->
        <div class="dash-card dash-card--wide">
          <div class="dash-card__header">
            <h2>Últimos Pedidos</h2>
            <router-link v-if="hasBusiness" to="/pedidos" class="dash-card__link">Ver todos</router-link>
          </div>
          <div v-if="!resumo.ultimosPedidos.length" class="dash-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span>Nenhum pedido ainda</span>
          </div>
          <div v-else class="order-feed">
            <div v-for="p in resumo.ultimosPedidos" :key="p.id" class="order-item" @click="router.push('/pedidos')">
              <div class="order-info">
                <span class="order-id">#{{ p.id.slice(0, 8) }}</span>
                <AppBadge size="sm">{{ p.status }}</AppBadge>
              </div>
              <span class="order-value">{{ formatCurrency(p.total) }}</span>
            </div>
          </div>
        </div>

        <!-- Pedidos por Status -->
        <div class="dash-card">
          <div class="dash-card__header">
            <h2>Pedidos por Status</h2>
          </div>
          <div v-if="!resumo.pedidosPorStatus.length" class="dash-empty">
            <span>Nenhum pedido</span>
          </div>
          <div v-else class="status-list">
            <div v-for="s in resumo.pedidosPorStatus" :key="s.status" class="status-item">
              <span class="status-label">
                <AppBadge size="sm">{{ s.status }}</AppBadge>
              </span>
              <div class="status-bar-wrapper">
                <div class="status-bar" :style="{ width: barWidth(s.count) + '%' }" />
              </div>
              <span class="status-count">{{ s.count }}</span>
            </div>
          </div>
        </div>

        <!-- Mais Vendidos -->
        <div class="dash-card">
          <div class="dash-card__header">
            <h2>Produtos Mais Vendidos</h2>
          </div>
          <div v-if="!resumo.maisVendidos.length" class="dash-empty">
            <span>Nenhuma venda ainda</span>
          </div>
          <div v-else class="top-list">
            <div v-for="(prod, i) in resumo.maisVendidos" :key="prod.produtoId" class="top-item">
              <span class="top-rank">{{ i + 1 }}</span>
              <div class="top-info">
                <span class="top-name">{{ prod.produtoNome }}</span>
                <span class="top-qty">{{ prod.totalVendido }} vendidos · {{ formatCurrency(prod.receita) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ações Rápidas -->
        <div class="dash-card">
          <div class="dash-card__header">
            <h2>Ações Rápidas</h2>
          </div>
          <div class="quick-actions">
            <router-link v-if="canGerente" to="/catalogo/novo" class="quick-action">
              <PhPlusCircle :size="18" />
              Novo Produto
            </router-link>
            <router-link to="/catalogo" class="quick-action">
              <PhBookOpen :size="18" />
              Gerenciar Catálogo
            </router-link>
            <router-link to="/pedidos" class="quick-action">
              <PhReceipt :size="18" />
              Ver Pedidos
            </router-link>
            <router-link to="/estoque" class="quick-action">
              <PhPackage :size="18" />
              Estoque
            </router-link>
          </div>
        </div>
      </div>

      <!-- Negócios (Super Admin) -->
      <AppCard v-if="isSuperAdmin" class="dash-section">
        <div class="dash-card__header">
          <h2>Seus Negócios</h2>
        </div>
        <div v-if="!businessStore.businesses.length" class="dash-empty">Nenhum negócio encontrado.</div>
        <div v-else class="business-list">
          <div v-for="b in businessStore.businesses" :key="b.id" class="business-item" @click="router.push('/negocios/' + b.id)">
            <div class="business-item__info">
              <strong>{{ b.nome }}</strong>
              <span class="text-muted">{{ b.slug }} · {{ b._count?.pedidos ?? 0 }} pedidos</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import { useAuthStore } from '@/app/stores/auth.store';
import { useBusinessStore } from '@/app/stores/business.store';
import { usePermissions } from '@/shared/composables/usePermissions';
import { RoleNegocio, type DashboardResumo } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { PhReceipt, PhBell, PhCube, PhUsers, PhCurrencyDollar, PhChartLine, PhPlusCircle, PhBookOpen, PhPackage } from '@phosphor-icons/vue';
import PageHeader from '@/shared/components/layout/PageHeader.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const router = useRouter();
const auth = useAuthStore();
const businessStore = useBusinessStore();
const { can } = usePermissions();

const loading = ref(true);
const resumo = ref<DashboardResumo | null>(null);
const chartData = ref<any>(null);
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `R$ ${ctx.parsed.y.toFixed(2)}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (v: any) => `R$${v}`,
      },
    },
  },
};

const canGerente = computed(() => can(RoleNegocio.GERENTE));
const isSuperAdmin = computed(() => auth.user?.membros?.some((m) => m.role === RoleNegocio.SUPER_ADMIN));
const hasBusiness = computed(() => !!businessStore.businessId());

const dataAtual = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

const maxStatusCount = computed(() => Math.max(...(resumo.value?.pedidosPorStatus.map((s) => s.count) ?? [1]), 1));

function barWidth(count: number) {
  return (count / maxStatusCount.value) * 100;
}

onMounted(async () => {
  loading.value = true;
  try {
    if (isSuperAdmin.value) {
      await businessStore.fetchAll();
    }

    const bid = businessStore.businessId();
    if (bid) {
      const [resumoData, chartDataRes] = await Promise.all([
        api.get<DashboardResumo>(`/negocios/${bid}/dashboard`).catch(() => ({ data: null })),
        api.get<any>(`/negocios/${bid}/dashboard/faturamento-diario`).catch(() => ({ data: null })),
      ]);
      resumo.value = resumoData.data;

      if (chartDataRes.data) {
        const d = chartDataRes.data;
        chartData.value = {
          labels: d.labels,
          datasets: [
            {
              label: 'Faturamento',
              data: d.faturamento,
              backgroundColor: 'rgba(79, 70, 229, 0.7)',
              borderColor: 'rgba(79, 70, 229, 1)',
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        };
      }
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard { max-width: 1200px; }
.dashboard__date { font-size: 0.8125rem; color: var(--color-text-secondary); }

.skeleton-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.skeleton-card { background: var(--color-bg-secondary); border-radius: var(--radius-lg); padding: 1.25rem; border: 1px solid var(--color-border-strong); }
.skeleton-line { height: 12px; background: linear-gradient(90deg, var(--color-bg-tertiary) 25%, #e5e7eb 50%, var(--color-bg-tertiary) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: var(--radius-sm); margin-bottom: 0.5rem; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.w-24 { width: 6rem; }
.w-16 { width: 4rem; }
.h-8 { height: 2rem; }

.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
@media (max-width: 768px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
.kpi-card { background: var(--color-bg-secondary); border-radius: var(--radius-lg); padding: 1.25rem; border: 1px solid var(--color-border-strong); border-top: 3px solid; }
.kpi-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.kpi-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-primary); text-transform: uppercase; letter-spacing: 0.04em; }
.kpi-value { display: block; font-size: 1.625rem; font-weight: 700; line-height: 1; }
.kpi-sub { display: block; font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.25rem; }

.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.dash-card--wide { grid-column: 1 / -1; }
@media (min-width: 768px) { .dash-card--wide { grid-column: span 2; } }
.dash-card { background: var(--color-bg-secondary); border-radius: var(--radius-lg); padding: 1.25rem; border: 1px solid var(--color-border-strong); }
.dash-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.dash-card__header h2 { font-size: 0.9375rem; font-weight: 700; color: var(--color-text-primary); }
.dash-card__link { font-size: 0.8125rem; color: var(--color-primary); font-weight: 500; }
.dash-card__link:hover { text-decoration: underline; }
.dash-empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--color-text-secondary); font-size: 0.8125rem; }

.order-feed { display: flex; flex-direction: column; gap: 0.25rem; }
.order-item { display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 0.75rem; border-radius: var(--radius-md); cursor: pointer; transition: background var(--transition-fast); }
.order-item:hover { background: var(--color-bg-tertiary); }
.order-info { display: flex; align-items: center; gap: 0.5rem; }
.order-id { font-size: 0.8125rem; font-weight: 700; color: var(--color-text-primary); font-family: monospace; }
.order-value { font-size: 0.8125rem; font-weight: 700; color: var(--color-text-primary); }

.status-list { display: flex; flex-direction: column; gap: 0.5rem; }
.status-item { display: flex; align-items: center; gap: 0.5rem; }
.status-label { min-width: 100px; }
.status-bar-wrapper { flex: 1; height: 8px; background: var(--color-bg-tertiary); border-radius: var(--radius-full); overflow: hidden; }
.status-bar { height: 100%; background: var(--color-brand); border-radius: var(--radius-full); transition: width 0.3s; }
.status-count { font-size: 0.8125rem; font-weight: 700; color: var(--color-text-primary); min-width: 24px; text-align: right; }

.top-list { display: flex; flex-direction: column; gap: 0.25rem; }
.top-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; border-radius: var(--radius-md); }
.top-rank { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; font-weight: 700; border-radius: var(--radius-full); background: var(--color-bg-tertiary); color: var(--color-text-secondary); flex-shrink: 0; }
.top-info { display: flex; flex-direction: column; }
.top-name { font-size: 0.8125rem; font-weight: 600; color: var(--color-text-primary); }
.top-qty { font-size: 0.6875rem; color: var(--color-text-secondary); }

.quick-actions { display: flex; flex-direction: column; gap: 0.25rem; }
.quick-action { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8125rem; color: var(--color-text-primary); text-decoration: none; transition: all var(--transition-fast); }
.quick-action:hover { background: rgba(79, 70, 229, 0.06); color: var(--color-primary); }

.dash-section { margin-bottom: 1.5rem; }
.business-list { display: flex; flex-direction: column; gap: 0.25rem; }
.business-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-radius: var(--radius-md); cursor: pointer; transition: background var(--transition-fast); }
.business-item:hover { background: rgba(79, 70, 229, 0.05); }
.business-item__info strong { display: block; font-size: 0.875rem; margin-bottom: 0.125rem; color: var(--color-text-primary); }
.text-muted { color: var(--color-text-secondary); font-size: 0.8125rem; }
.chart-wrapper { height: 220px; padding: 0.5rem 0; }
</style>
