import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { buildProductMultipart } from '../../utils/formDataBuilder';
import type { ProductWriteBody } from './productApiTypes';

export type AddProductPayload = {
  productData: ProductWriteBody;
  images?: (File | Blob | null | undefined)[];
};

export const useAddProduct = () => {
  const { mutate: addProduct, mutateAsync: addProductAsync, isPending, error } = useMutation({
    mutationFn: async ({ productData, images = [] }: AddProductPayload) => {
      const formData = buildProductMultipart(productData, images);
      return await APIService.private.post(`/admin/products/categories`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });
  return { addProduct, addProductAsync, isPending, error };
};
