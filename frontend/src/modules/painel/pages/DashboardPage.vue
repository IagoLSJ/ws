<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <div>
        <h1 class="dashboard__title">Dashboard</h1>
        <p class="dashboard__greeting">Bem-vindo(a), {{ auth.user?.nome }}</p>
      </div>
      <div class="dashboard__date">{{ dataAtual }}</div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="skeleton-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-line w-24" />
        <div class="skeleton-line w-16 h-8" />
      </div>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card" :style="{ borderTopColor: kpi.color }">
          <div class="kpi-header">
            <component :is="kpi.icon" :size="20" :color="kpi.color" weight="bold" />
            <span class="kpi-label">{{ kpi.label }}</span>
          </div>
          <span class="kpi-value">{{ kpi.value }}</span>
          <span v-if="kpi.sub" class="kpi-sub">{{ kpi.sub }}</span>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="dashboard-grid">
        <!-- Recent Orders -->
        <div class="dash-card dash-card--wide">
          <div class="dash-card__header">
            <h2>Últimos Pedidos</h2>
            <router-link v-if="hasBusiness" to="/pedidos" class="dash-card__link">Ver todos</router-link>
          </div>
          <div v-if="!pedidos.length" class="dash-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span>Nenhum pedido ainda</span>
          </div>
          <div v-else class="order-feed">
            <div v-for="p in pedidos.slice(0, 5)" :key="p.id" class="order-item" @click="router.push('/pedidos')">
              <div class="order-info">
                <span class="order-id">#{{ p.id.slice(0, 8) }}</span>
                <AppBadge size="sm">{{ p.status }}</AppBadge>
              </div>
              <span class="order-value">{{ formatCurrency(Number(p.total)) }}</span>
            </div>
          </div>
        </div>

        <!-- Stock Alerts -->
        <div class="dash-card">
          <div class="dash-card__header">
            <h2>Alertas de Estoque</h2>
            <router-link v-if="hasBusiness" to="/estoque" class="dash-card__link">Ver</router-link>
          </div>
          <div v-if="!estoqueAlertas.length" class="dash-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Estoque OK</span>
          </div>
          <div v-else class="alert-list">
            <div v-for="a in estoqueAlertas.slice(0, 5)" :key="a.id" class="alert-item">
              <span class="alert-name">{{ a.produto?.nome }}</span>
              <span class="alert-qty">{{ a.quantidadeAtual }} {{ a.unidade }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="dash-card">
          <div class="dash-card__header">
            <h2>Ações Rápidas</h2>
          </div>
          <div class="quick-actions">
            <router-link v-if="canGerente" to="/catalogo/novo" class="quick-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Novo Produto
            </router-link>
            <router-link to="/catalogo" class="quick-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>
              </svg>
              Gerenciar Catálogo
            </router-link>
            <router-link to="/pedidos" class="quick-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
              Ver Pedidos
            </router-link>
            <router-link to="/estoque" class="quick-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Estoque
            </router-link>
          </div>
        </div>
      </div>

      <!-- Business List (Super Admin) -->
      <AppCard v-if="auth.user?.membros?.some(m => m.role === RoleNegocio.SUPER_ADMIN)" class="dash-section">
        <div class="dash-card__header">
          <h2>Seus Negócios</h2>
        </div>
        <div v-if="!businessStore.businesses.length" class="dash-empty">Nenhum negócio encontrado.</div>
        <div v-else class="business-list">
          <div v-for="b in businessStore.businesses" :key="b.id" class="business-item" @click="router.push('/negocios/' + b.id)">
            <div class="business-item__info">
              <strong>{{ b.nome }}</strong>
              <span class="text-muted">{{ b.slug }}</span>
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
import { RoleNegocio, StatusPedido } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { PhReceipt, PhBell, PhBuildings, PhCube } from '@phosphor-icons/vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';

const router = useRouter();
const auth = useAuthStore();
const businessStore = useBusinessStore();
const { can } = usePermissions();

const loading = ref(true);
const pedidos = ref<any[]>([]);
const estoqueAlertas = ref<any[]>([]);

const canGerente = computed(() => can(RoleNegocio.GERENTE));
const hasBusiness = computed(() => !!businessStore.businessId());

const dataAtual = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

const kpis = computed(() => {
  const totalPedidos = pedidos.value.length;
  const pendentes = pedidos.value.filter((p) => p.status === StatusPedido.PENDENTE).length;
  const alertasCount = estoqueAlertas.value.length;
  const businessCount = businessStore.businesses.length;
  const productsFromBusinessCount = 0

  return [
    {
      label: 'Pedidos Hoje',
      value: totalPedidos,
      sub: pendentes > 0 ? `${pendentes} pendentes` : undefined,
      icon: PhReceipt,
      color: 'var(--color-primary)',
    },
    {
      label: 'Alertas Estoque',
      value: alertasCount,
      sub: alertasCount > 0 ? 'Atenção necessária' : 'Tudo ok',
      icon: PhBell,
      color: alertasCount > 0 ? 'var(--color-danger)' : 'var(--color-success)',
    },
    {
      label: 'Negócios',
      value: businessCount,
      icon: PhBuildings,
      color: 'var(--color-warning)',
    },
    {
      label: 'Produtos',
      value: productsFromBusinessCount,
      icon: PhCube,
      color: 'var(--color-info)',
    },
  ];
});

onMounted(async () => {
  loading.value = true;
  try {
    if (auth.user?.membros?.some((m) => m.role === RoleNegocio.SUPER_ADMIN)) {
      await businessStore.fetchAll();
    }

    const bid = businessStore.businessId();
    if (bid) {
      const [pedidosRes, alertasRes] = await Promise.all([
        api.get(`/negocios/${bid}/pedidos`).catch(() => ({ data: [] })),
        api.get(`/negocios/${bid}/estoque/alertas`).catch(() => ({ data: [] })),
      ]);
      pedidos.value = pedidosRes.data;
      estoqueAlertas.value = alertasRes.data;
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard { max-width: 1200px; }
.dashboard__header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
.dashboard__title { font-size: 1.375rem; font-weight: 700; margin-bottom: 0.125rem; }
.dashboard__greeting { font-size: 0.875rem; color: var(--color-text-muted); }
.dashboard__date { font-size: 0.8125rem; color: var(--color-text-muted); padding-top: 0.25rem; }

/* Skeleton */
.skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.skeleton-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  border: 1px solid var(--color-border-light);
}
.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, var(--color-bg-tertiary) 25%, #e5e7eb 50%, var(--color-bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.w-24 { width: 6rem; }
.w-16 { width: 4rem; }
.h-8 { height: 2rem; }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
@media (max-width: 768px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
.kpi-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  border: 1px solid var(--color-border-light);
  border-top: 3px solid;
}
.kpi-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.kpi-label { font-size: 0.75rem; font-weight: 500; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.kpi-value { display: block; font-size: 1.625rem; font-weight: 700; line-height: 1; }
.kpi-sub { display: block; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem; }

/* Dashboard Grid */
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.dash-card--wide { grid-column: 1 / -1; }
@media (min-width: 768px) { .dash-card--wide { grid-column: span 2; } }

.dash-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  border: 1px solid var(--color-border-light);
}
.dash-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.dash-card__header h2 { font-size: 0.9375rem; font-weight: 600; }
.dash-card__link { font-size: 0.8125rem; color: var(--color-primary); font-weight: 500; }
.dash-card__link:hover { text-decoration: underline; }
.dash-empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--color-text-muted); font-size: 0.8125rem; }

/* Order Feed */
.order-feed { display: flex; flex-direction: column; gap: 0.25rem; }
.order-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.625rem 0.75rem; border-radius: var(--radius-md);
  cursor: pointer; transition: background var(--transition-fast);
}
.order-item:hover { background: var(--color-bg-tertiary); }
.order-info { display: flex; align-items: center; gap: 0.5rem; }
.order-id { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-primary); font-family: monospace; }
.order-value { font-size: 0.8125rem; font-weight: 600; }

