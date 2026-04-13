import shared from '@commons/shared.module.css';
import Pagination from '@components/common/Pagination';
import s from '@pages/ReportsPage.module.css';
import { REPORT_MESSAGES } from './reportMessages';
import { ReportDateRangeFilterCard } from './ReportDateRangeFilterCard';

type DailyShootingReportPanelProps = {
  dateDraft: { start: string; end: string };
  setDateDraft: (next: { start: string; end: string }) => void;
  onRunQuery: () => void;
  onClearRange?: () => void;
  isLoading: boolean;
  rows: Record<string, string | number>[];
  kioskNames: string[];
  errorMessage: string;
  pageNum: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  totalElements: number;
};

export function DailyShootingReportPanel({
  dateDraft,
  setDateDraft,
  onRunQuery,
  onClearRange,
  isLoading,
  rows,
  kioskNames,
  errorMessage,
  pageNum,
  onPageChange,
  totalPages,
  totalElements,
}: DailyShootingReportPanelProps) {
  const colCount = Math.max(3, kioskNames.length + 2);

  return (
    <div>
      <ReportDateRangeFilterCard
        start={dateDraft.start}
        end={dateDraft.end}
        onStartChange={(v) => setDateDraft((d) => ({ ...d, start: v }))}
        onEndChange={(v) => setDateDraft((d) => ({ ...d, end: v }))}
        onSubmit={onRunQuery}
        onClear={onClearRange}
        loading={isLoading}
        submitDisabled={isLoading || !dateDraft.start || !dateDraft.end}
      />

      <div className={shared.card} style={{ marginTop: 14 }}>
        {isLoading ? (
          <div className={shared.tableResponsive}>
            <table className={shared.table} style={{ minWidth: 700 }}>
              <tbody>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`daily-skeleton-${idx}`} className={shared.skeletonRow}>
                    {Array.from({ length: colCount }).map((__, col) => (
                      <td
                        key={`daily-skeleton-${idx}-${col}`}
                        className={`${shared.td} ${col === 0 ? s.shootingTimeCol : ''}`}
                      >
                        <span className={shared.skeletonLine} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : errorMessage ? (
          <div className={s.emptyState}>
            <p style={{ color: 'var(--red-text)' }}>{errorMessage}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className={s.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p>{REPORT_MESSAGES.dailyEmptyHint}</p>
          </div>
        ) : (
          <div className={shared.tableResponsive}>
            <table className={shared.table} style={{ minWidth: 700 }}>
              <thead>
                <tr className={s.darkHead}>
                  <th className={`${s.darkTh} ${s.shootingTimeCol}`}>Date</th>
                  {kioskNames.map((name) => (
                    <th key={name} className={s.darkTh} style={{ textAlign: 'center' }}>
                      {name}
                    </th>
                  ))}
                  <th className={s.darkThAccent}>Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={String(row.date)}
                    className={shared.tr}
                    style={{ background: i % 2 === 1 ? '#fafbff' : 'white' }}
                  >
                    <td className={`${shared.td} ${shared.tdBold} ${s.shootingTimeCol}`}>{row.date}</td>
                    {kioskNames.map((name) => (
                      <td key={name} className={`${shared.td} ${shared.tdMuted}`} style={{ textAlign: 'center' }}>
                        {row[name] ?? 0}
                      </td>
                    ))}
                    <td
                      className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}
                      style={{ background: '#eff6ff', color: '#2563eb' }}
                    >
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !errorMessage && rows.length > 0 && totalElements > 0 ? (
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
    </div>
  );
}
