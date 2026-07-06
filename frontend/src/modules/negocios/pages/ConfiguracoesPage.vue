<template>
  <div>
    <div class="page-header">
      <h1>Configurações do Negócio</h1>
    </div>

    <div v-if="loading" class="loading">Carregando configurações...</div>

    <AppCard v-else>
      <form @submit.prevent="handleSubmit">
        <div class="form-section">
          <h3>Geral</h3>
          <div class="form-grid">
            <div class="app-input">
              <label class="app-input__label">Telefone de Contato</label>
              <input class="app-input__field" :value="form.telefoneContato" placeholder="(11) 99999-9999" @input="onPhoneInput" />
            </div>
            <AppInput v-model="form.taxaFrete" label="Taxa de Frete (R$)" type="number" step="0.01" min="0" />
          </div>
        </div>

        <div class="form-section">
          <h3>Endereço</h3>
          <div class="form-grid">
            <AppInput v-model="form.endereco.rua" label="Rua" class="full-width" />
            <AppInput v-model="form.endereco.numero" label="Número" />
            <AppInput v-model="form.endereco.bairro" label="Bairro" />
            <AppInput v-model="form.endereco.cidade" label="Cidade" />
            <div class="app-input">
              <label class="app-input__label">Estado</label>
              <select class="app-input__field" :value="form.endereco.estado" @change="onEstadoChange">
                <option value="">Selecione</option>
                <option v-for="uf in ufList" :key="uf" :value="uf">{{ uf }}</option>
              </select>
            </div>
            <div class="app-input">
              <label class="app-input__label">CEP</label>
              <input class="app-input__field" :value="form.endereco.cep" placeholder="01001-000" maxlength="9" @input="onCepInput" />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Horário de Funcionamento</h3>
          <div v-for="(d, i) in form.horario" :key="i" class="horario-row">
            <span class="horario-dia">{{ diasSemana[i] }}</span>
            <label class="checkbox-label">
              <input v-model="d.fechado" type="checkbox" />
              Fechado
            </label>
            <template v-if="!d.fechado">
              <AppInput v-model="d.abertura" type="time" label="Abertura" />
              <AppInput v-model="d.fechamento" type="time" label="Fechamento" />
            </template>
          </div>
        </div>

        <div class="form-section">
          <h3>Estoque</h3>
          <label class="checkbox-label">
            <input v-model="form.controleEstoqueAtivo" type="checkbox" />
            Controle de estoque ativo
          </label>
          <AppInput v-model="form.estoqueMinimoPadrao" label="Estoque Mínimo Padrão" type="number" min="0" />
        </div>

        <div class="form-section">
          <h3>Alertas</h3>
          <AppInput v-model="form.webhookUrl" label="Webhook URL" placeholder="https://..." />
          <AppInput v-model="form.emailAlertas" label="Email para Alertas" type="email" />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">{{ success }}</p>

        <div class="form-actions">
          <AppButton type="button" variant="ghost" @click="router.back()">Cancelar</AppButton>
          <AppButton type="submit" :loading="saving">Salvar</AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/shared/utils/api';
import { maskPhone, maskCep, ufList } from '@/shared/utils/masks';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';

const route = useRoute();
const router = useRouter();

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');

function onPhoneInput(e: Event) {
  const el = e.target as HTMLInputElement;
  const cursor = el.selectionStart;
  const prevLen = form.telefoneContato.length;
  form.telefoneContato = maskPhone(el.value);
  requestAnimationFrame(() => {
    const newLen = form.telefoneContato.length;
    const diff = newLen - prevLen;
    const pos = Math.max(0, (cursor ?? 0) + diff);
    el.setSelectionRange(pos, pos);
  });
}

