<template>
  <div>
    <div v-if="loading" class="loading">Carregando...</div>

    <template v-else-if="negocio">
      <div class="page-header">
        <div class="page-header__info">
          <img v-if="negocio.logoUrl" :src="negocio.logoUrl" class="header-logo" />
          <div v-else class="header-logo-placeholder">{{ negocio.nome.charAt(0) }}</div>
          <div>
            <h1>{{ negocio.nome }}</h1>
            <p class="text-muted">/{{ negocio.slug }}</p>
          </div>
        </div>
        <div class="header-actions" v-if="canManage">
          <AppButton variant="ghost" @click="router.push(`/negocios/${negocio.id}/configuracoes`)">
            Configurações
          </AppButton>
          <AppButton variant="ghost" @click="router.push(`/negocios/${negocio.id}/membros`)">
            Membros
          </AppButton>
          <AppButton variant="secondary" @click="router.push(`/negocios/${negocio.id}/editar`)">
            Editar
          </AppButton>
        </div>
      </div>

      <div class="kpi-mini-grid">
        <div class="kpi-mini">
          <span class="kpi-mini-value">{{ negocio._count?.pedidos ?? 0 }}</span>
          <span class="kpi-mini-label">Pedidos</span>
        </div>
        <div class="kpi-mini">
          <span class="kpi-mini-value">{{ negocio._count?.produtos ?? 0 }}</span>
          <span class="kpi-mini-label">Produtos</span>
        </div>
        <div class="kpi-mini">
          <span class="kpi-mini-value">{{ negocio._count?.membros ?? 0 }}</span>
          <span class="kpi-mini-label">Membros</span>
        </div>
        <div class="kpi-mini">
          <span class="kpi-mini-value">{{ negocio._count?.categorias ?? 0 }}</span>
          <span class="kpi-mini-label">Categorias</span>
        </div>
      </div>

      <div class="detail-grid">
        <AppCard>
          <h3>Informações</h3>
          <p><strong>Descrição:</strong> {{ negocio.descricao || '-' }}</p>
          <p><strong>Status:</strong>
            <AppBadge :variant="negocio.ativo ? 'success' : 'danger'">
              {{ negocio.ativo ? 'Ativo' : 'Inativo' }}
            </AppBadge>
          </p>
          <p v-if="negocio.bannerUrl" class="mt-1">
            <strong>Banner:</strong>
            <img :src="negocio.bannerUrl" class="banner-thumb" />
          </p>
        </AppCard>
        <AppCard v-if="negocio.configuracoes">
          <h3>Configurações</h3>
          <p><strong>Telefone:</strong> {{ negocio.configuracoes.telefoneContato || '-' }}</p>
          <p><strong>Taxa de Frete:</strong> {{ formatCurrency(negocio.configuracoes.taxaFrete) }}</p>
          <p><strong>Controle de Estoque:</strong> {{ negocio.configuracoes.controleEstoqueAtivo ? 'Ativo' : 'Inativo' }}</p>
          <p><strong>Estoque Mínimo Padrão:</strong> {{ negocio.configuracoes.estoqueMinimoPadrao }} un</p>
          <p v-if="negocio.configuracoes.endereco">
            <strong>Endereço:</strong>
            {{ negocio.configuracoes.endereco.rua }}, {{ negocio.configuracoes.endereco.numero }}
            {{ negocio.configuracoes.endereco.bairro ? '- ' + negocio.configuracoes.endereco.bairro : '' }}
            {{ negocio.configuracoes.endereco.cidade ? '- ' + negocio.configuracoes.endereco.cidade : '' }}/{{ negocio.configuracoes.endereco.estado }}
          </p>
        </AppCard>
      </div>

      <div v-if="canManage" class="section">
        <AppCard>
          <h3>Atalhos</h3>
          <div class="shortcuts">
            <AppButton @click="businessStore.select(negocio); router.push('/catalogo')">
              Gerenciar Catálogo
            </AppButton>
            <AppButton @click="businessStore.select(negocio); router.push('/estoque')">
              Gerenciar Estoque
            </AppButton>
            <AppButton @click="businessStore.select(negocio); router.push('/pedidos')">
              Ver Pedidos
            </AppButton>
          </div>
        </AppCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePermissions } from '@/shared/composables/usePermissions';
import { useBusinessStore } from '@/app/stores/business.store';
import { RoleNegocio } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';

const route = useRoute();
const router = useRouter();
const businessStore = useBusinessStore();
const { can } = usePermissions();

const loading = ref(true);
const canManage = computed(() => can(RoleNegocio.GERENTE));
const negocio = computed(() => businessStore.current);

onMounted(async () => {
  try {
    const data = await businessStore.fetchOne(route.params.id as string);
    if (data) {
      businessStore.select(data);
    } else {
      router.push('/negocios');
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header__info { display: flex; align-items: center; gap: 1rem; }
.text-muted { color: var(--color-text-muted); font-size: 0.875rem; }
.header-actions { display: flex; gap: 0.5rem; }
.header-logo { width: 56px; height: 56px; border-radius: var(--radius-lg); object-fit: cover; }
.header-logo-placeholder { width: 56px; height: 56px; border-radius: var(--radius-lg); background: var(--color-brand-soft); color: var(--color-brand); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0; }

.kpi-mini-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.kpi-mini { text-align: center; padding: 1rem; background: var(--color-bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--color-border-strong); }
.kpi-mini-value { display: block; font-size: 1.25rem; font-weight: 700; }
.kpi-mini-label { font-size: 0.6875rem; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.25rem; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.detail-grid h3 { font-size: 1rem; margin-bottom: 0.75rem; }
.detail-grid p { font-size: 0.875rem; margin-bottom: 0.5rem; }
.mt-1 { margin-top: 0.5rem; }
.banner-thumb { display: block; max-width: 200px; margin-top: 0.375rem; border-radius: var(--radius-md); }
.section { margin-bottom: 1.5rem; }
.shortcuts { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
.loading { color: var(--color-text-muted); text-align: center; padding: 2rem; }
</style>
