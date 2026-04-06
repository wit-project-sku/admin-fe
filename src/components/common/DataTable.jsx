import React, { useMemo } from 'react';
import styles from './DataTable.module.css';

/**
 * 공통 데이터 테이블 (제목, 툴바, 헤더, 행, 페이지네이션)
 *
 * @param {string}    title               - 테이블 제목 (예: "상품 목록")
 * @param {number}    total               - 총 데이터 수
 * @param {string[]}  columns             - 컬럼 헤더 레이블 배열
 * @param {string}    gridTemplateColumns - CSS grid-template-columns 값
 * @param {Array}     data                - 렌더링할 데이터 배열
 * @param {Function}  renderRow           - (item, idx) => ReactNode (각 행 내용)
 * @param {Function}  rowKey              - (item, idx) => string|number
 * @param {boolean}   loading
 * @param {any}       error
 * @param {string}    errorMessage
 * @param {string}    emptyMessage
 * @param {number}    page                - 현재 페이지 (1-based)
 * @param {number}    totalPages
 * @param {Function}  onPageChange        - (page: number) => void
 * @param {ReactNode} toolbarLeft         - 툴바 좌측 영역
 * @param {ReactNode} toolbarRight        - 툴바 우측 영역
 */
export default function DataTable({
  title,
  total,
  columns = [],
  gridTemplateColumns,
  data = [],
  renderRow,
  rowKey,
  loading,
  error,
  errorMessage = '조회에 실패했습니다.',
  emptyMessage = '검색 결과가 없습니다.',
  page,
  totalPages,
  onPageChange,
  toolbarLeft,
  toolbarRight,
}) {
  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const tp = Math.max(1, totalPages);
    const current = Math.min(Math.max(1, page), tp);

    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    let end = Math.min(tp, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    const arr = [];
    for (let p = start; p <= end; p += 1) arr.push(p);
    return arr;
  }, [page, totalPages]);

  const gridStyle = gridTemplateColumns ? { gridTemplateColumns } : undefined;

  const displayTotal = total ?? data.length;

  return (
    <>
      <div className={styles.section}>
        {/* 제목 행 */}
        <div className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          <span className={styles.totalCount}>총 {displayTotal.toLocaleString()}개</span>
        </div>

        {/* 툴바 */}
        {(toolbarLeft || toolbarRight) && (
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>{toolbarLeft}</div>
            <div className={styles.toolbarRight}>{toolbarRight}</div>
          </div>
        )}

        {/* 테이블 */}
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader} style={gridStyle}>
            {columns.map((col, i) => (
              <div key={i}>{col}</div>
            ))}
          </div>

          {loading && <div className={styles.noData}>불러오는 중...</div>}
          {!loading && error && <div className={styles.noData}>{errorMessage}</div>}
          {!loading && !error && data.length === 0 && <div className={styles.noData}>{emptyMessage}</div>}

          {!loading &&
            !error &&
            data.map((item, idx) => (
              <div
                className={styles.tableRow}
                key={rowKey ? rowKey(item, idx) : idx}
                style={gridStyle}
              >
                {renderRow(item, idx)}
              </div>
            ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className={styles.pagination}>
        <button
          className={styles.pageButton}
          type='button'
          aria-label='이전 페이지'
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          &lt;
        </button>
        {pageNumbers.map((p) => (
          <button
            key={p}
            className={p === page ? styles.pageButtonActive : styles.pageButton}
            type='button'
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button
          className={styles.pageButton}
          type='button'
          aria-label='다음 페이지'
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          &gt;
        </button>
      </div>
    </>
  );
}
