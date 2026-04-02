import { useMutation } from '@tanstack/react-query';
import APIService from '../../services/APIService';
import { buildProductMultipart } from '../../utils/formDataBuilder';

export const useUpdateProduct = () => {
  const { mutate: updateProduct } =  useMutation({
    mutationFn: async (productId, updatedData, images) => {
      const formData = buildProductMultipart(updatedData, images);
      return await APIService.private.put(`/admin/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });

    return { updateProduct };
};
