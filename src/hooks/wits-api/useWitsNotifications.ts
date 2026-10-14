import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type { WitsNotificationDto, WitsNotificationListParams, WitsNotificationPayload } from './witsTypes';

const BASE = '/admin/wits-notifications';

export const witsNotificationKeys = {
  all: ['wits-notifications'] as const,
  list: (params: WitsNotificationListParams) => ['wits-notifications', 'list', params] as const,
};

type PageData<T> = { content: T[]; totalElements: number; totalPages: number };

const dataOf = <T>(res: unknown): T | null => ((res as { data?: T } | null)?.data ?? null) as T | null;

/** GET `/admin/wits-notifications` — 발송 시각 최신순(내린 알림 제외). */
export const useWitsNotificationList = (params: WitsNotificationListParams) => {
  const { data, isPending, isError } = useQuery({
    queryKey: witsNotificationKeys.list(params),
    queryFn: async () => {
      const res = await APIService.private.get(BASE, {
        params: {
          pageNum: params.pageNum,
          pageSize: params.pageSize,
          ...(params.status ? { status: params.status } : {}),
        },
      });
      return dataOf<PageData<WitsNotificationDto>>(res);
    },
    placeholderData: keepPreviousData,
  });
  return {
    rows: data?.content ?? [],
    totalElements: Number(data?.totalElements) || 0,
    totalPages: Math.max(1, Number(data?.totalPages) || 1),
    isPending,
    isError,
  };
};

/** 등록·수정(예약 상태만)·예약 취소·내리기. 성공하면 알림 목록 전체를 다시 받는다. */
export const useWitsNotificationMutations = () => {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: witsNotificationKeys.all });

  const create = useMutation({
    mutationFn: (body: WitsNotificationPayload) => APIService.private.post(BASE, body),
    onSuccess,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: WitsNotificationPayload }) =>
      APIService.private.put(`${BASE}/${id}`, body),
    onSuccess,
  });
  const cancel = useMutation({
    mutationFn: (id: number) => APIService.private.post(`${BASE}/${id}/cancel`),
    onSuccess,
  });
  const remove = useMutation({
    mutationFn: (id: number) => APIService.private.delete(`${BASE}/${id}`),
    onSuccess,
  });

  return {
    createAsync: create.mutateAsync,
    updateAsync: update.mutateAsync,
    cancelAsync: cancel.mutateAsync,
    deleteAsync: remove.mutateAsync,
    isSaving: create.isPending || update.isPending,
    isCanceling: cancel.isPending,
    isDeleting: remove.isPending,
  };
};
