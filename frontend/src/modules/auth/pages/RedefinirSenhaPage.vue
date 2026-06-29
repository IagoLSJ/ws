<template>
  <div class="page">
    <div class="card">
      <h1>Redefinir Senha</h1>
      <form @submit.prevent="handleRedefinir">
        <AppInput v-model="novaSenha" label="Nova senha" type="password" placeholder="Mínimo 6 caracteres" />
        <AppInput v-model="confirmarSenha" label="Confirmar senha" type="password" placeholder="Repita a senha" />
        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">{{ success }}</p>
        <AppButton type="submit" :loading="loading" class="full-width">
          Redefinir senha
        </AppButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const route = useRoute();
const router = useRouter();

const novaSenha = ref('');
const confirmarSenha = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

async function handleRedefinir() {
  error.value = '';
  success.value = '';

  if (novaSenha.value.length < 6) { error.value = 'Senha deve ter no mínimo 6 caracteres'; return; }
  if (novaSenha.value !== confirmarSenha.value) { error.value = 'Senhas não conferem'; return; }

  loading.value = true;
  try {
    const token = route.query.token as string;
    if (!token) { error.value = 'Token inválido'; return; }
    await api.post('/auth/redefinir-senha', { token, novaSenha: novaSenha.value });
    success.value = 'Senha redefinida com sucesso!';
    setTimeout(() => router.push('/login'), 2000);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erro ao redefinir senha.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg-primary); padding: 1rem; }
.card { width: 100%; max-width: 400px; background: var(--color-bg-secondary); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-lg); }
.full-width { width: 100%; margin-top: 0.5rem; }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); }
.success-msg { font-size: 0.8125rem; color: var(--color-success); }
</style>
