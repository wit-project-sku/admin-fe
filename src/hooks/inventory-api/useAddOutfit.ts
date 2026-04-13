import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { OutfitWriteBody } from './outfitApiTypes';

export type AddOutfitPayload = {
  outfitData: OutfitWriteBody;
  images?: File[];
};

export const useAddOutfit = () => {
  const {
    mutate: addOutfit,
    mutateAsync: addOutfitAsync,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ outfitData, images = [] }: AddOutfitPayload) => {
      const formData = new FormData();

      formData.append('outfit', new Blob([JSON.stringify(outfitData)], { type: 'application/json' }));
      images.forEach((image) => {
        formData.append('images', image);
      });
      return await APIService.private.post('/admin/outfits', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
  return { addOutfit, addOutfitAsync, isPending, error };
};
