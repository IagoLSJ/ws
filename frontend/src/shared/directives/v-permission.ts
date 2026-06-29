import type { Directive } from 'vue';
import { usePermissions } from '@/shared/composables/usePermissions';
import { RoleNegocio } from '@/shared/utils/types';

export const vPermission: Directive<HTMLElement, RoleNegocio> = {
  mounted(el, binding) {
    const { can } = usePermissions();
    if (!can(binding.value)) {
      el.style.display = 'none';
    }
  },
  updated(el, binding) {
    const { can } = usePermissions();
    if (!can(binding.value)) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
  },
};
