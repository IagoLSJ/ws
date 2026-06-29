<template>
  <div class="confirmado-page">
    <div class="vitrine-cover" :style="{ backgroundImage: negocio?.bannerUrl ? `url(${negocio.bannerUrl})` : 'none' }">
      <div class="vitrine-cover-overlay">
        <div class="vitrine-cover-content">
          <div class="vitrine-store">
            <router-link :to="`/vitrine/${slug}`" class="confirmado-back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Voltar ao cardápio
            </router-link>
            <h1 class="vitrine-title">{{ negocio?.nome || '' }}</h1>
            <p v-if="negocio?.descricao" class="vitrine-desc">{{ negocio.descricao }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="confirmado-loading">
      <div class="spinner" />
      <span>Carregando...</span>
    </div>

    <div v-else-if="erro" class="confirmado-erro">
      <p>{{ erro }}</p>
      <AppButton @click="router.push(`/vitrine/${slug}`)">Voltar ao cardápio</AppButton>
    </div>

    <template v-else-if="pedido">
      <div class="confirmado-body">
        <div class="confirmado-success">
          <div class="confirmado-icon">&#10003;</div>
          <h1>Pedido Confirmado!</h1>
          <p class="confirmado-sub">Seu pedido foi recebido e está sendo processado.</p>
        </div>

        <div class="confirmado-card">
          <div class="confirmado-row">
            <span class="confirmado-label">Pedido</span>
            <strong>#{{ pedido.id.slice(0, 8) }}</strong>
          </div>
          <div class="confirmado-row">
            <span class="confirmado-label">Status</span>
            <AppBadge :variant="statusVariant">{{ statusLabel }}</AppBadge>
          </div>
          <div class="confirmado-row">
            <span class="confirmado-label">Tipo</span>
            <span>{{ pedido.tipoEntrega === 'RETIRADA' ? 'Retirada no local' : 'Entrega' }}</span>
          </div>
          <div class="confirmado-row" v-if="pedido.taxaFrete && Number(pedido.taxaFrete) > 0">
            <span class="confirmado-label">Frete</span>
            <span>{{ formatCurrency(Number(pedido.taxaFrete)) }}</span>
          </div>
          <div class="confirmado-row">
            <span class="confirmado-label">Pagamento</span>
            <span>{{ metodoLabel }} - {{ statusPagamentoLabel }}</span>
          </div>
          <div class="confirmado-row" v-if="pedido.agendadoPara">
            <span class="confirmado-label">Agendado para</span>
            <span>{{ formatAgendamento(pedido.agendadoPara) }}</span>
          </div>
          <div class="confirmado-row">
            <span class="confirmado-label">Total</span>
            <strong>{{ formatCurrency(Number(pedido.total)) }}</strong>
          </div>
        </div>

        <div v-if="pedido.tipoEntrega === 'ENTREGA' && pedido.endereco" class="confirmado-card">
          <h3 class="card-title">Endereço de Entrega</h3>
          <p v-if="pedido.endereco.logradouro">
            {{ pedido.endereco.logradouro }}, {{ pedido.endereco.numero }}
            <span v-if="pedido.endereco.complemento"> - {{ pedido.endereco.complemento }}</span>
          </p>
          <p v-if="pedido.endereco.bairro">{{ pedido.endereco.bairro }}</p>
          <p v-if="pedido.endereco.cidade">{{ pedido.endereco.cidade }}{{ pedido.endereco.estado ? ' - ' + pedido.endereco.estado : '' }}</p>
          <p v-if="pedido.endereco.cep">CEP: {{ pedido.endereco.cep }}</p>
          <p v-if="pedido.contato" class="contato">Contato: {{ pedido.contato }}</p>
        </div>

        <div class="confirmado-card">
          <h3 class="card-title">Itens</h3>
          <div v-for="item in pedido.itens" :key="item.id" class="confirmado-item">
            <div class="confirmado-item-info">
              <strong>{{ item.produtoNome }}</strong>
              <span class="confirmado-item-qtd">x{{ item.quantidade }}</span>
            </div>
            <span class="confirmado-item-preco">{{ formatCurrency(Number(item.precoUnitario) * item.quantidade) }}</span>
          </div>
        </div>

        <div class="confirmado-actions">
          <AppButton @click="router.push(`/vitrine/${slug}`)">
            Fazer novo pedido
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import type { Negocio, Pedido } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;

const negocio = ref<Negocio | null>(null);
const pedido = ref<Pedido | null>(null);
const loading = ref(true);
const erro = ref('');

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    PENDENTE: 'Pendente',
    CONFIRMADO: 'Confirmado',
    PREPARANDO: 'Preparando',
    PRONTO: 'Pronto',
    SAIU_PARA_ENTREGA: 'Saiu para entrega',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
  };
  return map[pedido.value?.status ?? ''] || pedido.value?.status || '';
});

