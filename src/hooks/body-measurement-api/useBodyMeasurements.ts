import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type {
  BodyMeasurementDetail,
  BodyMeasurementExportRow,
  BodyMeasurementFilterParams,
  BodyMeasurementListItem,
  BodyMeasurementListParams,
} from './bodyMeasurementTypes';

const BASE = '/admin/stats/body-measurements';

export const bodyMeasurementKeys = {
  all: ['body-measurements'] as const,
  lists: ['body-measurements', 'list'] as const,
  list: (params: BodyMeasurementListParams) => ['body-measurements', 'list', params] as const,
  detail: (eventId: string) => ['body-measurements', 'detail', eventId] as const,
};

type PageData<T> = { content: T[]; totalElements: number; totalPages: number };

/** BaseResponse 의 `data` 만 꺼낸다. */
const dataOf = <T>(res: unknown): T | null => ((res as { data?: T } | null)?.data ?? null) as T | null;

/** 필터 → 쿼리. 빈 값은 싣지 않는다(서버 기본 = 전체). kioskIds 는 쉼표 구분(`6,7,8`). */
export function toFilterQuery(f: BodyMeasurementFilterParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (f.startDate) q.startDate = f.startDate;
  if (f.endDate) q.endDate = f.endDate;
  if (f.kioskIds && f.kioskIds.length > 0) q.kioskIds = f.kioskIds.join(',');
  if (f.shotType) q.shotType = f.shotType;
  if (f.isSuccess != null) q.isSuccess = String(f.isSuccess);
  if (f.shooter) q.shooter = f.shooter;
  if (f.eventId) q.eventId = f.eventId;
  return q;
}

/**
 * GET 목록 — 촬영 시각 내림차순. `thumbnailUrl` 은 300초짜리 서명 주소라 페이지를 다시 받을 때마다 새로 온다.
 * 만료된 주소를 오래 들고 있지 않게 캐시는 짧게 둔다(staleTime 0 · 기본 refetch 규칙).
 */
export const useBodyMeasurementList = (params: BodyMeasurementListParams, options?: { enabled?: boolean }) => {
  const { data, isPending, isError, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: bodyMeasurementKeys.list(params),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await APIService.private.get(BASE, {
        params: { ...toFilterQuery(params), pageNum: params.pageNum, pageSize: params.pageSize },
      });
      return dataOf<PageData<BodyMeasurementListItem>>(res);
    },
    placeholderData: keepPreviousData,
  });
  return {
    rows: data?.content ?? [],
    totalElements: Number(data?.totalElements) || 0,
    totalPages: Math.max(1, Number(data?.totalPages) || 1),
    isPending,
    isError,
    isFetching,
    refetch,
    dataUpdatedAt,
  };
};

/**
 * GET 상세 — 원본 사진 `photoUrl`(300초) 포함. **열 때마다 새로 부른다**: 캐시를 남기지 않아(gcTime 0)
 * 같은 행을 다시 열어도 만료된 주소를 재사용하지 않는다.
 */
export const useBodyMeasurementDetail = (eventId: string | null) => {
  const { data, isPending, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: bodyMeasurementKeys.detail(eventId ?? ''),
    enabled: !!eventId,
    queryFn: async () =>
      dataOf<BodyMeasurementDetail>(await APIService.private.get(`${BASE}/${encodeURIComponent(eventId!)}`)),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
  return { detail: data ?? null, isPending: !!eventId && isPending, isError, error, refetch, dataUpdatedAt };
};

/** GET `/export` — 현재 필터 전체(최대 50,000행, 넘으면 400). 항목에 사진·주소 없음. */
export async function fetchBodyMeasurementExport(filters: BodyMeasurementFilterParams): Promise<BodyMeasurementExportRow[]> {
  const res = await APIService.private.get(`${BASE}/export`, { params: toFilterQuery(filters) });
  return dataOf<BodyMeasurementExportRow[]>(res) ?? [];
}

/** DELETE — 사진(원본·작은 사진)·측정값·촬영자 정보가 함께 지워진다. 촬영 횟수(photo_shot)는 남는다. */
export const useDeleteBodyMeasurement = () => {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (eventId: string) => APIService.private.delete(`${BASE}/${encodeURIComponent(eventId)}`),
    // 지운 촬영의 상세는 다시 부르면 404 라 버리고, 목록만 새로 받는다.
    onSuccess: (_res, eventId) => {
      qc.removeQueries({ queryKey: bodyMeasurementKeys.detail(eventId) });
      return qc.invalidateQueries({ queryKey: bodyMeasurementKeys.lists });
    },
  });
  return { deleteAsync: remove.mutateAsync, isDeleting: remove.isPending };
};
