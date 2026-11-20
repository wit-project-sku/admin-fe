import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type {
  MovieShareCancelResult,
  MovieShareShare,
  MovieShareStats,
  MovieShareVerification,
  VerificationListParams,
} from './movieShareTypes';

const BASE = '/admin/movie-share';

export const movieShareKeys = {
  all: ['movie-share'] as const,
  stats: (startDate: string, endDate: string) => ['movie-share', 'stats', startDate, endDate] as const,
  summary: ['movie-share', 'summary'] as const,
  shares: (pageNum: number, pageSize: number) => ['movie-share', 'shares', pageNum, pageSize] as const,
  verifications: (params: VerificationListParams) => ['movie-share', 'verifications', params] as const,
};

type PageData<T> = { content: T[]; totalElements: number; totalPages: number; last?: boolean };

const dataOf = <T>(res: unknown): T | null => ((res as { data?: T } | null)?.data ?? null) as T | null;

const pageResult = <T>(data: PageData<T> | null | undefined) => ({
  rows: data?.content ?? [],
  totalElements: Number(data?.totalElements) || 0,
  totalPages: Math.max(1, Number(data?.totalPages) || 1),
});

/** GET `/admin/movie-share/stats` — 기간 안 월별 인증(영화관별)·나누기 수. 기록 없는 달은 빠진다. */
export const useMovieShareStats = (startDate: string, endDate: string, enabled = true) => {
  const { data, isPending, isError } = useQuery({
    queryKey: movieShareKeys.stats(startDate, endDate),
    enabled,
    queryFn: async () =>
      dataOf<MovieShareStats>(
        await APIService.private.get(`${BASE}/stats`, {
          params: { ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) },
        }),
      ),
    placeholderData: keepPreviousData,
  });
  return { stats: data ?? null, isPending: enabled && isPending, isError };
};

/** GET `/movie-share/summary`(무인증) — 지금까지 나눈 횟수 합계(세 지점 합). 누적 카드. */
export const useMovieShareTotal = () => {
  const { data } = useQuery({
    queryKey: movieShareKeys.summary,
    queryFn: async () =>
      Number(dataOf<{ totalSharedCount: number }>(await APIService.public.get('/movie-share/summary'))?.totalSharedCount) ||
      0,
    staleTime: 60 * 1000,
  });
  return data;
};

/** GET `/admin/movie-share/shares` — 나누기 기록(최근 순). 기간 필터는 서버에 없다. */
export const useMovieShareShares = (pageNum: number, pageSize: number) => {
  const { data, isPending, isError } = useQuery({
    queryKey: movieShareKeys.shares(pageNum, pageSize),
    queryFn: async () =>
      dataOf<PageData<MovieShareShare>>(await APIService.private.get(`${BASE}/shares`, { params: { pageNum, pageSize } })),
    placeholderData: keepPreviousData,
  });
  return { ...pageResult(data), isPending, isError };
};

const EXPORT_PAGE = 200;
const EXPORT_MAX_PAGES = 200;

/**
 * 롯데 전달용 내려받기 — 나누기는 최근 순으로 오므로 `startDate` 보다 오래된 행이 나오면 멈춘다.
 * 서버에 기간 필터가 없어 기간은 여기서 거른다(`sharedAt` 의 날짜 부분, KST).
 */
export const fetchSharesInRange = async (startDate: string, endDate: string): Promise<MovieShareShare[]> => {
  const out: MovieShareShare[] = [];
  for (let pageNum = 1; pageNum <= EXPORT_MAX_PAGES; pageNum += 1) {
    const page = dataOf<PageData<MovieShareShare>>(
      await APIService.private.get(`${BASE}/shares`, { params: { pageNum, pageSize: EXPORT_PAGE } }),
    );
    const rows = page?.content ?? [];
    let reachedOlder = false;
    for (const row of rows) {
      const day = row.sharedAt.slice(0, 10);
      if (startDate && day < startDate) {
        reachedOlder = true;
        break;
      }
      if (!endDate || day <= endDate) out.push(row);
    }
    if (reachedOlder || rows.length === 0 || page?.last || pageNum >= Number(page?.totalPages)) break;
  }
  return out;
};

/** GET `/admin/movie-share/verifications` — 인증 기록(최근 순). 기간·상태·영화관·예매번호 끝자리로 거른다. */
export const useMovieShareVerifications = (params: VerificationListParams, enabled = true) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: movieShareKeys.verifications(params),
    enabled,
    queryFn: async () =>
      dataOf<PageData<MovieShareVerification>>(
        await APIService.private.get(`${BASE}/verifications`, {
          params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
        }),
      ),
    placeholderData: keepPreviousData,
  });
  return { ...pageResult(data), isPending, isError, error };
};

/** POST `/admin/movie-share/verifications/{id}/cancel` — 사유(200자 이하) 필수. 409 = 이미 취소됨. */
export const useCancelVerification = () => {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) =>
      dataOf<MovieShareCancelResult>(await APIService.private.post(`${BASE}/verifications/${id}/cancel`, { reason })),
    // 409(이미 취소)·404 여도 목록은 다시 받아 실제 상태를 보여 준다.
    onSettled: () => qc.invalidateQueries({ queryKey: movieShareKeys.all }),
  });
  return { cancelAsync: m.mutateAsync, isCancelling: m.isPending };
};
