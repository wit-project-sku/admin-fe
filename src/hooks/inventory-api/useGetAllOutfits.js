import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useGetAllOutfits = (page, size) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['outfits-get-all', page, size],
    queryFn: async () => {
      return await APIService.private.get('/outfits', {
        params: {
          page,
          size,
        },
      });
    },
  });
  return { data, isLoading, error };
};
