import { useMutation } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';

export type AddKioskBannerPayload = {
  kioskId: number;
  /** 배너 이미지 1장(서버가 멀티파트 `image` 단건만 받는다). */
  image: File | Blob;
};

/** POST `/admin/kiosks/{kioskId}/banners` — 멀티파트 `image` 로 1장 추가. */
export const useAddKioskBanner = () => {
  const {
    mutate: addKioskBanner,
    mutateAsync: addKioskBannerAsync,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ kioskId, image }: AddKioskBannerPayload) => {
      const formData = new FormData();
      formData.append('image', image);
      return await APIService.private.post(`/admin/kiosks/${kioskId}/banners`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });

  return { addKioskBanner, addKioskBannerAsync, isPending, error };
};
