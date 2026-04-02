import { useMutation } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useDeleteOutfit = () => {
  const { mutate: deleteOutfit } = useMutation({
    mutationFn: async (outfitId) => {
      return await APIService.private.delete(`/outfits/${outfitId}`);
    },
  });
  return { deleteOutfit };
};
