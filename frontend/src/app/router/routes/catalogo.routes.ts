import type { RouteRecordRaw } from 'vue-router';

export const catalogoRoutes: RouteRecordRaw[] = [
  {
    path: '/vitrine/:slug',
    name: 'Vitrine',
    component: () => import('@/modules/catalogo/pages/CatalogoPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/vitrine/:slug/checkout',
    name: 'Checkout',
    component: () => import('@/modules/catalogo/pages/CheckoutPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/vitrine/:slug/pedido/:pedidoId',
    name: 'PedidoConfirmado',
    component: () => import('@/modules/catalogo/pages/PedidoConfirmadoPage.vue'),
    meta: { requiresAuth: false },
  },
];
