import { useState } from 'react';
import shared from '@commons/shared.module.css';

import { useKioskHealthBoard, useKioskHealthMutations } from '@/hooks/kiosk-api/useKioskHealth';
import type { KioskHealthDto, KioskHealthSettingsPayload, KioskLiveness } from '@/hooks/kiosk-api/kioskHealthTypes';
import s from './KioskHealth.module.css';
import { HelpPopover } from './HelpPopover';
import { KioskHealthRow } from './KioskHealthRow';
import { EVENT_LABEL, STATUS_META, shortDateTime, shortKioskName } from './kioskHealthFormat';

const SUMMARY_ORDER: KioskLiveness[] = ['OFFLINE', 'WAITING', 'ONLINE', 'MAINTENANCE', 'OUT_OF_HOURS'];

/** 감시 중인 기기를 위로, 그 안에서는 id 순. 감시 안 하는 기기(테스트기 등)는 아래로 모은다. */
const byMonitoredThenId = (a: KioskHealthDto, b: KioskHealthDto) =>
  Number(b.monitored) - Number(a.monitored) || a.kioskId - b.kioskId;

/**
 * 키오스크 실행 모니터링. 서버가 요청 시각 기준으로 매번 판정하므로 화면은 1분마다 다시 받기만 한다.
 * 텔레그램 알림은 서버 배치(5분)가 상태가 바뀔 때만 보낸다 — 이 화면을 열어 두지 않아도 알림은 간다.
 */
export function KioskHealthBoard() {
  const { board, isPending, isError, refetch, isFetching } = useKioskHealthBoard();
  const { saveSettingsAsync, startMaintenanceAsync, endMaintenanceAsync, isPending: busy } = useKioskHealthMutations();
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok = true) => {
    setNotice({ text, ok });
    window.setTimeout(() => setNotice(null), 3200);
  };

  const run = async (task: () => Promise<unknown>, okText: string, failText: string) => {
    try {
      await task();
      flash(okText);
    } catch {
      flash(failText, false);
    }
  };

  if (isPending) return <div className={shared.card}>불러오는 중…</div>;
  if (isError || !board) return <div className={shared.card}>현황을 불러오지 못했습니다.</div>;

  const rows = [...board.kiosks].sort(byMonitoredThenId);
  const counts = rows.reduce<Partial<Record<KioskLiveness, number>>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const onSave = (kioskId: number, body: KioskHealthSettingsPayload) =>
    run(() => saveSettingsAsync({ kioskId, body }), '저장했습니다.', '저장에 실패했습니다.');
  const onStart = (kioskId: number, minutes: number) =>
    run(() => startMaintenanceAsync({ kioskId, minutes }), '점검 모드를 시작했습니다.', '점검 시작에 실패했습니다.');
  const onEnd = (kioskId: number) =>
    run(() => endMaintenanceAsync(kioskId), '점검 모드를 끝냈습니다.', '점검 종료에 실패했습니다.');

  return (
    <>
      {notice && <div className={`${s.notice} ${notice.ok ? s.noticeOk : s.noticeErr}`}>{notice.text}</div>}

      <div className={s.summary}>
        {SUMMARY_ORDER.filter((k) => counts[k]).map((k) => (
          <span key={k} className={`${shared.badge} ${shared[STATUS_META[k].badge]}`}>
            {STATUS_META[k].label} {counts[k]}
          </span>
        ))}
        <span className={s.summaryMeta}>
          {board.checkedAt.slice(11)} 기준 · 1분마다 자동 갱신{' '}
          <button type='button' className={s.smallBtn} disabled={isFetching} onClick={() => refetch()}>
            새로고침
          </button>
        </span>
      </div>

      <div className={shared.card}>
        <div className={shared.tableResponsive}>
          <table className={shared.table}>
            <thead className={shared.thead}>
              <tr>
                <th className={shared.th}>키오스크</th>
                <th className={shared.th}>상태</th>
                <th className={shared.th}>마지막 신호</th>
                <th className={shared.th}>운영시간</th>
                <th className={shared.thCenter}>감시</th>
                <th className={shared.th}>
                  <span className={s.thWithHelp}>
                    점검 모드
                    <HelpPopover label='점검 모드'>
                      <p>
                        키오스크 앱을 <b>일부러 끄기 전에</b>(점검·재설치·PC 재부팅 등) 눌러 두면, 정한 시간 동안 꺼져
                        있어도 알림을 보내지 않습니다.
                      </p>
                      <p>
                        키오스크에 명령을 보내지는 않습니다. 시간이 지나거나 [점검 종료]를 누르면 감시가 다시 켜지고,
                        재부팅 시간으로 {board.thresholdMinutes}분을 더 기다립니다.
                      </p>
                      <p>누르지 않고 끄면 {board.thresholdMinutes}분 뒤 오프라인 알림이 갑니다.</p>
                    </HelpPopover>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <KioskHealthRow
                  key={`${r.kioskId}-${r.openTime}-${r.closeTime}`}
                  row={r}
                  checkedAt={board.checkedAt}
                  busy={busy}
                  onSave={onSave}
                  onStartMaintenance={onStart}
                  onEndMaintenance={onEnd}
                />
              ))}
            </tbody>
          </table>
        </div>
        <p className={s.help}>
          신호 = 키오스크 앱이 약 2.5분마다 보내는 업데이트 확인 요청. 앱·PC·네트워크가 살아 있는지까지만 알 수
          있습니다(화면 멈춤은 감지하지 못합니다).
          <br />
          운영시간 안에서 {board.thresholdMinutes}분 넘게 신호가 없으면 오프라인으로 보고 텔레그램으로 알립니다. 다시
          신호가 오면 복구 알림을 보냅니다.
        </p>
      </div>

      <div className={shared.card} style={{ marginTop: 16 }}>
        <div className={shared.cardHead}>
          <h2 className={shared.cardTitle}>최근 이력</h2>
        </div>
        {board.recentEvents.length === 0 ? (
          <p className={s.help}>아직 이력이 없습니다.</p>
        ) : (
          <div className={shared.tableResponsive}>
            <table className={shared.table}>
              <thead className={shared.thead}>
                <tr>
                  <th className={shared.th}>시각</th>
                  <th className={shared.th}>키오스크</th>
                  <th className={shared.th}>구분</th>
                  <th className={shared.th}>내용</th>
                </tr>
              </thead>
              <tbody>
                {board.recentEvents.map((e, i) => (
                  <tr key={`${e.occurredAt}-${e.kioskId}-${i}`} className={shared.tr}>
                    <td className={shared.tdMono}>{shortDateTime(e.occurredAt)}</td>
                    <td className={shared.td}>{shortKioskName(e.kioskName)}</td>
                    <td className={shared.td}>{EVENT_LABEL[e.type]}</td>
                    <td className={shared.tdMuted}>{e.detail ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
