import { useMutation } from '@tanstack/react-query';
import APIService from '../../services/APIService';

export const useDeleteProduct = () => {
  const { mutate: deleteProduct } = useMutation({
    mutationFn: async (productId) => {
      return await APIService.private.delete(`/admin/products/${productId}/hard`);
    },
  });
  return { deleteProduct };
};
