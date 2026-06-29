import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/app/stores/auth.store';
import { useBusinessStore } from '@/app/stores/business.store';
import { RoleNegocio } from '@/shared/utils/types';

const ROLE_HIERARCHY: Record<RoleNegocio, number> = {
  [RoleNegocio.SUPER_ADMIN]: 5,
  [RoleNegocio.ADMIN]: 4,
  [RoleNegocio.GERENTE]: 3,
  [RoleNegocio.OPERADOR_ESTOQUE]: 2,
  [RoleNegocio.VISUALIZADOR]: 1,
};

export function usePermissions() {
  const auth = useAuthStore();
  const business = useBusinessStore();
  const route = useRoute();

  const businessId = computed(() => {
    return (route.params.businessId as string) || (route.params.id as string) || business.businessId() || '';
  });

  const membership = computed(() => {
    if (!businessId.value) return null;
    return auth.currentBusiness(businessId.value) ?? null;
  });

  const role = computed<RoleNegocio | null>(() => {
    if (auth.user?.membros?.some((m) => m.role === RoleNegocio.SUPER_ADMIN)) {
      return RoleNegocio.SUPER_ADMIN;
    }
    return membership.value?.role ?? null;
  });

  function can(minRole: RoleNegocio): boolean {
    if (!role.value) return false;
    return ROLE_HIERARCHY[role.value] >= ROLE_HIERARCHY[minRole];
  }

  function isAtLeast(minRole: RoleNegocio): boolean {
    return can(minRole);
  }

  return { role, membership, businessId, can, isAtLeast };
}
