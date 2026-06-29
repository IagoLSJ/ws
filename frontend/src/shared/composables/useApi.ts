import { ref } from 'vue';

export function useApi<T>() {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function request<R = T>(promise: Promise<{ data: R }>): Promise<R> {
    loading.value = true;
    error.value = null;
    try {
      const res = await promise;
      data.value = res.data as any;
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Erro inesperado';
      error.value = Array.isArray(msg) ? msg.join(', ') : msg;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, error, request };
}
