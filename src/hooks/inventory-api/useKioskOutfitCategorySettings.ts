import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type {
  KioskOutfitCategoryOverrideBody,
  KioskOutfitCategorySetting,
} from './kioskOutfitCategoryTypes';

/** 키오스크별 의상 카테고리 표시 설정 (`/categories/outfits/admin/kiosks/…`). */
export const KIOSK_OUTFIT_CATEGORY_KEY = 'kiosk-outfit-categories';

type SettingsResponse = {
  data: KioskOutfitCategorySetting[];
};

/**
 * 한 키오스크의 카테고리 설정 전체.
 *
 * 배정된 의상이 0벌이라 지금은 안 보이는 카테고리도 함께 온다 — 관리자는 "숨기지도 않았는데 왜 안 보이지"를
 * 알아야 한다.
 */
export const useGetKioskOutfitCategorySettings = (kioskId: number | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [KIOSK_OUTFIT_CATEGORY_KEY, kioskId],
    enabled: kioskId != null,
    queryFn: async () => {
      const res = await APIService.private.get<SettingsResponse>(
        `/categories/outfits/admin/kiosks/${kioskId}`,
      );
      return res?.data ?? [];
    },
  });

  return { settings: data ?? [], isLoading, error, refetch };
};

export type UpdateKioskOutfitCategoryPayload = {
  kioskId: number;
  categoryId: number;
  body: KioskOutfitCategoryOverrideBody;
};

/** 설정 저장(PUT). **전체 치환**이라 라벨 8칸을 늘 함께 보낸다. */
export const useUpdateKioskOutfitCategorySetting = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateSettingAsync, isPending } = useMutation({
    mutationFn: async ({ kioskId, categoryId, body }: UpdateKioskOutfitCategoryPayload) =>
      await APIService.private.put(
        `/categories/outfits/admin/kiosks/${kioskId}/${categoryId}`,
        body,
      ),
    onSuccess: (_res, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [KIOSK_OUTFIT_CATEGORY_KEY, variables.kioskId],
      });
    },
  });

  return { updateSettingAsync, isPending };
};

export type DeleteKioskOutfitCategoryPayload = {
  kioskId: number;
  categoryId: number;
};

/** 설정 삭제(DELETE) = 카테고리 기본값으로 되돌리기. */
export const useDeleteKioskOutfitCategorySetting = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: deleteSettingAsync, isPending } = useMutation({
    mutationFn: async ({ kioskId, categoryId }: DeleteKioskOutfitCategoryPayload) =>
      await APIService.private.delete(
        `/categories/outfits/admin/kiosks/${kioskId}/${categoryId}`,
      ),
    onSuccess: (_res, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [KIOSK_OUTFIT_CATEGORY_KEY, variables.kioskId],
      });
    },
  });

  return { deleteSettingAsync, isPending };
};
