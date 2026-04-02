import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';


export const useGetDailyShootingStats = (start, end) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dailyShootingStats', start, end],
    queryFn: async () => {
      return await APIService.private.get('/admin/stats/daily', {
        params: { start, end },
      });
    },
  });
  return { data, isLoading, error };
};
