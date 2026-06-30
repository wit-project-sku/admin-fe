import shared from '@commons/shared.module.css';
import s from '@pages/ReportsPage.module.css';

function CalendarGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

type ReportDateRangeFilterCardProps = {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
  submitDisabled: boolean;
  loading: boolean;
  submitLabel?: string;
};

export function ReportDateRangeFilterCard({
  start,
  end,
  onStartChange,
  onEndChange,
  onSubmit,
  onClear,
  submitDisabled,
  loading,
  submitLabel = '데이터 조회',
}: ReportDateRangeFilterCardProps) {
  return (
    <div className={`${shared.card} ${s.filterCard}`}>
      <div className={shared.dateFilter}>
        <div className={shared.dateInput}>
          <CalendarGlyph />
          <input type="date" value={start} onChange={(e) => onStartChange(e.target.value)} />
        </div>
        <span className={shared.dateSep}>~</span>
        <div className={shared.dateInput}>
          <CalendarGlyph />
          <input type="date" value={end} onChange={(e) => onEndChange(e.target.value)} />
        </div>
        {onClear ? (
          <button
            type="button"
            className={shared.btnFilterReset}
            onClick={onClear}
            disabled={loading}
            aria-label="필터 초기화"
            title="필터 초기화"
          />
        ) : null}
        <button type="button" className={shared.btnPrimary} onClick={onSubmit} disabled={submitDisabled}>
          {loading ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
