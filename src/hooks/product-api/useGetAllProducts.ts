import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { ProductStatus } from './productApiTypes';

export type ProductsAdminPage = {
  content: unknown[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type GetAllProductsResponse = {
  success: boolean;
  code: number;
  message: string;
  data: ProductsAdminPage;
};

export type GetAllProductsQueryParams = {
  pageNum: number;
  pageSize: number;
  productStatus?: ProductStatus;
  /** 상품명 검색 */
  keyword?: string;
};

export const useGetAllProducts = (params: GetAllProductsQueryParams) => {
  const { pageNum, pageSize, productStatus, keyword } = params;
  const kw = keyword?.trim() || undefined;

  const { data, isLoading, error, refetch } = useQuery<GetAllProductsResponse>({
    queryKey: ['products-all', pageNum, pageSize, productStatus ?? '', kw ?? ''],
    queryFn: async () => {
      return await APIService.private.get('/admin/products', {
        params: {
          pageNum,
          pageSize,
          ...(productStatus ? { productStatus } : {}),
          ...(kw ? { keyword: kw } : {}),
        },
      });
    },
  });

  return { data, isLoading, error, refetch };
};
