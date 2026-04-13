import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import styles from './AdminNav.module.css';
import { useNavigate } from 'react-router-dom';
import { authStoreApi } from '../../stores/authStore';

type NavItemDef = {
  label: string;
  path: string;
  icon: ReactNode;
};

const MAIN_MENU: NavItemDef[] = [
  {
    label: '통계 대시보드',
    path: '/admin/dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: '상세 분석 리포트',
    path: '/admin/reports',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const MANAGE_MENU: NavItemDef[] = [
  {
    label: '상품 관리',
    path: '/admin/products',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: '결제 관리',
    path: '/admin/payments',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: '배송 관리',
    path: '/admin/deliveries',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    label: '환불 관리',
    path: '/admin/refunds',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
      </svg>
    ),
  },
  {
    label: '의상 관리',
    path: '/admin/outfits',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
  },
];

function NavItem({ item, collapsed }: { item: NavItemDef; collapsed: boolean }) {
  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.icon}>{item.icon}</span>
      <span className={styles.label}>{item.label}</span>
    </NavLink>
  );
}

type AdminNavProps = {
  collapsed?: boolean;
};

export default function AdminNav({ collapsed = false }: AdminNavProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    authStoreApi.clearAuth();
    navigate('/admin/login');
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <nav className={styles.nav}>
        <div>
          <div className={styles.logo}>
            <div className={styles.logoMark}>W</div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>Wit Global</span>
              <span className={styles.logoSub}>ADMIN HUB</span>
            </div>
          </div>
        </div>
        <div className={styles.group}>
          <span className={styles.groupLabel}>위드마켓</span>
          {MAIN_MENU.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </div>
        <div className={styles.group}>
          <span className={styles.groupLabel}>MANAGEMENT</span>
          {MANAGE_MENU.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </div>
        <div className={styles.navBottom}>
          <button type="button" className={styles.logoutBtn} title="로그아웃" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className={styles.label}>로그아웃</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
