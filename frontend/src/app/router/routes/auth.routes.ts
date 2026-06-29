import type { RouteRecordRaw } from 'vue-router';

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/recuperar-senha',
    name: 'RecuperarSenha',
    component: () => import('@/modules/auth/pages/RecuperarSenhaPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/redefinir-senha',
    name: 'RedefinirSenha',
    component: () => import('@/modules/auth/pages/RedefinirSenhaPage.vue'),
    meta: { requiresAuth: false },
  },
];
