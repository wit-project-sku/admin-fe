import { useMutation } from '@tanstack/react-query';
import APIService from '../../services/APIService';
import { buildProductMultipart } from '../../utils/formDataBuilder';


export const useAddProduct = () => {
  const { mutate: addProduct } = useMutation({
    mutationFn: async (productData, categoryId, images = []) => {
      const formData = buildProductMultipart(productData, images);
      return await APIService.private.post(`/admin/products/categories/${categoryId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
  return { addProduct };
};
