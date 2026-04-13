import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type MonthlyShootingSort = 'latest' | 'oldest';

type UseGetMonthlyShootingStatsOptions = {
  enabled?: boolean;
  pageNum?: number;
  pageSize?: number;
  /** `latest` = 최신순, `oldest` = 등록순 (oldest / ascending month). */
  monthSort?: MonthlyShootingSort;
};

export const useGetMonthlyShootingStats = (options?: UseGetMonthlyShootingStatsOptions) => {
  const pageNum = options?.pageNum ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const monthSort: MonthlyShootingSort = options?.monthSort ?? 'latest';

  const { data, isLoading, error } = useQuery({
    queryKey: ['monthlyShootingStats', pageNum, pageSize, monthSort],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      return await APIService.private.get('/admin/stats/monthly', {
        params: {
          pageNum,
          pageSize,
          monthSort,
        },
      });
    },
  });

  return { data, isLoading, error };
};
