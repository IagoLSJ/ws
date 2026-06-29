<template>
  <div class="pdv-carrinho">
    <div class="pdv-carrinho-header">
      <h2>Carrinho</h2>
      <span class="pdv-carrinho-qtd">{{ itens.length }} itens</span>
    </div>

    <div v-if="!itens.length" class="pdv-carrinho-empty">
      Carrinho vazio. Selecione um produto.
    </div>

    <div v-else class="pdv-carrinho-body">
      <div v-for="item in itens" :key="item.produto.id" class="pdv-carrinho-item">
        <div class="pdv-item-header">
          <div class="pdv-item-info">
            <span class="pdv-item-nome">{{ item.produto.nome }}</span>
            <span class="pdv-item-preco-base">{{ formatCurrency(precoBase(item)) }}</span>
          </div>
          <div class="pdv-item-acoes">
            <button class="pdv-qtd-btn" @click="$emit('atualizarQtd', item.produto.id, item.quantidade - 1)">-</button>
            <span class="pdv-qtd-valor">{{ item.quantidade }}</span>
            <button class="pdv-qtd-btn" @click="$emit('atualizarQtd', item.produto.id, item.quantidade + 1)">+</button>
            <button class="pdv-item-remove" @click="$emit('remover', item.produto.id)">&times;</button>
          </div>
        </div>

        <div class="pdv-item-desconto">
          <select :value="item._descontoTipo || ''" class="pdv-desc-tipo" @change="onChangeItemDescontoTipo($event, item.produto.id)">
            <option value="">Sem desc.</option>
            <option value="PERCENTUAL">%</option>
            <option value="FIXO">R$</option>
          </select>
          <input
            v-if="item._descontoTipo"
            :value="item._descontoValor ?? ''"
            type="number"
            min="0"
            step="0.01"
            class="pdv-desc-valor"
            placeholder="Valor"
            @input="onChangeItemDescontoValor($event, item.produto.id)"
          />
          <span v-if="item._descontoTipo && item._descontoValor" class="pdv-item-total-desc">{{ formatCurrency(precoComDesconto(item)) }}</span>
        </div>

        <div class="pdv-item-total">
          {{ formatCurrency(precoComDesconto(item) * item.quantidade) }}
        </div>
      </div>
    </div>

    <div class="pdv-carrinho-footer">
      <div v-if="descontoTotalTipo" class="pdv-desconto-total">
        <select :value="descontoTotalTipo" class="pdv-desc-tipo" @change="onChangeTotalTipo($event)">
          <option value="">Sem desc. total</option>
          <option value="PERCENTUAL">% total</option>
          <option value="FIXO">R$ total</option>
        </select>
        <input
          v-if="descontoTotalTipo"
          :value="descontoTotalValor || ''"
          type="number"
          min="0"
          step="0.01"
          class="pdv-desc-valor"
          placeholder="Valor"
          @input="onChangeTotalValor($event)"
        />
      </div>
      <div class="pdv-carrinho-total">
        <span>Subtotal</span>
        <strong>{{ formatCurrency(subtotal) }}</strong>
      </div>
      <div v-if="descontoTotalValor > 0" class="pdv-carrinho-desconto">
        <span>Desconto</span>
        <strong class="desconto-valor">-{{ formatCurrency(subtotal - total) }}</strong>
      </div>
      <div class="pdv-carrinho-total-final">
        <span>Total</span>
        <strong>{{ formatCurrency(total) }}</strong>
      </div>
      <AppButton class="pdv-finalizar-btn" :disabled="!itens.length" @click="$emit('finalizar')">
        Finalizar Venda
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { calcularPrecoFinal } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import AppButton from '@/shared/components/ui/AppButton.vue';

const props = defineProps<{
  itens: Array<{
    produto: { id: string; nome: string; preco: number; tipoDesconto?: string | null; valorDesconto?: number; imagens?: any[] };
    quantidade: number;
    _descontoTipo?: string;
    _descontoValor?: number;
  }>;
  descontoTotalTipo: string;
  descontoTotalValor: number;
}>();

const emit = defineEmits<{
  remover: [produtoId: string];
  atualizarQtd: [produtoId: string, quantidade: number];
  finalizar: [];
  atualizarDesconto: [produtoId: string, tipo: string, valor: number];
  atualizarDescontoTotal: [tipo: string, valor: number];
}>();

function onChangeItemDescontoTipo(event: Event, produtoId: string) {
  const tipo = (event.target as HTMLSelectElement).value;
  const item = props.itens.find((i) => i.produto.id === produtoId);
  const valor = tipo ? Number(item?._descontoValor || 0) : 0;
  emit('atualizarDesconto', produtoId, tipo, valor);
}

