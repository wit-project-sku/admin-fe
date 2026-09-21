import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';
import type { KioskHealthBoardDto, KioskHealthSettingsPayload } from './kioskHealthTypes';

export const kioskHealthKey = ['kiosk-health'];

/** 서버 판정 배치(5분)보다 짧게 — 화면은 요청 시각 기준으로 서버가 매번 다시 판정해 준다. */
const REFRESH_MS = 60_000;

/** GET `/admin/kiosks/health` — 전체 키오스크 현황 + 최근 이력 30건. 1분마다 자동 갱신. */
export const useKioskHealthBoard = () => {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: kioskHealthKey,
    queryFn: async () => {
      const res = (await APIService.private.get('/admin/kiosks/health')) as Record<string, unknown>;
      return (res?.data ?? null) as KioskHealthBoardDto | null;
    },
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
  });
  return { board: data ?? null, isPending, isError, refetch, isFetching };
};

/** 감시 여부·운영시간 저장, 점검 시작·종료. 성공하면 현황을 다시 받는다(이력도 바뀌므로). */
export const useKioskHealthMutations = () => {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: kioskHealthKey });

  const settings = useMutation({
    mutationFn: ({ kioskId, body }: { kioskId: number; body: KioskHealthSettingsPayload }) =>
      APIService.private.put(`/admin/kiosks/${kioskId}/health`, body),
    onSuccess,
  });
  const startMaintenance = useMutation({
    mutationFn: ({ kioskId, minutes }: { kioskId: number; minutes: number }) =>
      APIService.private.post(`/admin/kiosks/${kioskId}/maintenance`, { minutes }),
    onSuccess,
  });
  const endMaintenance = useMutation({
    mutationFn: (kioskId: number) => APIService.private.delete(`/admin/kiosks/${kioskId}/maintenance`),
    onSuccess,
  });

  return {
    saveSettingsAsync: settings.mutateAsync,
    startMaintenanceAsync: startMaintenance.mutateAsync,
    endMaintenanceAsync: endMaintenance.mutateAsync,
    isPending: settings.isPending || startMaintenance.isPending || endMaintenance.isPending,
  };
};
