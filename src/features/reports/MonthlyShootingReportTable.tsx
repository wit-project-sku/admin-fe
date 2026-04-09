import shared from '@commons/shared.module.css';
import Pagination from '@components/common/Pagination';
import s from '@pages/ReportsPage.module.css';
import { REPORT_MESSAGES } from './reportMessages';

type MonthlyShootingReportTableProps = {
  rows: Record<string, string | number>[];
  kioskNames: string[];
  errorMessage: string;
  pageNum: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  totalElements: number;
};

export function MonthlyShootingReportTable({
  rows,
  kioskNames,
  errorMessage,
  pageNum,
  onPageChange,
  totalPages,
  totalElements,
}: MonthlyShootingReportTableProps) {
  const colCount = kioskNames.length + 2;

  return (
    <div className={shared.card}>
      <div className={shared.cardHead}>
        <span className={shared.cardTitle}>월별 상세 리포트</span>
      </div>
      <div className={shared.tableResponsive}>
        <table className={shared.table} style={{ minWidth: 700 }}>
          <thead>
            <tr className={s.darkHead}>
              <th className={s.darkTh}>Month</th>
              {kioskNames.map((name) => (
                <th key={name} className={s.darkTh} style={{ textAlign: 'center' }}>
                  {name}
                </th>
              ))}
              <th className={s.darkThAccent}>Total</th>
            </tr>
          </thead>
          <tbody>
            {errorMessage ? (
              <tr>
                <td colSpan={colCount} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                  {errorMessage}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className={shared.tableStateCell}>
                  {REPORT_MESSAGES.tableEmpty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={String(row.month)}
                  className={shared.tr}
                  style={{ background: i % 2 === 1 ? '#fafbff' : 'white' }}
                >
                  <td className={`${shared.td} ${shared.tdBold}`}>{row.month}</td>
                  {kioskNames.map((name) => (
                    <td key={name} className={`${shared.td} ${shared.tdMuted}`} style={{ textAlign: 'center' }}>
                      {(row[name] ?? 0).toLocaleString()}
                    </td>
                  ))}
                  <td
                    className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}
                    style={{ background: '#eff6ff', color: '#2563eb' }}
                  >
                    {Number(row.total).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!errorMessage && rows.length > 0 && totalElements > 0 ? (
        <div style={{ marginTop: 16 }}>
          <Pagination
            currentPage={pageNum}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalCount={totalElements}
          />
        </div>
      ) : null}
    </div>
  );
}