function onChangeItemDescontoValor(event: Event, produtoId: string) {
  const valor = parseFloat((event.target as HTMLInputElement).value) || 0;
  const item = props.itens.find((i) => i.produto.id === produtoId);
  emit('atualizarDesconto', produtoId, item?._descontoTipo || '', valor);
}

function onChangeTotalTipo(event: Event) {
  const tipo = (event.target as HTMLSelectElement).value;
  emit('atualizarDescontoTotal', tipo, tipo ? props.descontoTotalValor : 0);
}

function onChangeTotalValor(event: Event) {
  const valor = parseFloat((event.target as HTMLInputElement).value) || 0;
  emit('atualizarDescontoTotal', props.descontoTotalTipo, valor);
}

function precoBase(item: any): number {
  return calcularPrecoFinal(item.produto);
}

function precoComDesconto(item: any): number {
  let preco = precoBase(item);
  if (item._descontoTipo && item._descontoValor && item._descontoValor > 0) {
    if (item._descontoTipo === 'FIXO') preco = Math.max(0, preco - item._descontoValor);
    if (item._descontoTipo === 'PERCENTUAL') preco = Math.max(0, preco - (preco * item._descontoValor / 100));
  }
  return Math.round(preco * 100) / 100;
}

const subtotal = computed(() =>
  Math.round(props.itens.reduce((acc, item) => acc + precoComDesconto(item) * item.quantidade, 0) * 100) / 100,
);

const total = computed(() => {
  let valor = subtotal.value;
  if (props.descontoTotalTipo && props.descontoTotalValor && props.descontoTotalValor > 0) {
    if (props.descontoTotalTipo === 'FIXO') valor = Math.max(0, valor - props.descontoTotalValor);
    if (props.descontoTotalTipo === 'PERCENTUAL') valor = Math.max(0, valor - (valor * props.descontoTotalValor / 100));
  }
  return Math.round(valor * 100) / 100;
});
</script>

<style scoped>
.pdv-carrinho { display: flex; flex-direction: column; height: 100%; }
.pdv-carrinho-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border-light); }
.pdv-carrinho-header h2 { font-size: 1rem; }
.pdv-carrinho-qtd { font-size: 0.75rem; color: var(--color-text-muted); }
.pdv-carrinho-empty { padding: 2rem; text-align: center; color: var(--color-text-muted); flex: 1; display: flex; align-items: center; justify-content: center; }
.pdv-carrinho-body { flex: 1; overflow-y: auto; padding: 0.75rem 1.25rem; }
.pdv-carrinho-item { padding: 0.625rem 0; border-bottom: 1px solid var(--color-border-light); }
.pdv-item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
.pdv-item-info { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; flex: 1; }
.pdv-item-nome { font-size: 0.8125rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pdv-item-preco-base { font-size: 0.6875rem; color: var(--color-text-muted); }
.pdv-item-acoes { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }
.pdv-qtd-btn { width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); background: var(--color-bg-tertiary); font-size: 0.875rem; font-weight: 600; color: var(--color-text-secondary); }
.pdv-qtd-btn:hover { background: var(--color-border-light); }
.pdv-qtd-valor { font-size: 0.875rem; font-weight: 600; min-width: 1.5rem; text-align: center; }
.pdv-item-remove { font-size: 1rem; color: var(--color-text-muted); padding: 0.125rem; margin-left: 0.25rem; }
.pdv-item-remove:hover { color: var(--color-danger); }
.pdv-item-desconto { display: flex; align-items: center; gap: 0.375rem; margin-top: 0.375rem; }
.pdv-desc-tipo { font-size: 0.6875rem; padding: 0.125rem 0.25rem; border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); background: var(--color-bg-secondary); color: var(--color-text-secondary); width: auto; }
.pdv-desc-valor { width: 70px; font-size: 0.6875rem; padding: 0.125rem 0.375rem; border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); background: var(--color-bg-secondary); color: var(--color-text-primary); }
.pdv-item-total-desc { font-size: 0.75rem; font-weight: 700; color: var(--color-primary); margin-left: auto; }
.pdv-item-total { font-size: 0.8125rem; font-weight: 700; text-align: right; margin-top: 0.25rem; }
.pdv-carrinho-footer { padding: 1rem 1.25rem; border-top: 1px solid var(--color-border-light); }
.pdv-desconto-total { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.75rem; }
.pdv-carrinho-total { display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; }
.pdv-carrinho-desconto { display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; color: var(--color-danger); }
.desconto-valor { color: var(--color-danger); }
.pdv-carrinho-total-final { display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0 0.75rem; font-size: 1rem; }
.pdv-carrinho-total-final strong { font-size: 1.25rem; color: var(--color-primary); }
.pdv-finalizar-btn { width: 100%; }
</style>
