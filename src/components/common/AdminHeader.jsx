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
