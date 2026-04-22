import { useMemo, useState } from 'react';
import shared from '@commons/shared.module.css';
import s from './DashboardCommerceOverview.module.css';
import { DashboardCommerceMetrics } from './DashboardCommerceMetrics';
import { DashboardCommerceCumulativeBar } from './DashboardCommerceCumulativeBar';
import { DashboardCommerceTrendChart } from './DashboardCommerceTrendChart';
import { DashboardCommerceStatusChart } from './DashboardCommerceStatusChart';
import { DashboardCommerceOrdersTable } from './DashboardCommerceOrdersTable';
import { CUMULATIVE_DEFAULT_RANGE_DAYS, ORDERS_PAGE_SIZE } from './commerceConstants';
import { getPastDateYmd, getTodayYmd } from '../../utils/dateUtils';
import { useGetShopStatsSummary } from '../../hooks/payment-api/useGetShopStatsSummary';
import { useGetShopOrders } from '../../hooks/payment-api/useGetShopOrders';
import { useGetShopCumulativeRevenue } from '../../hooks/payment-api/useGetShopCumulativeRevenue';

export function DashboardCommerceOverview() {
  const initialStart = useMemo(() => getPastDateYmd(CUMULATIVE_DEFAULT_RANGE_DAYS), []);
  const initialEnd = useMemo(() => getTodayYmd(), []);
  const [rangeStart, setRangeStart] = useState(initialStart);
  const [rangeEnd, setRangeEnd] = useState(initialEnd);
  const [committedRange, setCommittedRange] = useState({ start: initialStart, end: initialEnd });
  const [ordersPage, setOrdersPage] = useState(1);

  const summaryQuery = useGetShopStatsSummary();
  const cumulativeQuery = useGetShopCumulativeRevenue({
    startDate: committedRange.start,
    endDate: committedRange.end,
  });
  const ordersQuery = useGetShopOrders({ pageNum: ordersPage, pageSize: ORDERS_PAGE_SIZE });

  const orderRows = ordersQuery.data?.content ?? [];
  const ordersTotalPages = Math.max(1, Number(ordersQuery.data?.totalPages) || 1);
  const ordersTotalCount = Number.isFinite(Number(ordersQuery.data?.totalElements))
    ? Number(ordersQuery.data?.totalElements)
    : orderRows.length;

  const applyRange = () => {
    if (!rangeStart || !rangeEnd) return;
    setCommittedRange({ start: rangeStart, end: rangeEnd });
  };

  return (
    <div className={s.root}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>쇼핑몰 커머스 현황</h1>
          <p className={shared.pageSubtitle}>Wit Global Shopping Commerce</p>
        </div>
      </div>

      <DashboardCommerceMetrics
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
        isFetching={summaryQuery.isFetching}
        onRetry={() => summaryQuery.refetch()}
      />

      <DashboardCommerceCumulativeBar
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onRangeStartChange={setRangeStart}
        onRangeEndChange={setRangeEnd}
        onApply={applyRange}
        data={cumulativeQuery.data}
        isLoading={cumulativeQuery.isLoading}
        isError={cumulativeQuery.isError}
        isFetching={cumulativeQuery.isFetching}
        onRetry={() => cumulativeQuery.refetch()}
      />

      <div className={s.chartsRow}>
        <DashboardCommerceTrendChart
          data={summaryQuery.data?.revenueTrend ?? []}
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
        <DashboardCommerceStatusChart
          data={summaryQuery.data?.orderStatusGraph ?? []}
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
      </div>

      <DashboardCommerceOrdersTable
        rows={orderRows}
        isInitialLoading={ordersQuery.isPending && !ordersQuery.isPlaceholderData}
        isFetching={ordersQuery.isFetching}
        isError={ordersQuery.isError}
        page={ordersPage}
        totalPages={ordersTotalPages}
        totalCount={ordersTotalCount}
        onPageChange={setOrdersPage}
        onRetry={() => ordersQuery.refetch()}
      />
    </div>
  );
}
