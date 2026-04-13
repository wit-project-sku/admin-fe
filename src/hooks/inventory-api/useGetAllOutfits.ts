import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

type UseGetAllOutfitsOptions = {
  enabled?: boolean;
};

export const useGetAllOutfits = (pageNum: number, pageSize: number, options?: UseGetAllOutfitsOptions) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['outfits-get-all', pageNum, pageSize],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      return await APIService.private.get('/admin/outfits', {
        params: {
          pageNum,
          pageSize,
        },
      });
    },
  });
  return { data, isLoading, error, refetch };
};
