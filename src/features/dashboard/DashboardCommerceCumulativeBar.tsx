import { AlertTriangle, Search } from 'lucide-react';
import shared from '@commons/shared.module.css';
import s from './DashboardCommerceOverview.module.css';
import type { ShopCumulativeRevenue } from '../../hooks/payment-api/useGetShopCumulativeRevenue';

export type DashboardCommerceCumulativeBarProps = {
  rangeStart: string;
  rangeEnd: string;
  onRangeStartChange: (v: string) => void;
  onRangeEndChange: (v: string) => void;
  onApply: () => void;
  data: ShopCumulativeRevenue | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
};

export function DashboardCommerceCumulativeBar({
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
  onApply,
  data,
  isLoading,
  isError,
  isFetching,
  onRetry,
}: DashboardCommerceCumulativeBarProps) {
  const canApply = Boolean(rangeStart && rangeEnd);

  return (
    <section className={s.cumulativeBar} aria-label='기간별 누적 매출' aria-busy={isLoading}>
      <div className={s.cumulativeLeft}>
        <p className={s.cumulativeTag}>Cumulative revenue</p>
        <h2 className={s.cumulativeTitle}>기간별 누적 매출</h2>
        <p className={s.cumulativeHint}>선택한 기간 동안의 총 결제 금액을 확인하세요</p>
      </div>
      <div className={s.cumulativeCenter}>
        <div className={s.dateDark}>
          <input
            type='date'
            value={rangeStart}
            onChange={(e) => onRangeStartChange(e.target.value)}
            aria-label='시작일'
          />
          <span className={s.dateSep}>~</span>
          <input
            type='date'
            value={rangeEnd}
            onChange={(e) => onRangeEndChange(e.target.value)}
            aria-label='종료일'
          />
        </div>
        <button
          type='button'
          className={s.searchBtn}
          onClick={onApply}
          disabled={!canApply || isFetching}
        >
          <Search size={16} strokeWidth={2.5} aria-hidden />
          {isFetching ? '조회 중…' : '조회'}
        </button>
      </div>
      <div className={s.cumulativeRight}>
        <p className={s.totalLabel}>Total amount</p>
        <div className={s.totalAmount} aria-live='polite'>
          {isLoading ? (
            <span
              className={shared.skeletonLine}
              style={{ maxWidth: 160, height: 20, background: 'rgba(148,163,184,0.25)' }}
              aria-label='불러오는 중'
            />
          ) : isError ? (
            <button type='button' className={s.totalRetry} onClick={onRetry}>
              <AlertTriangle size={14} />
              불러오기 실패 · 다시 시도
            </button>
          ) : data ? (
            `${data.totalAmount.toLocaleString('ko-KR')} 원`
          ) : (
            <span className={s.totalEmpty}>데이터 없음</span>
          )}
        </div>
      </div>
    </section>
  );
}
