import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export const useDeleteOutfit = () => {
  const { mutate: deleteOutfit, mutateAsync: deleteOutfitAsync } = useMutation({
    mutationFn: async (outfitId: number | string) => {
      return await APIService.private.delete(`/admin/outfits/${outfitId}`);
    },
  });
  return { deleteOutfit, deleteOutfitAsync };
};
