import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type UseGetDailyShootingStatsOptions = {
  enabled?: boolean;
  pageNum?: number;
  pageSize?: number;
};

export const useGetDailyShootingStats = (
  start: string | null | undefined,
  end: string | null | undefined,
  options?: UseGetDailyShootingStatsOptions,
) => {
  const pageNum = options?.pageNum ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const enabled = options?.enabled ?? true;

  const { data, isLoading, error } = useQuery({
    queryKey: ['dailyShootingStats', start, end, pageNum, pageSize],
    queryFn: async () => {
      return await APIService.private.get(
        '/admin/stats/daily',
        start && end
          ? { params: { start, end, pageNum, pageSize } }
          : {
              params: { pageNum, pageSize },
            },
      );
    },
  });
  return { data, isLoading, error };
};
