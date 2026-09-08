import { useCallback, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import shared from '@commons/shared.module.css';
import { useRequestKioskUpdate } from '@/hooks/kiosk-api/useRequestKioskUpdate';

/**
 * "키오스크 즉시 업데이트" 버튼 · Kiosk "update now" button.
 *
 * 키오스크는 평소 매주 금요일 17:00 점검 창에서만 업데이트를 확인한다. 이 버튼은 그
 * 일정을 그대로 두고, 서버의 요청 시각을 앞으로 옮겨 모든 키오스크가 다음 폴링(최대
 * 5분) 때 즉시 확인하도록 만든다.
 *
 * 주의 — 이 버튼은 코드를 배포하지 않는다. 새 릴리스가 이미 게시돼 있어야 의미가 있고,
 * 업데이트가 있으면 각 키오스크는 다운로드 후 "대기 상태일 때" 재시작한다(촬영/결제
 * 중에는 절대 재시작하지 않음).
 *
 * 표시되는 "최근 요청" 시각은 POST 응답에서만 온다(조회 API 없음) — 새로고침하면
 * 사라진다. Confirmation is required because this causes real kiosk restarts.
 */

function formatRequestedAt(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function KioskUpdateButton() {
  const { requestKioskUpdateAsync, isPending } = useRequestKioskUpdate();
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastRequested, setLastRequested] = useState<string | null>(null);

  const run = useCallback(async () => {
    setConfirming(false);
    try {
      const res = await requestKioskUpdateAsync({});
      setLastRequested(formatRequestedAt(res.requestedAt));
      setNotice('업데이트를 지시했습니다. 각 키오스크가 5분 이내에 확인합니다.');
    } catch {
      setNotice('업데이트 지시에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
    window.setTimeout(() => setNotice(null), 4000);
  }, [requestKioskUpdateAsync]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {notice ? <span className={shared.badgeBlue}>{notice}</span> : null}
      {lastRequested ? (
        <span className={shared.pageSubtitle} style={{ margin: 0, whiteSpace: 'nowrap' }}>
          최근 요청: {lastRequested}
        </span>
      ) : null}
      <button
        type='button'
        className={shared.btnOutline}
        onClick={() => setConfirming(true)}
        disabled={isPending}
        title='모든 키오스크가 즉시 업데이트를 확인합니다'
      >
        <RefreshCw size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
        {isPending ? '지시 중…' : '키오스크 즉시 업데이트'}
      </button>

      {confirming ? (
        <div
          role='dialog'
          aria-modal='true'
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setConfirming(false)}
        >
          <div
            className={shared.card}
            style={{ maxWidth: 460, width: '90%', cursor: 'default' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={shared.cardHead}>
              <h3 className={shared.cardTitle}>모든 키오스크를 지금 업데이트할까요?</h3>
            </div>
            <p className={shared.pageSubtitle} style={{ marginTop: 0 }}>
              각 키오스크가 최대 5분 안에 새 버전을 확인하고, 다운로드 후 <b>대기 상태일 때 자동으로 재시작</b>
              합니다. 촬영·결제 중에는 재시작하지 않습니다.
              <br />
              <br />
              새 릴리스가 게시돼 있어야 실제로 업데이트됩니다. 영업 시간 중에는 재시작이 눈에 띌 수 있습니다.
            </p>
            <div className={shared.actionGroup} style={{ justifyContent: 'flex-end' }}>
              <button type='button' className={shared.btnOutline} onClick={() => setConfirming(false)}>
                취소
              </button>
              <button type='button' className={shared.btnPrimary} onClick={run} disabled={isPending}>
                업데이트 지시
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
