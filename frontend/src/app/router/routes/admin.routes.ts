import type { RouteRecordRaw } from 'vue-router';

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'Dashboard',
    component: () => import('@/modules/painel/pages/DashboardPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'negocios',
    name: 'Negocios',
    component: () => import('@/modules/negocios/pages/NegociosListPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'negocios/novo',
    name: 'NegocioNovo',
    component: () => import('@/modules/negocios/pages/NegocioFormPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'negocios/:id',
    name: 'NegocioDetalhe',
    component: () => import('@/modules/negocios/pages/NegocioDetalhePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'negocios/:id/editar',
    name: 'NegocioEditar',
    component: () => import('@/modules/negocios/pages/NegocioFormPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'negocios/:id/membros',
    name: 'NegocioMembros',
    component: () => import('@/modules/negocios/pages/MembrosPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'categorias',
    name: 'Categorias',
    component: () => import('@/modules/categorias/pages/CategoriasPage.vue'),
    meta: { requiresAuth: true, requiresBusiness: true },
  },
  {
    path: 'pdv',
    name: 'PDV',
    component: () => import('@/modules/pdv/pages/PDVPage.vue'),
    meta: { requiresAuth: true, requiresBusiness: true },
  },
  {
    path: 'catalogo',
    name: 'CatalogoAdmin',
    component: () => import('@/modules/catalogo/pages/GerenciarCatalogo.vue'),
    meta: { requiresAuth: true, requiresBusiness: true },
  },
  {
    path: 'catalogo/novo',
    name: 'ProdutoNovo',
    component: () => import('@/modules/catalogo/pages/ProdutoForm.vue'),
    meta: { requiresAuth: true, requiresBusiness: true },
  },
  {
    path: 'catalogo/:id',
    name: 'ProdutoDetalhe',
    component: () => import('@/modules/catalogo/pages/ProdutoForm.vue'),
    meta: { requiresAuth: true, requiresBusiness: true },
  },
  {
    path: 'pedidos',
    name: 'PedidosAdmin',
    component: () => import('@/modules/pedidos/pages/PedidosListPage.vue'),
    meta: { requiresAuth: true, requiresBusiness: true },
  },
  {
    path: 'estoque',
    name: 'Estoque',
    component: () => import('@/modules/estoque/pages/EstoquePage.vue'),
    meta: { requiresAuth: true, requiresBusiness: true },
  },
  {
    path: 'estoque/:itemId/historico',
    name: 'EstoqueHistorico',
    component: () => import('@/modules/estoque/pages/HistoricoPage.vue'),
    meta: { requiresAuth: true, requiresBusiness: true },
  },
  {
    path: 'usuarios',
    name: 'Usuarios',
    component: () => import('@/modules/usuarios/pages/UsuariosListPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'usuarios/novo',
    name: 'UsuarioNovo',
    component: () => import('@/modules/usuarios/pages/UsuarioFormPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: 'usuarios/:id/editar',
    name: 'UsuarioEditar',
    component: () => import('@/modules/usuarios/pages/UsuarioFormPage.vue'),
    meta: { requiresAuth: true },
  },
];
