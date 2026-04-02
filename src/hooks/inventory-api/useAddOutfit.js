import { useMutation } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useAddOutfit = () => {
  const { mutate: addOutfit } = useMutation({
    mutationFn: async (outfitData, images) => {
      const formData = new FormData();

      // Spring @RequestPart("data") expects JSON
      formData.append('data', new Blob([JSON.stringify(outfitData)], { type: 'application/json' }));
      // Append images
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
  return { addOutfit };
};
