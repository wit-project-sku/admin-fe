import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { createKioskButton } from './createKioskButton';
import type { CreateKioskButtonPayload } from './kioskButtonsTypes';

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

export function useCreateKioskButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: CreateKioskButtonPayload) => {
      try {
        const data = await createKioskButton(payload);
        if (!data.success) {
          throw new Error(data.message || '요청이 처리되지 않았습니다.');
        }
        return data;
      } catch (err) {
        throw new Error(getApiMessage(err) || '요청이 처리되지 않았습니다.');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons-paged'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons'] });
    },
  });

  return {
    createKioskButtonAsync: mutation.mutateAsync,
    createKioskButton: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
