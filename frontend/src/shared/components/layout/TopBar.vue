<template>
  <header class="topbar" :class="{ 'topbar--expanded': !sidebarOpen }">
    <!-- Hamburger -->
    <button class="topbar__toggle" @click="$emit('toggle')" title="Toggle sidebar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <!-- Breadcrumbs -->
    <nav class="topbar__breadcrumbs">
      <template v-for="(crumb, i) in breadcrumbs" :key="crumb.to">
        <router-link
          v-if="crumb.to && i < breadcrumbs.length - 1"
          :to="crumb.to"
          class="topbar__crumb topbar__crumb--link"
        >
          {{ crumb.label }}
        </router-link>
        <span v-else-if="i < breadcrumbs.length - 1" class="topbar__crumb topbar__crumb--link" @click="navigate(crumb.to)">
          {{ crumb.label }}
        </span>
        <span v-else class="topbar__crumb topbar__crumb--current">{{ crumb.label }}</span>
        <svg v-if="i < breadcrumbs.length - 1" class="topbar__sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </template>
    </nav>

    <div class="topbar__spacer" />

    <!-- Search -->
    <button class="topbar__action" @click="emitSearch" title="Pesquisar (Ctrl+K)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <span class="topbar__shortcut">Ctrl+K</span>
    </button>

    <!-- Notifications placeholder -->
    <button class="topbar__action" title="Notificações">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    </button>

    <!-- User Dropdown -->
    <div class="topbar__user" @click="dropdownOpen = !dropdownOpen">
      <div class="topbar__avatar">{{ userInitial }}</div>
      <span class="topbar__name">{{ userName }}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
      <div v-if="dropdownOpen" class="topbar__dropdown">
        <div class="topbar__dropdown-header">
          <span class="topbar__dropdown-name">{{ userName }}</span>
          <span class="topbar__dropdown-email">{{ userEmail }}</span>
        </div>
        <div class="topbar__dropdown-divider" />
        <button class="topbar__dropdown-item" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/app/stores/auth.store';
import { useUiStore } from '@/app/stores/ui.store';

defineEmits<{ toggle: []; search: [] }>();

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();

const sidebarOpen = computed(() => ui.sidebarOpen);
const dropdownOpen = ref(false);

const userName = computed(() => auth.user?.nome ?? 'Usuário');
const userEmail = computed(() => auth.user?.email ?? '');
const userInitial = computed(() => userName.value.charAt(0).toUpperCase());

interface Breadcrumb {
  label: string;
  to?: string;
}

const breadcrumbMap: Record<string, Breadcrumb[]> = {
  '/': [{ label: 'Dashboard' }],
  '/negocios': [{ label: 'Negócios' }],
  '/negocios/novo': [{ label: 'Negócios', to: '/negocios' }, { label: 'Novo' }],
  '/negocios/:id': [{ label: 'Negócios', to: '/negocios' }, { label: 'Detalhe' }],
  '/negocios/:id/editar': [{ label: 'Negócios', to: '/negocios' }, { label: 'Editar' }],
  '/negocios/:id/membros': [{ label: 'Negócios', to: '/negocios' }, { label: 'Membros' }],
  '/catalogo': [{ label: 'Catálogo' }],
  '/catalogo/novo': [{ label: 'Catálogo', to: '/catalogo' }, { label: 'Novo Produto' }],
  '/catalogo/:id': [{ label: 'Catálogo', to: '/catalogo' }, { label: 'Editar Produto' }],
  '/categorias': [{ label: 'Categorias' }],
  '/pedidos': [{ label: 'Pedidos' }],
  '/estoque': [{ label: 'Estoque' }],
  '/estoque/:id/historico': [{ label: 'Estoque', to: '/estoque' }, { label: 'Histórico' }],
  '/usuarios': [{ label: 'Usuários' }],
  '/usuarios/novo': [{ label: 'Usuários', to: '/usuarios' }, { label: 'Novo' }],
  '/usuarios/:id/editar': [{ label: 'Usuários', to: '/usuarios' }, { label: 'Editar' }],
};

const breadcrumbs = computed<Breadcrumb[]>(() => {
  const path = route.path;
  const match = Object.keys(breadcrumbMap).find((pattern) => {
    if (pattern === path) return true;
    const regex = new RegExp('^' + pattern.replace(/:\w+/g, '[^/]+') + '$');
    return regex.test(path);
  });
  if (match) return breadcrumbMap[match];
  return [{ label: route.name as string || 'Página' }];
});

function emitSearch() {
  dropdownOpen.value = false;
  const event = new CustomEvent('opencode:search');
  window.dispatchEvent(event);
}

function navigate(to?: string) {
  if (to) router.push(to);
}

async function handleLogout() {
  dropdownOpen.value = false;
  await auth.logout();
  router.push('/login');
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    emitSearch();
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.topbar__user')) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.topbar {
  position: fixed;
  top: 0;
  right: 0;
  height: var(--header-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  padding: 0 1.25rem;
  gap: 0.5rem;
  z-index: 50;
  left: var(--sidebar-width);
  transition: left var(--transition-base);
}
.topbar--expanded { left: var(--sidebar-collapsed-width); }

/* Toggle */
.topbar__toggle {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.topbar__toggle:hover { background: var(--color-bg-tertiary); color: var(--color-text-primary); }

/* Breadcrumbs */
.topbar__breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  overflow: hidden;
}
.topbar__crumb {
  font-size: 0.8125rem;
  white-space: nowrap;
  color: var(--color-text-muted);
}
.topbar__crumb--link {
  color: var(--color-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: color var(--transition-fast);
}
.topbar__crumb--link:hover { color: var(--color-primary); }
.topbar__crumb--current { color: var(--color-text-primary); font-weight: 600; }
.topbar__sep { flex-shrink: 0; color: var(--color-border-medium); }

.topbar__spacer { flex: 1; }

/* Actions */
.topbar__action {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.topbar__action:hover { background: var(--color-bg-tertiary); color: var(--color-text-primary); }
.topbar__shortcut {
  font-size: 0.625rem;
  padding: 0.0625rem 0.3125rem;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
}

/* User */
.topbar__user {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem 0.375rem 0.375rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}
.topbar__user:hover { background: var(--color-bg-tertiary); }
.topbar__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  flex-shrink: 0;
}
.topbar__name { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-primary); }

/* Dropdown */
.topbar__dropdown {
  position: absolute;
  top: calc(100% + 0.375rem);
  right: 0;
  min-width: 200px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 60;
  animation: dropIn 0.12s ease;
}
@keyframes dropIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.topbar__dropdown-header {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
}
.topbar__dropdown-name { font-size: 0.8125rem; font-weight: 600; color: var(--color-text-primary); }
.topbar__dropdown-email { font-size: 0.75rem; color: var(--color-text-muted); }
.topbar__dropdown-divider { height: 1px; background: var(--color-border-light); }
.topbar__dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}
.topbar__dropdown-item:hover { background: var(--color-bg-tertiary); color: var(--color-danger); }
</style>
