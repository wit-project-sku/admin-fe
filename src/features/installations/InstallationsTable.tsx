import shared from '@commons/shared.module.css';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import type { InstallationSummaryDto } from '../../hooks/installation-api/installationTypes';
import s from './Installations.module.css';

type InstallationsTableProps = {
  loading: boolean;
  errorMessage: string;
  emptyMessage: string;
  rows: InstallationSummaryDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  onView: (row: InstallationSummaryDto) => void;
  onEdit: (row: InstallationSummaryDto) => void;
  onDelete: (row: InstallationSummaryDto) => void;
};

const COL_COUNT = 8;

/** 설치 정보 목록(최근 설치 순). 행 전체가 상세 보기, 오른쪽 버튼이 보기·수정·삭제. */
export function InstallationsTable({
  loading,
  errorMessage,
  emptyMessage,
  rows,
  page,
  pageSize,
  totalCount,
  onView,
  onEdit,
  onDelete,
}: InstallationsTableProps) {
  return (
    <div className={shared.tableResponsive}>
      <table className={`${shared.table} ${s.listTable}`}>
        <thead className={shared.thead}>
          <tr>
            <th className={`${shared.th} ${shared.thCenter}`} style={{ width: 64 }}>
              No
            </th>
            <th className={shared.th} style={{ width: 72 }}>
              사진
            </th>
            <th className={shared.th}>키오스크</th>
            <th className={shared.th}>설치일</th>
            <th className={shared.th}>클라이언트</th>
            <th className={shared.th}>주소</th>
            <th className={shared.th}>담당자</th>
            <th className={`${shared.th} ${shared.thRight}`} style={{ width: 132 }}>
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`installation-skeleton-${idx}`} className={shared.skeletonRow}>
                {Array.from({ length: COL_COUNT }).map((__, col) => (
                  <td key={`installation-skeleton-${idx}-${col}`} className={shared.td}>
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
            rows.map((row, i) => (
              <tr key={row.id} className={`${shared.tr} ${s.clickableRow}`} onClick={() => onView(row)}>
                <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                  {totalCount - ((page - 1) * pageSize + i)}
                </td>
                <td className={shared.td}>
                  {row.thumbnailUrl ? (
                    <img src={row.thumbnailUrl} alt='' className={s.thumb} />
                  ) : (
                    <span className={s.thumbEmpty}>없음</span>
                  )}
                </td>
                <td className={`${shared.td} ${s.nowrap}`}>{row.kioskName}</td>
                <td className={`${shared.td} ${s.nowrap}`}>{row.installedAt}</td>
                <td className={`${shared.td} ${shared.tdBold}`}>{row.clientName}</td>
                <td className={`${shared.td} ${s.addressCell}`} title={row.address}>
                  {row.address}
                  {row.siteName ? <div className={shared.tdSub}>{row.siteName}</div> : null}
                </td>
                <td className={`${shared.td} ${s.nowrap}`}>
                  {row.managerName ?? <span className={s.dash}>—</span>}
                </td>
                <td className={shared.td} onClick={(e) => e.stopPropagation()}>
                  <div className={shared.actionGroup} style={{ justifyContent: 'flex-end' }}>
                    <button type='button' className={shared.btnEdit} onClick={() => onView(row)} title='보기'>
                      <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#3b82f6' strokeWidth='2'>
                        <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                        <circle cx='12' cy='12' r='3' />
                      </svg>
                    </button>
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
