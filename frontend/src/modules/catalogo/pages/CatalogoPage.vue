<template>
  <div class="vitrine">
    <!-- Cover / Banner -->
    <div class="vitrine-cover" :style="{ backgroundImage: negocio?.bannerUrl ? `url(${negocio.bannerUrl})` : 'none' }">
      <div class="vitrine-cover-overlay">
        <div class="vitrine-cover-content">
          <div class="vitrine-store">
            <h1 class="vitrine-title">{{ negocio?.nome || '' }}</h1>
            <p v-if="negocio?.descricao" class="vitrine-desc">{{ negocio.descricao }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="vitrine-search-wrapper">
      <div class="vitrine-search" :style="{ borderColor: YELLOW }">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input v-model="busca" type="text" placeholder="Buscar no cardápio..." class="search-input" />
      </div>
    </div>

    <!-- Business Selector -->
    <div class="vitrine-selector" v-if="negociosLista.length > 1">
      <div class="selector-scroll">
        <button
          v-for="b in negociosLista"
          :key="b.id"
          :class="['selector-item', { 'selector-item--active': b.slug === route.params.slug }]"
          @click="trocarNegocio(b.slug)"
        >
          <span
            class="selector-avatar"
            :style="{
              background: b.slug === route.params.slug ? '#e11d48' : '#f0f0f0',
              borderColor: b.slug === route.params.slug ? '#e11d48' : '#e5e5e5',
            }"
          >
            <img v-if="b.logoUrl" :src="b.logoUrl" :alt="b.nome" />
            <span v-else class="selector-avatar-letter">{{ b.nome.charAt(0).toUpperCase() }}</span>
          </span>
          <span class="selector-name">{{ b.nome }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="vitrine-loading">
      <div class="spinner" :style="{ borderTopColor: YELLOW }" />
      <span>Carregando...</span>
    </div>

    <template v-else-if="negocio">
      <!-- Category tabs -->
      <nav class="vitrine-categorias">
        <button
          :class="['cat-tab', { 'cat-tab--active': !categoriaAtiva }]"
          :style="!categoriaAtiva ? { background: YELLOW, borderColor: YELLOW } : {}"
          @click="categoriaAtiva = ''"
        >Todos</button>
        <button
          v-for="cat in categorias"
          :key="cat.id"
          :class="['cat-tab', { 'cat-tab--active': categoriaAtiva === cat.id }]"
          :style="categoriaAtiva === cat.id ? { background: YELLOW, borderColor: YELLOW } : {}"
          @click="categoriaAtiva = cat.id"
        >{{ cat.nome }}</button>
      </nav>

      <!-- Products -->
      <div class="vitrine-grid">
        <div v-for="p in filteredProdutos" :key="p.id" class="produto-card" @click="produtoSelecionado = p">
          <div class="produto-image">
            <img
              v-if="p.imagens?.length"
              :src="p.imagens[0].url"
              :alt="p.nome"
              loading="lazy"
            />
            <div v-else class="produto-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
          </div>
          <div class="produto-body">
            <h3>{{ p.nome }}</h3>
            <p v-if="p.descricao" class="produto-desc">{{ p.descricao }}</p>
            <div class="produto-preco-row">
              <span class="produto-preco" :style="{ color: RED }">
                <template v-if="p.tipoDesconto && p.valorDesconto && p.valorDesconto > 0">
                  <span class="produto-preco--promo">{{ formatCurrency(calcularPrecoFinal(p)) }}</span>
                  <span class="produto-preco--original">{{ formatCurrency(Number(p.preco)) }}</span>
                  <span class="produto-preco--badge">{{ formatarDesconto(p) }}</span>
                </template>
                <template v-else>
                  {{ formatCurrency(Number(p.preco)) }}
                </template>
              </span>
              <button class="produto-add" :style="{ background: YELLOW }" @click.stop="quickAdd(p)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!filteredProdutos.length" class="vitrine-empty">Nenhum produto encontrado.</p>
    </template>

    <div v-else class="vitrine-error"><p>Negócio não encontrado.</p></div>

    <!-- Product Modal (Bottom Sheet) -->
    <Teleport to="body">
      <div v-if="!!produtoSelecionado" class="modal-overlay" @click.self="fecharModal">
        <div class="modal-sheet">
          <div class="modal-handle" />
          <button class="modal-close" @click="fecharModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div v-if="produtoSelecionado" class="modal-scroll">
            <div v-if="produtoSelecionado.imagens?.length" class="modal-image">
              <img :src="produtoSelecionado.imagens[0].url" :alt="produtoSelecionado.nome" />
            </div>
            <div class="modal-info">
              <h2>{{ produtoSelecionado.nome }}</h2>
              <div class="modal-preco" :style="{ color: RED }">
                <template v-if="produtoSelecionado.tipoDesconto && produtoSelecionado.valorDesconto && produtoSelecionado.valorDesconto > 0">
                  <span class="preco-promo">{{ formatCurrency(calcularPrecoFinal(produtoSelecionado)) }}</span>
                  <span class="preco-original">{{ formatCurrency(Number(produtoSelecionado.preco)) }}</span>
                  <span class="produto-preco--badge">{{ formatarDesconto(produtoSelecionado) }}</span>
                </template>
                <template v-else>{{ formatCurrency(Number(produtoSelecionado.preco)) }}</template>
              </div>
              <p v-if="produtoSelecionado.descricao" class="modal-desc">{{ produtoSelecionado.descricao }}</p>

              <div v-for="g in produtoSelecionado.gruposModificadores" :key="g.id" class="mod-group">
                <h4>
                  {{ g.nome }}
                  <span v-if="g.obrigatorio" class="obrigatorio">*</span>
                  <span v-if="g.maxSelecao > 1" class="mod-limit">(até {{ g.maxSelecao }})</span>
                </h4>
                <div v-for="o in g.opcoes" :key="o.id" class="mod-opcao">
                  <label :class="{ 'mod-opcao--checked': opcaoSelecionada(o.id) }">
                    <input
                      :type="g.maxSelecao === 1 ? 'radio' : 'checkbox'"
                      :name="'g-' + g.id"
                      :value="o.id"
                      :checked="opcaoSelecionada(o.id)"
                      @change="toggleOpcao(g, o.id)"
                    />
                    <span class="mod-opcao-nome">{{ o.nome }}</span>
                    <span v-if="Number(o.precoExtra) > 0" class="mod-preco">+{{ formatCurrency(Number(o.precoExtra)) }}</span>
                  </label>
                </div>
              </div>

              <div class="modal-obs">
                <input v-model="observacao" placeholder="Alguma observação?" class="obs-input" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-add-btn" :style="{ background: YELLOW, color: '#000' }" :disabled="adicionando" @click="adicionarAoCarrinho">
              <template v-if="adicionando">
                <svg class="btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"><animate attributeName="stroke-dashoffset" values="32;0" dur="0.6s" repeatCount="indefinite"/></circle></svg>
              </template>
              <template v-else>Adicionar • {{ formatCurrency(precoComOpcoes) }}</template>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Floating Cart Button -->
    <Teleport to="body">
      <button v-if="carrinho.quantidadeTotal > 0 && !produtoSelecionado" class="vitrine-fab" :style="{ background: YELLOW }" @click="carrinho.abrir()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="m1 1 4 0 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span class="fab-badge">{{ carrinho.quantidadeTotal }}</span>
        <span class="fab-label">Ver carrinho</span>
      </button>
    </Teleport>

    <CarrinhoDrawer :slug="(route.params.slug as string)" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import { useCarrinhoStore } from '@/app/stores/carrinho.store';
import type { Negocio, Categoria, Produto, GrupoModificador, NegocioResumo } from '@/shared/utils/types';
import { calcularPrecoFinal, formatarDesconto } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import CarrinhoDrawer from '@/shared/components/carrinho/CarrinhoDrawer.vue';

const YELLOW = '#ffd401';
const RED = '#fe0000';
const AMBER = '#df952f';

const route = useRoute();
const router = useRouter();
const carrinho = useCarrinhoStore();

const negocio = ref<Negocio | null>(null);
const categorias = ref<Categoria[]>([]);
const produtos = ref<Produto[]>([]);
const negociosLista = ref<NegocioResumo[]>([]);
const loading = ref(true);
const busca = ref('');
const categoriaAtiva = ref('');
const produtoSelecionado = ref<Produto | null>(null);
const opcoesSelecionadas = ref<string[]>([]);
const observacao = ref('');
const adicionando = ref(false);

function opcaoSelecionada(id: string) {
  return opcoesSelecionadas.value.includes(id);
}

function fecharModal() {
  produtoSelecionado.value = null;
  opcoesSelecionadas.value = [];
  observacao.value = '';
}

function toggleOpcao(grupo: GrupoModificador, opcaoId: string) {
  if (grupo.maxSelecao === 1) {
    const idx = opcoesSelecionadas.value.indexOf(opcaoId);
    opcoesSelecionadas.value = idx >= 0 ? [] : [opcaoId];
  } else {
    const idx = opcoesSelecionadas.value.indexOf(opcaoId);
    if (idx >= 0) {
      opcoesSelecionadas.value.splice(idx, 1);
    } else if (opcoesSelecionadas.value.length < grupo.maxSelecao) {
      opcoesSelecionadas.value.push(opcaoId);
    }
  }
}

const precoComOpcoes = computed(() => {
  if (!produtoSelecionado.value) return 0;
  const base = calcularPrecoFinal(produtoSelecionado.value);
  const extra = produtoSelecionado.value.gruposModificadores?.reduce((s, g) => {
    return s + g.opcoes.filter((o) => opcoesSelecionadas.value.includes(o.id)).reduce((s2, o) => s2 + Number(o.precoExtra), 0);
  }, 0) ?? 0;
  return base + extra;
});

async function adicionarAoCarrinho() {
  if (!produtoSelecionado.value) return;
  adicionando.value = true;
  try {
    await carrinho.adicionar(route.params.slug as string, {
      produtoId: produtoSelecionado.value.id,
      opcoesSelecionadas: opcoesSelecionadas.value,
      observacao: observacao.value || undefined,
    });
    fecharModal();
  } finally {
    adicionando.value = false;
  }
}

function quickAdd(produto: Produto) {
  if (!produto.gruposModificadores?.length) {
    adicionando.value = true;
    carrinho.adicionar(route.params.slug as string, {
      produtoId: produto.id,
      opcoesSelecionadas: [],
    }).finally(() => { adicionando.value = false; });
  } else {
    produtoSelecionado.value = produto;
  }
}

function trocarNegocio(slug: string) {
  if (slug !== route.params.slug) router.push(`/vitrine/${slug}`);
}

const filteredProdutos = computed(() => {
  let result = produtos.value;
  if (categoriaAtiva.value) result = result.filter((p) => p.categoriaId === categoriaAtiva.value);
  if (busca.value) {
    const q = busca.value.toLowerCase();
    result = result.filter((p) => p.nome.toLowerCase().includes(q) || (p.descricao && p.descricao.toLowerCase().includes(q)));
  }
  return result;
});

async function carregarVitrine(slug: string) {
  loading.value = true;
  try {
    const { data } = await api.get<{ negocio: Negocio; categorias: Categoria[]; produtos: Produto[] }>(`/vitrine/${slug}`);
    negocio.value = data.negocio;
    categorias.value = data.categorias;
    produtos.value = data.produtos;
    categoriaAtiva.value = '';
    busca.value = '';
    carrinho.fetchCarrinho(slug);
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.slug, (slug) => { if (slug) carregarVitrine(slug as string); });

onMounted(async () => {
  try {
    const { data } = await api.get<NegocioResumo[]>('/vitrine');
    negociosLista.value = data;
  } catch {}
  await carregarVitrine(route.params.slug as string);
});
</script>

<style scoped>
.vitrine {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 5rem;
}

/* ============= BUSINESS SELECTOR ============= */
.vitrine-selector {
  background: #fff;
  max-width: 880px;
  margin: 0.5rem auto 0;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

.selector-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.75rem 1rem;
  scrollbar-width: none;
}

.selector-scroll::-webkit-scrollbar { display: none; }

.selector-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  min-width: 64px;
  transition: opacity 0.2s;
}

.selector-item:hover { opacity: 0.8; }

.selector-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.2s;
}

