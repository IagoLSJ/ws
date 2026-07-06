<template>
  <div>
    <div class="page-header">
      <h1>{{ isEdit ? 'Editar Produto' : 'Novo Produto' }}</h1>
    </div>

    <AppCard>
      <form @submit.prevent="handleSubmit">
        <div class="form-section">
          <h3>Informações Básicas</h3>
          <div class="form-grid">
            <AppInput v-model="form.nome" label="Nome" :error="errors.nome" />
            <AppInput v-model="form.sku" label="SKU" />
          </div>
          <AppInput v-model="form.descricao" label="Descrição" />
          <div class="form-grid">
            <AppInput v-model="form.preco" label="Preço" type="number" step="0.01" min="0" :error="errors.preco" />
            <AppSelect
              v-model="form.tipoDesconto"
              label="Tipo de Desconto"
              :options="tipoDescontoOptions"
              placeholder="Sem desconto"
            />
            <AppInput
              v-if="form.tipoDesconto"
              v-model="form.valorDesconto"
              :label="form.tipoDesconto === 'PERCENTUAL' ? 'Desconto (%)' : 'Desconto (R$)'"
              type="number"
              step="0.01"
              min="0"
            />
            <div v-if="form.tipoDesconto && form.valorDesconto" class="valor-final-display">
              <span class="valor-final-label">Valor Final</span>
              <span class="valor-final-value">{{ formatCurrency(valorFinal) }}</span>
            </div>
            <AppSelect
              v-model="form.categoriaId"
              label="Categoria"
              :options="categoriaOptions"
            />
            <AppSelect v-if="isEdit" v-model="form.status" label="Status" :options="statusOptions" />
          </div>
          <label class="checkbox-label">
            <input v-model="form.controlaEstoque" type="checkbox" />
            Controlar estoque
          </label>
        </div>

        <div class="form-section">
          <h3>Imagem</h3>
          <div class="image-grid">
            <div v-if="imagemAtual" class="image-card">
              <img :src="imagemAtual.url" :alt="'Imagem'" />
              <AppButton
                size="sm"
                variant="danger"
                class="image-delete-btn"
                @click="confirmarExclusaoImagem(imagemAtual)"
              >
                &times;
              </AppButton>
            </div>
            <div v-else-if="pendingPreview" class="image-card">
              <img :src="pendingPreview" alt="Preview" />
            </div>
          </div>
          <p v-if="uploadError" class="error-msg">{{ uploadError }}</p>
          <AppButton
            type="button"
            size="sm"
            variant="secondary"
            :loading="uploading"
            @click="selecionarUpload"
          >
            {{ imagemAtual ? 'Trocar Imagem' : pendingFile ? 'Imagem selecionada' : 'Upload Imagem' }}
          </AppButton>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display:none"
            @change="handleUpload"
          />
        </div>

        <div class="form-section">
          <h3>Grupos de Modificadores</h3>
          <div v-for="(g, gi) in form.gruposModificadores" :key="gi" class="grupo-card">
            <div class="grupo-header">
              <AppInput v-model="g.nome" label="Nome do grupo" />
              <AppButton type="button" size="sm" variant="danger" @click="form.gruposModificadores.splice(gi, 1)">
                Remover
              </AppButton>
            </div>
            <div class="grupo-config">
              <label class="checkbox-label">
                <input v-model="g.obrigatorio" type="checkbox" />
                Obrigatório
              </label>
              <AppInput v-model="g.minSelecao" label="Mínimo" type="number" min="0" />
              <AppInput v-model="g.maxSelecao" label="Máximo" type="number" min="1" />
            </div>
            <div class="grupo-opcoes">
              <div v-for="(o, oi) in g.opcoes" :key="oi" class="opcao-row">
                <AppInput v-model="o.nome" placeholder="Opção" />
                <AppInput v-model="o.precoExtra" type="number" step="0.01" min="0" placeholder="Preço extra" />
                <AppButton type="button" size="sm" variant="ghost" @click="g.opcoes.splice(oi, 1)">
                  &times;
                </AppButton>
              </div>
               <AppButton type="button" size="sm" variant="ghost" @click="g.opcoes.push({ nome: '', precoExtra: '0', ordem: g.opcoes.length })">
                  + Opção
                </AppButton>
            </div>
          </div>
          <AppButton type="button" size="sm" variant="secondary" @click="addGrupo">
            + Grupo Modificador
          </AppButton>
        </div>

        <p v-if="errors.geral" class="error-msg">{{ errors.geral }}</p>

    <ConfirmDialog
      :open="showConfirmImg"
      title="Remover Imagem"
      message="Remover esta imagem?"
      confirm-text="Remover"
      confirm-variant="danger"
      :loading="removendoImg"
      @confirm="handleDeleteImagem"
      @cancel="showConfirmImg = false; imagemParaRemover = null"
    />

        <div class="form-actions">
          <AppButton type="button" variant="ghost" @click="router.back()">Cancelar</AppButton>
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
import { ProdutoStatus, type Produto, type Categoria, type ImagemProduto } from '@/shared/utils/types';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { useUpload } from '@/shared/composables/useUpload';
import { useUiStore } from '@/app/stores/ui.store';
import { useBusinessStore } from '@/app/stores/business.store';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import ConfirmDialog from '@/shared/components/feedback/ConfirmDialog.vue';

