import { useMutation } from '@tanstack/react-query';

import { APIService } from '../../utils/axios';

/**
 * 키오스크 앱 즉시 업데이트 · Kiosk app "update now" trigger.
 *
 * 키오스크 데스크톱 앱은 평소 매주 금요일 17:00 점검 창에서만 업데이트를 확인한다
 * (영업 중 재시작을 막기 위한 기본값). 이 API 는 그 일정을 건드리지 않고, 관리자가
 * 버튼을 눌러 "지금 확인" 을 지시하는 두 번째 트리거다.
 *
 * The backend stores ONE timestamp — when an update was last requested. Every
 * kiosk polls it (`GET /api/kiosks/{kioskNum}/update-command`, public) and forces
 * an immediate update check when it sees a value newer than the one it already
 * handled. The admin only has to move that timestamp forward, so this single
 * POST is the entire admin-side contract — there is deliberately no admin GET.
 *
 * 백엔드 계약 · Backend contract: kiosk-app `docs/UPDATE_COMMAND_API.md`.
 */

export type KioskUpdateCommand = {
  /** ISO-8601 UTC. 서버가 생성한다(클라이언트 시각은 신뢰하지 않음). */
  requestedAt: string | null;
};

function parseCommand(res: unknown): KioskUpdateCommand {
  const raw = (res ?? {}) as Record<string, unknown>;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  return { requestedAt: typeof data.requestedAt === 'string' ? data.requestedAt : null };
}

/**
 * POST `/admin/kiosks/update-command` — 전체(또는 지정) 키오스크에 즉시 업데이트 지시.
 *
 * kioskNums 를 비우면 전체 키오스크 대상. 응답의 `requestedAt` 으로 화면에 방금
 * 지시한 시각을 표시한다(별도 조회 API 없음).
 */
export const useRequestKioskUpdate = () => {
  const { mutateAsync: requestKioskUpdateAsync, isPending } = useMutation({
    mutationFn: async (body?: { kioskNums?: number[]; note?: string }) =>
      parseCommand(await APIService.private.post('/admin/kiosks/update-command', body ?? {})),
  });
  return { requestKioskUpdateAsync, isPending };
};
