import { APIService } from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';

export const useGetAllProductCategories = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product-categories-get-all'],
    queryFn: async () => {
      return await APIService.private.get('/categories/products');
    },
  });

  return { data, isLoading, error };
};
