import shared from '@commons/shared.module.css';
import type { LotteEventDto } from '../../hooks/lotte-event-api/lotteEventTypes';
import s from '../lotte/Lotte.module.css';
import { formatDateTime } from '../lotte/lotteFormat';
import {
  LOTTE_EVENT_KIND_LABEL,
  LOTTE_EVENT_STATUS_BADGE,
  LOTTE_EVENT_STATUS_LABEL,
  eventStatusOf,
} from './lotteEventConfig';

type Props = {
  loading: boolean;
  errorMessage: string;
  emptyMessage: string;
  rows: LotteEventDto[];
  branchCodeOf: (kioskId: number) => string;
  onEdit: (row: LotteEventDto) => void;
  onDelete: (row: LotteEventDto) => void;
};

const COL_COUNT = 8;

/** 건물 이벤트 목록. 행을 누르면 수정, 오른쪽 버튼으로 수정·삭제. */
export function LotteEventsTable({ loading, errorMessage, emptyMessage, rows, branchCodeOf, onEdit, onDelete }: Props) {
  return (
    <div className={shared.tableResponsive}>
      <table className={`${shared.table} ${s.listTable}`}>
        <thead className={shared.thead}>
          <tr>
            <th className={shared.th} style={{ width: 84 }}>
              상태
            </th>
            <th className={shared.th} style={{ width: 72 }}>
              지점
            </th>
            <th className={shared.th} style={{ width: 150 }}>
              건물
            </th>
            <th className={shared.th} style={{ width: 128 }}>
              종류
            </th>
            <th className={shared.th}>제목</th>
            <th className={shared.th} style={{ width: 190 }}>
              기간
            </th>
            <th className={shared.th} style={{ width: 150 }}>
              마지막 수정
            </th>
            <th className={`${shared.th} ${shared.thRight}`} style={{ width: 130 }}>
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`event-skeleton-${idx}`} className={shared.skeletonRow}>
                {Array.from({ length: COL_COUNT }).map((__, col) => (
                  <td key={col} className={shared.td}>
                    <span className={shared.skeletonLine} />
                  </td>
                ))}
              </tr>
            ))
          ) : errorMessage ? (
            <tr>
              <td colSpan={COL_COUNT} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                {errorMessage}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className={shared.tableStateCell}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const status = eventStatusOf(row);
              return (
                <tr key={row.id} className={`${shared.tr} ${s.clickableRow}`} onClick={() => onEdit(row)}>
                  <td className={`${shared.td} ${s.nowrap}`}>
                    <span className={LOTTE_EVENT_STATUS_BADGE[status]}>{LOTTE_EVENT_STATUS_LABEL[status]}</span>
                  </td>
                  <td className={`${shared.td} ${shared.tdMono} ${s.nowrap}`}>{branchCodeOf(row.kioskId)}</td>
                  <td className={`${shared.td} ${s.nowrap}`}>{row.building}</td>
                  <td className={`${shared.td} ${shared.tdMono} ${s.nowrap}`}>{LOTTE_EVENT_KIND_LABEL[row.kind] ?? row.kind}</td>
                  <td className={`${shared.td} ${s.titleCell}`}>
                    <span className={s.titleText} title={row.title}>
                      {row.title}
                    </span>
                    {row.place ? <span className={s.subText}>{row.place}</span> : null}
                  </td>
                  <td className={`${shared.td} ${s.nowrap}`}>
                    {row.startDate === row.endDate ? row.startDate : `${row.startDate} ~ ${row.endDate}`}
                    {row.timeText ? <span className={s.subText}>{row.timeText}</span> : null}
                  </td>
                  <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>
                    {formatDateTime(row.updatedAt)}
                    {row.updatedBy ? <span className={s.subText}>{row.updatedBy}</span> : null}
                  </td>
                  <td className={shared.td} onClick={(e) => e.stopPropagation()}>
                    <div className={shared.actionGroup} style={{ justifyContent: 'flex-end' }}>
                      <button type='button' className={s.actionBtn} onClick={() => onEdit(row)}>
                        수정
                      </button>
                      <button type='button' className={`${s.actionBtn} ${s.dangerBtn}`} onClick={() => onDelete(row)}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
