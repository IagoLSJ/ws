import { createRouter, createWebHistory } from 'vue-router';
import { authRoutes } from './routes/auth.routes';
import { adminRoutes } from './routes/admin.routes';
import { catalogoRoutes } from './routes/catalogo.routes';
import { authGuard } from './guards/authGuard';
import AppLayout from '@/shared/components/layout/AppShell.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    ...catalogoRoutes,
    {
      path: '/',
      component: AppLayout,
      beforeEnter: [authGuard],
      children: adminRoutes,
    },
  ],
});

export default router;
