import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import AdminLayout from '@layouts/AdminLayout';
import { useAuthStore } from '../stores/authStore';
import { ROLE_USER, useGetMe } from '../hooks/auth-api/useGetMe';
import { isPathAllowedForRole, ROLE_DEFAULT_LANDING } from '../utils/roleAccess';

const LoginPage = lazy(() => import('@pages/LoginPage'));
const DashboardPage = lazy(() => import('@pages/DashboardPage'));
const WithMarketDashboardPage = lazy(() => import('@pages/WithMarketDashboardPage'));
const ProductManagePage = lazy(() => import('@pages/ProductManagePage'));
const ShopsManagePage = lazy(() => import('@pages/ShopsManagePage'));
const PaymentManagePage = lazy(() => import('@pages/PaymentManagePage'));
const DeliveryManagePage = lazy(() => import('@pages/DeliveryManagePage'));
const RefundManagePage = lazy(() => import('@pages/RefundManagePage'));
const ReportsPage = lazy(() => import('@pages/ReportsPage'));
const OutfitsPage = lazy(() => import('@pages/OutfitsPage'));
const KioskAnalyticsPage = lazy(() => import('@pages/KioskAnalyticsPage'));
const KioskButtonManagePage = lazy(() => import('@pages/KioskButtonManagePage'));
const UserManagePage = lazy(() => import('@pages/UserManagePage'));
const NotFoundPage = lazy(() => import('@pages/notfound/NotFound'));

const Loader = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80vh',
      fontSize: 12,
      color: '#94a3b8',
      fontWeight: 700,
    }}
  >
    불러오는 중...
  </div>
);

function Guard({ children }: { children: ReactNode }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!hasHydrated) return <Loader />;
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}
function LoginGuard({ children }: { children: ReactNode }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!hasHydrated) return <Loader />;
  return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : children;
}

/** Authorizes the current pathname against the user's role. Blocks any path the role cannot access. */
function RoleGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { data: me, isLoading, isError } = useGetMe();

  if (isLoading && !me) return <Loader />;
  if (isError || !me) return <>{children}</>;

  if (!isPathAllowedForRole(me.role, pathname)) {
    return <Navigate to={ROLE_DEFAULT_LANDING[me.role]} replace />;
  }
  return <>{children}</>;
}

/** Dashboard dispatcher: ROLE_USER sees a dedicated 위드마켓 dashboard, ROLE_ADMIN sees the full dashboard. */
function RoleAwareDashboard() {
  const { data: me } = useGetMe();
  if (me?.role === ROLE_USER) return <WithMarketDashboardPage />;
  return <DashboardPage />;
}

export default function AppRouter() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route
            path="/admin/login"
            element={
              <LoginGuard>
                <LoginPage />
              </LoginGuard>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Guard>
                <RoleGuard>
                  <AdminLayout />
                </RoleGuard>
              </Guard>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<RoleAwareDashboard />} />
            <Route path="products" element={<ProductManagePage />} />
            <Route path="shops" element={<ShopsManagePage />} />
            <Route path="payments" element={<PaymentManagePage />} />
            <Route path="deliveries" element={<DeliveryManagePage />} />
            <Route path="refunds" element={<RefundManagePage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="outfits" element={<OutfitsPage />} />
            <Route path="kiosk-analytics" element={<KioskAnalyticsPage />} />
            <Route path="kiosk-buttons" element={<KioskButtonManagePage />} />
            <Route path="kiosk-apps" element={<Navigate to="/admin/kiosk-buttons" replace />} />
            <Route path="users" element={<UserManagePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
