import { NavLink, useNavigate } from 'react-router-dom';
import { useMemo, type ReactNode } from 'react';
import styles from './AdminNav.module.css';
import { authStoreApi } from '../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { useGetMe, ME_QUERY_KEY, ROLE_USER } from '../../hooks/auth-api/useGetMe';

type NavItemDef = {
  label: string;
  path: string;
  icon: ReactNode;
  /** Opens in a new tab (e.g. external storage); when set, `path` is only used as a React key. */
  externalHref?: string;
};

type NavGroupDef = {
  label: string;
  items: NavItemDef[];
};

const AR_OUTFIT_PHOTOS_DRIVE_URL =
  'https://drive.google.com/drive/folders/1Bfj3CrYzCIXaujhm4UcleprSKKWftWSo';

const GOOGLE_DRIVE_HOME_URL = 'https://drive.google.com/drive/home';

const GOOGLE_SHEETS_ACCOUNT_URL =
  'https://docs.google.com/spreadsheets/d/1UX8ETM2u2892yMIS8PxVp7Tnv4vNRM7re5bsrukbd7g/edit?gid=961778831#gid=961778831';

const AR_OUTFIT_GROUP: NavGroupDef = {
  label: 'AR 착장 오버뷰',
  items: [
    {
      label: '착장 통계 분석',
      path: '/admin/dashboard',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='3' y='3' width='7' height='7' />
          <rect x='14' y='3' width='7' height='7' />
          <rect x='14' y='14' width='7' height='7' />
          <rect x='3' y='14' width='7' height='7' />
        </svg>
      ),
    },
    {
      label: '의상 등록 관리',
      path: '/admin/outfits',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z' />
        </svg>
      ),
    },
    {
      label: '키오스크별 카테고리',
      path: '/admin/outfit-categories',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='3' y='4' width='18' height='4' rx='1' />
          <rect x='3' y='12' width='11' height='4' rx='1' />
          <line x1='17' y1='14' x2='21' y2='14' />
          <line x1='3' y1='20' x2='14' y2='20' />
        </svg>
      ),
    },
    {
      label: '상세 분석 리포트',
      path: '/admin/reports',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <line x1='18' y1='20' x2='18' y2='10' />
          <line x1='12' y1='20' x2='12' y2='4' />
          <line x1='6' y1='20' x2='6' y2='14' />
        </svg>
      ),
    },
    {
      label: '통계 리포트',
      path: '/admin/stat-reports',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
          <polyline points='14 2 14 8 20 8' />
          <line x1='8' y1='13' x2='16' y2='13' />
          <line x1='8' y1='17' x2='13' y2='17' />
        </svg>
      ),
    },
    {
      label: 'AR착장 사진데이터',
      path: '__nav_external_ar_outfit_photos__',
      externalHref: AR_OUTFIT_PHOTOS_DRIVE_URL,
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' />
        </svg>
      ),
    },
    {
      label: '구글 드라이브',
      path: '__nav_external_google_drive_home__',
      externalHref: GOOGLE_DRIVE_HOME_URL,
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z' />
        </svg>
      ),
    },
    {
      label: '구글 엑셀(계정)',
      path: '__nav_external_google_sheets_account__',
      externalHref: GOOGLE_SHEETS_ACCOUNT_URL,
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='3' y='3' width='18' height='18' rx='2' />
          <line x1='3' y1='9' x2='21' y2='9' />
          <line x1='3' y1='15' x2='21' y2='15' />
          <line x1='9' y1='3' x2='9' y2='21' />
          <line x1='15' y1='3' x2='15' y2='21' />
        </svg>
      ),
    },
  ],
};

const WITH_USAGE_GROUP: NavGroupDef = {
  label: 'WITH 사용 오버뷰',
  items: [
    {
      label: '아이콘 사용 분석',
      path: '/admin/kiosk-analytics',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M3 3v18h18' />
          <path d='M7 16l4-4 4 4 6-8' />
        </svg>
      ),
    },
    // 보류(2026-08-12): '아이콘 등록 관리' 메뉴 숨김. 아이콘 위치 변경 기능을 당분간 막아 둔다
    // (제주 3지점 버튼을 V89 로 적재한 뒤, 배치가 확정될 때까지 드래그로 흐트러지지 않게).
    // 페이지/라우트/백엔드는 그대로 유지 — 재활성화하려면 아래 항목 주석 해제.
    // {
    //   label: '아이콘 등록 관리',
    //   path: '/admin/kiosk-buttons',
    //   icon: (
    //     <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    //       <rect x='3' y='3' width='7' height='7' rx='1' />
    //       <rect x='14' y='3' width='7' height='7' rx='1' />
    //       <rect x='14' y='14' width='7' height='7' rx='1' />
    //       <rect x='3' y='14' width='7' height='7' rx='1' />
    //     </svg>
    //   ),
    // },
    // 보류(2026-07-10): '언어 텍스트 관리'(엑셀형 자막 그리드) 메뉴 숨김. 페이지/라우트/백엔드는 유지 —
    // 재활성화하려면 아래 항목 주석 해제.
    // {
    //   label: '언어 텍스트 관리',
    //   path: '/admin/kiosk-subtitles',
    //   icon: (
    //     <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
    //       <rect x='3' y='3' width='18' height='18' rx='1' />
    //       <path d='M3 9h18M3 15h18M9 3v18M15 3v18' />
    //     </svg>
    //   ),
    // },
  ],
};

