import { useMutation } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useUpdateDelivery = () => {
  const { mutate: updateDelivery } = useMutation({
    mutationFn: async (deliveryId, deliveryData) => {
      return await APIService.private.put(`/deliveries/admin/${deliveryId}`, deliveryData);
    },
  });
  return { updateDelivery };
};
