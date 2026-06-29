import { ref, computed } from 'vue';

export function usePagination<T>(items: import('vue').Ref<T[]>, perPage = 10) {
  const page = ref(1);
  const totalItems = computed(() => items.value.length);
  const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / perPage)));
  const paginatedItems = computed(() => {
    const start = (page.value - 1) * perPage;
    return items.value.slice(start, start + perPage);
  });

  function setPage(p: number) {
    if (p >= 1 && p <= totalPages.value) page.value = p;
  }

  return { page, totalItems, totalPages, paginatedItems, setPage };
}