/* Alerts */
.alert-list { display: flex; flex-direction: column; gap: 0.25rem; }
.alert-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.5rem 0.75rem; border-radius: var(--radius-md);
  background: rgba(239,68,68,0.04);
}
.alert-name { font-size: 0.8125rem; font-weight: 500; }
.alert-qty { font-size: 0.8125rem; font-weight: 600; color: var(--color-danger); }

/* Quick Actions */
.quick-actions { display: flex; flex-direction: column; gap: 0.25rem; }
.quick-action {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.625rem 0.75rem; border-radius: var(--radius-md);
  font-size: 0.8125rem; color: var(--color-text-secondary);
  text-decoration: none; transition: all var(--transition-fast);
}
.quick-action:hover { background: var(--color-bg-tertiary); color: var(--color-primary); }

/* Business List */
.dash-section { margin-bottom: 1.5rem; }
.business-list { display: flex; flex-direction: column; gap: 0.25rem; }
.business-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem; border-radius: var(--radius-md);
  cursor: pointer; transition: background var(--transition-fast);
}
.business-item:hover { background: var(--color-bg-tertiary); }
.business-item__info strong { display: block; font-size: 0.875rem; margin-bottom: 0.125rem; }
.text-muted { color: var(--color-text-muted); font-size: 0.8125rem; }
</style>
