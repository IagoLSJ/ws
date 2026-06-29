<template>
  <div>
    <div v-if="loading" class="loading">Carregando...</div>

    <template v-else-if="negocio">
      <div class="page-header">
        <div>
          <h1>{{ negocio.nome }}</h1>
          <p class="text-muted">/{{ negocio.slug }}</p>
        </div>
        <div class="header-actions" v-if="canManage">
          <AppButton variant="ghost" @click="router.push(`/negocios/${negocio.id}/membros`)">
            Membros
          </AppButton>
          <AppButton variant="secondary" @click="router.push(`/negocios/${negocio.id}/editar`)">
            Editar
          </AppButton>
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
        </AppCard>
        <AppCard>
          <h3>Estatísticas</h3>
          <p><strong>Membros:</strong> {{ negocio._count?.membros ?? 0 }}</p>
          <p><strong>Produtos:</strong> {{ negocio._count?.produtos ?? 0 }}</p>
          <p><strong>Categorias:</strong> {{ negocio._count?.categorias ?? 0 }}</p>
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
.text-muted { color: var(--color-text-muted); font-size: 0.875rem; }
.header-actions { display: flex; gap: 0.5rem; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.detail-grid h3 { font-size: 1rem; margin-bottom: 0.75rem; }
.detail-grid p { font-size: 0.875rem; margin-bottom: 0.5rem; }
.section { margin-bottom: 1.5rem; }
.shortcuts { display: flex; gap: 0.5rem; margin-top: 1rem; }
.loading { color: var(--color-text-muted); text-align: center; padding: 2rem; }
</style>
