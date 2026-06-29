<template>
  <Teleport to="body">
    <div v-if="open" class="search-overlay" @click.self="close">
      <div class="search-modal">
        <div class="search-input-wrapper">
          <svg class="search-magnifier" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            ref="inputRef"
            v-model="query"
            placeholder="Pesquisar páginas..."
            class="search-input"
            @keydown.esc="close"
            @keydown.down.prevent="nextResult"
            @keydown.up.prevent="prevResult"
            @keydown.enter="selectHighlighted"
          />
          <kbd class="search-kbd">ESC</kbd>
        </div>
        <div class="search-results" v-if="filtered.length">
          <button
            v-for="(r, i) in filtered"
            :key="r.to"
            :class="['search-result', { 'search-result--active': i === highlighted }]"
            @click="navigate(r.to)"
            @mouseenter="highlighted = i"
          >
            <component :is="r.icon" :size="18" weight="bold" />
            <span>{{ r.label }}</span>
            <span class="search-path">{{ r.path }}</span>
          </button>
        </div>
        <div v-else-if="query" class="search-empty">Nenhum resultado para "{{ query }}"</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import {
  PhHouse, PhBookOpen, PhTag, PhReceipt, PhPackage, PhBuildings, PhUsers, PhGear,
} from '@phosphor-icons/vue';

const router = useRouter();

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const inputRef = ref<HTMLInputElement | null>(null);
const query = ref('');
const highlighted = ref(0);

const pages = [
  { to: '/', label: 'Dashboard', icon: PhHouse, path: '/' },
  { to: '/catalogo', label: 'Catálogo', icon: PhBookOpen, path: '/catalogo' },
  { to: '/categorias', label: 'Categorias', icon: PhTag, path: '/categorias' },
  { to: '/pedidos', label: 'Pedidos', icon: PhReceipt, path: '/pedidos' },
  { to: '/estoque', label: 'Estoque', icon: PhPackage, path: '/estoque' },
  { to: '/negocios', label: 'Negócios', icon: PhBuildings, path: '/negocios' },
  { to: '/usuarios', label: 'Usuários', icon: PhUsers, path: '/usuarios' },
];

const filtered = computed(() => {
  if (!query.value) return pages;
  const q = query.value.toLowerCase();
  return pages.filter((p) => p.label.toLowerCase().includes(q) || p.path.includes(q));
});

function close() {
  query.value = '';
  emit('close');
}

function navigate(to: string) {
  router.push(to);
  close();
}

function nextResult() {
  if (highlighted.value < filtered.value.length - 1) highlighted.value++;
}

function prevResult() {
  if (highlighted.value > 0) highlighted.value--;
}

function selectHighlighted() {
  if (filtered.value[highlighted.value]) {
    navigate(filtered.value[highlighted.value].to);
  }
}

watch(() => props.open, async (v) => {
  if (v) {
    highlighted.value = 0;
    query.value = '';
    await nextTick();
    inputRef.value?.focus();
  }
});
</script>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  z-index: 500;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.search-modal {
  width: 100%;
  max-width: 520px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow: hidden;
  animation: slideDown 0.2s ease;
}
@keyframes slideDown { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border-light);
}
.search-magnifier { flex-shrink: 0; color: var(--color-text-muted); }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
  color: var(--color-text-primary);
}
.search-input::placeholder { color: var(--color-text-muted); }
.search-kbd {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: var(--color-bg-tertiary);
}
.search-results { padding: 0.5rem; max-height: 320px; overflow-y: auto; }
.search-result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--color-text-primary);
  text-align: left;
  transition: background 0.1s;
}
.search-result:hover,
.search-result--active { background: var(--color-bg-tertiary); }
.search-path { margin-left: auto; font-size: 0.75rem; color: var(--color-text-muted); }
.search-empty { padding: 1.5rem; text-align: center; color: var(--color-text-muted); font-size: 0.875rem; }
</style>
