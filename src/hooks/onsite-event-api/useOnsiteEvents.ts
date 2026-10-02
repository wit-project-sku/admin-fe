import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type {
  OnsiteEventDto,
  OnsiteEventListParams,
  OnsiteEventOptionDto,
  OnsiteEventPayload,
  OnsiteEventStatsDto,
} from './onsiteEventTypes';

const BASE = '/admin/onsite-events';

/** 등록·수정·삭제 뒤 이 접두어 전체(목록·옵션·상세·리포트)를 다시 받는다 — 기간이 바뀌면 리포트도 바뀐다. */
export const onsiteEventKeys = {
  all: ['onsite-events'] as const,
  list: (params: OnsiteEventListParams) => ['onsite-events', 'list', params] as const,
  options: ['onsite-events', 'options'] as const,
  detail: (id: number) => ['onsite-events', 'detail', id] as const,
  stats: (id: number) => ['onsite-events', 'stats', id] as const,
};

type PageData<T> = { content: T[]; totalElements: number; totalPages: number };

/** BaseResponse 의 `data` 만 꺼낸다. */
const dataOf = <T>(res: unknown): T | null => ((res as { data?: T } | null)?.data ?? null) as T | null;

/** GET `/admin/onsite-events` — 등록 관리 목록(시작일 늦은 순). keyword = 행사명·행사 지점 부분일치. */
export const useOnsiteEventList = (params: OnsiteEventListParams, options?: { enabled?: boolean }) => {
  const { data, isPending, isError } = useQuery({
    queryKey: onsiteEventKeys.list(params),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await APIService.private.get(BASE, {
        params: {
          pageNum: params.pageNum,
          pageSize: params.pageSize,
          ...(params.year ? { year: params.year } : {}),
          ...(params.keyword ? { keyword: params.keyword } : {}),
        },
      });
      return dataOf<PageData<OnsiteEventDto>>(res);
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

/** GET `/admin/onsite-events/options` — 리포트 드롭다운용 전체 행사(삭제 제외). */
export const useOnsiteEventOptions = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: onsiteEventKeys.options,
    queryFn: async () => dataOf<OnsiteEventOptionDto[]>(await APIService.private.get(`${BASE}/options`)) ?? [],
  });
  return { options: data ?? [], isPending, isError };
};

/** GET `/admin/onsite-events/{id}` — 수정 창 채우기. */
export const useOnsiteEvent = (id: number | null) => {
  const { data, isPending, isError } = useQuery({
    queryKey: onsiteEventKeys.detail(id ?? 0),
    enabled: id != null,
    queryFn: async () => dataOf<OnsiteEventDto>(await APIService.private.get(`${BASE}/${id}`)),
  });
  return { event: data ?? null, isPending: id != null && isPending, isError };
};

/** GET `/admin/onsite-events/{id}/stats` — 확정 전엔 서버가 실시간 계산, 확정 뒤엔 저장값. 모양은 같다. */
export const useOnsiteEventStats = (id: number | null) => {
  const { data, isPending, isError } = useQuery({
    queryKey: onsiteEventKeys.stats(id ?? 0),
    enabled: id != null,
    queryFn: async () => dataOf<OnsiteEventStatsDto>(await APIService.private.get(`${BASE}/${id}/stats`)),
  });
  return { stats: data ?? null, isPending: id != null && isPending, isError };
};

/** 등록·수정·삭제. 성공하면 행사 관련 조회를 모두 무효화한다. */
export const useOnsiteEventMutations = () => {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: onsiteEventKeys.all });

  const create = useMutation({
    mutationFn: (body: OnsiteEventPayload) => APIService.private.post(BASE, body),
    onSuccess,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: OnsiteEventPayload }) => APIService.private.put(`${BASE}/${id}`, body),
    onSuccess,
  });
  const remove = useMutation({
    mutationFn: (id: number) => APIService.private.delete(`${BASE}/${id}`),
    onSuccess,
  });

  return {
    createAsync: create.mutateAsync,
    updateAsync: update.mutateAsync,
    deleteAsync: remove.mutateAsync,
    isSaving: create.isPending || update.isPending,
    isDeleting: remove.isPending,
  };
};
