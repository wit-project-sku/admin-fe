import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AdminLayout from '@layouts/AdminLayout';

const ProductManagePage = lazy(() => import('@pages/ProductManagePage'));
const PaymentManagePage = lazy(() => import('@pages/PaymentManagePage'));
const DeliveryManagePage = lazy(() => import('@pages/DeliveryManagePage'));
const RefundManagePage = lazy(() => import('@pages/RefundManagePage'));
const LoginPage = lazy(() => import('@pages/LoginPage'));

const NotFoundPage = lazy(() => import('@pages/notfound/NotFound'));

const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '16px',
      color: '#666',
    }}
  >
    페이지를 불러오는 중...
  </div>
);

function AdminGuard({ children }) {
  const hasToken = !!localStorage.getItem('accessToken');
  return hasToken ? children : <Navigate to='/admin/login' replace />;
}

function AdminLoginGuard({ children }) {
  const hasToken = !!localStorage.getItem('accessToken');
  return hasToken ? <Navigate to='/admin/products' replace /> : children;
}

export default function AppRouter() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 루트는 /admin 으로 통일 */}
          <Route path='/' element={<Navigate to='/admin' replace />} />

          {/* 로그인은 가드 없이 접근 가능, 토큰 있으면 바로 products로 */}
          <Route
            path='/admin/login'
            element={
              <AdminLoginGuard>
                <LoginPage />
              </AdminLoginGuard>
            }
          />

          {/* /admin 아래는 전부 로그인 필요 */}
          <Route
            path='/admin/*'
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            {/* /admin 진입 시 기본 페이지 */}
            <Route index element={<Navigate to='products' replace />} />

            <Route path='products' element={<ProductManagePage />} />
            <Route path='payments' element={<PaymentManagePage />} />
            <Route path='deliveries' element={<DeliveryManagePage />} />
            <Route path='refunds' element={<RefundManagePage />} />

            {/* 존재하지 않는 admin 하위 경로 */}
            <Route path='*' element={<NotFoundPage />} />
          </Route>

          {/* 그 외 모든 경로는 /admin 으로 보내기 */}
          <Route path='*' element={<Navigate to='/admin/login' replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
