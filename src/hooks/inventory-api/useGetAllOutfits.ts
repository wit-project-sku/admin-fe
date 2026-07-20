import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type OutfitListStatus = 'ACTIVE' | 'INACTIVE';

export type OutfitListType = 'NORMAL' | 'PREMIUM' | 'SCHOOL_UNIFORM';

export type UseGetAllOutfitsParams = {
  pageNum: number;
  pageSize: number;
  /** 의상명 검색 키워드 */
  keyword?: string;
  /** ACTIVE | INACTIVE; omit for 전체 */
  status?: OutfitListStatus;
  /** NORMAL | PREMIUM | SCHOOL_UNIFORM; omit for 전체 */
  type?: OutfitListType;
  enabled?: boolean;
};

export const useGetAllOutfits = (params: UseGetAllOutfitsParams) => {
  const { pageNum, pageSize, keyword, status, type, enabled = true } = params;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['outfits-get-all', pageNum, pageSize, keyword ?? '', status ?? '', type ?? ''],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const requestParams: Record<string, string | number> = { pageNum, pageSize };
      const kw = keyword?.trim();
      if (kw) requestParams.keyword = kw;
      if (status) requestParams.status = status;
      if (type) requestParams.type = type;
      return await APIService.private.get('/admin/outfits', { params: requestParams });
    },
  });

  return { data, isLoading, error, refetch };
};
