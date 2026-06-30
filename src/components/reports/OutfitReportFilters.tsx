import shared from '@commons/shared.module.css';
import s from '../../pages/ReportsPage.module.css';

export type KioskOption = { id: string | number; name: string };

type OutfitReportFiltersProps = {
  kiosks: KioskOption[];
  kioskId: string;
  onKioskChange: (id: string) => void;
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onSearch: () => void;
  onClearFilters?: () => void;
  loading?: boolean;
};

export default function OutfitReportFilters({
  kiosks,
  kioskId,
  onKioskChange,
  start,
  end,
  onStartChange,
  onEndChange,
  onSearch,
  onClearFilters,
  loading,
}: OutfitReportFiltersProps) {
  return (
    <div className={`${shared.card} ${s.filterCard}`}>
      <div className={s.outfitFilterRow}>
        <div className={s.outfitFilterField}>
          <label className={s.outfitFilterLabel}>지점 (키오스크)</label>
          <select className={s.outfitSelect} value={kioskId} onChange={(e) => onKioskChange(e.target.value)}>
            <option value="">전체 지점</option>
            {kiosks.map((k) => (
              <option key={String(k.id)} value={String(k.id)}>
                {k.name}
              </option>
            ))}
          </select>
        </div>
        <div className={s.outfitFilterField}>
          <label className={s.outfitFilterLabel}>기간</label>
          <div className={s.outfitDateRow}>
            <div className={shared.dateInput}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input type="date" value={start} onChange={(e) => onStartChange(e.target.value)} />
            </div>
            <span className={shared.dateSep}>~</span>
            <div className={shared.dateInput}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input type="date" value={end} onChange={(e) => onEndChange(e.target.value)} />
            </div>
          </div>
        </div>
        <div className={shared.toolbarFilterActions} style={{ alignSelf: 'flex-end' }}>
          {onClearFilters ? (
            <button
              type="button"
              className={shared.btnFilterReset}
              onClick={onClearFilters}
              disabled={!!loading}
              aria-label="필터 초기화"
              title="필터 초기화"
            />
          ) : null}
          <button type="button" className={shared.btnPrimary} onClick={onSearch} disabled={!!loading}>
            {loading ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: 'reportsSpin 1s linear infinite' }}
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
            조회
          </button>
        </div>
      </div>
    </div>
  );
}
