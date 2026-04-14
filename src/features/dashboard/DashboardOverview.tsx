import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import shared from '@commons/shared.module.css';
import s from '@pages/DashboardPage.module.css';
import { DashboardChartFallback } from './DashboardChartFallback';
import { DashboardPopularOutfits } from './DashboardPopularOutfits';
import { DashboardStatCard } from './DashboardStatCard';
import { DashboardWeekdayAxisTick } from './DashboardWeekdayAxisTick';
import type { ShootingSummary } from './dashboardSummary';
import type { DashboardPieSlice, NormalizedWeeklyStats } from '@/utils/weeklyStatsNormalize';

type DashboardOverviewProps = {
  summary: ShootingSummary | null;
  weekly: NormalizedWeeklyStats;
  weeklyPieSlices: DashboardPieSlice[];
  weeklyLoading: boolean;
  weeklyError: boolean;
  onDrillToday: () => void;
  onDrillMonthly: () => void;
};

/**
 * Headline shooting counts (`today` / `monthly` / `grand`) are taken from
 * `/admin/stats/summary` when it is present so they match drilldown kiosk totals
 * from the same payload. `/admin/stats/total` is authoritative only for
 * `weeklyTrend` and `marketShare`; its duplicate total fields are used only as
 * a fallback when summary is unavailable.
 */
function shootingTotalPreferSummary(
  summary: ShootingSummary | null,
  field: 'todayTotal' | 'monthlyTotal' | 'grandTotal',
  weeklyFallback: number,
): number {
  if (summary != null) {
    const v = summary[field];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return typeof weeklyFallback === 'number' && Number.isFinite(weeklyFallback) ? weeklyFallback : 0;
}

export function DashboardOverview({
  summary,
  weekly,
  weeklyPieSlices,
  weeklyLoading,
  weeklyError,
  onDrillToday,
  onDrillMonthly,
}: DashboardOverviewProps) {
  const lineData = weekly.weeklyTrend;
  const todayVal = shootingTotalPreferSummary(summary, 'todayTotal', weekly.todayTotal);
  const monthlyVal = shootingTotalPreferSummary(summary, 'monthlyTotal', weekly.monthlyTotal);
  const grandVal = shootingTotalPreferSummary(summary, 'grandTotal', weekly.grandTotal);
  const totalOutfitCount = summary?.totalOutfitCount ?? 0;

  const lineChartBody =
    weeklyLoading ? (
      <DashboardChartFallback variant='loading' />
    ) : weeklyError ? (
      <DashboardChartFallback variant='error' />
    ) : lineData.length === 0 ? (
      <DashboardChartFallback variant='empty' message='주간 추세 데이터가 없습니다.' />
    ) : (
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={lineData} margin={{ top: 8, right: 16, left: -20, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke='#f1f5f9' />
          <XAxis dataKey='day' axisLine={false} tickLine={false} tick={(p) => <DashboardWeekdayAxisTick {...p} />} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontSize: 11,
            }}
            formatter={(v) => [`${v}건`]}
          />
          <Line
            type='monotone'
            dataKey='lastWeek'
            stroke='#fbbf24'
            strokeWidth={2}
            strokeDasharray='5 4'
            dot={false}
            name='지난주'
          />
          <Line
            type='monotone'
            dataKey='thisWeek'
            stroke='#3b82f6'
            strokeWidth={3.5}
            dot={{ r: 4, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            name='금주'
          />
        </LineChart>
      </ResponsiveContainer>
    );

  const pieChartBody =
    weeklyLoading ? (
      <DashboardChartFallback variant='loading' />
    ) : weeklyError ? (
      <DashboardChartFallback variant='error' />
    ) : weeklyPieSlices.length === 0 ? (
      <DashboardChartFallback variant='empty' message='지점 점유 데이터가 없습니다.' />
    ) : (
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={weeklyPieSlices}
            cx='50%'
            cy='45%'
            innerRadius={52}
            outerRadius={72}
            paddingAngle={4}
            dataKey='value'
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {weeklyPieSlices.map((e, i) => (
              <Cell key={i} fill={e.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [`${v}건`]} />
          <Legend
            verticalAlign='bottom'
            iconType='circle'
            iconSize={7}
            wrapperStyle={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}
          />
        </PieChart>
      </ResponsiveContainer>
    );

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>실시간 운영 대시보드</h1>
          <p className={shared.pageSubtitle}>Wit AR Service Insights</p>
        </div>
      </div>

      <div className={s.statsGrid}>
        <DashboardStatCard
          title='오늘 촬영 수'
          value={todayVal}
          color='#f59e0b'
          icon={
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.5'>
              <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
            </svg>
          }
          onClick={onDrillToday}
        />
        <DashboardStatCard
          title='이번 달 촬영'
          value={monthlyVal}
          color='#a855f7'
          icon={
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.5'>
              <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
              <path d='M16 3.13a4 4 0 0 1 0 7.75' />
            </svg>
          }
          onClick={onDrillMonthly}
        />
        <DashboardStatCard
          title='총 누적 촬영'
          value={grandVal}
          color='#3b82f6'
          icon={
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.5'>
              <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' />
              <circle cx='12' cy='13' r='4' />
            </svg>
          }
        />
        <DashboardStatCard
          title='의상 종류'
          value={totalOutfitCount}
          unit='종'
          color='#ec4899'
          icon={
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.5'>
              <path d='M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z' />
            </svg>
          }
          onClick={() => {
            window.location.href = '/admin/outfits';
          }}
        />
      </div>

      <div className={s.chartsGrid}>
        <div className={`${shared.card} ${s.lineChartCard}`}>
          <div className={shared.cardHead}>
            <span className={shared.cardTitle} style={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Weekly Trend
            </span>
            <div className={s.chartLegend}>
              <div className={s.legendItem}>
                <div className={s.legendLine} style={{ background: '#3b82f6' }} />
                <span>This Week</span>
              </div>
              <div className={s.legendItem}>
                <div className={s.legendDash} />
                <span>Last Week</span>
              </div>
            </div>
          </div>
          <div className={s.chartArea}>{lineChartBody}</div>
        </div>

        <div className={`${shared.card} ${s.pieChartCard}`}>
          <div className={shared.cardHead}>
            <span className={s.pieLabel}>Market Share</span>
          </div>
          <div className={s.chartArea}>{pieChartBody}</div>
        </div>
      </div>

      <DashboardPopularOutfits />
    </div>
  );
}
