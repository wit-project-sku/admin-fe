import shared from '@commons/shared.module.css';
import s from '@pages/OutfitsPage.module.css';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import type { OutfitRow } from './outfitListMappers';
import { OUTFIT_TABLE_MESSAGES } from './outfitListConfig';

type OutfitsTableProps = {
  loading: boolean;
  errorMessage: string;
  rows: OutfitRow[];
  page: number;
  pageSize: number;
  kioskNameById: Record<string, string>;
  onEdit: (row: OutfitRow) => void;
  onDelete: (row: OutfitRow) => void;
};

const COL_COUNT = 7;

function formatKioskCell(ids: unknown, nameById: Record<string, string>): string {
  if (!Array.isArray(ids) || ids.length === 0) return '—';
  return (
    ids
      .map((id) => nameById[String(id)])
      .filter(Boolean)
      .join(', ') || '—'
  );
}

function thumbSrc(row: OutfitRow): string | undefined {
  return row.imageUrl || row.images?.[0]?.imageUrl;
}

function ScheduleCell({ row }: { row: OutfitRow }) {
  const { operationStartYmd: start, operationEndYmd: end } = row;
  if (!start && !end) {
    return <span className={s.scheduleEmpty}>—</span>;
  }
  return (
    <div className={s.outfitScheduleStack}>
      <span className={s.scheduleStart}>
        {start || '—'} <span className={s.scheduleTilde}>~</span>
      </span>
      <span className={s.scheduleEnd}>{end ? end : '무기한'}</span>
    </div>
  );
}

export function OutfitsTable({
  loading,
  errorMessage,
  rows,
  page,
  pageSize,
  kioskNameById,
  onEdit,
  onDelete,
}: OutfitsTableProps) {
  return (
    <div className={s.tableResponsive}>
      <table className={shared.table}>
        <thead className={shared.thead}>
          <tr>
            <th className={`${shared.th} ${shared.thCenter}`}>No</th>
            <th className={`${shared.th} ${shared.thCenter}`}>미리보기</th>
            <th className={`${shared.th} ${shared.thLeft}`}>정보</th>
            <th className={`${shared.th} ${shared.thCenter}`}>운영 일정</th>
            <th className={`${shared.th} ${shared.thCenter}`}>설치 키오스크</th>
            <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
            <th className={`${shared.th} ${shared.thRight}`}>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <tr key={`outfit-skeleton-${idx}`} className={shared.skeletonRow}>
                {Array.from({ length: COL_COUNT }).map((__, col) => (
                  <td key={`outfit-skeleton-${idx}-${col}`} className={shared.td}>
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
                {OUTFIT_TABLE_MESSAGES.empty}
              </td>
            </tr>
          ) : (
            rows.map((o, i) => {
              const src = thumbSrc(o);
              return (
                <tr key={String(o.id)} className={shared.tr}>
                  <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                    #{String((page - 1) * pageSize + i + 1).padStart(3, '0')}
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <div className={s.previewWrapper}>
                      {src ? (
                        <img src={src} alt="" className={s.tableThumb} />
                      ) : (
                        <div className={s.tableThumbPlaceholder} aria-hidden />
                      )}
                    </div>
                  </td>
                  <td className={`${shared.td} ${shared.tdLeft}`}>
                    <div className={s.outfitInfoStack}>
                      <span className={s.outfitInfoName}>{o.name || '—'}</span>
                      <span className={s.outfitInfoCode}>{o.outfitCode}</span>
                    </div>
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <ScheduleCell row={o} />
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter} ${shared.tdMuted}`}>
                    {formatKioskCell(o.kioskIds, kioskNameById)}
                  </td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <span
                      className={`${shared.badge} ${o.status === 'ACTIVE' ? shared.badgeGreen : shared.badgeGray}`}
                    >
                      {o.status === 'ACTIVE' ? '활성화' : '비활성화'}
                    </span>
                  </td>
                  <td className={shared.td}>
                    <div className={shared.actionGroup} style={{ justifyContent: 'flex-end' }}>
                      <EditBtn onClick={() => onEdit(o)} />
                      <DeleteBtn onClick={() => onDelete(o)} />
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
