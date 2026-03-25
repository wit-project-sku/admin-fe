import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from '@commons/AdminHeader';
import AdminNav from '@commons/AdminNav';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/admin/login';

  if (isLogin) return <Outlet />;

  return (
    <div className={styles.root}>
      <AdminHeader />
      <div className={styles.body}>
        <AdminNav />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
