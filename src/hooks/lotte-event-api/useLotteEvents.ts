import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { APIService } from '../../utils/axios';
import type { LotteEventDto, LotteEventListParams, LotteEventRequest } from './lotteEventTypes';

const BASE = '/admin/lotte/events';

export const lotteEventKeys = {
  all: ['admin-lotte-events'] as const,
  list: (params: LotteEventListParams) => ['admin-lotte-events', 'list', params] as const,
};

type PageData<T> = { content: T[]; totalElements: number; totalPages: number; last?: boolean };

const dataOf = <T>(res: unknown): T | null => ((res as { data?: T } | null)?.data ?? null) as T | null;

/** GET `/admin/lotte/events` — 시작일이 늦은 순. 지점·건물·상태는 선택, 함께 주면 AND. */
export const useLotteEventList = (params: LotteEventListParams, enabled = true) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: lotteEventKeys.list(params),
    enabled,
    placeholderData: keepPreviousData,
    // 404 = 서버에 아직 API 가 없음 — 다시 물어도 같으니 바로 안내를 띄운다.
    retry: (count, err) => !(isAxiosError(err) && err.response?.status === 404) && count < 3,
    queryFn: async () =>
      dataOf<PageData<LotteEventDto>>(
        await APIService.private.get(BASE, {
          params: {
            pageNum: params.pageNum,
            pageSize: params.pageSize,
            ...(params.kioskId ? { kioskId: params.kioskId } : {}),
            ...(params.building ? { building: params.building } : {}),
            ...(params.status ? { status: params.status } : {}),
          },
        }),
      ),
  });
  return {
    rows: data?.content ?? [],
    totalElements: Number(data?.totalElements) || 0,
    totalPages: Math.max(1, Number(data?.totalPages) || 1),
    isPending: enabled && isPending,
    isError,
    error,
  };
};

export const useLotteEventMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: lotteEventKeys.all });

  /** POST `/admin/lotte/events` · PUT `/admin/lotte/events/{id}` */
  const save = useMutation({
    mutationFn: ({ id, body }: { id: number | null; body: LotteEventRequest }) =>
      id == null ? APIService.private.post(BASE, body) : APIService.private.put(`${BASE}/${id}`, body),
    onSuccess: invalidate,
  });

  /** DELETE `/admin/lotte/events/{id}` — 되돌릴 수 없어 사유를 함께 보낸다. */
  const remove = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      APIService.private.delete(`${BASE}/${id}`, { data: { reason } }),
    onSuccess: invalidate,
  });

  return {
    saveAsync: save.mutateAsync,
    isSaving: save.isPending,
    removeAsync: remove.mutateAsync,
    isRemoving: remove.isPending,
  };
};