const route = useRoute();
const router = useRouter();
const ui = useUiStore();
const businessStore = useBusinessStore();

const isEdit = computed(() => !!route.params.id);
const saving = ref(false);
const categorias = ref<Categoria[]>([]);
const imagens = ref<ImagemProduto[]>([]);
const showConfirmImg = ref(false);
const imagemParaRemover = ref<ImagemProduto | null>(null);
const removendoImg = ref(false);
const { uploading, uploadError, uploadImage } = useUpload();
const fileInput = ref<HTMLInputElement | null>(null);
const pendingFile = ref<File | null>(null);
const pendingPreview = ref<string | null>(null);

const imagemAtual = computed(() => imagens.value[0] ?? null);

const form = reactive({
  nome: '',
  descricao: '',
  preco: '',
  tipoDesconto: '',
  valorDesconto: '',
  sku: '',
  categoriaId: '',
  status: ProdutoStatus.ATIVO,
  controlaEstoque: true,
  gruposModificadores: [] as any[],
});

const tipoDescontoOptions = [
  { value: 'PERCENTUAL', label: 'Percentual (%)' },
  { value: 'FIXO', label: 'Valor Fixo (R$)' },
];

const valorFinal = computed(() => {
  const preco = parseFloat(form.preco) || 0;
  if (!form.tipoDesconto || !form.valorDesconto) return preco;
  const desc = parseFloat(form.valorDesconto) || 0;
  if (desc <= 0) return preco;
  if (form.tipoDesconto === 'FIXO') return Math.max(0, preco - desc);
  if (form.tipoDesconto === 'PERCENTUAL') return Math.max(0, preco - (preco * desc / 100));
  return preco;
});

const errors = reactive({ nome: '', preco: '', geral: '' });

const categoriaOptions = computed(() =>
  categorias.value.map((c) => ({ value: c.id, label: c.nome })),
);

const statusOptions = [
  { value: ProdutoStatus.ATIVO, label: 'Ativo' },
  { value: ProdutoStatus.PAUSADO, label: 'Pausado' },
  { value: ProdutoStatus.ESGOTADO, label: 'Esgotado' },
];

function addGrupo() {
  form.gruposModificadores.push({
    nome: '',
    obrigatorio: false,
    minSelecao: 0,
    maxSelecao: 1,
    ordem: form.gruposModificadores.length,
    opcoes: [],
  });
}

function parseGruposPayload() {
    return form.gruposModificadores.map((g: any) => ({
      nome: g.nome,
      obrigatorio: g.obrigatorio ?? false,
      minSelecao: g.minSelecao ? parseInt(g.minSelecao) : 0,
      maxSelecao: g.maxSelecao ? parseInt(g.maxSelecao) : 1,
      ordem: g.ordem ?? 0,
      opcoes: g.opcoes.map((o: any) => ({
        nome: o.nome,
        precoExtra: o.precoExtra ? parseFloat(o.precoExtra) : 0,
        ordem: o.ordem ?? 0,
      })),
    }));
  }

async function handleSubmit() {
  errors.nome = '';
  errors.preco = '';
  errors.geral = '';

  if (!form.nome) { errors.nome = 'Nome obrigatório'; return; }
  if (!form.preco) { errors.preco = 'Preço obrigatório'; return; }

  saving.value = true;
  try {
      const bid = businessStore.businessId();
      const payload = {
        nome: form.nome,
        descricao: form.descricao,
        preco: parseFloat(form.preco),
        categoriaId: form.categoriaId || undefined,
        tipoDesconto: form.tipoDesconto || undefined,
        valorDesconto: form.valorDesconto ? parseFloat(form.valorDesconto) : undefined,
        sku: form.sku || undefined,
        destaque: undefined,
        ordem: undefined,
        controlaEstoque: form.controlaEstoque,
        ...(isEdit.value ? { status: form.status } : {}),
        gruposModificadores: parseGruposPayload(),
      };

      if (isEdit.value) {
        await api.patch(`/negocios/${bid}/produtos/${route.params.id}`, payload);
        ui.addToast('Produto atualizado!', 'success');
        router.push('/catalogo');
      } else {
        const { data: novo } = await api.post<Produto>(`/negocios/${bid}/produtos`, payload);
        if (pendingFile.value) {
          const key = await uploadImage(bid, novo.id, pendingFile.value);
          if (key) {
            ui.addToast('Produto criado com imagem!', 'success');
          } else if (!uploadError.value) {
            ui.addToast('Produto criado, mas erro ao enviar imagem.', 'warning');
          }
          pendingFile.value = null;
          pendingPreview.value = null;
        } else {
          ui.addToast('Produto criado!', 'success');
        }
        router.push('/catalogo');
      }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao salvar';
    errors.geral = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    saving.value = false;
  }
}

