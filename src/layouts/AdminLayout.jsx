import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from '@commons/AdminHeader';
import AdminNav from '@commons/AdminNav';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { pathname } = useLocation();

  // 관리자 로그인 페이지에서는 헤더/네비게이션 숨김
  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');

  return (
    <div className={styles.layoutContainer}>
      <AdminHeader />
      <div className={styles.bodyContainer}>
        {!isAdminLogin && <AdminNav />}
        <div className={styles.contentArea}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
