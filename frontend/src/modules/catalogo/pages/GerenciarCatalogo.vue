<template>
  <div>
    <div class="page-header">
      <h1>Catálogo</h1>
      <AppButton v-if="can(RoleNegocio.GERENTE)" @click="router.push('/catalogo/novo')">
        Novo Produto
      </AppButton>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>

    <template v-else>
      <div class="filter-bar">
        <AppSelect
          v-model="filtroCategoria"
          :options="categoriaOptions"
          placeholder="Todas as categorias"
        />
        <AppSelect
          v-model="filtroStatus"
          :options="statusOptions"
          placeholder="Todos os status"
        />
      </div>

      <div class="product-grid">
        <AppCard
          v-for="p in filteredProdutos"
          :key="p.id"
          clickable
          @click="router.push(`/catalogo/${p.id}`)"
        >
          <div class="product-info">
            <h3>{{ p.nome }}</h3>
            <p class="product-price">
              <template v-if="p.tipoDesconto && p.valorDesconto && p.valorDesconto > 0">
                <span class="price-final">{{ formatCurrency(calcularPrecoFinal(p)) }}</span>
                <span class="price-original">{{ formatCurrency(Number(p.preco)) }}</span>
                <span class="price-badge">{{ formatarDesconto(p) }}</span>
              </template>
              <template v-else>
                {{ formatCurrency(Number(p.preco)) }}
              </template>
            </p>
            <p v-if="p.categoria" class="product-cat">{{ p.categoria.nome }}</p>
            <div class="product-meta">
              <AppBadge :variant="statusVariant(p.status)">{{ p.status }}</AppBadge>
              <span v-if="p.controlaEstoque" class="text-muted">
                Estoque: {{ p.estoqueItem?.quantidadeAtual ?? 0 }}
              </span>
            </div>
            <AppButton
              v-if="can(RoleNegocio.GERENTE)"
              size="sm"
              variant="danger"
              class="delete-btn"
              @click.stop="confirmarExclusao(p)"
            >
              Remover
            </AppButton>
          </div>
        </AppCard>
      </div>

      <p v-if="!filteredProdutos.length && !loading" class="empty">
        Nenhum produto encontrado.
      </p>
    </template>

    <ConfirmDialog
      :open="showConfirm"
      title="Remover Produto"
      :message="`Remover ${produtoParaRemover?.nome}? Esta ação não pode ser desfeita.`"
      confirm-text="Remover"
      confirm-variant="danger"
      :loading="removendo"
      @confirm="handleDelete"
      @cancel="showConfirm = false; produtoParaRemover = null"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import { usePermissions } from '@/shared/composables/usePermissions';
import { useBusinessStore } from '@/app/stores/business.store';
import { useUiStore } from '@/app/stores/ui.store';
import { RoleNegocio, ProdutoStatus, type Produto, type Categoria, calcularPrecoFinal, formatarDesconto } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog.vue';

const router = useRouter();
const { can } = usePermissions();
const ui = useUiStore();
const businessStore = useBusinessStore();

const produtos = ref<Produto[]>([]);
const categorias = ref<Categoria[]>([]);
const loading = ref(true);
const filtroCategoria = ref('');
const filtroStatus = ref('');

const categoriaOptions = computed(() => [
  ...categorias.value.map((c) => ({ value: c.id, label: c.nome })),
]);

const statusOptions = [
  { value: ProdutoStatus.ATIVO, label: 'Ativo' },
  { value: ProdutoStatus.PAUSADO, label: 'Pausado' },
  { value: ProdutoStatus.ESGOTADO, label: 'Esgotado' },
];

const filteredProdutos = computed(() => {
  let result = produtos.value;
  if (filtroCategoria.value) {
    result = result.filter((p) => p.categoriaId === filtroCategoria.value);
  }
  if (filtroStatus.value) {
    result = result.filter((p) => p.status === filtroStatus.value);
  }
  return result;
});

function statusVariant(status: ProdutoStatus) {
  const map: Record<string, any> = {
    ATIVO: 'success', PAUSADO: 'warning', ESGOTADO: 'danger',
  };
  return map[status] || 'neutral';
}

const showConfirm = ref(false);
const produtoParaRemover = ref<Produto | null>(null);
const removendo = ref(false);

function confirmarExclusao(produto: Produto) {
  produtoParaRemover.value = produto;
  showConfirm.value = true;
}

async function handleDelete() {
  if (!produtoParaRemover.value) return;
  removendo.value = true;
  try {
    const bid = businessStore.businessId();
    await api.delete(`/negocios/${bid}/produtos/${produtoParaRemover.value.id}`);
    ui.addToast('Produto removido.', 'success');
    produtos.value = produtos.value.filter((p) => p.id !== produtoParaRemover.value!.id);
    showConfirm.value = false;
    produtoParaRemover.value = null;
  } catch {
    ui.addToast('Erro ao remover produto.', 'error');
  } finally {
    removendo.value = false;
  }
}

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
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.product-info h3 { font-size: 1rem; margin-bottom: 0.25rem; }
.product-price { font-size: 1.125rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.price-final { color: var(--color-primary); }
.price-original { font-size: 0.75rem; color: var(--color-text-muted); text-decoration: line-through; font-weight: 400; }
.price-badge { font-size: 0.625rem; font-weight: 700; color: #fff; background: var(--color-danger); padding: 0.0625rem 0.375rem; border-radius: var(--radius-full); }
.product-cat { font-size: 0.75rem; color: var(--color-text-muted); }
.product-meta { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; flex-wrap: wrap; }
.delete-btn { margin-left: auto; }
.text-muted { color: var(--color-text-muted); font-size: 0.75rem; }
.loading, .empty { color: var(--color-text-muted); text-align: center; padding: 2rem; }
</style>
