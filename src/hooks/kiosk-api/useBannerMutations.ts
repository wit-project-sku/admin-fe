import { useMutation } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type { BannerTargetType } from './bannerTypes';

export type BannerTargetPayload = {
  targetType: BannerTargetType;
  /** targetType=SELECTED 일 때만 사용 */
  kioskIds?: number[];
  startDate?: string | null;
  endDate?: string | null;
};

/** 멀티파트 `data`(JSON) 파트는 content-type 을 명시해야 서버가 역직렬화한다. */
function jsonPart(payload: BannerTargetPayload): Blob {
  return new Blob([JSON.stringify(payload)], { type: 'application/json' });
}

/** POST `/admin/banners` — 이미지 여러 장을 같은 대상·기간으로 한 번에 등록. */
export const useCreateBanners = () => {
  const { mutateAsync: createBannersAsync, isPending } = useMutation({
    mutationFn: async ({ payload, images }: { payload: BannerTargetPayload; images: File[] }) => {
      const fd = new FormData();
      fd.append('data', jsonPart(payload));
      images.forEach((f) => fd.append('images', f));
      return await APIService.private.post('/admin/banners', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  });
  return { createBannersAsync, isPending };
};

/** PUT `/admin/banners/{id}` — 노출 대상·기간만 수정(이미지 유지). */
export const useUpdateBanner = () => {
  const { mutateAsync: updateBannerAsync, isPending } = useMutation({
    mutationFn: async ({ bannerId, payload }: { bannerId: number; payload: BannerTargetPayload }) =>
      await APIService.private.put(`/admin/banners/${bannerId}`, payload),
  });
  return { updateBannerAsync, isPending };
};

/** PUT `/admin/banners/{id}/image` — 이미지 교체(노출 중인 모든 키오스크에 반영). */
export const useReplaceBannerImage = () => {
  const { mutateAsync: replaceImageAsync, isPending } = useMutation({
    mutationFn: async ({ bannerId, image }: { bannerId: number; image: File }) => {
      const fd = new FormData();
      fd.append('image', image);
      return await APIService.private.put(`/admin/banners/${bannerId}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  });
  return { replaceImageAsync, isPending };
};

/** DELETE `/admin/banners/{id}` — 소재와 모든 배정을 함께 삭제. */
export const useDeleteBanner = () => {
  const { mutateAsync: deleteBannerAsync, isPending } = useMutation({
    mutationFn: async (bannerId: number) =>
      await APIService.private.delete(`/admin/banners/${bannerId}`),
  });
  return { deleteBannerAsync, isPending };
};

/** DELETE `/admin/kiosks/{kioskId}/banners/{bannerId}` — 이 키오스크에서만 내리기. */
export const useUnassignKioskBanner = () => {
  const { mutateAsync: unassignAsync, isPending } = useMutation({
    mutationFn: async ({ kioskId, bannerId }: { kioskId: number; bannerId: number }) =>
      await APIService.private.delete(`/admin/kiosks/${kioskId}/banners/${bannerId}`),
  });
  return { unassignAsync, isPending };
};
