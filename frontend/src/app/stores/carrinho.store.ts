import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/shared/utils/api';
import type { CarrinhoResponse, CarrinhoItem, Pedido } from '@/shared/utils/types';

function getSessionId(): string {
  let id = localStorage.getItem('cart_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('cart_session', id);
  }
  return id;
}

export const useCarrinhoStore = defineStore('carrinho', () => {
  const itens = ref<CarrinhoItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const aberto = ref(false);

  const sessionId = getSessionId();

  const quantidadeTotal = computed(() =>
    itens.value.reduce((acc, i) => acc + i.quantidade, 0),
  );

  function toggle() {
    aberto.value = !aberto.value;
  }

  function abrir() {
    aberto.value = true;
  }

  function fechar() {
    aberto.value = false;
  }

  async function fetchCarrinho(slug: string) {
    loading.value = true;
    try {
      const { data } = await api.get<CarrinhoResponse>(`/vitrine/${slug}/carrinho`, {
        params: { sessionId },
      });
      itens.value = data.itens;
      total.value = data.total;
    } catch {
      itens.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  async function adicionar(slug: string, payload: {
    produtoId: string;
    quantidade?: number;
    observacao?: string;
    opcoesSelecionadas?: string[];
  }) {
    const { data } = await api.post<CarrinhoItem>(`/vitrine/${slug}/carrinho`, payload, {
      params: { sessionId },
    });
    await fetchCarrinho(slug);
    aberto.value = true;
    return data;
  }

  async function atualizarQuantidade(slug: string, itemId: string, quantidade: number) {
    await api.patch(`/vitrine/${slug}/carrinho/${itemId}`, { quantidade }, {
      params: { sessionId },
    });
    await fetchCarrinho(slug);
  }

  async function remover(slug: string, itemId: string) {
    await api.delete(`/vitrine/${slug}/carrinho/${itemId}`, {
      params: { sessionId },
    });
    await fetchCarrinho(slug);
  }

  function limpar() {
    itens.value = [];
    total.value = 0;
  }

  return {
    itens, total, loading, aberto, sessionId, quantidadeTotal,
    toggle, abrir, fechar,
    fetchCarrinho, adicionar, atualizarQuantidade, remover, limpar,
  };
});
