<template>
  <div class="checkout-page">
    <div class="vitrine-cover" :style="{ backgroundImage: negocio?.bannerUrl ? `url(${negocio.bannerUrl})` : 'none' }">
      <div class="vitrine-cover-overlay">
        <div class="vitrine-cover-content">
          <div class="vitrine-store">
            <router-link :to="`/vitrine/${slug}`" class="checkout-back">
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

    <div class="checkout-body">
      <div v-if="loading" class="checkout-loading">
        <div class="spinner" />
        <span>Carregando...</span>
      </div>

      <template v-else-if="!itens.length">
        <div class="checkout-empty">
          <p>Carrinho vazio.</p>
          <AppButton @click="router.push(`/vitrine/${slug}`)">Ver Cardápio</AppButton>
        </div>
      </template>

      <template v-else>
        <h2 class="checkout-section-title">Finalizar Pedido</h2>

        <div class="checkout-grid">
          <div class="checkout-items">
            <h3>Itens ({{ carrinho.quantidadeTotal }})</h3>
            <div v-for="item in itens" :key="item.id" class="checkout-item" :style="{ borderLeftColor: YELLOW }">
              <div class="checkout-item-info">
                <strong>{{ item.produto.nome }}</strong>
                <span class="checkout-item-qtd">x{{ item.quantidade }}</span>
                <div v-if="item.opcoesSelecionadas?.length" class="checkout-item-opcoes">
                  <span v-for="op in item.opcoesSelecionadas" :key="op.id">
                    {{ op.opcao.nome }}
                    <span v-if="Number(op.opcao.precoExtra) > 0">(+{{ formatCurrency(Number(op.opcao.precoExtra)) }})</span>
                  </span>
                </div>
              </div>
              <span class="checkout-item-preco">{{ formatCurrency(precoTotal(item)) }}</span>
            </div>

            <div class="checkout-total-row" v-if="taxaFrete > 0 && tipoEntrega === 'ENTREGA'">
              <span>Frete</span>
              <span>{{ formatCurrency(taxaFrete) }}</span>
            </div>

            <div class="checkout-total">
              <strong>Total</strong>
              <strong>{{ formatCurrency(totalComFrete) }}</strong>
            </div>
          </div>

          <div class="checkout-form">
            <h3>Tipo de Entrega</h3>
            <div class="entrega-opcoes">
              <label :class="['entrega-radio', { 'entrega-radio--active': tipoEntrega === 'RETIRADA' }]">
                <input type="radio" v-model="tipoEntrega" value="RETIRADA" />
                <div class="entrega-radio-content">
                  <strong>Retirada no local</strong>
                  <span>Sem taxa de entrega</span>
                </div>
              </label>
              <label :class="['entrega-radio', { 'entrega-radio--active': tipoEntrega === 'ENTREGA' }]">
                <input type="radio" v-model="tipoEntrega" value="ENTREGA" />
                <div class="entrega-radio-content">
                  <strong>Entrega</strong>
                  <span v-if="taxaFrete > 0">Taxa: {{ formatCurrency(taxaFrete) }}</span>
                  <span v-else>Grátis</span>
                </div>
              </label>
            </div>

            <template v-if="tipoEntrega === 'ENTREGA'">
              <h3>Endereço de Entrega</h3>
              <div class="endereco-grid">
                <AppInput v-model="endereco.logradouro" label="Logradouro" />
                <AppInput v-model="endereco.numero" label="Número" />
                <AppInput v-model="endereco.complemento" label="Complemento" />
                <AppInput v-model="endereco.bairro" label="Bairro" />
                <AppInput v-model="endereco.cidade" label="Cidade" />
                <AppInput v-model="endereco.estado" label="Estado" />
                <AppInput v-model="endereco.cep" label="CEP" />
              </div>
            </template>

            <AppInput v-model="form.contato" label="Telefone / Contato" placeholder="(11) 99999-8888" />

            <h3>Pagamento</h3>
            <AppSelect
              v-model="form.metodoPagamento"
              label="Forma de pagamento"
              :options="metodoOptions"
            />
            <AppInput
              v-if="form.metodoPagamento === 'DINHEIRO'"
              v-model="form.trocoPara"
              label="Troco para"
              type="number"
              min="0"
              step="0.01"
            />

            <div class="agendamento-section">
              <h3>Agendamento</h3>
              <p class="agendamento-desc">Defina uma data e hora para retirada ou entrega do pedido.</p>
              <div class="agendamento-grid">
                <AppInput v-model="form.dataAgendada" label="Data" type="date" />
                <AppInput v-model="form.horaAgendada" label="Hora" type="time" />
              </div>
            </div>

            <AppInput
              v-model="form.observacao"
              label="Observação (opcional)"
              placeholder="Ex: Deixar na portaria"
            />
            <p v-if="erro" class="checkout-erro">{{ erro }}</p>
            <AppButton :loading="finalizando" class="checkout-btn" @click="finalizar">
              Confirmar Pedido - {{ formatCurrency(totalComFrete) }}
            </AppButton>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCarrinhoStore } from '@/app/stores/carrinho.store';
import api from '@/shared/utils/api';
import { MetodoPagamento, calcularPrecoFinal } from '@/shared/utils/types';
import type { CarrinhoItem, Negocio } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';

const YELLOW = '#ffd401';

const route = useRoute();
const router = useRouter();
const carrinho = useCarrinhoStore();
const slug = route.params.slug as string;

const negocio = ref<Negocio | null>(null);
const loading = ref(true);
const finalizando = ref(false);
const erro = ref('');
const taxaFrete = ref(0);
const tipoEntrega = ref<'RETIRADA' | 'ENTREGA'>('ENTREGA');

