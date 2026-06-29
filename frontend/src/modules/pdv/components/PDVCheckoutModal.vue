<template>
  <AppModal :open="open" title="Finalizar Venda" @close="$emit('close')">
    <div class="checkout-resumo">
      <h3>Resumo da Venda</h3>
      <div v-for="item in itens" :key="item.produto.id" class="checkout-resumo-item">
        <div class="checkout-resumo-info">
          <span>{{ item.produto.nome }} x{{ item.quantidade }}</span>
          <span v-if="item._descontoTipo" class="checkout-resumo-desconto">
            (desc.{{ item._descontoTipo === 'PERCENTUAL' ? `${item._descontoValor ?? 0}%` : `R$ ${Number(item._descontoValor ?? 0).toFixed(2)}` }})
          </span>
        </div>
        <span class="checkout-resumo-valor">{{ formatCurrency(totalItem(item)) }}</span>
      </div>
      <div class="checkout-resumo-subtotal">
        <span>Subtotal</span>
        <span>{{ formatCurrency(subtotal) }}</span>
      </div>
      <div v-if="descontoTotalTipo && Number(descontoTotalValor) > 0" class="checkout-resumo-desconto-total">
        <span>Desconto total ({{ descontoTotalTipo === 'PERCENTUAL' ? `${descontoTotalValor}%` : `R$ ${Number(descontoTotalValor).toFixed(2)}` }})</span>
        <span class="checkout-resumo-desconto-valor">-{{ formatCurrency(subtotal - total) }}</span>
      </div>
      <div class="checkout-resumo-total">
        <strong>Total a pagar</strong>
        <strong class="checkout-resumo-total-valor">{{ formatCurrency(total) }}</strong>
      </div>
    </div>

    <div class="checkout-form">
      <AppSelect
        v-model="metodo"
        label="Forma de Pagamento"
        :options="metodoOptions"
      />
      <AppInput
        v-if="metodo === 'DINHEIRO'"
        v-model="valorPago"
        label="Valor Recebido"
        type="number"
        step="0.01"
        min="0"
      />
      <div v-if="metodo === 'DINHEIRO' && Number(valorPago) >= total" class="troco-display">
        <span>Troco</span>
        <strong>{{ formatCurrency(Number(valorPago) - total) }}</strong>
      </div>
      <details class="checkout-agendamento">
        <summary class="checkout-agendamento-summary">Agendar para outra data/hora</summary>
        <div class="checkout-agendamento-grid">
          <AppInput v-model="agendamentoData" label="Data" type="date" />
          <AppInput v-model="agendamentoHora" label="Hora" type="time" />
        </div>
      </details>
      <AppInput v-model="observacao" label="Observação (opcional)" />
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="$emit('close')">Cancelar</AppButton>
      <AppButton :loading="loading" @click="confirmar">Confirmar Venda - {{ formatCurrency(total) }}</AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { calcularPrecoFinal } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';

const props = defineProps<{
  open: boolean;
  itens: Array<{
    produto: { id: string; nome: string; preco: number; tipoDesconto?: string | null; valorDesconto?: number };
    quantidade: number;
    _descontoTipo?: string;
    _descontoValor?: number;
  }>;
  descontoTotalTipo: string;
  descontoTotalValor: number;
}>();

const emit = defineEmits<{
  confirmar: [dados: { metodo: string; valorPago?: number; observacao?: string; agendadoPara?: string }];
  close: [];
}>();

const metodo = ref('DINHEIRO');
const valorPago = ref('');
const observacao = ref('');
const agendamentoData = ref('');
const agendamentoHora = ref('');
const loading = ref(false);

const metodoOptions = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
];

function precoItemComDesconto(item: any): number {
  let preco = calcularPrecoFinal(item.produto);
  if (item._descontoTipo && item._descontoValor && item._descontoValor > 0) {
    if (item._descontoTipo === 'FIXO') preco = Math.max(0, preco - item._descontoValor);
    if (item._descontoTipo === 'PERCENTUAL') preco = Math.max(0, preco - (preco * item._descontoValor / 100));
  }
  return Math.round(preco * 100) / 100;
}

function totalItem(item: any): number {
  return precoItemComDesconto(item) * item.quantidade;
}

const subtotal = computed(() =>
  Math.round(props.itens.reduce((acc, item) => acc + totalItem(item), 0) * 100) / 100,
);

const total = computed(() => {
  let valor = subtotal.value;
  if (props.descontoTotalTipo && props.descontoTotalValor && props.descontoTotalValor > 0) {
    if (props.descontoTotalTipo === 'FIXO') valor = Math.max(0, valor - props.descontoTotalValor);
    if (props.descontoTotalTipo === 'PERCENTUAL') valor = Math.max(0, valor - (valor * props.descontoTotalValor / 100));
  }
  return Math.round(valor * 100) / 100;
});

watch(() => props.open, (val) => {
  if (val) {
    metodo.value = 'DINHEIRO';
    valorPago.value = '';
    observacao.value = '';
    agendamentoData.value = '';
    agendamentoHora.value = '';
    loading.value = false;
  }
});

async function confirmar() {
  let agendadoPara: string | undefined;
  if (agendamentoData.value && agendamentoHora.value) {
    agendadoPara = `${agendamentoData.value}T${agendamentoHora.value}:00.000Z`;
  } else if (agendamentoData.value) {
    agendadoPara = `${agendamentoData.value}T00:00:00.000Z`;
  }
  loading.value = true;
  emit('confirmar', {
    metodo: metodo.value,
    valorPago: valorPago.value ? parseFloat(valorPago.value) : undefined,
    observacao: observacao.value || undefined,
    agendadoPara,
  });
  loading.value = false;
}
</script>

<style scoped>
.checkout-resumo { margin-bottom: 1.5rem; }
.checkout-resumo h3 { font-size: 0.9375rem; margin-bottom: 0.75rem; }
.checkout-resumo-item { display: flex; justify-content: space-between; padding: 0.375rem 0; font-size: 0.8125rem; border-bottom: 1px solid var(--color-border-light); }
.checkout-resumo-info { display: flex; flex-direction: column; gap: 0.125rem; }
.checkout-resumo-desconto { font-size: 0.6875rem; color: var(--color-danger); }
.checkout-resumo-valor { font-weight: 600; white-space: nowrap; }
.checkout-resumo-subtotal { display: flex; justify-content: space-between; padding: 0.5rem 0 0.25rem; font-size: 0.8125rem; color: var(--color-text-muted); }
.checkout-resumo-desconto-total { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.8125rem; color: var(--color-danger); }
.checkout-resumo-desconto-valor { font-weight: 600; }
.checkout-resumo-total { display: flex; justify-content: space-between; padding-top: 0.75rem; font-size: 1rem; border-top: 2px solid var(--color-border-light); }
.checkout-resumo-total-valor { font-size: 1.25rem; color: var(--color-primary); }
.checkout-form { display: flex; flex-direction: column; gap: 0.75rem; }
.checkout-agendamento { border: 1px solid var(--color-border-light); border-radius: var(--radius-md); padding: 0.5rem 0.75rem; }
.checkout-agendamento-summary { font-size: 0.8125rem; font-weight: 500; cursor: pointer; color: var(--color-text-secondary); }
.checkout-agendamento-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem; }
.troco-display { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--color-bg-tertiary); border-radius: var(--radius-md); font-size: 0.9375rem; }
.troco-display strong { color: var(--color-primary); font-size: 1.125rem; }
</style>
