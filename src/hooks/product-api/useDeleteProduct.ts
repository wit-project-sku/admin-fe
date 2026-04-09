import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export const useDeleteProduct = () => {
  const { mutate: deleteProduct, mutateAsync: deleteProductAsync } = useMutation({
    mutationFn: async (productId: number | string) => {
      return await APIService.private.delete(`/admin/products/${productId}/hard`);
    },
  });
  return { deleteProduct, deleteProductAsync };
};
