import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminHeader.module.css';
import gearIcon from '@assets/images/gear.png';
import logoutIcon from '@assets/images/logout.png';

export default function AdminHeader() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const username = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.sub || payload?.username || null;
    } catch {
      return null;
    }
  }, [token]);

  const pad = (n) => String(n).padStart(2, '0');
  const formattedTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <span className={styles.welcomeText}>
          {username ? <span className={styles.username}>{username}</span> : ''}
          <span className={styles.welcomeSuffix}> 님 안녕하세요.</span>
        </span>
        <span className={styles.timeBadge}>{formattedTime}</span>
      </div>
      <div className={styles.rightSection}>
        <button className={styles.iconButton} title='설정'>
          <img src={gearIcon} alt='설정' className={styles.icon} />
        </button>
        <button className={styles.iconButton} title='로그아웃' onClick={handleLogout}>
          <img src={logoutIcon} alt='로그아웃' className={styles.icon} />
        </button>
      </div>
    </header>
  );
}
