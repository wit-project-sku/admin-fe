import { useQuery } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type { BannerDto } from './bannerTypes';

export const bannersKey = ['banners'];

/** GET `/admin/banners` — 배너 소재 목록(최신순). */
export const useBanners = () => {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: bannersKey,
    queryFn: async () => {
      const res = await APIService.private.get('/admin/banners');
      const raw = (res ?? {}) as Record<string, unknown>;
      return (Array.isArray(raw.data) ? raw.data : Array.isArray(res) ? res : []) as BannerDto[];
    },
    staleTime: 30_000,
  });
  return { banners: data ?? [], isPending, isError, refetch };
};
