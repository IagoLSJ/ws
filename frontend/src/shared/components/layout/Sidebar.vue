<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': !open }">
    <!-- Logo -->
    <div class="sidebar__header">
      <div class="sidebar__logo">
        <span class="sidebar__logo-icon">MN</span>
        <span v-show="open" class="sidebar__logo-text">MultiNegócio</span>
      </div>
    </div>

    <!-- Business Selector -->
    <div v-if="businessStore.businesses.length && open" class="sidebar__business">
      <button class="sidebar__business-btn" @click="toggleOpen = !toggleOpen">
        <PhBuildings class="sidebar__business-icon" :size="18" weight="bold" />
        <span class="sidebar__business-name">{{ currentBusinessName }}</span>
        <PhCaretDown class="sidebar__business-chevron" :class="{ 'sidebar__business-chevron--open': toggleOpen }" :size="14" weight="bold" />
      </button>
      <Transition name="dropdown">
        <div v-if="toggleOpen" class="sidebar__business-dropdown">
          <button
            v-for="b in businessStore.businesses"
            :key="b.id"
            class="sidebar__business-option"
            :class="{ 'sidebar__business-option--active': b.id === currentBusinessId }"
            @click="selectBusiness(b.id)"
          >
            <span class="sidebar__business-option-name">{{ b.nome }}</span>
            <PhCheck v-if="b.id === currentBusinessId" class="sidebar__business-option-check" :size="14" weight="bold" />
          </button>
        </div>
      </Transition>
    </div>

    <!-- Navigation -->
    <nav class="sidebar__nav">
      <div v-for="section in sections" :key="section.label">
        <div v-show="open" class="sidebar__section-label">{{ section.label }}</div>
        <router-link
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="sidebar__link"
          :class="{ 'sidebar__link--active': isActive(item.to) }"
        >
          <component :is="item.icon" class="sidebar__icon" :size="20" weight="bold" />
          <span v-show="open" class="sidebar__label">{{ item.label }}</span>
          <span v-if="item.badge && open" class="sidebar__badge">{{ item.badge }}</span>
        </router-link>
      </div>
    </nav>

    <!-- User Footer -->
    <div class="sidebar__footer">
      <div class="sidebar__user">
        <div class="sidebar__avatar">{{ userInitial }}</div>
        <div v-show="open" class="sidebar__user-info">
          <span class="sidebar__user-name">{{ userName }}</span>
          <span class="sidebar__user-role">{{ userRole }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBusinessStore } from '@/app/stores/business.store';
import { useAuthStore } from '@/app/stores/auth.store';
import { RoleNegocio } from '@/shared/utils/types';
import {
  PhHouse, PhBuildings, PhBookOpen, PhPackage, PhUsers, PhReceipt, PhTag, PhCaretDown, PhCheck, PhShoppingCart, PhChartLine, PhClipboardText,
} from '@phosphor-icons/vue';

defineProps<{ open: boolean }>();

const route = useRoute();
const router = useRouter();
const businessStore = useBusinessStore();
const auth = useAuthStore();

const toggleOpen = ref(false);

const currentBusinessId = computed(() => businessStore.businessId());

const currentBusinessName = computed(() => {
  if (!currentBusinessId.value) return 'Selecionar negócio';
  const found = businessStore.businesses.find((b) => b.id === currentBusinessId.value);
  return found?.nome ?? 'Selecionar negócio';
});

function selectBusiness(id: string) {
  businessStore.setBusinessId(id);
  toggleOpen.value = false;
}

function onClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.sidebar__business')) {
    toggleOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside);
  if (auth.isAuthenticated && !businessStore.businesses.length) {
    businessStore.fetchAll();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
});

const isSuperAdmin = computed(() =>
  auth.user?.membros?.some((m) => m.role === RoleNegocio.SUPER_ADMIN),
);

const userName = computed(() => auth.user?.nome ?? 'Usuário');
const userInitial = computed(() => userName.value.charAt(0).toUpperCase());

const userRole = computed(() => {
  const membro = auth.user?.membros?.[0];
  if (!membro) return '';
  const labels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    GERENTE: 'Gerente',
    OPERADOR: 'Operador',
    VISUALIZADOR: 'Visualizador',
  };
  return labels[membro.role] || membro.role;
});

