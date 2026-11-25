import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { useStatsChannel } from '@/stores/statsChannelStore';

export const useGetStatisticSummary = () => {
  const channel = useStatsChannel();
  const { data, isLoading, error } = useQuery({
    queryKey: ['statisticSummary', channel],
    queryFn: async () => {
      return await APIService.private.get('/admin/stats/summary', { params: { channel } });
    },
  });

  return { data, isLoading, error };
};
