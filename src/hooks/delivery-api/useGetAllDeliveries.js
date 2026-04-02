import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const usegetAllDerliveries = (pageNum = 1, pageSize = 7) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['deliveries-all', pageNum, pageSize],
    queryFn: async () => {
      return await APIService.private.get('/deliveries/admin', {
        params: { pageNum, pageSize },
      });
    },
  });

  return { data, isLoading, error };
};
