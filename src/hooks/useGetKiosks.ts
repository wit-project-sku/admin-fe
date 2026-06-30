import { useQuery } from '@tanstack/react-query';
import { APIService } from '../utils/axios';

export type AdminKioskDto = {
  id: number;
  name: string;
  city: string;
  district: string;
  address: string;
};

type AdminKioskPageResponse = {
  success: boolean;
  code: number;
  message: string;
  data: {
    content: AdminKioskDto[];
    totalElements: number;
    totalPages: number;
    pageNum: number;
    pageSize: number;
    last: boolean;
  };
};

export type UseGetKiosksOptions = {
  enabled?: boolean;
  /** 키오스크 이름 검색어 → `keyword` query. */
  keyword?: string;
  /** 도시 → `city` query. */
  city?: string;
  /**
   * How many rows each **single HTTP request** asks for (`pageSize` query param).
   * This is **not** a cap on total kiosks: we keep requesting `pageNum` 1…n until `data.last`
   * and concatenate every `content` into one array for the select.
   */
  pageSize?: number;
};

/** Default rows per request when listing all kiosks (larger = fewer round-trips). */
const DEFAULT_PAGE_FETCH_SIZE = 200;

/** Safety cap on page index (not on total row count). */
const MAX_PAGE_INDEX = 500;

/**
 * Loads every page from GET `/admin/kiosks` and returns **all** `content[]` rows merged.
 * Query: `pageNum`, `pageSize`, optional `keyword`, optional `city`.
 */
async function fetchAllAdminKiosks(
  keyword: string | undefined,
  city: string | undefined,
  pageSize: number,
): Promise<AdminKioskDto[]> {
  const acc: AdminKioskDto[] = [];
  let pageNum = 1;
  const kw = keyword?.trim() || undefined;
  const cityQ = city?.trim() || undefined;

  while (pageNum <= MAX_PAGE_INDEX) {
    const res = await APIService.private.get<AdminKioskPageResponse>('/admin/kiosks', {
      params: {
        pageNum,
        pageSize,
        ...(kw ? { keyword: kw } : {}),
        ...(cityQ ? { city: cityQ } : {}),
      },
    });
    const page = res?.data;
    if (!page?.content?.length) break;
    acc.push(...page.content);
    if (page.last) break;
    pageNum += 1;
    if (pageNum > page.totalPages) break;
  }

  return acc;
}

/**
 * Kiosks for selects: GET `/admin/kiosks` with pagination, then **merge all pages** until `last`.
 * Optional `keyword` / `city` query params (server-side filter); `pageSize` only controls chunk size per request.
 */
export const useGetKiosks = (options?: UseGetKiosksOptions) => {
  const keyword = options?.keyword?.trim() || undefined;
  const city = options?.city?.trim() || undefined;
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_FETCH_SIZE;
  const enabled = options?.enabled ?? true;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-kiosk-list', keyword ?? '', city ?? '', pageSize],
    enabled,
    queryFn: () => fetchAllAdminKiosks(keyword, city, pageSize),
    staleTime: 2 * 60 * 1000,
  });

  return { data, isLoading, error };
};
