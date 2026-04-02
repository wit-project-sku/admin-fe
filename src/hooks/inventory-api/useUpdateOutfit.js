import { useMutation } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useUpdateOutfit = () => {
  const { mutate: updateOutfit } = useMutation({
    mutationFn: async (outfitId, outfitData, images) => {
      const formData = new FormData();

      // Spring @RequestPart("data") expects JSON
      formData.append('data', new Blob([JSON.stringify(outfitData)], { type: 'application/json' }));
      // Append images
      images.forEach((image) => {
        formData.append('images', image);
      });
      return await APIService.private.put(`/outfits/${outfitId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
  return { updateOutfit };
};
