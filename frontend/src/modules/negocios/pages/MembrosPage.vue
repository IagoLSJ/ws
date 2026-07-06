<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Membros</h1>
        <p class="text-muted">{{ negocio?.nome || 'Negócio' }}</p>
      </div>
      <AppButton v-if="canGerente" @click="showModal = true">Convidar Membro</AppButton>
    </div>

    <div v-if="loading" class="loading">Carregando...</div>
    <table v-else class="table">
      <thead>
        <tr>
          <th>Usuário</th>
          <th>Função</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in membros" :key="row.id">
          <td>
            <div>{{ row.usuario?.nome }}</div>
            <span class="text-muted">{{ row.usuario?.email }}</span>
          </td>
          <td>
            <select
              v-if="canGerente"
              v-model="row.role"
              class="role-select text-white"
              @change="atualizarRole(row)"
            >
              <option v-for="r in roleOptions" class="text-white" :value="r.value">{{ r.label }}</option>
            </select>
            <span v-else>{{ row.role }}</span>
          </td>
          <td>{{ row.ativo ? 'Ativo' : 'Inativo' }}</td>
          <td><button v-if="canGerente" @click="confirmarRemocao(row)">Remover</button></td>
        </tr>
      </tbody>
    </table>

    <AppModal :open="showModal" title="Convidar Membro" @close="showModal = false">
      <form @submit.prevent="handleConvite">
        <AppInput v-model="conviteEmail" label="E-mail" type="email" placeholder="email@exemplo.com" />
        <AppSelect v-model="conviteRole" label="Função" :options="roleOptions" />
        <p v-if="conviteError" class="error-msg">{{ conviteError }}</p>
        <div class="modal-footer-buttons">
          <AppButton variant="ghost" @click="showModal = false">Cancelar</AppButton>
          <AppButton type="submit" :loading="convidando">Convidar</AppButton>
        </div>
      </form>
    </AppModal>

    <ConfirmDialog
      :open="showConfirm"
      title="Remover Membro"
      :message="`Remover ${membroParaRemover?.usuario?.nome} do negócio?`"
      confirm-text="Remover"
      confirm-variant="danger"
      @confirm="handleRemove"
      @cancel="showConfirm = false; membroParaRemover = null"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/shared/utils/api';
import { usePermissions } from '@/shared/composables/usePermissions';
import { RoleNegocio, type MembroNegocio, type Negocio } from '@/shared/utils/types';
import { useUiStore } from '@/app/stores/ui.store';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog.vue';

const route = useRoute();
const ui = useUiStore();

const { can } = usePermissions();
const canGerente = computed(() => can(RoleNegocio.GERENTE));

const businessId = route.params.id as string;
const membros = ref<MembroNegocio[]>([]);
const negocio = ref<Negocio | null>(null);
const loading = ref(true);
const showModal = ref(false);
const showConfirm = ref(false);
const membroParaRemover = ref<MembroNegocio | null>(null);
const conviteEmail = ref('');
const conviteRole = ref(RoleNegocio.VISUALIZADOR);
const convidando = ref(false);
const conviteError = ref('');

const roleOptions = [
  { value: RoleNegocio.GERENTE, label: 'Gerente' },
  { value: RoleNegocio.OPERADOR, label: 'Operador' },
  { value: RoleNegocio.VISUALIZADOR, label: 'Visualizador' },
];

async function fetchData() {
  loading.value = true;
  try {
    const [membrosRes, negocioRes] = await Promise.all([
      api.get(`/negocios/${businessId}/membros`),
      api.get(`/negocios/${businessId}`),
    ]);
    membros.value = membrosRes.data;
    negocio.value = negocioRes.data;
  } finally {
    loading.value = false;
  }
}

async function handleConvite() {
  conviteError.value = '';
  convidando.value = true;
  try {
    await api.post(`/negocios/${businessId}/membros/convidar`, {
      email: conviteEmail.value,
      role: conviteRole.value,
    });
    ui.addToast('Membro convidado com sucesso!', 'success');
    showModal.value = false;
    conviteEmail.value = '';
    await fetchData();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao convidar';
    conviteError.value = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    convidando.value = false;
  }
}

function confirmarRemocao(membro: MembroNegocio) {
  membroParaRemover.value = membro;
  showConfirm.value = true;
}

async function handleRemove() {
  if (!membroParaRemover.value) return;
  try {
    await api.delete(`/negocios/${businessId}/membros/${membroParaRemover.value.id}`);
    ui.addToast('Membro removido.', 'success');
    showConfirm.value = false;
    membroParaRemover.value = null;
    await fetchData();
  } catch {
    ui.addToast('Erro ao remover membro.', 'error');
  }
}

async function atualizarRole(membro: MembroNegocio) {
  try {
    await api.patch(`/negocios/${businessId}/membros/${membro.id}`, { role: membro.role });
    ui.addToast('Função atualizada.', 'success');
  } catch {
    ui.addToast('Erro ao atualizar função.', 'error');
    await fetchData();
  }
}

onMounted(fetchData);
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
.text-muted { color: var(--color-text-muted); font-size: 0.875rem; }
.loading { color: var(--color-text-muted); text-align: center; padding: 2rem; }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); }
.table { width: 100%; border-collapse: collapse; }
.table th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); background: var(--color-bg-tertiary); border-bottom: 1px solid var(--color-border-light); }
.table td { padding: 0.75rem 1rem; font-size: 0.875rem; border-bottom: 1px solid var(--color-border-light); }
.modal-footer-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.role-select { padding: 0.25rem 0.5rem; font-size: 0.8125rem; color: white;border-radius: var(--radius-md); border: 1px solid var(--color-border-medium); background: var(--color-bg-primary); cursor: pointer; outline: none; }
</style>
