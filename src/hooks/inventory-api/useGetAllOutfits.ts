import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type OutfitListStatus = 'ACTIVE' | 'INACTIVE';

export type UseGetAllOutfitsParams = {
  pageNum: number;
  pageSize: number;
  /** 의상명 검색 키워드 */
  keyword?: string;
  /** ACTIVE | INACTIVE; omit for 전체 */
  status?: OutfitListStatus;
  enabled?: boolean;
};

export const useGetAllOutfits = (params: UseGetAllOutfitsParams) => {
  const { pageNum, pageSize, keyword, status, enabled = true } = params;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['outfits-get-all', pageNum, pageSize, keyword ?? '', status ?? ''],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const requestParams: Record<string, string | number> = { pageNum, pageSize };
      const kw = keyword?.trim();
      if (kw) requestParams.keyword = kw;
      if (status) requestParams.status = status;
      return await APIService.private.get('/admin/outfits', { params: requestParams });
    },
  });

  return { data, isLoading, error, refetch };
};
