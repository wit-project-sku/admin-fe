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
  /** 검색어(상점명 Kr/En·업무코드 부분일치, 선택). */
  keyword?: string;
  pageNum: number;
  pageSize: number;
};

export const useGetAllShops = (params: GetAllShopsQueryParams) => {
  const { kioskId, keyword, pageNum, pageSize } = params;
  const enabled = kioskId != null && kioskId !== '';
  const trimmedKeyword = keyword?.trim() ? keyword.trim() : undefined;

  const { data, isLoading, error, refetch } = useQuery<GetAllShopsResponse>({
    queryKey: ['shops-all', kioskId ?? '', trimmedKeyword ?? '', pageNum, pageSize],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      return await APIService.private.get('/admin/shops', {
        params: { kioskId, keyword: trimmedKeyword, pageNum, pageSize },
      });
    },
  });

  return { data, isLoading, error, refetch };
};
