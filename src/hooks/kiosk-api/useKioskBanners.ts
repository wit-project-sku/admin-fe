import { useQuery } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type { KioskBannerDto } from './kioskBannerTypes';

export const kioskBannersKey = (kioskId: number | undefined) => ['kiosk-banners', kioskId ?? ''];

/** GET `/admin/kiosks/{kioskId}/banners` — 노출 순서대로 배너 목록. */
export const useKioskBanners = (kioskId: number | undefined) => {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: kioskBannersKey(kioskId),
    queryFn: async () => {
      const res = await APIService.private.get(`/admin/kiosks/${kioskId}/banners`);
      // APIService 가 BaseResponse 를 벗기는 경우/안 벗기는 경우 모두 방어.
      const raw = (res ?? {}) as Record<string, unknown>;
      const list = (Array.isArray(raw.data) ? raw.data : Array.isArray(res) ? res : []) as KioskBannerDto[];
      return list;
    },
    enabled: typeof kioskId === 'number' && kioskId > 0,
    staleTime: 30_000,
  });

  return { banners: data ?? [], isPending, isError, refetch };
};
