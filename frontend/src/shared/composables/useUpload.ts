import { ref } from 'vue';
import api from '@/shared/utils/api';

export function useUpload() {
  const uploading = ref(false);

  async function uploadImage(
    businessId: string,
    produtoId: string,
    file: File,
  ): Promise<string | null> {
    uploading.value = true;
    try {
      const { data: presigned } = await api.post<{ url: string; key: string }>(
        `/negocios/${businessId}/produtos/${produtoId}/imagens`,
        { fileName: file.name },
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

  return { uploading, uploadImage };
}
