import { useQuery } from '@tanstack/react-query';
import { APIService } from '../utils/axios';

/**
 * 선택 목록에서 감출 사내 테스트 단말인가.
 *
 * 이름 접두어가 운영 매장(`#W001-인사동=북인사광장`)과 비매장 단말(`#P001-HQ=3개모니터`)을 가른다.
 * 다만 **`#P` 가 전부 테스트인 것은 아니다** — `#P003-VN=2개모니터`(id 202)는 베트남에 실제로
 * 설치된 모니터라 의상을 등록해야 한다. 그래서 접두어만으로 자르지 않고 **거점이 HQ 인 것만** 감춘다.
 *
 * id 가 아니라 이름으로 판정하는 이유: 키오스크 id 는 재번호가 매겨진 전례가 있다(P003 은 6 → 202).
 */
export const isTestKiosk = (name?: string | null): boolean => {
  const trimmed = (name ?? '').trimStart();
  return trimmed.startsWith('#P') && trimmed.includes('-HQ');
};

export type AdminKioskDto = {
  id: number;
  name: string;
  city: string;
  district: string;
  address: string;
  /** 줄별 용량이 없는 줄의 기본 버튼 수 (기본 4, 최대 4) */
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
