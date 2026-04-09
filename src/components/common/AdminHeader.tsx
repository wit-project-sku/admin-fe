import styles from './AdminHeader.module.css';
import { useAuthStore } from '../../stores/authStore';

type AdminHeaderProps = {
  collapsed?: boolean;
  onToggleSidebar?: () => void;
};

export default function AdminHeader({ collapsed = false, onToggleSidebar }: AdminHeaderProps) {
  const username = useAuthStore((state) => state.username);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={onToggleSidebar}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="9" y1="4" x2="9" y2="20" />
            {collapsed ? <polyline points="14 9 17 12 14 15" /> : <polyline points="16 9 13 12 16 15" />}
          </svg>
        </button>
      </div>

      <div className={styles.right}>
        {username ? (
          <>
            <div className={styles.account}>
              <div className={styles.avatar}>{username.slice(0, 2).toUpperCase()}</div>
              <div className={styles.infoWrapper}>
                <span className={styles.accountName}>{username}</span>
                <span className={styles.accountRole}>관리자</span>
              </div>
            </div>
          </>
        ) : (
          <span className={styles.noAccount}>로그인이 필요합니다</span>
        )}
      </div>
    </header>
  );
}
