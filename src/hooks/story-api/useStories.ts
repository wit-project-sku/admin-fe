import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { StoryDto, StoryListParams, StoryStatus } from './storyTypes';

const BASE = '/admin/stories';

/** 상태 변경·순서 저장 뒤 이 접두어 전체(목록·건수·순서 창)를 다시 받는다. */
export const storyKeys = {
  all: ['admin-stories'] as const,
  list: (params: StoryListParams) => ['admin-stories', 'list', params] as const,
  count: (status: StoryStatus | undefined, kioskId: number | undefined) =>
    ['admin-stories', 'count', status ?? 'ALL', kioskId ?? 0] as const,
  approved: (kioskId: number) => ['admin-stories', 'approved', kioskId] as const,
};

type PageData<T> = { content: T[]; totalElements: number; totalPages: number; last?: boolean };

const dataOf = <T>(res: unknown): T | null => ((res as { data?: T } | null)?.data ?? null) as T | null;

const fetchPage = async (params: StoryListParams) =>
  dataOf<PageData<StoryDto>>(
    await APIService.private.get(BASE, {
      params: {
        pageNum: params.pageNum,
        pageSize: params.pageSize,
        ...(params.status ? { status: params.status } : {}),
        ...(params.kioskId ? { kioskId: params.kioskId } : {}),
      },
    }),
  );

/** GET `/admin/stories` — 최근에 올린 순. `status`·`kioskId` 는 선택, 둘 다 주면 AND. */
export const useStoryList = (params: StoryListParams, enabled = true) => {
  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: storyKeys.list(params),
    queryFn: () => fetchPage(params),
    placeholderData: keepPreviousData,
    enabled,
  });
  return {
    rows: data?.content ?? [],
    totalElements: Number(data?.totalElements) || 0,
    totalPages: Math.max(1, Number(data?.totalPages) || 1),
    isPending: enabled && isPending,
    isError,
    isFetching,
  };
};

/**
 * 탭 건수. 서버에 건수 API 가 없어 `pageSize=1` 로 목록을 받아 `totalElements` 만 쓴다.
 */
export const useStoryCount = (status: StoryStatus | undefined, kioskId: number | undefined, enabled = true) => {
  const { data } = useQuery({
    queryKey: storyKeys.count(status, kioskId),
    queryFn: async () => Number((await fetchPage({ status, kioskId, pageNum: 1, pageSize: 1 }))?.totalElements) || 0,
    enabled,
    staleTime: 30 * 1000,
  });
  return data;
};

const APPROVED_PAGE = 200;
const MAX_PAGES = 20;

/** 한 키오스크의 승인된 사연 전부 — 순서 정하기 창. */
export const useApprovedStories = (kioskId: number | null) => {
  const { data, isPending, isError } = useQuery({
    queryKey: storyKeys.approved(kioskId ?? 0),
    enabled: kioskId != null,
    queryFn: async () => {
      const acc: StoryDto[] = [];
      for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum += 1) {
        const page = await fetchPage({ status: 'APPROVED', kioskId: kioskId!, pageNum, pageSize: APPROVED_PAGE });
        acc.push(...(page?.content ?? []));
        if (!page || page.last || pageNum >= Number(page.totalPages)) break;
      }
      return acc;
    },
  });
  return { stories: data ?? [], isPending: kioskId != null && isPending, isError };
};

export const useStoryMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: storyKeys.all });

  /** PATCH `/admin/stories/{id}/status` — PENDING → APPROVED|HIDDEN, 그 뒤 APPROVED ↔ HIDDEN. */
  const status = useMutation({
    mutationFn: ({ id, status: next }: { id: number; status: Exclude<StoryStatus, 'PENDING'> }) =>
      APIService.private.patch(`${BASE}/${id}/status`, { status: next }),
    onSettled: invalidate,
  });

  /** PATCH `/admin/stories/order` — 보낸 순서대로 1번부터 고정. 빈 배열 = 고정 모두 풀기. */
  const order = useMutation({
    mutationFn: ({ kioskId, storyIds }: { kioskId: number; storyIds: number[] }) =>
      APIService.private.patch(`${BASE}/order`, { kioskId, storyIds }),
    onSuccess: invalidate,
  });

  return {
    changeStatusAsync: status.mutateAsync,
    pendingStatusId: status.isPending ? (status.variables?.id ?? null) : null,
    saveOrderAsync: order.mutateAsync,
    isSavingOrder: order.isPending,
  };
};
