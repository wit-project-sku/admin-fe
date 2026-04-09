import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type UpdateDeliveryPayload = {
  deliveryId: number | string;
  deliveryData: {
    deliveryStatus: 'all' | 'ORDERED' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'PICKED_UP' | 'CANCELED';
    trackingNumber: string;
  };
};

export const useUpdateDelivery = () => {
  const { mutate: updateDelivery, mutateAsync: updateDeliveryAsync, isPending, error } = useMutation({
    mutationFn: async ({ deliveryId, deliveryData }: UpdateDeliveryPayload) => {
      return await APIService.private.put(`/deliveries/admin/${deliveryId}`, deliveryData);
    },
  });
  return { updateDelivery, updateDeliveryAsync, isPending, error };
};
