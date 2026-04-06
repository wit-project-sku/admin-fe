import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from '@commons/AdminHeader';
import AdminNav from '@commons/AdminNav';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');

  return (
    <div className={styles.layoutContainer}>
      {!isAdminLogin && <AdminNav />}
      <div className={styles.rightSection}>
        <AdminHeader />
        <div className={styles.contentArea}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
