import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export const useGetProductById = (productId: number | string | null | undefined) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product-by-id', productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      return await APIService.private.get(`/products/${productId}`);
    },
  });

  return { data, isLoading, error };
};
