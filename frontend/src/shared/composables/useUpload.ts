import { ref } from 'vue';
import api from '@/shared/utils/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function useUpload() {
  const uploading = ref(false);
  const uploadError = ref('');

  async function uploadImage(
    businessId: string,
    produtoId: string,
    file: File,
  ): Promise<string | null> {
    uploadError.value = '';

    if (file.size > MAX_FILE_SIZE) {
      uploadError.value = `A imagem deve ter no máximo 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB enviado)`;
      return null;
    }

    uploading.value = true;
    try {
      const { data: presigned } = await api.post<{ url: string; key: string }>(
        `/negocios/${businessId}/produtos/${produtoId}/imagens`,
        { fileName: file.name, fileSize: file.size },
      );

      const uploadRes = await fetch(presigned.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) {
        console.error('Upload to storage failed:', uploadRes.status, uploadRes.statusText);
        return null;
      }

      await api.post(`/negocios/${businessId}/produtos/${produtoId}/imagens/confirmar`, {
        key: presigned.key,
      });

      return presigned.key;
    } catch (err: any) {
      console.error('Upload failed:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
      }
      return null;
    } finally {
      uploading.value = false;
    }
  }

  return { uploading, uploadError, uploadImage };
}