const statusVariant = computed(() => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    PENDENTE: 'warning',
    CONFIRMADO: 'info',
    PREPARANDO: 'info',
    PRONTO: 'success',
    SAIU_PARA_ENTREGA: 'success',
    ENTREGUE: 'success',
    CANCELADO: 'danger',
  };
  return map[pedido.value?.status ?? ''] || 'neutral';
});

const metodoLabel = computed(() => {
  const pag = pedido.value?.pagamentos?.[0];
  if (!pag) return '-';
  const map: Record<string, string> = {
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de Crédito',
    CARTAO_DEBITO: 'Cartão de Débito',
    PIX: 'PIX',
    OUTRO: 'Outro',
  };
  return map[pag.metodo] || pag.metodo;
});

const statusPagamentoLabel = computed(() => {
  const pag = pedido.value?.pagamentos?.[0];
  if (!pag) return '-';
  const map: Record<string, string> = {
    PENDENTE: 'Pendente',
    APROVADO: 'Aprovado',
    RECUSADO: 'Recusado',
    CANCELADO: 'Cancelado',
    ESTORNADO: 'Estornado',
  };
  return map[pag.status] || pag.status;
});

function formatAgendamento(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(async () => {
  try {
    const [negocioRes, pedidoRes] = await Promise.all([
      api.get(`/vitrine/${slug}`).catch(() => null),
      api.get<Pedido>(`/vitrine/${slug}/pedidos/${route.params.pedidoId}`),
    ]);
    if (negocioRes) negocio.value = negocioRes.data.negocio;
    pedido.value = pedidoRes.data;
  } catch {
    erro.value = 'Pedido não encontrado.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.confirmado-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 3rem;
}

/* ============= COVER ============= */
.vitrine-cover {
  position: relative;
  height: 160px;
  background-size: cover;
  background-position: center;
  background-color: #333;
}

.vitrine-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7));
  display: flex;
  align-items: flex-end;
}

.vitrine-cover-content {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
}

.vitrine-store { flex: 1; min-width: 0; }

.confirmado-back {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #ffd401;
  text-decoration: none;
  margin-bottom: 0.25rem;
}

.confirmado-back:hover { color: #fff; }

.vitrine-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.vitrine-desc {
  font-size: 0.8125rem;
  opacity: 0.75;
  margin-top: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.confirmado-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--color-text-muted);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border-light);
  border-top-color: #ffd401;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.confirmado-erro { text-align: center; padding: 2rem; }
.confirmado-erro p { margin-bottom: 1rem; color: var(--color-text-muted); }

.confirmado-body {
  max-width: 520px;
  margin: 0 auto;
  padding: 1.5rem;
}

.confirmado-success {
  text-align: center;
  margin-bottom: 1.5rem;
}

.confirmado-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: #22c55e;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto 0.75rem;
}

.confirmado-success h1 { font-size: 1.375rem; margin-bottom: 0.25rem; }
.confirmado-sub { color: var(--color-text-muted); font-size: 0.875rem; }

.confirmado-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.confirmado-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-border-light);
}

.confirmado-row:last-child { border-bottom: none; }
.confirmado-label { color: var(--color-text-muted); }
.confirmado-card p { font-size: 0.8125rem; margin-bottom: 0.25rem; }
.contato { margin-top: 0.5rem; font-weight: 500; }

.confirmado-item {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-border-light);
}

.confirmado-item:last-child { border-bottom: none; }
.confirmado-item-info strong { display: block; font-size: 0.8125rem; }
.confirmado-item-qtd { font-size: 0.75rem; color: var(--color-text-muted); }
.confirmado-item-preco { font-weight: 600; white-space: nowrap; margin-left: 0.75rem; }
.confirmado-actions { text-align: center; margin-top: 1.5rem; }
</style>