.selector-item--active .selector-avatar {
  border-width: 2.5px;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
}

.selector-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selector-avatar-letter {
  font-size: 1.125rem;
  font-weight: 700;
  color: #fff;
}

.selector-item--active .selector-avatar-letter { color: #fff; }

.selector-item:not(.selector-item--active) .selector-avatar-letter { color: #666; }

.selector-name {
  font-size: 0.6875rem;
  color: #666;
  text-align: center;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-item--active .selector-name {
  color: #111;
  font-weight: 600;
}

/* ============= COVER ============= */
.vitrine-cover {
  position: relative;
  height: 160px;
  background-size: cover;
  background-position: center;
  background-color: #333;
}

.vitrine-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7));
  display: flex;
  align-items: flex-end;
}

.vitrine-cover-content {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
}

.vitrine-store { flex: 1; min-width: 0; }

.vitrine-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.vitrine-desc {
  font-size: 0.8125rem;
  opacity: 0.75;
  margin-top: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}



/* ============= SEARCH ============= */
.vitrine-search-wrapper {
  max-width: 880px;
  margin: 0 auto;
  padding: 0 1rem;
  margin-top: -1.25rem;
  position: relative;
  z-index: 2;
}

.vitrine-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border: 2px solid #e11d48;
  border-radius: 12px;
  padding: 0 0.875rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.search-icon {
  flex-shrink: 0;
  color: #999;
}

