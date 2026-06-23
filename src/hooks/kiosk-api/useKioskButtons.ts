import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';
import type { KioskButtonDto, KioskButtonsListResponse } from './kioskButtonsTypes';

export type KioskButtonsPagedResult = {
  content: KioskButtonDto[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
};

export type UseKioskButtonsOptions = {
  enabled?: boolean;
  /** Narrow buttons to one kiosk (with optional city/district from that kiosk). */
  kioskId?: number;
  city?: string;
  district?: string;
  /** Rows per HTTP request when paging through results. */
  pageSize?: number;
};

const DEFAULT_PAGE_FETCH_SIZE = 200;
const MAX_PAGE_INDEX = 500;

async function fetchAllKioskButtons(
  kioskId: number | undefined,
  city: string | undefined,
  district: string | undefined,
  pageSize: number,
): Promise<KioskButtonDto[]> {
  const acc: KioskButtonDto[] = [];
  let pageNum = 1;
  const cityQ = city?.trim() || undefined;
  const districtQ = district?.trim() || undefined;

  while (pageNum <= MAX_PAGE_INDEX) {
    const res = await APIService.private.get<KioskButtonsListResponse>('/admin/kiosks/buttons', {
      params: {
        pageNum,
        pageSize,
        ...(typeof kioskId === 'number' && kioskId > 0 ? { kioskId } : {}),
        ...(cityQ ? { city: cityQ } : {}),
        ...(districtQ ? { district: districtQ } : {}),
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

async function fetchKioskButtonsPage(params: {
  pageNum: number;
  pageSize: number;
  kioskId?: number;
  city?: string;
  district?: string;
}): Promise<KioskButtonsPagedResult> {
  const cityQ = params.city?.trim() || undefined;
  const districtQ = params.district?.trim() || undefined;
  const res = await APIService.private.get<KioskButtonsListResponse>('/admin/kiosks/buttons', {
    params: {
      pageNum: params.pageNum,
      pageSize: params.pageSize,
      ...(typeof params.kioskId === 'number' && params.kioskId > 0 ? { kioskId: params.kioskId } : {}),
      ...(cityQ ? { city: cityQ } : {}),
      ...(districtQ ? { district: districtQ } : {}),
    },
  });
  const page = res?.data;
  const content = page?.content ?? [];
  const totalElements = page?.totalElements ?? content.length;
  const apiTotalPages = page?.totalPages;
  const fallbackPages = Math.max(1, Math.ceil(totalElements / params.pageSize) || 1);
  const totalPages = totalElements === 0 ? 1 : Math.max(1, apiTotalPages ?? fallbackPages);
  return {
    content,
    totalElements,
    totalPages,
    pageNum: page?.pageNum ?? params.pageNum,
    pageSize: page?.pageSize ?? params.pageSize,
    last: page?.last ?? true,
  };
}

export type UseKioskButtonsPagedOptions = {
  enabled?: boolean;
  pageNum: number;
  pageSize: number;
  kioskId?: number;
  city?: string;
  district?: string;
};

/**
 * Single page from GET `/admin/kiosks/buttons` (for manage UI pagination).
 */
export function useKioskButtonsPaged(options: UseKioskButtonsPagedOptions) {
  const { pageNum, pageSize, kioskId, city, district, enabled = true } = options;
  const cityQ = city?.trim() || undefined;
  const districtQ = district?.trim() || undefined;

  return useQuery({
    queryKey: ['admin-kiosk-buttons-paged', pageNum, pageSize, kioskId ?? '', cityQ ?? '', districtQ ?? ''],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () => fetchKioskButtonsPage({ pageNum, pageSize, kioskId, city: cityQ, district: districtQ }),
    staleTime: 60 * 1000,
  });
}

/**
 * All kiosk buttons for selects (GET `/admin/kiosks/buttons`), pages merged until `last`.
 */
export function useKioskButtons(options?: UseKioskButtonsOptions) {
  const kioskId = options?.kioskId;
  const city = options?.city?.trim() || undefined;
  const district = options?.district?.trim() || undefined;
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_FETCH_SIZE;
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['admin-kiosk-buttons', kioskId ?? '', city ?? '', district ?? '', pageSize],
    enabled,
    queryFn: () => fetchAllKioskButtons(kioskId, city, district, pageSize),
    staleTime: 2 * 60 * 1000,
  });
}
