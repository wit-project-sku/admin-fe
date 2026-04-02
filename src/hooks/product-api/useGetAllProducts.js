import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useGetAllProducts = (pageNum = 1, pageSize = 6, productStatus) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products-all', pageNum, pageSize, productStatus],
    queryFn: async () => {
      const params = { pageNum, pageSize, productStatus };
      return await APIService.private.get('/admin/products', { params });
    },
  });

  return { data, isLoading, error };
};
