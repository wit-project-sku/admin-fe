import { useMutation } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';

export type AddKioskBannersPayload = {
  kioskId: number;
  /** 배너 이미지 여러 장(서버 멀티파트 `images`). */
  images: (File | Blob | null | undefined)[];
};

/** POST `/admin/kiosks/{kioskId}/banners` — 멀티파트 `images` 로 1장 이상 추가. */
export const useAddKioskBanners = () => {
  const {
    mutate: addKioskBanners,
    mutateAsync: addKioskBannersAsync,
    isPending,
    error,
  } = useMutation({
    mutationFn: async ({ kioskId, images }: AddKioskBannersPayload) => {
      const formData = new FormData();
      images.filter(Boolean).forEach((file) => {
        if (file) formData.append('images', file);
      });
      return await APIService.private.post(`/admin/kiosks/${kioskId}/banners`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  });

  return { addKioskBanners, addKioskBannersAsync, isPending, error };
};
