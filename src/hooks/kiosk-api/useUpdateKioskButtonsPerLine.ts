import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { APIService } from '@/utils/axios';

export type UpdateButtonsPerLineVariables = {
  kioskId: number;
  buttonsPerLine: number;
};

function getApiMessage(err: unknown): string | null {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: unknown } | string | undefined;
    if (typeof body === 'string' && body.trim()) return body;
    const top = body && typeof body === 'object' ? body.message : undefined;
    if (typeof top === 'string' && top.trim()) return top;
  }
  return null;
}

/**
 * `PUT /admin/kiosks/{kioskId}/buttons-per-line?value=N`
 * 한 줄당 버튼 수를 바꾸면 백엔드가 (line, position) 을 새 폭 기준으로 재배치(reflow)한다.
 */
export function useUpdateKioskButtonsPerLine() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ kioskId, buttonsPerLine }: UpdateButtonsPerLineVariables) => {
      try {
        const res = await APIService.private.put<{ data?: unknown }>(
          `/admin/kiosks/${kioskId}/buttons-per-line`,
          null,
          { params: { value: buttonsPerLine } },
        );
        return res.data;
      } catch (err) {
        throw new Error(getApiMessage(err) || '한 줄당 버튼 수를 변경하지 못했습니다.');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-list'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons-paged'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons'] });
    },
  });

  return {
    updateButtonsPerLineAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
