import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';

type Envelope<T> = { success: boolean; code: number; message: string; data: T };

/** 버튼 이미지 업로드/교체·삭제 (PUT/DELETE /admin/kiosks/button/{id}/image). 성공 시 버튼 목록 무효화. */
export function useKioskButtonImage() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin-kiosk-buttons'] });
    void qc.invalidateQueries({ queryKey: ['admin-kiosk-buttons-paged'] });
  };

  const upload = useMutation({
    mutationFn: async (vars: { buttonId: number; file: File }) => {
      const form = new FormData();
      form.append('file', vars.file);
      const body = await APIService.private.put<Envelope<string>>(
        `/admin/kiosks/button/${vars.buttonId}/image`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return body?.data ?? null;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (buttonId: number) =>
      APIService.private.delete(`/admin/kiosks/button/${buttonId}/image`),
    onSuccess: invalidate,
  });

  return {
    uploadImageAsync: upload.mutateAsync,
    deleteImageAsync: remove.mutateAsync,
    isPending: upload.isPending || remove.isPending,
  };
}
