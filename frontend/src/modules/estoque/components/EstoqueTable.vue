<template>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>Produto</th>
          <th>Saldo</th>
          <th>Mínimo</th>
          <th v-if="$slots.actions">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td><strong>{{ item.produto?.nome }}</strong></td>
          <td :class="{ 'text-danger': item.quantidadeAtual <= item.estoqueMinimo }">
            {{ item.quantidadeAtual }} {{ item.unidade }}
          </td>
          <td>{{ item.estoqueMinimo }} {{ item.unidade }}</td>
          <td v-if="$slots.actions">
            <slot name="actions" :item="item" />
          </td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="4" class="empty">Nenhum item de estoque.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { EstoqueItem } from '@/shared/utils/types';

defineProps<{ items: EstoqueItem[] }>();
</script>

<style scoped>
.table-wrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); background: var(--color-bg-tertiary); border-bottom: 1px solid var(--color-border-light); }
.table td { padding: 0.75rem 1rem; font-size: 0.875rem; border-bottom: 1px solid var(--color-border-light); }
.table tbody tr:hover { background: var(--color-bg-tertiary); }
.text-danger { color: var(--color-danger); }
.empty { text-align: center; color: var(--color-text-muted); padding: 2rem; }
</style>
