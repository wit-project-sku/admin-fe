import { User } from 'lucide-react';
import shared from '@commons/shared.module.css';

import type { BodyMeasurementListItem } from '../../hooks/body-measurement-api/bodyMeasurementTypes';
import {
  fmtGenderNationality,
  fmtHeightPair,
  fmtNum,
  fmtShotMinute,
  kioskShortName,
} from './bodyMeasurementFormat';
import s from './BodyMeasurements.module.css';

type Props = {
  loading: boolean;
  errorMessage: string;
  emptyMessage: string;
  rows: BodyMeasurementListItem[];
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
  /** 작은 사진이 깨짐(서명 주소 만료 등) → 목록을 한 번 다시 받는다. */
  onThumbError: () => void;
};

const COLUMNS: { label: string; num?: boolean; center?: boolean }[] = [
  { label: '사진', center: true },
  { label: '촬영 시각' },
  { label: '지점' },
  { label: '키(측정/입력)', num: true },
  { label: '어깨', num: true },
  { label: '가슴', num: true },
  { label: '허리', num: true },
  { label: '엉덩이', num: true },
  { label: '신뢰도', num: true },
  { label: '성별·국적' },
];

/** 체형 측정 목록. 숫자는 받은 값 그대로(반올림 없음), null 은 `—`. 행을 누르면 아래 상세가 열린다. */
export function BodyMeasurementTable({
  loading,
  errorMessage,
  emptyMessage,
  rows,
  selectedEventId,
  onSelect,
  onThumbError,
}: Props) {
  const thClass = (c: (typeof COLUMNS)[number]) =>
    [shared.th, s.th, c.num ? shared.thRight : c.center ? shared.thCenter : s.thLeft].filter(Boolean).join(' ');
  const td = `${shared.td} ${s.td}`;
  const tdNum = `${td} ${s.num}`;

  return (
    <div className={shared.tableResponsive}>
      <table className={`${shared.table} ${s.table}`}>
        <thead className={shared.thead}>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.label} className={thClass(c)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={`bm-skeleton-${i}`} className={shared.skeletonRow}>
                {COLUMNS.map((c) => (
                  <td key={c.label} className={td}>
                    <span className={shared.skeletonLine} />
                  </td>
                ))}
              </tr>
            ))
          ) : errorMessage ? (
            <tr>
              <td colSpan={COLUMNS.length} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                {errorMessage}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className={shared.tableStateCell}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const selected = r.eventId === selectedEventId;
              const genderNat = fmtGenderNationality(r.shooter, 'code');
              return (
                <tr
                  key={r.eventId}
                  className={`${shared.tr} ${s.row} ${selected ? s.rowSelected : ''}`}
                  aria-selected={selected}
                  tabIndex={0}
                  onClick={() => onSelect(r.eventId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(r.eventId);
                    }
                  }}
                >
                  <td className={td}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {r.thumbnailUrl ? (
                        <img
                          src={r.thumbnailUrl}
                          alt=''
                          className={s.thumb}
                          loading='lazy'
                          onError={onThumbError}
                        />
                      ) : (
                        <span className={s.thumbEmpty} aria-label='사진 없음'>
                          <User size={14} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={td}>{fmtShotMinute(r.shotAt)}</td>
                  <td className={td} title={r.kioskName ?? undefined}>
                    {kioskShortName(r.kioskName)}
                  </td>
                  <td className={tdNum}>{fmtHeightPair(r.heightCm, r.shooter?.heightCm)}</td>
                  <td className={tdNum}>{fmtNum(r.shoulderWidthCm)}</td>
                  <td className={tdNum}>{fmtNum(r.chestWidthCm)}</td>
                  <td className={tdNum}>{fmtNum(r.waistWidthCm)}</td>
                  <td className={tdNum}>{fmtNum(r.hipWidthCm)}</td>
                  <td className={tdNum}>{fmtNum(r.confidence)}</td>
                  <td className={td}>{genderNat ?? <span className={s.muted}>미입력</span>}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
