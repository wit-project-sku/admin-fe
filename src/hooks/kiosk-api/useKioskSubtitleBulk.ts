import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';
import type {
  BaseEnvelope,
  KioskSubtitleBulkPayload,
  KioskSubtitleDto,
} from './kioskSubtitleTypes';

const SUBTITLES_KEY = 'admin-kiosk-subtitles';

/** 자막 일괄 저장 (POST /admin/kiosks/subtitles/bulk). 성공 시 해당 키오스크 전체 자막을 반환. */
export function useKioskSubtitleBulkSave(kioskId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: KioskSubtitleBulkPayload): Promise<KioskSubtitleDto[]> => {
      const body = await APIService.private.post<BaseEnvelope<KioskSubtitleDto[]>>(
        '/admin/kiosks/subtitles/bulk',
        payload,
      );
      return body?.data ?? [];
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [SUBTITLES_KEY] });
      if (typeof kioskId === 'number') {
        void qc.invalidateQueries({ queryKey: [SUBTITLES_KEY, 'by-kiosk', kioskId] });
      }
    },
  });
}
