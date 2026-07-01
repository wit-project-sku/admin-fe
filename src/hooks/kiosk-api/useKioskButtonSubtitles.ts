import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { APIService } from '@/utils/axios';
import type {
  BaseEnvelope,
  KioskSubtitleDto,
  KioskSubtitlePayload,
  SubtitlePage,
} from './kioskSubtitleTypes';

const SUBTITLES_KEY = 'admin-kiosk-subtitles';

function apiMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: unknown } | string | undefined;
    if (typeof body === 'string' && body.trim()) return body;
    const m = body && typeof body === 'object' ? body.message : undefined;
    if (typeof m === 'string' && m.trim()) return m;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

/** 한 버튼의 자막 세그먼트 목록 (GET /admin/kiosks/subtitles?kioskId&buttonId). */
export function useKioskButtonSubtitles(params: {
  kioskId?: number;
  buttonId?: number;
  enabled?: boolean;
}) {
  const { kioskId, buttonId, enabled = true } = params;
  return useQuery({
    queryKey: [SUBTITLES_KEY, kioskId ?? '', buttonId ?? ''],
    enabled: enabled && typeof kioskId === 'number' && typeof buttonId === 'number',
    queryFn: async (): Promise<KioskSubtitleDto[]> => {
      const body = await APIService.private.get<BaseEnvelope<SubtitlePage>>(
        '/admin/kiosks/subtitles',
        { params: { kioskId, buttonId, pageNum: 1, pageSize: 100 } },
      );
      const list = body?.data?.content ?? [];
      return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    },
    staleTime: 30 * 1000,
  });
}

/** 자막 생성/수정/삭제 뮤테이션. 성공 시 해당 버튼의 목록을 무효화. */
export function useKioskSubtitleMutations(kioskId?: number, buttonId?: number) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: [SUBTITLES_KEY, kioskId ?? '', buttonId ?? ''] });

  const create = useMutation({
    mutationFn: async (payload: KioskSubtitlePayload) => {
      try {
        return await APIService.private.post<BaseEnvelope<KioskSubtitleDto>>(
          '/admin/kiosks/subtitles',
          payload,
        );
      } catch (err) {
        throw new Error(apiMessage(err, '자막을 등록하지 못했습니다.'));
      }
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (vars: { id: number; payload: KioskSubtitlePayload }) => {
      try {
        return await APIService.private.put<BaseEnvelope<KioskSubtitleDto>>(
          `/admin/kiosks/subtitles/${vars.id}`,
          vars.payload,
        );
      } catch (err) {
        throw new Error(apiMessage(err, '자막을 수정하지 못했습니다.'));
      }
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await APIService.private.delete(`/admin/kiosks/subtitles/${id}`);
      } catch (err) {
        throw new Error(apiMessage(err, '자막을 삭제하지 못했습니다.'));
      }
    },
    onSuccess: invalidate,
  });

  return {
    createSubtitle: create.mutateAsync,
    updateSubtitle: update.mutateAsync,
    deleteSubtitle: remove.mutateAsync,
    isPending: create.isPending || update.isPending || remove.isPending,
  };
}
