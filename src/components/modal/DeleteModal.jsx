import { useEffect } from 'react';
import styles from './Modal.module.css';

export default function DeleteModal({ open, target, loading, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteBody}>
          <div className={styles.warnIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3 className={styles.deleteTitle}>정말 삭제하시겠습니까?</h3>
          <p className={styles.deleteDesc}>
            <span className={styles.deleteTarget}>{target ?? '이 항목'}</span>을 삭제하면 복구할 수 없습니다.
          </p>
        </div>
        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose} disabled={loading}>취소</button>
          <button className={styles.btnDanger} onClick={onConfirm} disabled={loading}>
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
