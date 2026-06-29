<template>
  <div class="app-shell">
    <!-- Mobile overlay -->
    <div v-if="ui.sidebarOpen && isMobile" class="sidebar-overlay" @click="ui.toggleSidebar()" />

    <Sidebar :open="ui.sidebarOpen" />
    <TopBar @toggle="ui.toggleSidebar()" @search="searchOpen = true" />
    <main class="app-main" :class="{ 'app-main--expanded': !ui.sidebarOpen }">
      <router-view :key="pageKey" />
    </main>
    <GlobalSearch :open="searchOpen" @close="searchOpen = false" />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUiStore } from '@/app/stores/ui.store';
import { useAuthStore } from '@/app/stores/auth.store';
import { useBusinessStore } from '@/app/stores/business.store';
import Sidebar from './Sidebar.vue';
import TopBar from './TopBar.vue';
import GlobalSearch from './GlobalSearch.vue';
import Toast from '@/shared/components/feedback/Toast.vue';

const ui = useUiStore();
const auth = useAuthStore();
const business = useBusinessStore();
const router = useRouter();

const pageKey = computed(() => business.businessId() || 'no-business');

const searchOpen = ref(false);
const isMobile = ref(window.innerWidth < 768);

function updateMobile() { isMobile.value = window.innerWidth < 768; }

onMounted(() => {
  updateMobile();
  window.addEventListener('resize', updateMobile);
    window.addEventListener('opencode:search', () => { searchOpen.value = true; });
    window.addEventListener('resize', updateMobile);
  if (auth.isAuthenticated && !auth.user) {
    auth.fetchMe();
  }
  if (!auth.isAuthenticated) {
    router.push('/login');
  }
});
</script>

<style scoped>
.app-shell { min-height: 100vh; }
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 99;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.app-main {
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  padding: 1.5rem;
  min-height: calc(100vh - var(--header-height));
  transition: margin-left var(--transition-base);
}
.app-main--expanded { margin-left: var(--sidebar-collapsed-width); }
@media (max-width: 768px) {
  .app-main, .app-main--expanded { margin-left: 0; }
  .app-main { padding: 1rem; }
}
</style>
