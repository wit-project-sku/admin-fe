import { useState } from 'react';
import shared from '@commons/shared.module.css';

import type { KioskHealthDto, KioskHealthSettingsPayload } from '@/hooks/kiosk-api/kioskHealthTypes';
import s from './KioskHealth.module.css';
import { STATUS_META, agoText, shortDateTime, shortKioskName } from './kioskHealthFormat';

const MAINTENANCE_OPTIONS = [30, 60, 120, 240, 480];

type Props = {
  row: KioskHealthDto;
  checkedAt: string;
  busy: boolean;
  onSave: (kioskId: number, body: KioskHealthSettingsPayload) => void;
  onStartMaintenance: (kioskId: number, minutes: number) => void;
  onEndMaintenance: (kioskId: number) => void;
};

/**
 * 키오스크 한 줄. 운영시간은 입력만으로 저장되지 않고 [저장]을 눌러야 반영된다(시각 두 칸을 다 고치는 동안 중간값이 서버에 가지 않게).
 * 부모가 서버 값이 바뀔 때 key 로 이 줄을 새로 만들어 편집 상태를 초기화한다.
 */
export function KioskHealthRow({ row, checkedAt, busy, onSave, onStartMaintenance, onEndMaintenance }: Props) {
  const [open, setOpen] = useState(row.openTime ?? '');
  const [close, setClose] = useState(row.closeTime ?? '');
  const [minutes, setMinutes] = useState(120);

  const meta = STATUS_META[row.status];
  const hoursChanged = open !== (row.openTime ?? '') || close !== (row.closeTime ?? '');
  const hoursValid = (open === '' && close === '') || (open !== '' && close !== '' && open !== close);
  const inMaintenance = row.status === 'MAINTENANCE';

  const save = (monitored: boolean) =>
    onSave(row.kioskId, { monitored, openTime: open || null, closeTime: close || null });

  return (
    <tr className={`${shared.tr} ${row.monitored ? '' : s.dim}`}>
      <td className={shared.td} title={row.kioskName}>
        <span className={s.nameMain}>{shortKioskName(row.kioskName)}</span>
        <span className={s.nameSub}>id {row.kioskId}</span>
      </td>
      <td className={shared.td}>
        <span className={`${shared.badge} ${shared[meta.badge]}`} title={meta.hint}>
          {meta.label}
        </span>
        {row.offlineSince && <span className={s.nameSub}>알림 {shortDateTime(row.offlineSince)}</span>}
      </td>
      <td className={shared.td}>
        {agoText(row.lastSeenAt, checkedAt)}
        <span className={s.nameSub}>{shortDateTime(row.lastSeenAt)}</span>
      </td>
      <td className={shared.td}>
        <div className={s.hoursCell}>
          <input
            type='time'
            className={s.timeInput}
            value={open}
            onChange={(e) => setOpen(e.target.value)}
            aria-label='운영 시작'
          />
          ~
          <input
            type='time'
            className={s.timeInput}
            value={close}
            onChange={(e) => setClose(e.target.value)}
            aria-label='운영 종료'
          />
          <button
            type='button'
            className={s.smallBtn}
            disabled={busy || !hoursChanged || !hoursValid}
            onClick={() => save(row.monitored)}
            title={hoursValid ? '' : '시작·종료를 모두 넣거나 모두 비워 주세요(같은 시각 불가)'}
          >
            저장
          </button>
        </div>
        <span className={s.nameSub}>{open === '' && close === '' ? '비우면 24시간 감시' : '종료가 더 이르면 자정 넘김'}</span>
      </td>
      <td className={shared.tdCenter}>
        <input
          type='checkbox'
          checked={row.monitored}
          disabled={busy || !hoursValid}
          onChange={(e) => save(e.target.checked)}
          aria-label='감시'
        />
      </td>
      <td className={shared.td}>
        <div className={s.maintCell}>
          {inMaintenance ? (
            <>
              <span>~{shortDateTime(row.maintenanceUntil)}</span>
              <button type='button' className={s.smallBtn} disabled={busy} onClick={() => onEndMaintenance(row.kioskId)}>
                점검 종료
              </button>
            </>
          ) : (
            <>
              <select className={s.select} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                {MAINTENANCE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m}분` : `${m / 60}시간`}
                  </option>
                ))}
              </select>
              <button
                type='button'
                className={s.smallBtn}
                disabled={busy}
                onClick={() => onStartMaintenance(row.kioskId, minutes)}
              >
                점검 시작
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
