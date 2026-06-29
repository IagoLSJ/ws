<template>
  <div class="pdv-produtos-content">
    <div class="pdv-produtos-filtros">
      <AppInput v-model="busca" placeholder="Buscar produto..." />
      <AppSelect v-model="categoriaFiltro" :options="categoriaOptions" placeholder="Todas categorias" />
    </div>

    <div v-if="loading" class="pdv-loading">Carregando...</div>

    <div v-else class="pdv-produtos-grid">
      <button
        v-for="p in filteredProdutos"
        :key="p.id"
        class="pdv-produto-btn"
        @click="$emit('adicionar', p)"
      >
        <div class="pdv-produto-img">
          <img v-if="p.imagens?.length" :src="p.imagens[0].url" :alt="p.nome" />
          <div v-else class="pdv-produto-placeholder">MN</div>
        </div>
        <div class="pdv-produto-info">
          <span class="pdv-produto-nome">{{ p.nome }}</span>
          <span class="pdv-produto-preco">{{ formatCurrency(calcularPrecoFinal(p)) }}</span>
        </div>
      </button>
    </div>

    <p v-if="!filteredProdutos.length && !loading" class="pdv-empty">Nenhum produto encontrado.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/shared/utils/api';
import { useBusinessStore } from '@/app/stores/business.store';
import { calcularPrecoFinal, type Produto, type Categoria } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';

defineEmits<{ adicionar: [produto: Produto] }>();

const businessStore = useBusinessStore();
const produtos = ref<Produto[]>([]);
const categorias = ref<Categoria[]>([]);
const loading = ref(true);
const busca = ref('');
const categoriaFiltro = ref('');

const categoriaOptions = computed(() =>
  categorias.value.map((c) => ({ value: c.id, label: c.nome })),
);

const filteredProdutos = computed(() => {
  let result = produtos.value;
  if (categoriaFiltro.value) result = result.filter((p) => p.categoriaId === categoriaFiltro.value);
  if (busca.value) {
    const q = busca.value.toLowerCase();
    result = result.filter((p) => p.nome.toLowerCase().includes(q) || (p.descricao && p.descricao.toLowerCase().includes(q)));
  }
  return result;
});

onMounted(async () => {
  try {
    const bid = businessStore.businessId();
    const [prodRes, catRes] = await Promise.all([
      api.get(`/negocios/${bid}/produtos`),
      api.get(`/negocios/${bid}/categorias`),
    ]);
    produtos.value = prodRes.data;
    categorias.value = catRes.data;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.pdv-produtos-content { display: flex; flex-direction: column; height: 100%; }
.pdv-produtos-filtros { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
.pdv-loading, .pdv-empty { text-align: center; padding: 2rem; color: var(--color-text-muted); }
.pdv-produtos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; flex: 1; overflow-y: auto; align-content: start; }
.pdv-produto-btn { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--color-bg-secondary); border: 1px solid var(--color-border-light); border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition-fast); text-align: center; }
.pdv-produto-btn:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
.pdv-produto-img { width: 80px; height: 80px; border-radius: var(--radius-md); overflow: hidden; background: var(--color-bg-tertiary); }
.pdv-produto-img img { width: 100%; height: 100%; object-fit: cover; }
.pdv-produto-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 0.75rem; font-weight: 700; }
.pdv-produto-info { display: flex; flex-direction: column; gap: 0.125rem; }
.pdv-produto-nome { font-size: 0.8125rem; font-weight: 600; line-height: 1.2; }
.pdv-produto-preco { font-size: 0.9375rem; font-weight: 700; color: var(--color-primary); }
</style>
