<template>
  <div>
    <div class="page-header">
      <h1>{{ isEdit ? 'Editar Negócio' : 'Novo Negócio' }}</h1>
    </div>

    <AppCard>
      <form @submit.prevent="handleSubmit">
        <div class="logo-section">
          <div class="logo-preview" @click="selecionarLogo">
            <img v-if="logoPreview" :src="logoPreview" alt="Logo" class="logo-img" />
            <div v-else class="logo-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
              </svg>
              <span>Adicionar logo</span>
            </div>
            <button v-if="logoPreview" type="button" class="logo-remove" @click.stop="removerLogo">&times;</button>
          </div>
          <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFile" />
          <div v-if="uploading" class="logo-uploading">Enviando...</div>
        </div>

        <div class="form-grid">
          <AppInput v-model="form.nome" label="Nome" placeholder="Nome do negócio" :error="errors.nome" />
          <AppInput v-model="form.slug" label="Slug" placeholder="meu-negocio" :error="errors.slug" />
          <AppInput v-model="form.descricao" label="Descrição" placeholder="Breve descrição" class="full-width" />
        </div>
        <p v-if="errors.geral" class="error-msg">{{ errors.geral }}</p>
        <div class="form-actions">
          <AppButton variant="ghost" @click="router.push('/negocios')">Cancelar</AppButton>
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
import { useBusinessStore } from '@/app/stores/business.store';
import api from '@/shared/utils/api';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const route = useRoute();
const router = useRouter();
const businessStore = useBusinessStore();

const isEdit = computed(() => !!route.params.id);
const saving = ref(false);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement>();
const logoPreview = ref('');
const logoFile = ref<File>();

const form = reactive({ nome: '', slug: '', descricao: '' });
const errors = reactive({ nome: '', slug: '', geral: '' });

function selecionarLogo() {
  fileInput.value?.click();
}

async function handleFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  logoPreview.value = URL.createObjectURL(file);
  logoFile.value = file;

  if (isEdit.value) {
    const negocioId = route.params.id as string;
    uploading.value = true;
    try {
      const { data } = await api.post(`/negocios/${negocioId}/logo`, { fileName: file.name });

      const uploadRes = await fetch(data.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('Upload falhou');

      await api.post(`/negocios/${negocioId}/logo/confirmar`, { key: data.key });
    } catch {
      logoPreview.value = '';
      logoFile.value = undefined;
    } finally {
      uploading.value = false;
    }
  }
}

async function removerLogo() {
  if (!isEdit.value) {
    logoPreview.value = '';
    logoFile.value = undefined;
    return;
  }

  try {
    await api.delete(`/negocios/${route.params.id as string}/logo`);
    logoPreview.value = '';
    logoFile.value = undefined;
  } catch {}
}

async function handleSubmit() {
  errors.nome = '';
  errors.slug = '';
  errors.geral = '';

  if (!form.nome) { errors.nome = 'Nome obrigatório'; return; }

  saving.value = true;
  try {
    if (isEdit.value) {
      await businessStore.update(route.params.id as string, form);
    } else {
      const created = await businessStore.create(form);
      if (logoFile.value && created?.id) {
        const file = logoFile.value;
        const { data } = await api.post(`/negocios/${created.id}/logo`, { fileName: file.name });
        const uploadRes = await fetch(data.url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (uploadRes.ok) {
          await api.post(`/negocios/${created.id}/logo/confirmar`, { key: data.key });
        }
      }
    }
    router.push('/negocios');
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
      const data = await businessStore.fetchOne(route.params.id as string);
      if (data) {
        form.nome = data.nome;
        form.slug = data.slug;
        form.descricao = data.descricao ?? '';
        if (data.logoUrl) logoPreview.value = data.logoUrl;
      } else {
        router.push('/negocios');
      }
    } catch {
      errors.geral = 'Erro ao carregar dados';
    }
  }
});
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }

.logo-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.logo-preview {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: border-color 0.2s;
}

.logo-preview:hover { border-color: #ffd401; }

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: #9ca3af;
  font-size: 0.6875rem;
}

.logo-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: #dc2626;
  color: #fff;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.logo-uploading {
  text-align: center;
  font-size: 0.8125rem;
  color: #888;
  margin-top: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-grid :deep(.full-width) { grid-column: 1 / -1; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.error-msg { font-size: 0.8125rem; color: var(--color-danger); margin-top: 0.5rem; }
</style>
