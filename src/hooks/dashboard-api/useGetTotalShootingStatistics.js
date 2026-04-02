import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useGetStatisticSummary = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['statisticSummary'],
    queryFn: async () => {
      return await APIService.private.get('/admin/stats/summary');
    },
    onError: (err) => {
      console.error('통계 요약 조회 실패:', err);
    },
  });

  return { data, isLoading, error };
};
