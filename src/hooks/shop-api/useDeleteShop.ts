import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export const useDeleteShop = () => {
  const { mutate: deleteShop, mutateAsync: deleteShopAsync } = useMutation({
    mutationFn: async (shopId: number | string) => {
      return await APIService.private.delete(`/admin/shops/${shopId}`);
    },
  });
  return { deleteShop, deleteShopAsync };
};
