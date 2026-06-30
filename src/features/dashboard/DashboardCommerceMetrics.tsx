import type { ReactNode } from 'react';
import {
  AlertTriangle,
  DollarSign,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  Undo2,
} from 'lucide-react';
import shared from '@commons/shared.module.css';
import s from './DashboardCommerceOverview.module.css';
import type { ShopStatsSummary } from '../../hooks/payment-api/useGetShopStatsSummary';

type MetricCardProps = {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: number | undefined;
  unit: string;
  isLoading: boolean;
  isError: boolean;
  trendPill?: ReactNode;
};

function MetricCard({ icon, iconBg, label, value, unit, isLoading, isError, trendPill }: MetricCardProps) {
  return (
    <div className={s.metricCard}>
      <div className={s.metricTop}>
        <div className={s.metricIcon} style={{ background: iconBg }}>
          {icon}
        </div>
        {!isLoading && !isError && trendPill}
      </div>
      <div className={s.metricLabel}>{label}</div>
      <div className={s.metricValue}>
        {isLoading ? (
          <span className={shared.skeletonLine} style={{ maxWidth: 120, height: 22 }} aria-label='로딩 중' />
        ) : isError ? (
          <span className={s.metricError}>
            <AlertTriangle size={14} /> 불러오기 실패
          </span>
        ) : (
          <>
            {(value ?? 0).toLocaleString('ko-KR')}
            <span className={s.metricUnit}>{unit}</span>
          </>
        )}
      </div>
    </div>
  );
}

export type DashboardCommerceMetricsProps = {
  summary: ShopStatsSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
};

export function DashboardCommerceMetrics({
  summary,
  isLoading,
  isError,
  isFetching,
  onRetry,
}: DashboardCommerceMetricsProps) {
  const newOrdersTrend = summary?.newOrdersTrend ?? 0;

  return (
    <>
      <section className={s.metricsGrid} aria-label='핵심 지표' aria-busy={isLoading}>
        <MetricCard
          icon={<DollarSign size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #3b82f6, #1d4ed8)'
          label='오늘 매출'
          value={summary?.todayRevenue}
          unit='원'
          isLoading={isLoading}
          isError={isError}
        />
        <MetricCard
          icon={<ShoppingCart size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #3b82f6, #2563eb)'
          label='신규 주문'
          value={summary?.newOrders}
          unit='건'
          isLoading={isLoading}
          isError={isError}
          trendPill={
            newOrdersTrend !== 0 ? (
              <span className={newOrdersTrend > 0 ? s.trendUp : s.trendDown}>
                {newOrdersTrend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(newOrdersTrend)}%
              </span>
            ) : null
          }
        />
        <MetricCard
          icon={<Truck size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #f97316, #ea580c)'
          label='배송 처리중'
          value={summary?.deliveringCount}
          unit='건'
          isLoading={isLoading}
          isError={isError}
        />
        <MetricCard
          icon={<Undo2 size={18} strokeWidth={2} aria-hidden />}
          iconBg='linear-gradient(145deg, #ef4444, #dc2626)'
          label='취소/환불 요청'
          value={summary?.refundRequestCount}
          unit='건'
          isLoading={isLoading}
          isError={isError}
        />
      </section>

      {isError && (
        <div className={s.errorBanner} role='alert'>
          <span>
            <AlertTriangle size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            커머스 요약 데이터를 불러오지 못했습니다.
          </span>
          <button type='button' className={s.retryBtn} onClick={onRetry} disabled={isFetching}>
            <RefreshCw size={12} style={{ marginRight: 4, verticalAlign: '-2px' }} />
            다시 시도
          </button>
        </div>
      )}
    </>
  );
}
