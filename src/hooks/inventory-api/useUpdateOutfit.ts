import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { OutfitWriteBody } from './outfitApiTypes';

export type UpdateOutfitPayload = {
  outfitId: number | string;
  outfitData: OutfitWriteBody;
  images?: File[];
};

export const useUpdateOutfit = () => {
  const { mutate: updateOutfit, mutateAsync: updateOutfitAsync, isPending, error } = useMutation({
    mutationFn: async ({ outfitId, outfitData, images = [] }: UpdateOutfitPayload) => {
      const formData = new FormData();

      formData.append('outfit', new Blob([JSON.stringify(outfitData)], { type: 'application/json' }));
      images.forEach((image) => {
        formData.append('images', image);
      });
      return await APIService.private.put(`/admin/outfits/${outfitId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
  return { updateOutfit, updateOutfitAsync, isPending, error };
};
