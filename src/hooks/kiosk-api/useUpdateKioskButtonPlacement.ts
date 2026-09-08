import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { APIService } from '@/utils/axios';

export type ButtonPlacement = 'MAIN' | 'FIXED' | 'OFF_MAIN';

export type UpdatePlacementVariables = {
  buttonId: number;
  placement: ButtonPlacement;
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
 * `PUT /admin/kiosks/button/{buttonId}/placement?value=X`
 * MAIN(그리드)/FIXED(고정)/OFF_MAIN(미표시). 예외 유형은 그리드에서 빠지고 재배치된다.
 */
export function useUpdateKioskButtonPlacement() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ buttonId, placement }: UpdatePlacementVariables) => {
      try {
        const res = await APIService.private.put<{ data?: unknown }>(
          `/admin/kiosks/button/${buttonId}/placement`,
          null,
          { params: { value: placement } },
        );
        return res.data;
      } catch (err) {
        throw new Error(getApiMessage(err) || '배치 유형을 변경하지 못했습니다.');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons-paged'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-kiosk-buttons'] });
    },
  });

  return {
    updatePlacementAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
