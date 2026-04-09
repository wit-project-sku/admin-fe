import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export const useGetStatisticSummary = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['statisticSummary'],
    queryFn: async () => {
      return await APIService.private.get('/admin/stats/summary');
    },
  });

  return { data, isLoading, error };
};
