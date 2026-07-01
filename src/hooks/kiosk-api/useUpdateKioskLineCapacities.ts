import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { APIService } from '@/utils/axios';

export type UpdateLineCapacitiesVariables = {
  kioskId: number;
  capacities: number[];
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
 * `PUT /admin/kiosks/{kioskId}/line-capacities` — body: 줄별 용량 배열(각 1~4).
 * 백엔드가 지정 용량에 맞춰 버튼을 재배치(reflow)한다.
 */
export function useUpdateKioskLineCapacities() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ kioskId, capacities }: UpdateLineCapacitiesVariables) => {
      try {
        const res = await APIService.private.put<{ data?: unknown }>(
          `/admin/kiosks/${kioskId}/line-capacities`,
          capacities,
        );
        return res.data;
      } catch (err) {
        throw new Error(getApiMessage(err) || '줄별 버튼 수를 변경하지 못했습니다.');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-list'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons-paged'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons'] });
    },
  });

  return {
    updateLineCapacitiesAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
