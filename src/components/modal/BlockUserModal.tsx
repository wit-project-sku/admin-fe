import { useEffect } from 'react';
import styles from './DeleteModal.module.css';
import type { UserRow } from '../../features/users/userListMappers';

type BlockUserModalProps = {
  open: boolean;
  user: UserRow | null;
  loading?: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
};

export default function BlockUserModal({ open, user, loading, onConfirm, onClose }: BlockUserModalProps) {
  const isBlocked = user?.isActive === false;

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteBody}>
          <div
            className={styles.warnIcon}
            style={{ background: isBlocked ? 'var(--green-bg)' : 'var(--amber-bg)' }}
          >
            {isBlocked ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            )}
          </div>
          <h3 className={styles.deleteTitle}>
            {isBlocked ? '사용자를 차단 해제하시겠습니까?' : '사용자를 차단하시겠습니까?'}
          </h3>
          <p className={styles.deleteDesc}>
            <span className={styles.deleteTarget}>&quot;{user?.name ?? user?.username ?? '이 사용자'}&quot;</span>
            <br />
            {isBlocked
              ? '차단이 해제되면 해당 사용자가 다시 로그인할 수 있습니다.'
              : '차단된 사용자는 로그인이 제한됩니다.'}
          </p>
        </div>
        <div className={styles.footer} style={{ backgroundColor: '#fff', borderTop: 'none', paddingBottom: '32px' }}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isBlocked ? '#15803d' : '#d97706',
              color: '#fff',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? '처리 중...' : isBlocked ? '차단 해제' : '차단하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