const KIOSK_CONTENT_GROUP: NavGroupDef = {
  label: '키오스크 컨텐츠 관리',
  items: [
    {
      label: '상점 등록 관리',
      path: '/admin/shops',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M3 9l1.5-5h15L21 9' />
          <path d='M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9' />
          <path d='M3 9h18' />
          <path d='M9 20v-6h6v6' />
        </svg>
      ),
    },
    {
      label: '배너 관리',
      path: '/admin/banners',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='3' y='4' width='18' height='7' rx='1' />
          <rect x='3' y='15' width='18' height='5' rx='1' />
          <path d='M7 7.5h4' />
        </svg>
      ),
    },
    {
      label: '배경 사진 관리',
      path: '/admin/backgrounds',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='3' y='3' width='18' height='18' rx='2' />
          <circle cx='8.5' cy='8.5' r='1.5' />
          <path d='M21 15l-5-5L5 21' />
        </svg>
      ),
    },
  ],
};

const DONATION_GROUP: NavGroupDef = {
  label: '기부 관리',
  items: [
    {
      label: '기부 대시보드',
      path: '/admin/donations/dashboard',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='3' y='3' width='7' height='7' />
          <rect x='14' y='3' width='7' height='7' />
          <rect x='14' y='14' width='7' height='7' />
          <rect x='3' y='14' width='7' height='7' />
        </svg>
      ),
    },
    {
      label: 'NGO 기부',
      path: '/admin/donations/ngo',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z' />
        </svg>
      ),
    },
    {
      label: '학교 기부',
      path: '/admin/donations/school',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M22 10v6M2 10l10-5 10 5-10 5z' />
          <path d='M6 12v5c3 3 9 3 12 0v-5' />
        </svg>
      ),
    },
  ],
};

const WITH_MARKET_DASHBOARD_ITEM: NavItemDef = {
  label: '위드마켓 대시보드',
  path: '/admin/dashboard',
  icon: (
    <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <rect x='3' y='3' width='7' height='7' />
      <rect x='14' y='3' width='7' height='7' />
      <rect x='14' y='14' width='7' height='7' />
      <rect x='3' y='14' width='7' height='7' />
    </svg>
  ),
};

const WITH_MARKET_GROUP: NavGroupDef = {
  label: '위드마켓 오버뷰',
  items: [
    {
      label: '상품 결제 관리',
      path: '/admin/payments',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='1' y='4' width='22' height='16' rx='2' />
          <line x1='1' y1='10' x2='23' y2='10' />
        </svg>
      ),
    },
    {
      label: '상품 배송 관리',
      path: '/admin/deliveries',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='1' y='3' width='15' height='13' />
          <polygon points='16 8 20 8 23 11 23 16 16 16 16 8' />
          <circle cx='5.5' cy='18.5' r='2.5' />
          <circle cx='18.5' cy='18.5' r='2.5' />
        </svg>
      ),
    },
    {
      label: '상품 환불 관리',
      path: '/admin/refunds',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <polyline points='1 4 1 10 7 10' />
          <path d='M3.51 15a9 9 0 1 0 .49-4.95' />
        </svg>
      ),
    },
    {
      label: '상품 등록 관리',
      path: '/admin/products',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' />
          <line x1='3' y1='6' x2='21' y2='6' />
          <path d='M16 10a4 4 0 0 1-8 0' />
        </svg>
      ),
    },
  ],
};

const SYSTEM_GROUP: NavGroupDef = {
  label: '시스템 관리',
  items: [
    {
      label: '사용자 관리',
      path: '/admin/users',
      icon: (
        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
          <circle cx='9' cy='7' r='4' />
          <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
          <path d='M16 3.13a4 4 0 0 1 0 7.75' />
        </svg>
      ),
    },
  ],
};

const NAV_GROUPS: NavGroupDef[] = [
  AR_OUTFIT_GROUP,
  WITH_USAGE_GROUP,
  KIOSK_CONTENT_GROUP,
  DONATION_GROUP,
  WITH_MARKET_GROUP,
  SYSTEM_GROUP,
];

const USER_NAV_GROUPS: NavGroupDef[] = [
  {
    label: '위드마켓 오버뷰',
    items: [WITH_MARKET_DASHBOARD_ITEM, ...WITH_MARKET_GROUP.items],
  },
];

function NavItem({ item, collapsed }: { item: NavItemDef; collapsed: boolean }) {
  if (item.externalHref) {
    return (
      <a
        href={item.externalHref}
        target='_blank'
        rel='noopener noreferrer'
        className={styles.item}
        title={collapsed ? item.label : undefined}
      >
        <span className={styles.icon}>{item.icon}</span>
        <span className={styles.label}>{item.label}</span>
      </a>
    );
  }

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
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();

  const visibleGroups = useMemo<NavGroupDef[]>(
    () => (me?.role === ROLE_USER ? USER_NAV_GROUPS : NAV_GROUPS),
    [me?.role],
  );

  const handleLogout = () => {
    authStoreApi.clearAuth();
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    navigate('/admin/login');
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <nav className={styles.nav} aria-label='관리자 메뉴'>
        <div className={styles.navHeader}>
          <button
          type='button'
          className={styles.logo}
          onClick={() => navigate('/admin/dashboard')}
          aria-label='대시보드로 이동'
        >
          <div className={styles.logoMark}>W</div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>Wit Global</span>
            <span className={styles.logoSub}>ADMIN HUB</span>
          </div>
        </button>
        </div>

        <div className={styles.navScroll}>
        {visibleGroups.map((group) => (
          <div key={group.label} className={styles.group}>
            <span className={styles.groupLabel}>{group.label}</span>
            {group.items.map((item) => (
              <NavItem key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
        </div>

        <div className={styles.navFooter}>
          <button type='button' className={styles.logoutBtn} title='로그아웃' onClick={handleLogout}>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
              <polyline points='16 17 21 12 16 7' />
              <line x1='21' y1='12' x2='9' y2='12' />
            </svg>
            <span className={styles.label}>로그아웃</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
