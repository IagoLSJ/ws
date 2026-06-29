<template>
  <Teleport to="body">
    <transition name="drawer">
      <div v-if="carrinho.aberto" class="drawer-overlay" @click.self="carrinho.fechar()">
        <aside class="drawer">
          <div class="drawer-header">
            <h2>Carrinho ({{ carrinho.quantidadeTotal }})</h2>
            <button class="drawer-close" @click="carrinho.fechar()">&times;</button>
          </div>

          <div v-if="carrinho.loading" class="drawer-loading">Carregando...</div>

          <div v-else-if="!carrinho.itens.length" class="drawer-empty">
            Carrinho vazio
          </div>

          <div v-else class="drawer-body">
            <div v-for="item in carrinho.itens" :key="item.id" class="cart-item">
              <div class="cart-item-info">
                <strong>{{ item.produto.nome }}</strong>
                <div v-if="item.opcoesSelecionadas?.length" class="cart-item-opcoes">
                  <span v-for="op in item.opcoesSelecionadas" :key="op.id">
                    {{ op.opcao.nome }}
                    <span v-if="Number(op.opcao.precoExtra) > 0">(+{{ formatCurrency(Number(op.opcao.precoExtra)) }})</span>
                  </span>
                </div>
                <div v-if="item.observacao" class="cart-item-obs">{{ item.observacao }}</div>
              </div>
              <div class="cart-item-actions">
                <div class="cart-item-qtd">
                  <button class="qtd-btn" @click="diminuir(item)">-</button>
                  <span>{{ item.quantidade }}</span>
                  <button class="qtd-btn" @click="aumentar(item)">+</button>
                </div>
                <span class="cart-item-preco">{{ formatCurrency(precoItem(item)) }}</span>
                <button class="cart-item-remove" @click="remover(item)">&times;</button>
              </div>
            </div>
          </div>

          <div v-if="carrinho.itens.length" class="drawer-footer">
            <div class="drawer-total">
              <span>Total</span>
              <strong>{{ formatCurrency(carrinho.total) }}</strong>
            </div>
            <AppButton class="drawer-checkout-btn" @click="irParaCheckout">
              Finalizar Pedido
            </AppButton>
          </div>
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useCarrinhoStore } from '@/app/stores/carrinho.store';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import type { CarrinhoItem } from '@/shared/utils/types';
import { calcularPrecoFinal } from '@/shared/utils/types';
import AppButton from '@/shared/components/ui/AppButton.vue';

const router = useRouter();
const carrinho = useCarrinhoStore();

const props = defineProps<{ slug: string }>();

function precoItem(item: CarrinhoItem): number {
  const base = calcularPrecoFinal(item.produto);
  const extra = item.opcoesSelecionadas?.reduce((s, o) => s + Number(o.opcao.precoExtra), 0) ?? 0;
  return (base + extra) * item.quantidade;
}

async function aumentar(item: CarrinhoItem) {
  await carrinho.atualizarQuantidade(props.slug, item.id, item.quantidade + 1);
}

async function diminuir(item: CarrinhoItem) {
  if (item.quantidade <= 1) {
    await remover(item);
  } else {
    await carrinho.atualizarQuantidade(props.slug, item.id, item.quantidade - 1);
  }
}

async function remover(item: CarrinhoItem) {
  await carrinho.remover(props.slug, item.id);
}

function irParaCheckout() {
  carrinho.fechar();
  router.push(`/vitrine/${props.slug}/checkout`);
}
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  display: flex;
  justify-content: flex-end;
}
.drawer {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-secondary);
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}
.drawer-header h2 { font-size: 1.125rem; }
.drawer-close {
  font-size: 1.5rem;
  color: var(--color-text-muted);
  padding: 0.25rem;
  line-height: 1;
}
.drawer-close:hover { color: var(--color-text-primary); }
.drawer-loading, .drawer-empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}
.drawer-body { flex: 1; overflow-y: auto; padding: 1rem 1.5rem; }
.cart-item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-light);
}
.cart-item-info { flex: 1; min-width: 0; }
.cart-item-info strong { font-size: 0.875rem; display: block; }
.cart-item-opcoes { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem; }
.cart-item-opcoes span { display: block; }
.cart-item-obs { font-size: 0.75rem; color: var(--color-text-secondary); font-style: italic; margin-top: 0.125rem; }
.cart-item-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; flex-shrink: 0; }
.cart-item-qtd { display: flex; align-items: center; gap: 0.25rem; }
.qtd-btn {
  width: 1.5rem; height: 1.5rem;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--color-bg-tertiary);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.qtd-btn:hover { background: var(--color-border-light); }
.cart-item-qtd span { font-size: 0.875rem; font-weight: 600; min-width: 1.5rem; text-align: center; }
.cart-item-preco { font-size: 0.8125rem; font-weight: 600; white-space: nowrap; }
.cart-item-remove {
  font-size: 1rem;
  color: var(--color-text-muted);
  padding: 0.125rem;
}
.cart-item-remove:hover { color: var(--color-danger); }
.drawer-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border-light);
}
.drawer-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; font-size: 1rem; }
.drawer-total strong { font-size: 1.25rem; }
.drawer-checkout-btn { width: 100%; }
.drawer-enter-active, .drawer-leave-active { transition: opacity var(--transition-base); }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform var(--transition-base); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer { transform: translateX(100%); }
.drawer-leave-to .drawer { transform: translateX(100%); }
</style>
