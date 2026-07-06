<template>
  <Teleport to="body">
    <transition name="drawer">
      <div v-if="carrinho.aberto" class="drawer-overlay" @click.self="carrinho.fechar()">
        <aside class="drawer">
          <div class="drawer-header">
            <div class="drawer-title-wrap">
              <span class="drawer-eyebrow">Seu pedido</span>
              <h2>Carrinho ({{ carrinho.quantidadeTotal }})</h2>
            </div>
            <button class="drawer-close" @click="carrinho.fechar()">&times;</button>
          </div>

          <div v-if="carrinho.loading" class="drawer-loading">Carregando...</div>

          <div v-else-if="!carrinho.itens.length" class="drawer-empty">
            <div class="drawer-empty-card">
              <strong>Carrinho vazio</strong>
              <span>Adicione produtos para continuar para o checkout.</span>
            </div>
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
              <span>Total do pedido</span>
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
  background: rgba(9, 12, 20, 0.56);
  backdrop-filter: blur(8px);
  z-index: 1100;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 100%;
  max-width: 460px;
  background:
    radial-gradient(circle at top right, rgba(225, 29, 72, 0.06), transparent 26%),
    linear-gradient(180deg, #ffffff 0%, #fffafc 100%);
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: -24px 0 40px rgba(17, 24, 39, 0.18);
  border-left: 1px solid rgba(17, 17, 17, 0.08);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
}

.drawer-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.drawer-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-store-brand);
}

.drawer-header h2 { font-size: 1.125rem; color: var(--color-store-text); }

.drawer-close {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  font-size: 1.35rem;
  color: var(--color-text-muted);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 17, 17, 0.04);
  line-height: 1;
}

.drawer-close:hover {
  color: var(--color-text-primary);
  background: rgba(17, 17, 17, 0.08);
}

.drawer-loading,
.drawer-empty {
  padding: 1.25rem;
  text-align: center;
  color: var(--color-text-muted);
}

.drawer-empty-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--color-store-accent-soft);
  color: var(--color-store-text);
  border: 1px solid rgba(225, 29, 72, 0.14);
}

.drawer-empty-card span { color: var(--color-store-muted); font-size: 0.875rem; }

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.05);
}

.cart-item-info { flex: 1; min-width: 0; }

.cart-item-info strong { font-size: 0.9rem; display: block; color: var(--color-store-text); }

.cart-item-opcoes { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem; }

.cart-item-opcoes span { display: block; }

.cart-item-obs {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-style: italic;
  margin-top: 0.35rem;
  padding-top: 0.35rem;
  border-top: 1px dashed rgba(17, 17, 17, 0.08);
}

.cart-item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.cart-item-qtd { display: flex; align-items: center; gap: 0.25rem; }

.qtd-btn {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--color-store-accent-soft);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-store-brand);
  border: 1px solid rgba(225, 29, 72, 0.14);
}

.qtd-btn:hover { background: rgba(225, 29, 72, 0.14); }

.cart-item-qtd span {
  font-size: 0.875rem;
  font-weight: 700;
  min-width: 1.5rem;
  text-align: center;
  color: var(--color-store-text);
}

.cart-item-preco {
  font-size: 0.875rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-store-brand);
}

.cart-item-remove {
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 9999px;
  font-size: 1rem;
  color: var(--color-text-muted);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 17, 17, 0.04);
}

.cart-item-remove:hover { color: var(--color-danger); background: var(--color-danger-soft); }

.drawer-footer {
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid rgba(17, 17, 17, 0.08);
  background: linear-gradient(180deg, rgba(255,255,255,0.72), #fff);
  box-shadow: 0 -12px 24px rgba(17, 24, 39, 0.04);
}

.drawer-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.drawer-total strong { font-size: 1.35rem; color: var(--color-store-text); }

.drawer-checkout-btn { width: 100%; }

.drawer-checkout-btn :deep(.app-button--primary) {
  width: 100%;
  background: linear-gradient(135deg, var(--color-store-brand), var(--color-store-brand-hover));
  color: #fff;
  box-shadow: 0 12px 24px rgba(225, 29, 72, 0.18);
}

.drawer-checkout-btn :deep(.app-button--primary:hover:not(:disabled)) {
  background: linear-gradient(135deg, var(--color-store-brand-hover), #9f1239);
}

.drawer-enter-active,
.drawer-leave-active { transition: opacity var(--transition-base); }

.drawer-enter-active .drawer,
.drawer-leave-active .drawer { transition: transform var(--transition-base); }

.drawer-enter-from,
.drawer-leave-to { opacity: 0; }

.drawer-enter-from .drawer { transform: translateX(100%); }

.drawer-leave-to .drawer { transform: translateX(100%); }

@media (max-width: 520px) {
  .drawer {
    max-width: 100%;
    border-left: none;
  }

  .drawer-header,
  .drawer-body,
  .drawer-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .cart-item {
    padding: 0.8rem;
  }
}
</style>
