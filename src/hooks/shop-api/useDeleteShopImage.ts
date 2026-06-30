import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type DeleteShopImagePayload = {
  shopId: number | string;
  imageId: number | string;
};

/** DELETE `/admin/shops/{id}/images/{imageId}` — 상점의 특정 이미지 삭제(S3 + DB). */
export const useDeleteShopImage = () => {
  const { mutate: deleteShopImage, mutateAsync: deleteShopImageAsync } = useMutation({
    mutationFn: async ({ shopId, imageId }: DeleteShopImagePayload) => {
      return await APIService.private.delete(`/admin/shops/${shopId}/images/${imageId}`);
    },
  });
  return { deleteShopImage, deleteShopImageAsync };
};
