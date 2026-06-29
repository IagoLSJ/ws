<template>
  <AppCard class="alerta-card" :class="{ 'alerta-card--critico': item.quantidadeAtual <= 0 }">
    <div class="alerta-info">
      <strong>{{ item.produto?.nome }}</strong>
      <span class="alerta-qtd">
        {{ item.quantidadeAtual }} {{ item.unidade }}
        <span v-if="item.quantidadeAtual <= 0" class="badge-critico">CRÍTICO</span>
      </span>
    </div>
    <div class="alerta-meta">
      <span class="text-muted">Mínimo: {{ item.estoqueMinimo }}</span>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import type { EstoqueItem } from '@/shared/utils/types';
import AppCard from '@/shared/components/ui/AppCard.vue';

defineProps<{ item: EstoqueItem }>();
</script>

<style scoped>
.alerta-card { border-left: 4px solid var(--color-warning); }
.alerta-card--critico { border-left-color: var(--color-danger); }
.alerta-info { display: flex; justify-content: space-between; align-items: center; }
.alerta-qtd { font-weight: 600; color: var(--color-warning); }
.badge-critico { font-size: 0.6875rem; background: var(--color-danger); color: #fff; padding: 0.125rem 0.375rem; border-radius: var(--radius-sm); margin-left: 0.5rem; }
.alerta-meta { margin-top: 0.25rem; }
.text-muted { font-size: 0.75rem; color: var(--color-text-muted); }
</style>
