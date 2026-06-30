import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type OutfitRankingStatsParams = {
  kioskId?: string;
  start?: string;
  end?: string;
  sort?: 'POPULAR' | 'ID';
  pageNum?: number;
  pageSize?: number;
};

type UseGetOutfitRankingStatsOptions = {
  enabled?: boolean;
};

/** Axios query object: sort always sent; other fields only if set. */
export function toOutfitRankingStatsQueryParams(
  input: OutfitRankingStatsParams | undefined,
): Record<string, string | number> {
  const sort = input?.sort ?? 'POPULAR';
  const out: Record<string, string | number> = {
    sort,
    pageNum: input?.pageNum ?? 1,
    pageSize: input?.pageSize ?? 10,
  };

  const start = input?.start?.trim();
  const end = input?.end?.trim();
  if (start) out.start = start;
  if (end) out.end = end;

  const kid = input?.kioskId;
  if (kid != null && Number.isFinite(Number(kid))) {
    out.kioskId = Number(kid);
  }

  return out;
}

export const useGetOutfitRankingStats = (
  params: OutfitRankingStatsParams | undefined,
  options?: UseGetOutfitRankingStatsOptions,
) => {
  const queryParams = useMemo(() => (params == null ? null : toOutfitRankingStatsQueryParams(params)), [params]);

  const enabled = (options?.enabled ?? true) && queryParams != null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['outfit-ranking-stats', queryParams],
    queryFn: async () => {
      return await APIService.private.get('/admin/stats/outfit-ranking', {
        params: queryParams!,
      });
    },
    enabled,
  });

  return { data, isLoading, error };
};
