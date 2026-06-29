<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">MultiNegócio</h1>
      <p class="login-subtitle">Faça login para continuar</p>
      <form @submit.prevent="handleLogin">
        <AppInput
          v-model="email"
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          :error="errors.email"
        />
        <AppInput
          v-model="senha"
          label="Senha"
          type="password"
          placeholder="Sua senha"
          :error="errors.senha"
        />
        <p v-if="errors.geral" class="login-error">{{ errors.geral }}</p>
        <AppButton type="submit" :loading="auth.loading" class="login-btn">
          Entrar
        </AppButton>
      </form>
      <router-link to="/recuperar-senha" class="login-forgot">
        Esqueceu a senha?
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/app/stores/auth.store';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const senha = ref('');
const errors = reactive({ email: '', senha: '', geral: '' });

async function handleLogin() {
  errors.email = '';
  errors.senha = '';
  errors.geral = '';

  if (!email.value) { errors.email = 'E-mail obrigatório'; return; }
  if (!senha.value) { errors.senha = 'Senha obrigatória'; return; }

  try {
    await auth.login(email.value, senha.value);
    await auth.fetchMe();
    router.push('/');
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao fazer login';
    errors.geral = Array.isArray(msg) ? msg.join(', ') : msg;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
  padding: 1rem;
}
.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow-lg);
}
.login-title { font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 0.25rem; }
.login-subtitle { font-size: 0.875rem; color: var(--color-text-muted); text-align: center; margin-bottom: 1.5rem; }
.login-btn { width: 100%; margin-top: 0.5rem; }
.login-error { font-size: 0.8125rem; color: var(--color-danger); text-align: center; }
.login-forgot {
  display: block;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.8125rem;
}
</style>
