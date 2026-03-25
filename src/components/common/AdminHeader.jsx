import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminHeader.module.css';

export default function AdminHeader() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const username = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.sub || payload?.username || null;
    } catch {
      return null;
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/admin/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>W</div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>Wit Global</span>
          <span className={styles.logoSub}>ADMIN HUB</span>
        </div>
      </div>

      <div className={styles.right}>
        {username ? (
          <>
            <div className={styles.account}>
              <div className={styles.avatar}>{username.slice(0, 2).toUpperCase()}</div>
              <span className={styles.accountName}>{username}</span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title="로그아웃">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              로그아웃
            </button>
          </>
        ) : (
          <span className={styles.noAccount}>로그인이 필요합니다</span>
        )}
      </div>
    </header>
  );
}
