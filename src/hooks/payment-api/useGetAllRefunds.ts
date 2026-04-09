import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export const useGetAllRefunds = (pageNum = 1, pageSize = 7) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['all-refunds', pageNum, pageSize],
    queryFn: async () => {
      return await APIService.private.get('/refunds/admin', {
        params: { pageNum, pageSize },
      });
    },
  });
  return { data, isLoading, error };
};