.search-input {
  flex: 1;
  padding: 0.75rem 0;
  border: none;
  font-size: 0.875rem;
  outline: none;
  background: transparent;
  min-width: 0;
}

/* ============= LOADING ============= */
.vitrine-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--color-text-muted);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border-light);
  border-top-color: #e11d48;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ============= CATEGORIES ============= */
.vitrine-categorias {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 1rem 1rem 0.75rem;
  max-width: 880px;
  margin: 0 auto;
  scrollbar-width: none;
}

.vitrine-categorias::-webkit-scrollbar { display: none; }

.cat-tab {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  background: #fff;
  color: #333;
  border: 1px solid #e5e5e5;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.cat-tab:hover { border-color: #999; }

.cat-tab--active { color: #fff; border-color: transparent; }

/* ============= PRODUCT GRID ============= */
.vitrine-grid {
  max-width: 880px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .vitrine-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 480px) {
  .vitrine-grid { grid-template-columns: repeat(2, 1fr); }
}

.produto-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
}

.produto-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }

.produto-image {
  width: 100%;
  aspect-ratio: 1;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.produto-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.produto-placeholder { color: #ccc; }

.produto-body {
  padding: 0.625rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.produto-body h3 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 0.125rem;
  line-height: 1.2;
}

.produto-desc {
  font-size: 0.6875rem;
  color: #888;
  margin-bottom: 0.375rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.produto-preco-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.375rem;
  margin-top: auto;
}

.produto-preco {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #e11d48;
}

.produto-preco--promo { color: #dc2626; }

.produto-preco--badge { font-size: 0.5rem; font-weight: 700; color: #fff; background: #dc2626; padding: 0.0625rem 0.3125rem; border-radius: var(--radius-full); margin-left: 0.25rem; vertical-align: middle; }

.produto-preco--original {
  font-size: 0.625rem;
  color: #999;
  text-decoration: line-through;
  font-weight: 400;
  margin-left: 0.25rem;
}

.produto-add {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.produto-add:hover { opacity: 0.85; }

.vitrine-empty {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.vitrine-error {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

/* ============= MODAL (Bottom Sheet) ============= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-sheet {
  background: #fff;
  border-radius: 20px 20px 0 0;
  max-width: 480px;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  position: relative;
}

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.modal-handle {
  width: 36px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 0.625rem auto 0;
  flex-shrink: 0;
}

.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.06);
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.modal-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal-image {
  width: 100%;
  aspect-ratio: 16/10;
  overflow: hidden;
  background: #f0f0f0;
}

.modal-image img { width: 100%; height: 100%; object-fit: cover; }

.modal-info { padding: 1rem 1.25rem; }

.modal-info h2 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.375rem;
  color: #111;
}

.modal-preco {
  font-size: 1.25rem;
  font-weight: 700;
  color: #e11d48;
  margin-bottom: 0.75rem;
}

.modal-preco .preco-promo { color: #dc2626; }

.modal-preco .preco-original {
  font-size: 0.875rem;
  color: #999;
  text-decoration: line-through;
  font-weight: 400;
  margin-left: 0.5rem;
}

.modal-desc {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.mod-group {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: #f8f8f8;
  border-radius: 10px;
}

.mod-group h4 {
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.obrigatorio { color: #dc2626; }

.mod-limit { font-weight: 400; color: #999; font-size: 0.75rem; }

.mod-opcao { margin-bottom: 0.25rem; }

.mod-opcao label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  padding: 0.5rem 0.625rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.mod-opcao label:hover { background: rgba(0,0,0,0.02); }

.mod-opcao--checked { background: var(--color-bg-tertiary); }

.mod-opcao input { accent-color: #ffd401; }

.mod-opcao-nome { flex: 1; color: #333; }

.mod-preco { color: #999; font-size: 0.75rem; }

.modal-obs { padding: 0 1.25rem; margin-bottom: 0.75rem; }

.obs-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 0.8125rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.obs-input:focus { border-color: #ffd401; }

.modal-footer {
  padding: 0.75rem 1.25rem 1.25rem;
  flex-shrink: 0;
}

.modal-add-btn {
  width: 100%;
  padding: 0.8125rem;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: opacity 0.2s;
}

.modal-add-btn:hover { opacity: 0.9; }
.modal-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-spinner { animation: spin 0.6s linear infinite; }

/* ============= FAB ============= */
.vitrine-fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem 0.75rem 0.875rem;
  border: none;
  border-radius: 999px;
  color: #000;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  z-index: 100;
  animation: fabIn 0.3s ease;
  white-space: nowrap;
}

@keyframes fabIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.fab-badge {
  background: rgba(255,255,255,0.25);
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
}

.fab-label { margin-right: 0.25rem; }
</style>
