import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { useStatsChannel } from '@/stores/statsChannelStore';

export type MonthlyShootingSort = 'latest' | 'oldest';

/** API query `sort`: `ASC` = 최신순(latest), `DESC` = 등록순(oldest). */
export type MonthlyShootingStatsApiSort = 'ASC' | 'DESC';

type UseGetMonthlyShootingStatsOptions = {
  enabled?: boolean;
  pageNum?: number;
  pageSize?: number;
  /** UI: `latest` → API `sort=ASC`, `oldest` → API `sort=DESC`. */
  monthSort?: MonthlyShootingSort;
};

function monthSortToApiSort(monthSort: MonthlyShootingSort): MonthlyShootingStatsApiSort {
  return monthSort === 'latest' ? 'DESC' : 'ASC';
}

export const useGetMonthlyShootingStats = (options?: UseGetMonthlyShootingStatsOptions) => {
  const pageNum = options?.pageNum ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const monthSort: MonthlyShootingSort = options?.monthSort ?? 'latest';
  const sort = monthSortToApiSort(monthSort);
  const channel = useStatsChannel();

  const { data, isLoading, error } = useQuery({
    queryKey: ['monthlyShootingStats', pageNum, pageSize, sort, channel],
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      return await APIService.private.get('/admin/stats/monthly', {
        params: {
          pageNum,
          pageSize,
          sort,
          channel,
        },
      });
    },
  });

  return { data, isLoading, error };
};
