import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { buildProductMultipart } from '../../utils/formDataBuilder';
import type { ProductWriteBody } from './productApiTypes';

export type UpdateProductPayload = {
  productId: number | string;
  updatedData: ProductWriteBody;
  images?: (File | Blob | null | undefined)[];
};

export const useUpdateProduct = () => {
  
  const { mutate: updateProduct, mutateAsync: updateProductAsync, isPending, error } = useMutation({
    mutationFn: async ({ productId, updatedData, images = [] }: UpdateProductPayload) => {
      const formData = buildProductMultipart(updatedData, images);
      return await APIService.private.put(`/admin/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });

  return { updateProduct, updateProductAsync, isPending, error };
};
