import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type ShopsAdminPage = {
  content: unknown[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type GetAllShopsResponse = {
  success: boolean;
  code: number;
  message: string;
  data: ShopsAdminPage;
};

export type GetAllShopsQueryParams = {
  /** 키오스크(지역) 식별자 (필수). 값이 없으면 요청하지 않는다. */
  kioskId: number | string | null | undefined;
  pageNum: number;
  pageSize: number;
};

export const useGetAllShops = (params: GetAllShopsQueryParams) => {
  const { kioskId, pageNum, pageSize } = params;
  const enabled = kioskId != null && kioskId !== '';

  const { data, isLoading, error, refetch } = useQuery<GetAllShopsResponse>({
    queryKey: ['shops-all', kioskId ?? '', pageNum, pageSize],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      return await APIService.private.get('/admin/shops', {
        params: { kioskId, pageNum, pageSize },
      });
    },
  });

  return { data, isLoading, error, refetch };
};
