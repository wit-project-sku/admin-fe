import React from 'react';
import styles from './Pagination.module.css';

export default function Pagination({ currentPage, totalPages, onPageChange, totalCount, unit = '건' }) {
  // 간단한 페이지 번호 배열 생성 로직 (필요시 더 복잡하게 구현 가능)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        총 <strong>{totalCount.toLocaleString()}</strong>
        {unit}
      </div>
      <div className={styles.buttonGroup}>
        <button className={styles.pageBtn} onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <span className={styles.pageMoveBtn}>‹</span>
        </button>
        {pages.map((n) => (
          <button
            key={n}
            className={`${styles.pageBtn} ${currentPage === n ? styles.active : ''}`}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}
        <button
          className={styles.pageBtn}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className={styles.pageMoveBtn}>›</span>
        </button>
      </div>
    </div>
  );
}