const form = reactive({
  metodoPagamento: MetodoPagamento.PIX,
  trocoPara: '',
  observacao: '',
  contato: '',
  dataAgendada: '',
  horaAgendada: '',
});

const endereco = reactive({
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
});

const itens = ref<CarrinhoItem[]>([]);

const metodoOptions = [
  { value: MetodoPagamento.PIX, label: 'PIX' },
  { value: MetodoPagamento.DINHEIRO, label: 'Dinheiro' },
  { value: MetodoPagamento.CARTAO_CREDITO, label: 'Cartão de Crédito' },
  { value: MetodoPagamento.CARTAO_DEBITO, label: 'Cartão de Débito' },
];

const totalComFrete = computed(() => {
  const totalItens = carrinho.total;
  if (tipoEntrega.value === 'ENTREGA' && taxaFrete.value > 0) {
    return totalItens + taxaFrete.value;
  }
  return totalItens;
});

function precoTotal(item: CarrinhoItem): number {
  const base = calcularPrecoFinal(item.produto);
  const extra = item.opcoesSelecionadas?.reduce((s, o) => s + Number(o.opcao.precoExtra), 0) ?? 0;
  return (base + extra) * item.quantidade;
}

async function finalizar() {
  erro.value = '';
  finalizando.value = true;
  try {
    const enderecoEntrega: Record<string, string> = {};
    if (tipoEntrega.value === 'ENTREGA') {
      for (const [k, v] of Object.entries(endereco)) {
        if (v) enderecoEntrega[k] = v;
      }
    }

    let agendadoPara: string | undefined;
    if (form.dataAgendada) {
      agendadoPara = form.horaAgendada
        ? `${form.dataAgendada}T${form.horaAgendada}:00.000Z`
        : `${form.dataAgendada}T00:00:00.000Z`;
    }

    const { data } = await api.post(`/vitrine/${slug}/pedidos/checkout`, {
      tipoEntrega: tipoEntrega.value,
      metodoPagamento: form.metodoPagamento,
      trocoPara: form.trocoPara ? parseFloat(form.trocoPara) : undefined,
      observacao: form.observacao || undefined,
      contato: form.contato || undefined,
      enderecoEntrega: Object.keys(enderecoEntrega).length ? enderecoEntrega : undefined,
      agendadoPara,
    }, {
      params: { sessionId: carrinho.sessionId },
    });
    carrinho.limpar();
    router.push(`/vitrine/${slug}/pedido/${data.id}`);
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao finalizar pedido';
    erro.value = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    finalizando.value = false;
  }
}

onMounted(async () => {
  await carrinho.fetchCarrinho(slug);

  try {
    const { data } = await api.get(`/vitrine/${slug}`);
    negocio.value = data.negocio;
    taxaFrete.value = Number(data.negocio.configuracoes?.taxaFrete ?? 0);
  } catch {}

  itens.value = carrinho.itens;
  loading.value = false;
});
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 3rem;
  color: #1a1a1a;
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
  max-width: 900px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
}

.vitrine-store { flex: 1; min-width: 0; }

.checkout-back {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #ffd401;
  text-decoration: none;
  margin-bottom: 0.25rem;
}

.checkout-back:hover { color: #fff; }

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

/* ============= BODY ============= */
.checkout-body {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.checkout-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #888;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e0e0e0;
  border-top-color: #ffd401;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.checkout-empty { text-align: center; padding: 2rem; }
.checkout-empty p { margin-bottom: 1rem; color: #888; }

.checkout-section-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: #ffd401;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 640px) { .checkout-grid { grid-template-columns: 1fr; } }

.checkout-items {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.checkout-items h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e5e5;
  color: #1a1a1a;
}

.checkout-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e5e5;
  font-size: 0.875rem;
  border-left: 3px solid transparent;
  padding-left: 0.5rem;
}

.checkout-item:last-child { border-bottom: none; }

.checkout-item-info { flex: 1; min-width: 0; }
.checkout-item-info strong { display: block; color: #1a1a1a; }
.checkout-item-qtd { font-size: 0.75rem; color: #888; }
.checkout-item-opcoes { font-size: 0.75rem; color: #888; }
.checkout-item-opcoes span { display: block; }
.checkout-item-preco { font-weight: 600; white-space: nowrap; margin-left: 0.75rem; color: #e11d48; }

.checkout-total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.8125rem;
  color: #888;
}

.checkout-total {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  font-size: 1rem;
  border-top: 2px solid #e5e5e5;
  color: #1a1a1a;
}

.checkout-form {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.checkout-form h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e5e5;
  color: #1a1a1a;
}

.entrega-opcoes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.entrega-radio {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #1a1a1a;
}

.entrega-radio:hover { border-color: #ffd401; }

.entrega-radio--active {
  border-color: #ffd401;
  background: #fffbe6;
}

.entrega-radio input { accent-color: #ffd401; }

.entrega-radio-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.entrega-radio-content strong { font-size: 0.875rem; }

.entrega-radio-content span { font-size: 0.75rem; color: #888; }

.endereco-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.checkout-erro { font-size: 0.8125rem; color: #dc2626; margin-top: 0.5rem; }
.checkout-btn { width: 100%; margin-top: 1rem; }

.agendamento-section {
  margin-top: 1.5rem;
  background: #fffbe6;
  border: 1px solid #ffd401;
  border-radius: 10px;
  padding: 1rem;
}

.agendamento-section h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  padding-bottom: 0;
  border-bottom: none;
  color: #1a1a1a;
}

.agendamento-desc {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.75rem;
}

.agendamento-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
</style>
