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
        <AppSelect
          v-model="filtroPreco"
          :options="precoOptions"
          placeholder="Todos os preços"
        />
      </div>

      <p class="filter-count">{{ filteredProdutos.length }} produto{{ filteredProdutos.length !== 1 ? 's' : '' }}</p>

      <div class="product-grid">
        <AppCard
          v-for="p in filteredProdutos"
          :key="p.id"
          clickable
          @click="router.push(`/catalogo/${p.id}`)"
        >
          <div class="product-card">
            <div class="product-img-wrapper">
              <img v-if="p.imagens?.[0]" :src="p.imagens[0].url" class="product-img" />
              <div v-else class="product-img-placeholder">
                <PhCube :size="24" />
              </div>
              <span v-if="p.destaque" class="product-badge">Destaque</span>
            </div>
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
                <span v-if="p._count?.pedidoItens" class="text-sold">
                  {{ p._count.pedidoItens }} vendido{{ p._count.pedidoItens !== 1 ? 's' : '' }}
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
import { PhCube } from '@phosphor-icons/vue';
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
const filtroPreco = ref('');

const categoriaOptions = computed(() => [
  ...categorias.value.map((c) => ({ value: c.id, label: c.nome })),
]);

const statusOptions = [
  { value: ProdutoStatus.ATIVO, label: 'Ativo' },
  { value: ProdutoStatus.PAUSADO, label: 'Pausado' },
  { value: ProdutoStatus.ESGOTADO, label: 'Esgotado' },
];

const precoOptions = [
  { value: 'ate10', label: 'Até R$ 10' },
  { value: '10a50', label: 'R$ 10 a R$ 50' },
  { value: '50a100', label: 'R$ 50 a R$ 100' },
  { value: 'acima100', label: 'Acima de R$ 100' },
];

const filteredProdutos = computed(() => {
  let result = produtos.value;
  if (filtroCategoria.value) {
    result = result.filter((p) => p.categoriaId === filtroCategoria.value);
  }
  if (filtroStatus.value) {
    result = result.filter((p) => p.status === filtroStatus.value);
  }
  if (filtroPreco.value) {
    result = result.filter((p) => {
      const preco = Number(p.preco);
      switch (filtroPreco.value) {
        case 'ate10': return preco <= 10;
        case '10a50': return preco > 10 && preco <= 50;
        case '50a100': return preco > 50 && preco <= 100;
        case 'acima100': return preco > 100;
        default: return true;
      }
    });
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
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
.filter-count { font-size: 0.75rem; color: var(--color-text-3); margin-bottom: 1rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }

.product-card { display: flex; flex-direction: column; }
.product-img-wrapper { position: relative; width: 100%; aspect-ratio: 1; background: var(--color-bg-tertiary); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 0.75rem; }
.product-img { width: 100%; height: 100%; object-fit: cover; }
.product-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-3); }
.product-badge { position: absolute; top: 0.375rem; left: 0.375rem; font-size: 0.625rem; font-weight: 700; background: var(--color-warning); color: #000; padding: 0.125rem 0.5rem; border-radius: var(--radius-full); }

.product-info h3 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.25rem; }
.product-price { font-size: 1.0625rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.price-final { color: var(--color-primary); }
.price-original { font-size: 0.75rem; color: var(--color-text-muted); text-decoration: line-through; font-weight: 400; }
.price-badge { font-size: 0.625rem; font-weight: 700; color: #fff; background: var(--color-danger); padding: 0.0625rem 0.375rem; border-radius: var(--radius-full); }
.product-cat { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem; }
.product-meta { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; flex-wrap: wrap; }
.text-sold { font-size: 0.6875rem; color: var(--color-text-3); }
.delete-btn { margin-top: 0.5rem; width: 100%; }
.text-muted { color: var(--color-text-muted); font-size: 0.75rem; }
.loading, .empty { color: var(--color-text-muted); text-align: center; padding: 2rem; }
</style>
