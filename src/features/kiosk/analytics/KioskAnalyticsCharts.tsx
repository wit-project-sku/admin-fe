import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDurationSeconds, formatDurationSecondsShort } from '../kioskFormatters';
import { formatReadableCount } from '@/utils/formatReadableCount';
import styles from './KioskAnalyticsPage.module.css';

const ANALYTICS_TOOLTIP = {
  contentStyle: {
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-card)',
    fontSize: 12,
    fontWeight: 600,
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  },
  labelStyle: { marginBottom: 6, fontWeight: 700, color: 'var(--text-primary)' },
} as const;

type ClickDistRow = { name: string; clicks: number; color: string };
type UsageRow = { name: string; usageSeconds: number; color: string };
type NamedClicks = { name: string; clicks: number };
type TopKioskUsageRow = { name: string; usageSeconds: number };
type TrendRow = { label: string; clicks: number; usageSeconds: number };

type Props = {
  isLoading: boolean;
  clickDistData: ClickDistRow[];
  usagePerButtonData: UsageRow[];
  trendChartData: TrendRow[];
  topLocChart: NamedClicks[];
  topKioskUsageData: TopKioskUsageRow[];
};

function ChartBody({
  isLoading,
  isEmpty,
  emptyMessage,
  children,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  if (isLoading) {
    return <div className={styles.chartEmptyState}>불러오는 중…</div>;
  }
  if (isEmpty) {
    return <div className={styles.chartEmptyState}>{emptyMessage}</div>;
  }
  return <>{children}</>;
}

export function KioskAnalyticsCharts({
  isLoading,
  clickDistData,
  usagePerButtonData,
  trendChartData,
  topLocChart,
  topKioskUsageData,
}: Props) {
  return (
    <section className={styles.chartGrid} aria-label='차트'>
      <div className={`${styles.chartCard} ${styles.chartSpan2}`}>
        <div className={styles.chartHead}>
          <h2 className={styles.chartTitle}>
            버튼별 클릭
            {/* <span className={styles.chartTitleUnit}>기간 합계 · 횟수</span> */}
          </h2>
        </div>
        <div
          className={styles.chartBody}
          style={
            !isLoading && clickDistData.length > 0
              ? {
                  height: `${Math.min(720, Math.max(260, 56 + clickDistData.length * 28))}px`,
                }
              : undefined
          }
        >
          <ChartBody
            isLoading={isLoading}
            isEmpty={clickDistData.length === 0}
            emptyMessage='버튼별 클릭 데이터가 없습니다.'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart layout='vertical' data={clickDistData} margin={{ top: 10, right: 20, left: 6, bottom: 8 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--border-subtle)' horizontal={false} />
                <XAxis
                  type='number'
                  tick={{ className: styles.chartAxisValueTick }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                  tickFormatter={(v) => formatReadableCount(Number(v))}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={220}
                  tick={{ className: styles.chartAxisCategoryTick }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <Tooltip {...ANALYTICS_TOOLTIP} formatter={(v: number) => [formatReadableCount(v), '클릭']} />
                <Bar dataKey='clicks' radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {clickDistData.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                  <LabelList
                    dataKey='clicks'
                    position='right'
                    offset={10}
                    className={styles.chartBarEndLabel}
                    formatter={(v: number | string) => formatReadableCount(Number(v))}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBody>
        </div>
      </div>

      <div className={`${styles.chartCard} ${styles.chartSpan2}`}>
        <div className={styles.chartHead}>
          <h2 className={styles.chartTitle}>
            버튼별 사용 시간
            {/* <span className={styles.chartTitleUnit}>기간 합계 · 초 단위 집계</span> */}
          </h2>
        </div>
        <div
          className={styles.chartBody}
          style={
            !isLoading && usagePerButtonData.length > 0
              ? {
                  height: `${Math.min(720, Math.max(260, 56 + usagePerButtonData.length * 28))}px`,
                }
              : undefined
          }
        >
          <ChartBody
            isLoading={isLoading}
            isEmpty={usagePerButtonData.length === 0}
            emptyMessage='버튼별 사용 시간 데이터가 없습니다.'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart layout='vertical' data={usagePerButtonData} margin={{ top: 10, right: 12, left: 6, bottom: 8 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--border-subtle)' horizontal={false} />
                <XAxis
                  type='number'
                  tick={{ className: styles.chartAxisValueTick }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                  tickFormatter={(v) => formatDurationSecondsShort(Number(v))}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={220}
                  tick={{ className: styles.chartAxisCategoryTick }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <Tooltip {...ANALYTICS_TOOLTIP} formatter={(v: number) => [formatDurationSeconds(v), '사용 시간']} />
                <Bar dataKey='usageSeconds' radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {usagePerButtonData.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBody>
        </div>
      </div>

      <div className={`${styles.chartCard} ${styles.chartSpan2}`}>
        <div className={styles.chartHead}>
          <h2 className={styles.chartTitle}>
            사용 추이
            {/* <span className={styles.chartTitleUnit}>클릭 수 · 사용 시간(초)</span> */}
          </h2>
        </div>
        <div className={styles.chartBody}>
          <ChartBody
            isLoading={isLoading}
            isEmpty={trendChartData.length === 0}
            emptyMessage='기간별 사용 추이 데이터가 없습니다.'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={trendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--border-subtle)' />
                <XAxis dataKey='label' tick={{ className: styles.chartAxisCategoryTick }} tickLine={false} />
                <YAxis
                  yAxisId='left'
                  tick={{ className: styles.chartAxisValueTick }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                  tickFormatter={(v) => formatReadableCount(Number(v))}
                />
                <YAxis
                  yAxisId='right'
                  orientation='right'
                  tick={{ className: styles.chartAxisValueTick }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                  tickFormatter={(v) => formatDurationSecondsShort(Number(v))}
                />
                <Tooltip
                  {...ANALYTICS_TOOLTIP}
                  formatter={(value: number, name: string) => {
                    if (name === '사용 시간' || name === 'usageSeconds') {
                      return [formatDurationSeconds(value), '사용 시간'];
                    }
                    return [formatReadableCount(value), '클릭'];
                  }}
                />
                <Legend />
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='clicks'
                  name='클릭'
                  stroke='#2563eb'
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='usageSeconds'
                  name='사용 시간'
                  stroke='#0d9488'
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartBody>
        </div>
      </div>

      <div className={`${styles.chartCard} ${styles.chartSpan2}`}>
        <div className={styles.chartHead}>
          <h2 className={styles.chartTitle}>지역별 클릭수</h2>
        </div>
        <div className={styles.chartBody}>
          <ChartBody
            isLoading={isLoading}
            isEmpty={topLocChart.length === 0}
            emptyMessage='위치별 클릭 데이터가 없습니다.'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={topLocChart} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' vertical={false} />
                <XAxis dataKey='name' tick={{ fontSize: 10 }} interval={0} angle={-16} textAnchor='end' height={52} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatReadableCount(Number(v))} />
                <Tooltip formatter={(v: number) => [formatReadableCount(v), '클릭']} />
                <Bar dataKey='clicks' fill='#6366f1' radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBody>
        </div>
      </div>

      <div className={`${styles.chartCard} ${styles.chartSpan2}`}>
        <div className={styles.chartHead}>
          <h2 className={styles.chartTitle}>WITH별 사용</h2>
        </div>
        <div className={styles.chartBody}>
          <ChartBody
            isLoading={isLoading}
            isEmpty={topKioskUsageData.length === 0}
            emptyMessage='WITH별 사용 데이터가 없습니다.'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={topKioskUsageData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' vertical={false} />
                <XAxis dataKey='name' tick={{ fontSize: 9 }} interval={0} angle={-22} textAnchor='end' height={58} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatDurationSecondsShort(Number(v))} />
                <Tooltip formatter={(v: number) => [formatDurationSeconds(v), '사용 시간']} />
                <Bar dataKey='usageSeconds' fill='#0ea5e9' radius={[4, 4, 0, 0]} maxBarSize={22} name='사용 시간' />
              </BarChart>
            </ResponsiveContainer>
          </ChartBody>
        </div>
      </div>
    </section>
  );
}
