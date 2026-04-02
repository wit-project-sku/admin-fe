import { useQuery } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useGetProductById = (productId) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['product-by-id', productId],
        queryFn: async () => {
            return await APIService.private.get(`/products/${productId}`);
        }
    });

    return { data, isLoading, error };
}
