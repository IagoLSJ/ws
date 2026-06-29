import type { NavigationGuard } from 'vue-router';
import { useAuthStore } from '@/app/stores/auth.store';
import { useBusinessStore } from '@/app/stores/business.store';

export const authGuard: NavigationGuard = async (to, _from, next) => {
  const auth = useAuthStore();
  const business = useBusinessStore();

  if (to.meta.requiresAuth === false) {
    next();
    return;
  }

  if (!auth.isAuthenticated) {
    next('/login');
    return;
  }

  if (!auth.user) {
    await auth.fetchMe();
  }

  if (to.meta.roles && auth.user) {
    const membros = auth.user.membros ?? [];
    const hasRole = membros.some((m) => (to.meta.roles as string[]).includes(m.role));
    if (!hasRole) {
      next('/');
      return;
    }
  }

  if (to.meta.requiresBusiness && !business.businessId()) {
    if (auth.user?.membros?.length) {
      const first = auth.user.membros[0];
      business.setBusinessId(first.negocioId);
    } else {
      next('/negocios');
      return;
    }
  }

  next();
};
