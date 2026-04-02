import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useGetOutfitById = (outfitId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['outfit-by-id', outfitId],
    queryFn: async () => {
      return await APIService.private.get(`/outfits/${outfitId}`);
    },
  });
  return { data, isLoading, error };
};
