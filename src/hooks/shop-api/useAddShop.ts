import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { buildShopMultipart } from '../../utils/formDataBuilder';
import type { ShopWriteBody } from './shopApiTypes';

export type AddShopPayload = {
  shopData: ShopWriteBody;
  images?: (File | Blob | null | undefined)[];
};

export const useAddShop = () => {
  const { mutate: addShop, mutateAsync: addShopAsync, isPending, error } = useMutation({
    mutationFn: async ({ shopData, images = [] }: AddShopPayload) => {
      const formData = buildShopMultipart(shopData, images);
      return await APIService.private.post(`/admin/shops`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
  return { addShop, addShopAsync, isPending, error };
};
