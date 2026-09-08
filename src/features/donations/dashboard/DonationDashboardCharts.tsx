import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import shared from '@commons/shared.module.css';
import s from '../../dashboard/DashboardCommerceOverview.module.css';
import { DashboardChartFallback } from '../../dashboard/DashboardChartFallback';
import { compactKrw, krw } from '../../dashboard/commerceFormatters';
import type { DonationSlice, TopTarget, TrendPoint } from './donationDashboardAggregate';

export const DONATION_TREND_ACCENT = '#10b981';
export const DONATION_TYPE_COLORS: Record<string, string> = {
  CAMPAIGN: '#6366f1',
  SCHOOL: '#f43f5e',
};
export const DONATION_PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#a855f7', '#84cc16'];

type ChartStateProps = { isLoading: boolean; isError: boolean };

/** 일별 완료 기부액 추이 (Area). */
export function DonationTrendChart({ data, isLoading, isError }: { data: TrendPoint[] } & ChartStateProps) {
  const gradientId = useMemo(() => `donationTrend-${Math.random().toString(36).slice(2, 9)}`, []);
  const hasData = data.some((d) => d.amount > 0);

  return (
    <div className={s.chartCard}>
      <div className={s.chartHead}>
        <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>Daily Trend</span>
        <p className={s.chartSubtitle}>최근 30일 일별 기부액 추이</p>
      </div>
      <div className={s.chartBody} aria-busy={isLoading}>
        {isLoading ? (
          <DashboardChartFallback variant='loading' />
        ) : isError ? (
          <DashboardChartFallback variant='error' message='기부 추이 데이터를 불러오지 못했습니다.' />
        ) : !hasData ? (
          <DashboardChartFallback variant='empty' message='표시할 기부 추이 데이터가 없습니다.' />
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor={DONATION_TREND_ACCENT} stopOpacity={0.35} />
                  <stop offset='95%' stopColor={DONATION_TREND_ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke='#f1f5f9' />
              <XAxis
                dataKey='label'
                axisLine={false}
                tickLine={false}
                interval='preserveStartEnd'
                minTickGap={24}
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
                formatter={(value: number) => [krw(value), '기부액']}
                labelFormatter={(label, payload) => {
                  const first = payload?.[0] as { payload?: TrendPoint } | undefined;
                  const count = first?.payload?.count ?? 0;
                  return `${label} · ${count}건`;
                }}
                contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
              />
              <Area
                type='monotone'
                dataKey='amount'
                stroke={DONATION_TREND_ACCENT}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/** NGO vs 학교 기부 비중 (Pie, 금액 기준). */
export function DonationTypeChart({ data, isLoading, isError }: { data: DonationSlice[] } & ChartStateProps) {
  return (
    <div className={s.chartCard}>
      <div className={s.pieHead}>
        <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>NGO vs 학교</span>
      </div>
      <div className={s.chartBody} aria-busy={isLoading}>
        {isLoading ? (
          <DashboardChartFallback variant='loading' />
        ) : isError ? (
          <DashboardChartFallback variant='error' message='기부 유형 데이터를 불러오지 못했습니다.' />
        ) : data.length === 0 ? (
          <DashboardChartFallback variant='empty' message='표시할 기부 유형 데이터가 없습니다.' />
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
                dataKey='amount'
                nameKey='label'
                cx='50%'
                cy='45%'
                innerRadius={52}
                outerRadius={72}
                paddingAngle={4}
                label={({ percent }: { percent?: number }) =>
                  typeof percent === 'number' ? `${(percent * 100).toFixed(1)}%` : ''
                }
              >
                {data.map((entry, i) => (
                  <Cell key={entry.key} fill={DONATION_TYPE_COLORS[entry.key] ?? DONATION_PALETTE[i % DONATION_PALETTE.length]!} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, item) => {
                  const payload = (item as { payload?: DonationSlice }).payload;
                  return [krw(value), payload?.label ?? ''];
                }}
              />
              <Legend
                verticalAlign='bottom'
                iconType='circle'
                iconSize={7}
                wrapperStyle={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/** 결제수단 분포 (Pie, 건수 기준). */
export function DonationPaymentChart({ data, isLoading, isError }: { data: DonationSlice[] } & ChartStateProps) {
  return (
    <div className={s.chartCard}>
      <div className={s.pieHead}>
        <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>결제수단</span>
      </div>
      <div className={s.chartBody} aria-busy={isLoading}>
        {isLoading ? (
          <DashboardChartFallback variant='loading' />
        ) : isError ? (
          <DashboardChartFallback variant='error' message='결제수단 데이터를 불러오지 못했습니다.' />
        ) : data.length === 0 ? (
          <DashboardChartFallback variant='empty' message='표시할 결제수단 데이터가 없습니다.' />
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
                dataKey='count'
                nameKey='label'
                cx='50%'
                cy='45%'
                innerRadius={52}
                outerRadius={72}
                paddingAngle={4}
                label={({ percent }: { percent?: number }) =>
                  typeof percent === 'number' ? `${(percent * 100).toFixed(1)}%` : ''
                }
              >
                {data.map((entry, i) => (
                  <Cell key={entry.key} fill={DONATION_PALETTE[i % DONATION_PALETTE.length]!} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, item) => {
                  const payload = (item as { payload?: DonationSlice }).payload;
                  return [`${value.toLocaleString('ko-KR')}건`, payload?.label ?? ''];
                }}
              />
              <Legend
                verticalAlign='bottom'
                iconType='circle'
                iconSize={7}
                wrapperStyle={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/** 대상별 기부액 상위 (가로 Bar). */
export function DonationTopTargetsChart({ data, isLoading, isError }: { data: TopTarget[] } & ChartStateProps) {
  return (
    <div className={s.chartCard}>
      <div className={s.chartHead}>
        <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>Top Targets</span>
        <p className={s.chartSubtitle}>대상별 누적 기부액 상위</p>
      </div>
      <div className={s.chartBody} style={{ height: 320 }} aria-busy={isLoading}>
        {isLoading ? (
          <DashboardChartFallback variant='loading' />
        ) : isError ? (
          <DashboardChartFallback variant='error' message='대상별 기부 데이터를 불러오지 못했습니다.' />
        ) : data.length === 0 ? (
          <DashboardChartFallback variant='empty' message='표시할 대상별 기부 데이터가 없습니다.' />
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} layout='vertical' margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke='#f1f5f9' />
              <XAxis
                type='number'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                tickFormatter={compactKrw}
              />
              <YAxis
                type='category'
                dataKey='name'
                axisLine={false}
                tickLine={false}
                width={120}
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                formatter={(value: number, _name, item) => {
                  const payload = (item as { payload?: TopTarget }).payload;
                  return [krw(value), `${payload?.count ?? 0}건`];
                }}
                contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
              />
              <Bar dataKey='amount' radius={[0, 6, 6, 0]} barSize={18}>
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={DONATION_PALETTE[i % DONATION_PALETTE.length]!} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
