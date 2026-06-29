<template>
  <div class="mod-group">
    <h4>{{ grupo.nome }} <span v-if="grupo.obrigatorio" class="required">*</span></h4>
    <div v-for="opcao in grupo.opcoes" :key="opcao.id" class="mod-opcao">
      <label>
        <input
          :type="grupo.maxSelecao === 1 ? 'radio' : 'checkbox'"
          :name="'grupo-' + grupo.id"
          :disabled="!opcao.ativo"
        />
        {{ opcao.nome }}
        <span v-if="Number(opcao.precoExtra) > 0" class="mod-preco">
          +{{ formatCurrency(Number(opcao.precoExtra)) }}
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GrupoModificador } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';

defineProps<{ grupo: GrupoModificador }>();
</script>

<style scoped>
.mod-group { margin-top: 1rem; }
.mod-group h4 { font-size: 0.875rem; margin-bottom: 0.5rem; }
.required { color: var(--color-danger); }
.mod-opcao { font-size: 0.8125rem; padding: 0.25rem 0; }
.mod-preco { color: var(--color-text-muted); margin-left: 0.25rem; }
</style>
