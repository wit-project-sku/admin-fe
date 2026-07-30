import { useQuery } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type { KioskBannerDto } from './bannerTypes';

export const kioskBannersKey = (kioskId: number | undefined) => ['kiosk-banners', kioskId ?? ''];

/** GET `/admin/kiosks/{kioskId}/banners` — 이 키오스크의 노출 순서대로(기간 지난 것 포함). */
export const useKioskBanners = (kioskId: number | undefined) => {
  const { data, isPending, isError } = useQuery({
    queryKey: kioskBannersKey(kioskId),
    queryFn: async () => {
      const res = await APIService.private.get(`/admin/kiosks/${kioskId}/banners`);
      const raw = (res ?? {}) as Record<string, unknown>;
      return (Array.isArray(raw.data) ? raw.data : Array.isArray(res) ? res : []) as KioskBannerDto[];
    },
    enabled: typeof kioskId === 'number' && kioskId > 0,
    staleTime: 30_000,
  });
  return { banners: data ?? [], isPending, isError };
};
