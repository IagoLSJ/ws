import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/shared/utils/api';
import type { Negocio } from '@/shared/utils/types';

export const useBusinessStore = defineStore('business', () => {
  const businesses = ref<Negocio[]>([]);
  const current = ref<Negocio | null>(null);
  const currentBusinessId = ref<string>('');
  const loading = ref(false);

  const businessId = (): string => {
    if (currentBusinessId.value) return currentBusinessId.value;
    if (current.value) return current.value.id;
    return '';
  };

  async function fetchAll() {
    loading.value = true;
    try {
      const { data } = await api.get<Negocio[]>('/negocios');
      businesses.value = data;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(id: string) {
    loading.value = true;
    try {
      const { data } = await api.get<Negocio>(`/negocios/${id}`);
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function create(dto: Partial<Negocio>) {
    const { data } = await api.post<Negocio>('/negocios', dto);
    businesses.value.push(data);
    return data;
  }

  async function update(id: string, dto: Partial<Negocio>) {
    const { data } = await api.patch<Negocio>(`/negocios/${id}`, dto);
    const idx = businesses.value.findIndex((b) => b.id === id);
    if (idx >= 0) businesses.value[idx] = data;
    if (current.value?.id === id) current.value = data;
    return data;
  }

  async function remove(id: string) {
    await api.delete(`/negocios/${id}`);
    businesses.value = businesses.value.filter((b) => b.id !== id);
    if (current.value?.id === id) current.value = null;
  }

  function select(negocio: Negocio) {
    current.value = negocio;
    currentBusinessId.value = negocio.id;
  }

  function setBusinessId(id: string) {
    currentBusinessId.value = id;
  }

  

  return {
    businesses, current, currentBusinessId, loading,
    businessId,
    fetchAll, fetchOne, create, update, remove, select, setBusinessId,
  };
});