function onCepInput(e: Event) {
  const el = e.target as HTMLInputElement;
  const cursor = el.selectionStart;
  const prevLen = form.endereco.cep.length;
  form.endereco.cep = maskCep(el.value);
  requestAnimationFrame(() => {
    const newLen = form.endereco.cep.length;
    const diff = newLen - prevLen;
    const pos = Math.max(0, (cursor ?? 0) + diff);
    el.setSelectionRange(pos, pos);
  });
}

function onEstadoChange(e: Event) {
  form.endereco.estado = (e.target as HTMLSelectElement).value;
}

const form = reactive({
  taxaFrete: '0',
  controleEstoqueAtivo: true,
  estoqueMinimoPadrao: '5',
  webhookUrl: '',
  emailAlertas: '',
  telefoneContato: '',
  endereco: { rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' },
  horario: diasSemana.map(() => ({ abertura: '08:00', fechamento: '18:00', fechado: false })),
});

onMounted(async () => {
  try {
    const { data } = await api.get(`/negocios/${route.params.id}`);
    const c = data.configuracoes;
    if (c) {
      form.taxaFrete = String(c.taxaFrete ?? 0);
      form.controleEstoqueAtivo = c.controleEstoqueAtivo ?? true;
      form.estoqueMinimoPadrao = String(c.estoqueMinimoPadrao ?? 5);
      form.webhookUrl = c.webhookUrl ?? '';
      form.emailAlertas = c.emailAlertas ?? '';
      form.telefoneContato = c.telefoneContato ?? '';
      if (c.endereco) Object.assign(form.endereco, c.endereco);
      if (c.horarioFuncionamento?.dias) {
        for (let i = 0; i < c.horarioFuncionamento.dias.length && i < form.horario.length; i++) {
          Object.assign(form.horario[i], c.horarioFuncionamento.dias[i]);
        }
      }
    }
  } catch {
    error.value = 'Erro ao carregar configurações';
  } finally {
    loading.value = false;
  }
});

async function handleSubmit() {
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    const taxaFrete = Number(form.taxaFrete);
    const estoqueMinimoPadrao = Number(form.estoqueMinimoPadrao);

    if (!Number.isFinite(taxaFrete) || taxaFrete < 0) {
      error.value = 'Informe uma taxa de frete válida.';
      return;
    }

    if (!Number.isFinite(estoqueMinimoPadrao) || estoqueMinimoPadrao < 0) {
      error.value = 'Informe um estoque mínimo padrão válido.';
      return;
    }

    const payload: any = {
      taxaFrete,
      controleEstoqueAtivo: form.controleEstoqueAtivo,
      estoqueMinimoPadrao,
      webhookUrl: form.webhookUrl || undefined,
      emailAlertas: form.emailAlertas || undefined,
      telefoneContato: form.telefoneContato || undefined,
      endereco: form.endereco,
      horarioFuncionamento: { dias: form.horario },
    };
    await api.patch(`/negocios/${route.params.id}/configuracoes`, payload);
    success.value = 'Configurações salvas!';
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao salvar';
    error.value = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.app-input { display: flex; flex-direction: column; gap: 0.25rem; }
.app-input__label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
.app-input__field {
  padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-md); background: var(--color-bg-secondary); color: var(--color-text-primary);
  transition: border-color var(--transition-fast); outline: none;
}
.app-input__field:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }
.app-input__field::placeholder { color: var(--color-text-muted); }
.form-section { margin-bottom: 2rem; }
.form-section h3 { font-size: 1rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border-light); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-grid > .full-width, .form-grid > .app-input.full-width { grid-column: 1 / -1; }
.horario-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.horario-dia { min-width: 80px; font-weight: 600; font-size: 0.875rem; }
.checkbox-label { display: flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; cursor: pointer; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border-light); }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); margin-top: 0.5rem; }
.success-msg { font-size: 0.8125rem; color: var(--color-success); margin-top: 0.5rem; }
.page-header { margin-bottom: 1.5rem; }
.loading { color: var(--color-text-muted); text-align: center; padding: 3rem; font-size: 0.9375rem; }
</style>
