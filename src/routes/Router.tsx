import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import AdminLayout from '@layouts/AdminLayout';
import { useAuthStore } from '../stores/authStore';

const LoginPage = lazy(() => import('@pages/LoginPage'));
const DashboardPage = lazy(() => import('@pages/DashboardPage'));
const ProductManagePage = lazy(() => import('@pages/ProductManagePage'));
const PaymentManagePage = lazy(() => import('@pages/PaymentManagePage'));
const DeliveryManagePage = lazy(() => import('@pages/DeliveryManagePage'));
const RefundManagePage = lazy(() => import('@pages/RefundManagePage'));
const ReportsPage = lazy(() => import('@pages/ReportsPage'));
const OutfitsPage = lazy(() => import('@pages/OutfitsPage'));
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
                <AdminLayout />
              </Guard>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductManagePage />} />
            <Route path="payments" element={<PaymentManagePage />} />
            <Route path="deliveries" element={<DeliveryManagePage />} />
            <Route path="refunds" element={<RefundManagePage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path="outfits" element={<OutfitsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