function selecionarUpload() {
  fileInput.value?.click();
}

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const produtoId = route.params.id;
  if (!produtoId) {
    pendingFile.value = file;
    pendingPreview.value = URL.createObjectURL(file);
    input.value = '';
    return;
  }
  const bid = businessStore.businessId();
  const key = await uploadImage(bid, produtoId as string, file);
  if (key) {
    ui.addToast('Imagem enviada!', 'success');
    pendingFile.value = null;
    pendingPreview.value = null;
    const { data: prod } = await api.get<Produto>(`/negocios/${bid}/produtos/${produtoId}`);
    imagens.value = prod.imagens ?? [];
  } else if (!uploadError.value) {
    ui.addToast('Erro ao enviar imagem.', 'error');
  }
  input.value = '';
}

function confirmarExclusaoImagem(img: ImagemProduto) {
  imagemParaRemover.value = img;
  showConfirmImg.value = true;
}

async function handleDeleteImagem() {
  if (!imagemParaRemover.value) return;
  removendoImg.value = true;
  try {
    const bid = businessStore.businessId();
    await api.delete(
      `/negocios/${bid}/produtos/${route.params.id}/imagens/${imagemParaRemover.value.id}`,
    );
    ui.addToast('Imagem removida.', 'success');
    imagens.value = imagens.value.filter((i) => i.id !== imagemParaRemover.value!.id);
    showConfirmImg.value = false;
    imagemParaRemover.value = null;
    uploadError.value = '';
  } catch {
    ui.addToast('Erro ao remover imagem.', 'error');
  } finally {
    removendoImg.value = false;
  }
}

onMounted(async () => {
  try {
    const bid = businessStore.businessId();
    const { data } = await api.get(`/negocios/${bid}/categorias`);
    categorias.value = data;

    if (isEdit.value) {
      const { data: prod } = await api.get<Produto>(`/negocios/${bid}/produtos/${route.params.id}`);
      form.nome = prod.nome;
      form.descricao = prod.descricao ?? '';
      form.preco = String(prod.preco);
      form.tipoDesconto = prod.tipoDesconto ?? '';
      form.valorDesconto = prod.valorDesconto ? String(prod.valorDesconto) : '';
      form.sku = prod.sku ?? '';
      form.categoriaId = prod.categoriaId ?? '';
      form.status = prod.status;
      form.controlaEstoque = prod.controlaEstoque;
      imagens.value = prod.imagens ?? [];
      form.gruposModificadores = (prod.gruposModificadores ?? []).map((g) => ({
        nome: g.nome,
        obrigatorio: g.obrigatorio,
        minSelecao: g.minSelecao,
        maxSelecao: g.maxSelecao,
        ordem: g.ordem,
        opcoes: g.opcoes.map((o) => ({
          nome: o.nome,
          precoExtra: String(o.precoExtra),
          ativo: o.ativo,
          ordem: o.ordem,
        })),
      }));
    }
  } catch {
    errors.geral = 'Erro ao carregar dados';
  }
});
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.form-section { margin-bottom: 2rem; }
.form-section h3 { font-size: 1rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border-light); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border-light); }
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-top: 0.75rem; cursor: pointer; }
.grupo-card { border: 1px solid var(--color-border-light); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem; }
.grupo-header { display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 0.75rem; }
.grupo-config { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; }
.grupo-config .checkbox-label { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; cursor: pointer; }
.grupo-opcoes { display: flex; flex-direction: column; gap: 0.5rem; }
.opcao-row { display: flex; gap: 0.5rem; align-items: flex-start; }
.error-msg { font-size: 0.8125rem; color: var(--color-danger); margin-top: 0.5rem; }
.valor-final-display { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.5rem 0.75rem; background: var(--color-bg-tertiary); border-radius: var(--radius-md); }
.valor-final-label { font-size: 0.75rem; color: var(--color-text-muted); }
.valor-final-value { font-size: 1.125rem; font-weight: 700; color: var(--color-primary); }
.image-grid { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.image-card { position: relative; width: 100px; height: 100px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--color-border-light); }
.image-card img { width: 100%; height: 100%; object-fit: cover; }
.image-delete-btn { position: absolute; top: 2px; right: 2px; width: 1.5rem; height: 1.5rem; padding: 0; font-size: 1rem; line-height: 1; }
</style>
