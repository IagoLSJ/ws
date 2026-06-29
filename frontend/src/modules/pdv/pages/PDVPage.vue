<template>
  <div class="pdv-page">
    <div class="pdv-produtos">
      <div class="pdv-header">
        <h1>PDV - Caixa</h1>
      </div>
      <PDVProdutoList @adicionar="adicionarItem" />
    </div>
    <div class="pdv-carrinho-wrapper">
      <PDVCarrinho
        :itens="carrinhoItens"
        :desconto-total-tipo="descontoTotalTipo"
        :desconto-total-valor="descontoTotalValor"
        @remover="removerItem"
        @atualizar-qtd="atualizarQtd"
        @atualizar-desconto="atualizarDescontoItem"
        @atualizar-desconto-total="atualizarDescontoTotal"
        @finalizar="abrirCheckout"
      />
    </div>
    <PDVCheckoutModal
      :open="showCheckout"
      :itens="carrinhoItens"
      :desconto-total-tipo="descontoTotalTipo"
      :desconto-total-valor="descontoTotalValor"
      @confirmar="finalizarVenda"
      @close="showCheckout = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/shared/utils/api';
import { useBusinessStore } from '@/app/stores/business.store';
import { useUiStore } from '@/app/stores/ui.store';
import type { Produto } from '@/shared/utils/types';
import PDVProdutoList from '../components/PDVProdutoList.vue';
import PDVCarrinho from '../components/PDVCarrinho.vue';
import PDVCheckoutModal from '../components/PDVCheckoutModal.vue';

interface ItemCarrinhoPDV {
  produto: Produto;
  quantidade: number;
  _descontoTipo?: string;
  _descontoValor?: number;
}

const businessStore = useBusinessStore();
const ui = useUiStore();
const carrinhoItens = ref<ItemCarrinhoPDV[]>([]);
const showCheckout = ref(false);
const descontoTotalTipo = ref('');
const descontoTotalValor = ref(0);

function adicionarItem(produto: Produto) {
  const existing = carrinhoItens.value.find((i) => i.produto.id === produto.id);
  if (existing) {
    existing.quantidade++;
  } else {
    carrinhoItens.value.push({ produto, quantidade: 1 });
  }
  ui.addToast(`${produto.nome} adicionado`, 'success');
}

function removerItem(produtoId: string) {
  carrinhoItens.value = carrinhoItens.value.filter((i) => i.produto.id !== produtoId);
}

function atualizarQtd(produtoId: string, qtd: number) {
  const item = carrinhoItens.value.find((i) => i.produto.id === produtoId);
  if (!item) return;
  if (qtd <= 0) {
    removerItem(produtoId);
    return;
  }
  item.quantidade = qtd;
}

function atualizarDescontoItem(produtoId: string, tipo: string, valor: number) {
  const item = carrinhoItens.value.find((i) => i.produto.id === produtoId);
  if (!item) return;
  item._descontoTipo = tipo || undefined;
  item._descontoValor = tipo ? valor : undefined;
}

function atualizarDescontoTotal(tipo: string, valor: number) {
  descontoTotalTipo.value = tipo;
  descontoTotalValor.value = valor;
}

function abrirCheckout() {
  if (!carrinhoItens.value.length) {
    ui.addToast('Carrinho vazio', 'warning');
    return;
  }
  showCheckout.value = true;
}

async function finalizarVenda(dados: { metodo: string; valorPago?: number; observacao?: string; agendadoPara?: string }) {
  try {
    const bid = businessStore.businessId();
    const payload: any = {
      itens: carrinhoItens.value.map((i) => ({
        produtoId: i.produto.id,
        quantidade: i.quantidade,
        ...(i._descontoTipo ? { desconto: { tipo: i._descontoTipo, valor: i._descontoValor } } : {}),
      })),
      pagamento: {
        metodo: dados.metodo,
        valorPago: dados.valorPago,
      },
      observacao: dados.observacao,
      agendadoPara: dados.agendadoPara,
    };
    if (descontoTotalTipo.value && descontoTotalValor.value > 0) {
      payload.descontoTotal = { tipo: descontoTotalTipo.value, valor: descontoTotalValor.value };
    }
    await api.post(`/negocios/${bid}/pdv/checkout`, payload);
    ui.addToast('Venda finalizada com sucesso!', 'success');
    carrinhoItens.value = [];
    descontoTotalTipo.value = '';
    descontoTotalValor.value = 0;
    showCheckout.value = false;
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao finalizar venda';
    ui.addToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
  }
}
</script>

<style scoped>
.pdv-page {
  display: grid;
  grid-template-columns: 1fr 380px;
  height: calc(100vh - 2rem);
  gap: 1rem;
}
.pdv-header { margin-bottom: 1rem; }
.pdv-header h1 { font-size: 1.25rem; }
.pdv-carrinho-wrapper {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
