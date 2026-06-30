import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export const useGetDeliveryById = (deliveryId: number | string | null | undefined) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['delivery-by-id', deliveryId],
    enabled: Boolean(deliveryId),
    queryFn: async () => {
      return await APIService.private.get(`/deliveries/admin/${deliveryId}`);
    },
  });

  return { data, error, isLoading };
};
