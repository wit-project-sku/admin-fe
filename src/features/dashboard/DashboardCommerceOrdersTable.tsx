import { AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import shared from '@commons/shared.module.css';
import s from './DashboardCommerceOverview.module.css';
import Pagination from '@components/common/Pagination';
import { ORDERS_PAGE_SIZE, ORDERS_TABLE_COLS } from './commerceConstants';
import { formatOrderedAt, orderBadgeClass } from './commerceFormatters';
import type { ShopOrderRow } from '../../hooks/payment-api/useGetShopOrders';

export type DashboardCommerceOrdersTableProps = {
  rows: ShopOrderRow[];
  /** True only on the very first fetch (no data cached yet) — renders skeleton rows. */
  isInitialLoading: boolean;
  /** True whenever a fetch is in-flight (including pagination) — drives the slim top progress bar. */
  isFetching: boolean;
  isError: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
};

export function DashboardCommerceOrdersTable({
  rows,
  isInitialLoading,
  isFetching,
  isError,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onRetry,
}: DashboardCommerceOrdersTableProps) {
  const showPagination = !isInitialLoading && !isError && rows.length > 0;
  const isRefreshing = isFetching && !isInitialLoading;

  return (
    <section className={s.ordersCard} aria-label='최근 주문' aria-busy={isFetching}>
      {isRefreshing && <div className={s.topProgress} aria-hidden />}
      <div className={s.ordersHead}>
        <div className={s.ordersTitleRow}>
          <div className={s.ordersIcon} aria-hidden>
            <Package size={18} strokeWidth={2} />
          </div>
          <div>
            <h2 className={s.ordersSectionTitle}>최근 실시간 주문 내역</h2>
            <p className={s.ordersDesc}>오늘 들어온 주문 및 상태를 바로 확인하세요</p>
          </div>
        </div>
        <Link to='/admin/deliveries' className={s.viewAllBtn}>
          전체 주문 보기
        </Link>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.th}>Order id / time</th>
              <th className={s.th}>Customer</th>
              <th className={s.th}>Item</th>
              <th className={s.th}>Amount</th>
              <th className={s.th}>Status</th>
            </tr>
          </thead>
          <tbody className={isRefreshing ? s.tbodyRefreshing : undefined}>
            {isInitialLoading ? (
              Array.from({ length: ORDERS_PAGE_SIZE }).map((_, idx) => (
                <tr key={`orders-skeleton-${idx}`} className={shared.skeletonRow}>
                  {Array.from({ length: ORDERS_TABLE_COLS }).map((__, col) => (
                    <td key={`orders-skeleton-${idx}-${col}`} className={s.td}>
                      <span className={shared.skeletonLine} />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td className={`${s.emptyRow} ${s.emptyError}`} colSpan={ORDERS_TABLE_COLS}>
                  <AlertTriangle size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                  주문 내역을 불러오지 못했습니다.
                  <button type='button' className={s.inlineRetry} onClick={onRetry}>
                    <RefreshCw size={12} />
                    다시 시도
                  </button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className={s.emptyRow} colSpan={ORDERS_TABLE_COLS}>
                  표시할 주문 내역이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.orderId}>
                  <td className={s.td}>
                    <span className={s.orderId}>{row.orderId}</span>
                    <span className={s.orderTime}>{formatOrderedAt(row.orderedAt)}</span>
                  </td>
                  <td className={s.td}>{row.customerName ?? '-'}</td>
                  <td className={s.td}>{row.itemName ?? '-'}</td>
                  <td className={`${s.td} ${s.amount}`}>{row.amount.toLocaleString('ko-KR')}원</td>
                  <td className={s.td}>
                    <span className={orderBadgeClass(row.status)}>{row.status ?? '-'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalCount={totalCount}
          unit='건'
        />
      )}
    </section>
  );
}
