import { APIService } from '@/utils/axios';
import { useMutation } from '@tanstack/react-query';

export const useAdminProductCategories = () => {
  useMutation({
    mutationFn: async (categories: string[]) =>
      await APIService.private.post('/admin/products/categories', { categories }),
  });
};