interface MenuItem {
  to: string;
  icon: any;
  label: string;
  badge?: string | number;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const sections = computed<MenuSection[]>(() => {
  const config: MenuSection = {
    label: 'Configurações',
    items: [
      { to: '/', icon: PhHouse, label: 'Dashboard' },
      { to: '/pdv', icon: PhShoppingCart, label: 'PDV Caixa' },
      { to: '/catalogo', icon: PhBookOpen, label: 'Catálogo' },
      { to: '/categorias', icon: PhTag, label: 'Categorias' },
      { to: '/pedidos', icon: PhReceipt, label: 'Pedidos' },
      { to: '/estoque', icon: PhPackage, label: 'Estoque' },
      
    ],
  };

  const result: MenuSection[] = [config];

  if (isSuperAdmin.value) {
    result.push({
      label: 'Administração',
      items: [
        { to: '/negocios', icon: PhBuildings, label: 'Negócios' },
        { to: '/usuarios', icon: PhUsers, label: 'Usuários' },
        { to: '/relatorios', icon: PhChartLine, label: 'Relatórios' },
      { to: '/auditoria', icon: PhClipboardText, label: 'Auditoria' },
      ],
    });
  }

  return result;
});

function isActive(to: string) {
  if (to === '/') return route.path === '/';
  return route.path.startsWith(to);
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-secondary);
  color: rgba(255, 255, 255, 0.92);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  z-index: 100;
  overflow: hidden;
}
.sidebar--collapsed { width: var(--sidebar-collapsed-width); }

/* Header */
.sidebar__header {
  padding: 1.125rem 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.sidebar__logo {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.sidebar__logo-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.sidebar__logo-text {
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
}

/* Business Selector */
.sidebar__business {
  position: relative;
  padding: 0.5rem 0.75rem;
  flex-shrink: 0;
}
.sidebar__business-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.06);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
  font-size: 0.8125rem;
  text-align: left;
}
.sidebar__business-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.25);
}
.sidebar__business-icon {
  flex-shrink: 0;
  opacity: 0.5;
}
.sidebar__business-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.sidebar__business-chevron {
  flex-shrink: 0;
  opacity: 0.4;
  transition: transform var(--transition-fast);
}
.sidebar__business-chevron--open {
  transform: rotate(180deg);
}
.sidebar__business-dropdown {
  position: absolute;
  top: calc(100% - 0.25rem);
  left: 0.75rem;
  right: 0.75rem;
  background: #141622;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  z-index: 200;
  overflow: hidden;
}
.sidebar__business-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.84);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  text-align: left;
  transition: all var(--transition-fast);
}
.sidebar__business-option:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
}
.sidebar__business-option--active {
  color: #fff;
  background: rgba(255,255,255,0.14);
}
.sidebar__business-option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar__business-option-check {
  flex-shrink: 0;
  color: var(--color-primary);
}

/* Dropdown transition */
.dropdown-enter-active { transition: all 0.15s ease-out; }
.dropdown-leave-active { transition: all 0.1s ease-in; }
.dropdown-enter-from { opacity: 0; transform: translateY(-4px); }
.dropdown-leave-to { opacity: 0; transform: translateY(-4px); }

/* Navigation */
.sidebar__nav {
  padding: 0.5rem 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar__nav::-webkit-scrollbar { width: 3px; }
.sidebar__nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }

.sidebar__section-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.48);
  padding: 1rem 1.5rem 0.375rem;
  white-space: nowrap;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1.25rem;
  margin: 0.125rem 0.5rem;
  border-radius: var(--radius-md);
  color: rgba(255,255,255,0.76);
  text-decoration: none;
  transition: all var(--transition-fast);
  white-space: nowrap;
  position: relative;
}
.sidebar__link:hover {
  color: #fff;
  background: rgba(255,255,255,0.1);
}
.sidebar__link--active {
  color: #fff;
  background: rgba(255,255,255,0.16);
}
.sidebar__link--active::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 3px 3px 0;
  background: var(--color-primary);
}
.sidebar__icon { flex-shrink: 0; }
.sidebar__label { font-size: 0.875rem; font-weight: 500; }
.sidebar__badge {
  margin-left: auto;
  font-size: 0.6875rem;
  font-weight: 600;
  background: var(--color-danger);
  color: #fff;
  padding: 0.0625rem 0.4375rem;
  border-radius: var(--radius-full);
  min-width: 1.125rem;
  text-align: center;
}

/* Footer */
.sidebar__footer {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 0.75rem 1rem;
  flex-shrink: 0;
}
.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.sidebar__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}
.sidebar__user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.sidebar__user-name {
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar__user-role {
  font-size: 0.6875rem;
  color: rgba(255,255,255,0.58);
}
</style>
