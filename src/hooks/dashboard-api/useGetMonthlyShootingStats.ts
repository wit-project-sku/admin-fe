import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

type UseGetMonthlyShootingStatsOptions = {
  enabled?: boolean;
  pageNum?: number;
  pageSize?: number;
};

export const useGetMonthlyShootingStats = (options?: UseGetMonthlyShootingStatsOptions) => {
  const pageNum = options?.pageNum ?? 1;
  const pageSize = options?.pageSize ?? 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['monthlyShootingStats', pageNum, pageSize],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      return await APIService.private.get('/admin/stats/monthly', {
        params: {
          pageNum,
          pageSize,
        },
      });
    },
  });

  return { data, isLoading, error };
};
