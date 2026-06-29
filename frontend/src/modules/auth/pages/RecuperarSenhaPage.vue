<template>
  <div class="page">
    <div class="card">
      <h1>Recuperar Senha</h1>
      <p class="subtitle">Receba um link para redefinir sua senha</p>
      <form @submit.prevent="handleRecuperar">
        <AppInput v-model="email" label="E-mail" type="email" placeholder="seu@email.com" />
        <p v-if="success" class="success-msg">{{ success }}</p>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <AppButton type="submit" :loading="loading" class="full-width">
          Enviar link
        </AppButton>
      </form>
      <router-link to="/login" class="back-link">Voltar ao login</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/shared/utils/api';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const email = ref('');
const loading = ref(false);
const success = ref('');
const error = ref('');

async function handleRecuperar() {
  loading.value = true;
  success.value = '';
  error.value = '';
  try {
    const { data } = await api.post('/auth/recuperar-senha', { email: email.value });
    success.value = data.message || 'Link enviado com sucesso.';
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erro ao solicitar recuperação.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg-primary); padding: 1rem; }
.card { width: 100%; max-width: 400px; background: var(--color-bg-secondary); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-lg); }
.subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 1.5rem; }
.full-width { width: 100%; margin-top: 0.5rem; }
.success-msg { font-size: 0.8125rem; color: var(--color-success); }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); }
.back-link { display: block; text-align: center; margin-top: 1rem; font-size: 0.8125rem; }
</style>
