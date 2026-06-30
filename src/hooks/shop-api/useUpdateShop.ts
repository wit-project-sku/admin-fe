import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { buildShopMultipart } from '../../utils/formDataBuilder';
import type { ShopWriteBody } from './shopApiTypes';

export type UpdateShopPayload = {
  shopId: number | string;
  updatedData: ShopWriteBody;
  /** 함께 추가할 새 이미지(선택). 이미지는 별도 엔드포인트로도 관리할 수 있다. */
  images?: (File | Blob | null | undefined)[];
};

export const useUpdateShop = () => {
  const { mutate: updateShop, mutateAsync: updateShopAsync, isPending, error } = useMutation({
    mutationFn: async ({ shopId, updatedData, images = [] }: UpdateShopPayload) => {
      const formData = buildShopMultipart(updatedData, images);
      return await APIService.private.put(`/admin/shops/${shopId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });

  return { updateShop, updateShopAsync, isPending, error };
};
