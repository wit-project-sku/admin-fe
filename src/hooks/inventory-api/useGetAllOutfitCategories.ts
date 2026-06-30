import { useQuery } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';

/** Outfit-only categories (`GET /categories/outfits`). */
export const useGetAllOutfitCategories = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['outfit-categories'],
    queryFn: async () => APIService.private.get('/categories/outfits'),
  });

  return { data, isLoading, error, refetch };
};
