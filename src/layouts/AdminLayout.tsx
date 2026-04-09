import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from '@commons/AdminHeader';
import AdminNav from '@commons/AdminNav';
import { useUiStore } from '../stores/uiStore';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/admin/login';
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  if (isLogin) return <Outlet />;

  return (
    <div className={styles.root}>
      <div className={`${styles.body} ${collapsed ? styles.bodyCollapsed : ''}`}>
        <AdminNav collapsed={collapsed} />
        <div className={`${styles.mainWrapper} ${collapsed ? styles.mainWrapperCollapsed : ''}`}>
          <AdminHeader collapsed={collapsed} onToggleSidebar={toggleSidebar} />
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
