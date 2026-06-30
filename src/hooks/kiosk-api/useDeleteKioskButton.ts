import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { deleteKioskButton } from './deleteKioskButton';

function getApiMessage(err: unknown): string | null {
  if (isAxiosError(err)) {
    const body = err.response?.data as
      | { message?: unknown; error?: { message?: unknown } }
      | string
      | undefined;
    if (typeof body === 'string' && body.trim()) return body;
    const top = body && typeof body === 'object' ? body.message : undefined;
    if (typeof top === 'string' && top.trim()) return top;
    const nested = body && typeof body === 'object' ? body.error?.message : undefined;
    if (typeof nested === 'string' && nested.trim()) return nested;
  }
  return null;
}

function isExplicitFailure(data: unknown): { failed: boolean; message?: string } {
  if (!data || typeof data !== 'object') return { failed: false };
  const d = data as { success?: unknown; code?: unknown; message?: unknown };
  if (d.success === false) {
    return { failed: true, message: typeof d.message === 'string' ? d.message : undefined };
  }
  if (typeof d.code === 'number' && d.code >= 400) {
    return { failed: true, message: typeof d.message === 'string' ? d.message : undefined };
  }
  return { failed: false };
}

export function useDeleteKioskButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (buttonId: number) => {
      try {
        const data = await deleteKioskButton(buttonId);
        const fail = isExplicitFailure(data);
        if (fail.failed) {
          throw new Error(fail.message || '요청이 처리되지 않았습니다.');
        }
        return data;
      } catch (err) {
        throw new Error(getApiMessage(err) || '버튼을 삭제하지 못했습니다.');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons-paged'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons'] });
      await queryClient.invalidateQueries({ queryKey: ['kiosk-button-stats-summary'] });
    },
  });

  return {
    deleteKioskButtonAsync: mutation.mutateAsync,
    deleteKioskButton: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
