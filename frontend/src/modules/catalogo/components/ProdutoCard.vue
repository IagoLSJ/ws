<template>
  <div class="produto-card" @click="$emit('click')">
    <div class="produto-image">
      <img v-if="produto.imagens?.length" :src="produto.imagens[0].url" :alt="produto.nome" />
      <div v-else class="produto-placeholder">Sem imagem</div>
    </div>
    <div class="produto-body">
      <h3>{{ produto.nome }}</h3>
      <p v-if="produto.descricao" class="produto-desc">{{ produto.descricao }}</p>
      <div class="produto-meta">
        <span class="produto-preco">
          <template v-if="produto.tipoDesconto && produto.valorDesconto && produto.valorDesconto > 0">
            <span class="preco-final">{{ formatCurrency(calcularPrecoFinal(produto)) }}</span>
            <span class="preco-original">{{ formatCurrency(Number(produto.preco)) }}</span>
            <span class="preco-badge">{{ formatarDesconto(produto) }}</span>
          </template>
          <template v-else>
            {{ formatCurrency(Number(produto.preco)) }}
          </template>
        </span>
        <AppBadge v-if="produto.status !== 'ATIVO'" :variant="statusBadge">
          {{ produto.status }}
        </AppBadge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Produto } from '@/shared/utils/types';
import { calcularPrecoFinal, formatarDesconto } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import AppBadge from '@/shared/components/ui/AppBadge.vue';

const props = defineProps<{ produto: Produto }>();

defineEmits<{ click: [] }>();

const statusBadge = computed(() => {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    ATIVO: 'success', PAUSADO: 'warning', ESGOTADO: 'danger',
  };
  return map[props.produto.status] || 'neutral';
});
</script>

<style scoped>
.produto-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
}
.produto-card:hover { box-shadow: var(--shadow-md); }
.produto-image { aspect-ratio: 16/9; background: var(--color-bg-tertiary); display: flex; align-items: center; justify-content: center; }
.produto-image img { width: 100%; height: 100%; object-fit: cover; }
.produto-placeholder { color: var(--color-text-muted); font-size: 0.8125rem; }
.produto-body { padding: 0.75rem 1rem; }
.produto-body h3 { font-size: 0.9375rem; margin-bottom: 0.25rem; }
.produto-desc { font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.produto-meta { display: flex; align-items: center; justify-content: space-between; }
.produto-preco { font-size: 1.125rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.preco-final { color: var(--color-primary); }
.preco-original { font-size: 0.75rem; color: var(--color-text-muted); text-decoration: line-through; font-weight: 400; }
.preco-badge { font-size: 0.625rem; font-weight: 700; color: #fff; background: var(--color-danger); padding: 0.0625rem 0.375rem; border-radius: var(--radius-full); }
</style>
