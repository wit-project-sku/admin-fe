import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { updateKioskButton } from './updateKioskButton';
import type { UpdateKioskButtonPayload } from './kioskButtonsTypes';

export type UpdateKioskButtonVariables = {
  buttonId: number;
  payload: UpdateKioskButtonPayload;
};

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

export function useUpdateKioskButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ buttonId, payload }: UpdateKioskButtonVariables) => {
      try {
        const data = await updateKioskButton(buttonId, payload);
        const fail = isExplicitFailure(data);
        if (fail.failed) {
          throw new Error(fail.message || '요청이 처리되지 않았습니다.');
        }
        return data;
      } catch (err) {
        throw new Error(getApiMessage(err) || '요청이 처리되지 않았습니다.');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons-paged'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons'] });
      await queryClient.invalidateQueries({ queryKey: ['kiosk-button-stats-summary'] });
    },
  });

  return {
    updateKioskButtonAsync: mutation.mutateAsync,
    updateKioskButton: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
