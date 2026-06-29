<template>
  <div>
    <div class="page-header">
      <h1>{{ isEdit ? 'Editar Usuário' : 'Novo Usuário' }}</h1>
    </div>

    <AppCard>
      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <AppInput v-model="form.nome" label="Nome" :error="errors.nome" />
          <AppInput v-model="form.email" label="E-mail" type="email" :error="errors.email" />
          <AppInput
            v-model="form.senha"
            :label="isEdit ? 'Nova senha (deixar vazio para manter)' : 'Senha'"
            type="password"
            :error="errors.senha"
          />
        </div>
        <p v-if="errors.geral" class="error-msg">{{ errors.geral }}</p>
        <div class="form-actions">
          <AppButton variant="ghost" @click="router.push('/usuarios')">Cancelar</AppButton>
          <AppButton type="submit" :loading="saving">
            {{ isEdit ? 'Salvar' : 'Criar' }}
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);
const saving = ref(false);
const form = reactive({ nome: '', email: '', senha: '' });
const errors = reactive({ nome: '', email: '', senha: '', geral: '' });

async function handleSubmit() {
  errors.nome = '';
  errors.email = '';
  errors.senha = '';
  errors.geral = '';

  if (!form.nome) { errors.nome = 'Nome obrigatório'; return; }
  if (!form.email) { errors.email = 'E-mail obrigatório'; return; }
  if (!isEdit.value && !form.senha) { errors.senha = 'Senha obrigatória'; return; }

  saving.value = true;
  try {
    if (isEdit.value) {
      const payload: any = { nome: form.nome, email: form.email };
      if (form.senha) payload.senha = form.senha;
      await api.patch(`/usuarios/${route.params.id}`, payload);
    } else {
      await api.post('/usuarios', form);
    }
    router.push('/usuarios');
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao salvar';
    errors.geral = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  if (isEdit.value) {
    try {
      const { data } = await api.get(`/usuarios/${route.params.id}`);
      form.nome = data.nome;
      form.email = data.email;
    } catch {
      errors.geral = 'Erro ao carregar dados';
    }
  }
});
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border-light); }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); margin-top: 0.5rem; }
</style>
