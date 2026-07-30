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

/**
 * PUT `/admin/banners/{id}` — 이미지·노출 대상·기간을 한 번에 수정.
 * image 를 넘기지 않으면 기존 이미지를 그대로 둔다(부분 저장으로 인한 중간 상태가 생기지 않도록 단일 요청).
 */
export const useUpdateBanner = () => {
  const { mutateAsync: updateBannerAsync, isPending } = useMutation({
    mutationFn: async ({
      bannerId,
      payload,
      image,
    }: {
      bannerId: number;
      payload: BannerTargetPayload;
      image?: File | null;
    }) => {
      const fd = new FormData();
      fd.append('data', jsonPart(payload));
      if (image) fd.append('image', image);
      return await APIService.private.put(`/admin/banners/${bannerId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  });
  return { updateBannerAsync, isPending };
};

/**
 * DELETE `/admin/banners?ids=1,2,3` — 선택한 배너를 한 번에 삭제(단건도 동일 경로).
 * 서버가 영향받은 키오스크의 노출 순서를 키오스크당 한 번만 다시 채우므로, 건별 호출보다 안전하고 빠르다.
 */
export const useDeleteBanners = () => {
  const { mutateAsync: deleteBannersAsync, isPending } = useMutation({
    mutationFn: async (bannerIds: number[]) =>
      await APIService.private.delete('/admin/banners', {
        params: { ids: bannerIds.join(',') },
      }),
  });
  return { deleteBannersAsync, isPending };
};

/** DELETE `/admin/kiosks/{kioskId}/banners/{bannerId}` — 이 키오스크에서만 내리기. */
export const useUnassignKioskBanner = () => {
  const { mutateAsync: unassignAsync, isPending } = useMutation({
    mutationFn: async ({ kioskId, bannerId }: { kioskId: number; bannerId: number }) =>
      await APIService.private.delete(`/admin/kiosks/${kioskId}/banners/${bannerId}`),
  });
  return { unassignAsync, isPending };
};
