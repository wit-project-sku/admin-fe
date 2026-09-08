import { useMutation } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';

export type ReorderKioskBannersPayload = {
  kioskId: number;
  /** 노출 순서대로 나열한 배너 ID 배열. */
  bannerIds: number[];
};

/** PUT `/admin/kiosks/{kioskId}/banners/order` — 배열 순서대로 노출 순서 재배치. */
export const useReorderKioskBanners = () => {
  const {
    mutate: reorderKioskBanners,
    mutateAsync: reorderKioskBannersAsync,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ kioskId, bannerIds }: ReorderKioskBannersPayload) =>
      await APIService.private.put(`/admin/kiosks/${kioskId}/banners/order`, bannerIds),
  });

  return { reorderKioskBanners, reorderKioskBannersAsync, isPending, error };
};
