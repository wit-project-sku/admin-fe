import { useEffect } from 'react';
import styles from './DeleteModal.module.css';

type DeleteModalProps = {
  open: boolean;
  /** Modal heading, e.g. "상품을 삭제하시겠습니까?" */
  title?: string;
  target?: string | null;
  loading?: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
};

export default function DeleteModal({
  open,
  title = '이 항목을 삭제하시겠습니까?',
  target,
  loading,
  onConfirm,
  onClose,
}: DeleteModalProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteBody}>
          <div className={styles.warnIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h3 className={styles.deleteTitle}>{title}</h3>
          <p className={styles.deleteDesc}>
            <span className={styles.deleteTarget}>&quot;{target ?? '이 항목'}&quot;</span>
            <br />
            삭제 이후에는 복구할 수 없습니다.
          </p>
        </div>

        <div className={styles.footer} style={{ backgroundColor: '#fff', borderTop: 'none', paddingBottom: '32px' }}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
            취소
          </button>
          <button type="button" className={styles.btnDanger} onClick={onConfirm} disabled={loading}>
            {loading ? '삭제 중...' : '삭제하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
