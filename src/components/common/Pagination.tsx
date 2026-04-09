import styles from './Pagination.module.css';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  unit?: string;
};

export default function Pagination({ currentPage, totalPages, onPageChange, totalCount, unit = '건' }: PaginationProps) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), safeTotalPages);
  const safeTotalCount = Number.isFinite(Number(totalCount)) ? Number(totalCount) : 0;

  const makePages = (): (number | 'ellipsis')[] => {
    if (safeTotalPages <= 7) return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    if (safeCurrentPage <= 4) return [1, 2, 3, 4, 5, 'ellipsis', safeTotalPages];
    if (safeCurrentPage >= safeTotalPages - 3) {
      return [1, 'ellipsis', safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages];
    }
    return [1, 'ellipsis', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, 'ellipsis', safeTotalPages];
  };

  const pages = makePages();
  const goToPage = (next: number) => onPageChange(Math.min(Math.max(1, next), safeTotalPages));

  return (
    <div className={styles.container}>
      <div className={styles.leftInfo}>
        총 <strong>{safeTotalCount.toLocaleString()}</strong>
        {unit}
      </div>
      <div className={styles.centerControls}>
        <button type="button" className={styles.pageBtn} onClick={() => goToPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1}>
          <span className={styles.pageMoveBtn}>‹</span>
        </button>
        {pages.map((n, idx) =>
          n === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
              ...
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`${styles.pageBtn} ${safeCurrentPage === n ? styles.active : ''}`}
              onClick={() => goToPage(n)}
            >
              {n}
            </button>
          ),
        )}
        <button type="button" className={styles.pageBtn} onClick={() => goToPage(safeCurrentPage + 1)} disabled={safeCurrentPage === safeTotalPages}>
          <span className={styles.pageMoveBtn}>›</span>
        </button>
      </div>
    </div>
  );
}
