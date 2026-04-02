import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useGetRefundById = (refundId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['refund-by-id', refundId],
    queryFn: async () => {
      return await APIService.private.get(`/refunds/admin/${refundId}`);
    },
  });
  return { data, isLoading, error };
};
