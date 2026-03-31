import { useEffect } from 'react';
import styles from './DeleteModal.module.css';

export default function DeleteModal({ open, target, loading, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* 폭을 좁게 설정하여 집중도를 높임 */}
      <div className={styles.modal} style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteBody}>
          {/* 이미지 1번의 삼각형 경고 아이콘 스타일 반영 */}
          <div className={styles.warnIcon}>
            <svg
              width='32'
              height='32'
              viewBox='0 0 24 24'
              fill='none'
              stroke='#f59e0b'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
              <line x1='12' y1='9' x2='12' y2='13' />
              <line x1='12' y1='17' x2='12.01' y2='17' />
            </svg>
          </div>

          <h3 className={styles.deleteTitle}>상품을 삭제하시겠습니까?</h3>
          <p className={styles.deleteDesc}>
            <span className={styles.deleteTarget}>"{target ?? '이 항목'}"</span>
            <br />
            삭제 이후에는 복구할 수 없습니다.
          </p>
        </div>

        <div className={styles.footer} style={{ backgroundColor: '#fff', borderTop: 'none', paddingBottom: '32px' }}>
          <button className={styles.btnSecondary} onClick={onClose} disabled={loading}>
            취소
          </button>
          <button className={styles.btnDanger} onClick={onConfirm} disabled={loading}>
            {loading ? '삭제 중...' : '삭제하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
