import { useMutation } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';

export type DeleteKioskBannerPayload = {
  kioskId: number;
  bannerId: number;
};

/** DELETE `/admin/kiosks/{kioskId}/banners/{bannerId}` — 1장 삭제(S3 + DB). */
export const useDeleteKioskBanner = () => {
  const {
    mutate: deleteKioskBanner,
    mutateAsync: deleteKioskBannerAsync,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ kioskId, bannerId }: DeleteKioskBannerPayload) =>
      await APIService.private.delete(`/admin/kiosks/${kioskId}/banners/${bannerId}`),
  });

  return { deleteKioskBanner, deleteKioskBannerAsync, isPending, error };
};
