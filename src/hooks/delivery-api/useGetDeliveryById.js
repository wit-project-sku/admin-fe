import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useGetDeliveryById = (deliveryId) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['delivery-by-id', deliveryId],
    queryFn: async () => {
      return await APIService.private.get(`/deliveries/admin/${deliveryId}`);
    },
  });

  return { data, error, isLoading };
};
