import React, { useMemo } from 'react';
import styles from './AdminHeader.module.css';
import logo from '@assets/images/logo.png';
import login from '@assets/images/login.png';

export default function AdminHeader() {
  const token = localStorage.getItem('accessToken');

  const username = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.sub || payload?.username || null;
    } catch (e) {
      console.log(e);
      return null;
    }
  }, [token]);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <img src={logo} alt='WIT KIOSK' className={styles.logo} />
      </div>

      <div className={styles.rightSection}>
        {username ? (
          <span className={styles.userName}>관리자 {username}님</span>
        ) : (
          <span className={styles.loginText}>로그인이 필요합니다.</span>
        )}
        <img src={login} alt='login' className={styles.loginIcon} />
      </div>
    </header>
  );
}
