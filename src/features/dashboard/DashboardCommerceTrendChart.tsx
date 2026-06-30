import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import shared from '@commons/shared.module.css';
import s from './DashboardCommerceOverview.module.css';
import { DashboardChartFallback } from './DashboardChartFallback';
import { COMMERCE_CHART_ACCENT, COMMERCE_CHART_COMPARE } from './commerceConstants';
import { compactKrw, krw } from './commerceFormatters';
import type { ShopRevenueTrendPoint } from '../../hooks/payment-api/useGetShopStatsSummary';

export type DashboardCommerceTrendChartProps = {
  data: ShopRevenueTrendPoint[];
  isLoading: boolean;
  isError: boolean;
};

export function DashboardCommerceTrendChart({ data, isLoading, isError }: DashboardCommerceTrendChartProps) {
  const gradientId = useMemo(() => `commerceRev-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <div className={s.chartCard}>
      <div className={s.chartHead}>
        <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>Weekly Trend</span>
        <p className={s.chartSubtitle}>이번 주 vs 지난 주 매출 추이</p>
      </div>
      <div className={s.chartBody} aria-busy={isLoading}>
        {isLoading ? (
          <DashboardChartFallback variant='loading' />
        ) : isError ? (
          <DashboardChartFallback variant='error' message='주간 매출 데이터를 불러오지 못했습니다.' />
        ) : data.length === 0 ? (
          <DashboardChartFallback variant='empty' message='표시할 주간 매출 데이터가 없습니다.' />
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor={COMMERCE_CHART_ACCENT} stopOpacity={0.35} />
                  <stop offset='95%' stopColor={COMMERCE_CHART_ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke='#f1f5f9' />
              <XAxis
                dataKey='label'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                tickFormatter={compactKrw}
                width={48}
              />
              <Tooltip
                formatter={(value: number, name) => {
                  const label: string = name === 'revenue' ? '이번 주' : '지난 주';
                  return [krw(value), label];
                }}
                labelFormatter={(label, payload) => {
                  const first = payload?.[0] as { payload?: { date?: string } } | undefined;
                  const date = first?.payload?.date;
                  return date ? `${label} · ${date}` : String(label ?? '');
                }}
                contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
              />
              <Area
                type='monotone'
                dataKey='revenue'
                stroke={COMMERCE_CHART_ACCENT}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
              />
              <Line
                type='monotone'
                dataKey='lastWeekRevenue'
                stroke={COMMERCE_CHART_COMPARE}
                strokeWidth={2}
                strokeDasharray='4 4'
                dot={false}
              />
              <Legend
                verticalAlign='bottom'
                height={24}
                iconType='circle'
                iconSize={8}
                formatter={(v) => (v === 'revenue' ? '이번 주' : '지난 주')}
                wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
