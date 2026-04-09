import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

type UseGetAllOutfitsOptions = {
  enabled?: boolean;
};

export const useGetAllOutfits = (page: number, size: number, options?: UseGetAllOutfitsOptions) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['outfits-get-all', page, size],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      return await APIService.private.get('/admin/outfits', {
        params: {
          page,
          size,
        },
      });
    },
  });
  return { data, isLoading, error, refetch };
};
