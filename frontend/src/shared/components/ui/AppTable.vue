<template>
  <div class="app-table-wrapper">
    <table class="app-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">
            {{ col.label }}
          </th>
          <th v-if="$slots.actions" class="app-table__actions-header">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data" :key="row.id">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="app-table__actions">
            <slot name="actions" :row="row" />
          </td>
        </tr>
        <tr v-if="!data.length">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="app-table__empty">
            {{ emptyText }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string;
  label: string;
}

defineProps<{
  columns: Column[];
  data: Record<string, any>[];
  emptyText?: string;
}>();
</script>

<style scoped>
.app-table-wrapper { overflow-x: auto; }
.app-table { width: 100%; border-collapse: collapse; }
.app-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  background: linear-gradient(180deg, var(--color-bg-tertiary), var(--color-surface-2));
  border-bottom: 1px solid var(--color-border-light);
}
.app-table td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
}
.app-table tbody tr:hover { background: rgba(79, 70, 229, 0.04); }
.app-table__actions { text-align: right; }
.app-table__actions-header { text-align: right; }
.app-table__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-text-secondary);
}
</style>
