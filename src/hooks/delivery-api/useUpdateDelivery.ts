import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type DeliveryAdminUpdateBody = {
  deliveryStatus?: string;
  trackingNumber?: string;
  receiverName?: string;
  phoneNumber?: string;
  zipCode?: string;
  address?: string;
  addressDetail?: string;
  /** Some APIs use this key for line-2 address */
  detailAddress?: string;
};

export type UpdateDeliveryPayload = {
  deliveryId: number | string;
  deliveryData: DeliveryAdminUpdateBody;
};

export const useUpdateDelivery = () => {
  const { mutate: updateDelivery, mutateAsync: updateDeliveryAsync, isPending, error } = useMutation({
    mutationFn: async ({ deliveryId, deliveryData }: UpdateDeliveryPayload) => {
      return await APIService.private.put(`/deliveries/admin/${deliveryId}`, deliveryData);
    },
  });
  return { updateDelivery, updateDeliveryAsync, isPending, error };
};
