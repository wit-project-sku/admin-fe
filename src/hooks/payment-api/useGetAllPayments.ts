import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export const useGetAllPayments = (pageNum = 1, pageSize = 7) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', pageNum, pageSize],
    queryFn: async () => {
      return await APIService.private.get('/payments/admin', {
        params: { pageNum, pageSize },
      });
    },
  });
  return { data, isLoading, error };
};
