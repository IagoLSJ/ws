import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/shared/utils/api';
import type { Usuario, LoginResponse, MembroNegocio } from '@/shared/utils/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Usuario | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value);

  const currentBusiness = computed(() => {
    return (businessId: string): MembroNegocio | undefined => {
      return user.value?.membros?.find((m) => m.negocioId === businessId);
    };
  });

  function setTokens(data: { accessToken: string; refreshToken: string }) {
    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    localStorage.setItem('auth', JSON.stringify(data));
  }

  async function login(email: string, senha: string) {
    loading.value = true;
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, senha });
      user.value = { id: data.user.id, nome: data.user.nome, email: data.user.email, criadoEm: new Date().toISOString() };
      setTokens(data);
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe() {
    try {
      const { data } = await api.get<Usuario>('/auth/me');
      user.value = data;
      return data;
    } catch {
      logout();
      return null;
    }
  }

  async function logout() {
    if (refreshToken.value) {
      try {
        await api.post('/auth/logout', { refreshToken: refreshToken.value });
      } catch { /* ignore */ }
    }
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('auth');
  }

  function init() {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        accessToken.value = parsed.accessToken;
        refreshToken.value = parsed.refreshToken;
      } catch {
        localStorage.removeItem('auth');
      }
    }
  }

  init();

  return {
    user, accessToken, refreshToken, loading,
    isAuthenticated, currentBusiness,
    login, fetchMe, logout, setTokens,
  };
});
