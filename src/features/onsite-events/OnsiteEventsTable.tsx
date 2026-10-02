import shared from '@commons/shared.module.css';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import type { OnsiteEventDto } from '../../hooks/onsite-event-api/onsiteEventTypes';
import { ONSITE_EVENT_MESSAGES } from './onsiteEventConfig';
import { formatCreatedDate, formatPeriodShort } from './onsiteEventFormat';
import s from './OnsiteEvents.module.css';

type OnsiteEventsTableProps = {
  loading: boolean;
  errorMessage: string;
  rows: OnsiteEventDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  onEdit: (row: OnsiteEventDto) => void;
  onDelete: (row: OnsiteEventDto) => void;
};

const COL_COUNT = 8;

/** 행사 등록 목록. 상태 라벨·촬영 기기(키오스크 번호)는 표시하지 않는다(기획 확정). */
export function OnsiteEventsTable({
  loading,
  errorMessage,
  rows,
  page,
  pageSize,
  totalCount,
  onEdit,
  onDelete,
}: OnsiteEventsTableProps) {
  return (
    <div className={shared.tableResponsive}>
      <table className={`${shared.table} ${s.listTable}`}>
        <thead className={shared.thead}>
          <tr>
            <th className={`${shared.th} ${shared.thCenter}`} style={{ width: 64 }}>
              No
            </th>
            <th className={shared.th}>행사명</th>
            <th className={shared.th}>행사 지점</th>
            <th className={shared.th}>사용 콘텐츠</th>
            <th className={shared.th}>기간</th>
            <th className={shared.th}>메모</th>
            <th className={shared.th}>등록일</th>
            <th className={`${shared.th} ${shared.thRight}`} style={{ width: 100 }}>
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`onsite-skeleton-${idx}`} className={shared.skeletonRow}>
                {Array.from({ length: COL_COUNT }).map((__, col) => (
                  <td key={`onsite-skeleton-${idx}-${col}`} className={shared.td}>
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
                {ONSITE_EVENT_MESSAGES.empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.id} className={shared.tr}>
                {/* 최신(맨 위)이 가장 큰 번호 */}
                <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                  {totalCount - ((page - 1) * pageSize + i)}
                </td>
                <td className={`${shared.td} ${shared.tdBold}`}>{row.name}</td>
                <td className={shared.td}>{row.venue}</td>
                <td className={shared.td}>
                  <span className={s.contentPill}>{row.contentLabel}</span>
                </td>
                <td className={`${shared.td} ${s.nowrap}`}>{formatPeriodShort(row.startDate, row.endDate)}</td>
                <td className={`${shared.td} ${s.memoCell}`} title={row.memo ?? undefined}>
                  {row.memo?.trim() ? row.memo : <span className={s.dash}>—</span>}
                </td>
                <td className={`${shared.td} ${shared.tdMuted} ${s.nowrap}`}>{formatCreatedDate(row.createdAt)}</td>
                <td className={shared.td}>
                  <div className={shared.actionGroup} style={{ justifyContent: 'flex-end' }}>
                    <EditBtn onClick={() => onEdit(row)} />
                    <DeleteBtn onClick={() => onDelete(row)} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
