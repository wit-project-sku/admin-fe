import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type AddShopImagesPayload = {
  shopId: number | string;
  images: (File | Blob | null | undefined)[];
};

/** POST `/admin/shops/{id}/images` — 멀티파트 `images`로 1개 이상 추가. */
export const useAddShopImages = () => {
  const { mutate: addShopImages, mutateAsync: addShopImagesAsync, isPending, error } = useMutation({
    mutationFn: async ({ shopId, images }: AddShopImagesPayload) => {
      const formData = new FormData();
      images.filter(Boolean).forEach((file) => {
        if (file) formData.append('images', file);
      });
      return await APIService.private.post(`/admin/shops/${shopId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
  return { addShopImages, addShopImagesAsync, isPending, error };
};
