import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import shared from '@commons/shared.module.css';
import s from '../../dashboard/DashboardCommerceOverview.module.css';
import { DashboardChartFallback } from '../../dashboard/DashboardChartFallback';
import { compactKrw, krw } from '../../dashboard/commerceFormatters';
import { DONATION_PALETTE } from './DonationDashboardCharts';
import type { GraduationBar, RegionBar, SchoolRankRow } from './schoolDonationAggregate';

type ChartStateProps = { isLoading: boolean; isError: boolean };

/** 지역별 누적 기부액 (가로 Bar). */
export function SchoolRegionChart({ data, isLoading, isError }: { data: RegionBar[] } & ChartStateProps) {
  return (
    <div className={s.chartCard}>
      <div className={s.chartHead}>
        <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>By Region</span>
        <p className={s.chartSubtitle}>지역별 누적 기부액</p>
      </div>
      <div className={s.chartBody} style={{ height: 320 }} aria-busy={isLoading}>
        {isLoading ? (
          <DashboardChartFallback variant='loading' />
        ) : isError ? (
          <DashboardChartFallback variant='error' message='지역별 데이터를 불러오지 못했습니다.' />
        ) : data.length === 0 ? (
          <DashboardChartFallback variant='empty' message='표시할 지역별 데이터가 없습니다.' />
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
                dataKey='label'
                axisLine={false}
                tickLine={false}
                width={80}
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(244,63,94,0.06)' }}
                formatter={(value: number, _n, item) => {
                  const payload = (item as { payload?: RegionBar }).payload;
                  return [krw(value), `${payload?.schools ?? 0}개교`];
                }}
                contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
              />
              <Bar dataKey='amount' radius={[0, 6, 6, 0]} barSize={16}>
                {data.map((entry, i) => (
                  <Cell key={entry.region} fill={DONATION_PALETTE[i % DONATION_PALETTE.length]!} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/** 졸업연도별 기부 분포 (세로 Bar) — 학교 기부 고유 지표. */
export function SchoolGraduationChart({ data, isLoading, isError }: { data: GraduationBar[] } & ChartStateProps) {
  return (
    <div className={s.chartCard}>
      <div className={s.chartHead}>
        <span className={`${shared.cardTitle} ${s.chartEyebrow}`}>By Graduation Year</span>
        <p className={s.chartSubtitle}>졸업연도별 기부액</p>
      </div>
      <div className={s.chartBody} aria-busy={isLoading}>
        {isLoading ? (
          <DashboardChartFallback variant='loading' />
        ) : isError ? (
          <DashboardChartFallback variant='error' message='졸업연도 데이터를 불러오지 못했습니다.' />
        ) : data.length === 0 ? (
          <DashboardChartFallback variant='empty' message='표시할 졸업연도 데이터가 없습니다.' />
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke='#f1f5f9' />
              <XAxis
                dataKey='year'
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
                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                formatter={(value: number, _n, item) => {
                  const payload = (item as { payload?: GraduationBar }).payload;
                  return [krw(value), `${payload?.count ?? 0}건`];
                }}
                labelFormatter={(label) => (label === '미상' ? '졸업연도 미상' : `${label}년 졸업`)}
                contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
              />
              <Bar dataKey='amount' radius={[6, 6, 0, 0]} barSize={26} fill='#6366f1' />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function RankChangeBadge({ change }: { change: number | null }) {
  if (change == null) {
    return <span className={`${shared.badge} ${shared.badgeGray}`}>NEW</span>;
  }
  if (change > 0) {
    return <span style={{ color: 'var(--green-text, #16a34a)', fontWeight: 700, fontSize: 12 }}>▲ {change}</span>;
  }
  if (change < 0) {
    return <span style={{ color: 'var(--red-text, #dc2626)', fontWeight: 700, fontSize: 12 }}>▼ {Math.abs(change)}</span>;
  }
  return <span style={{ color: 'var(--text-muted, #94a3b8)', fontWeight: 700, fontSize: 12 }}>—</span>;
}

/** 누적 기부액 상위 학교 랭킹 테이블. */
export function SchoolRankingTable({ rows, isLoading, isError }: { rows: SchoolRankRow[] } & ChartStateProps) {
  const COLS = 7;
  return (
    <div className={shared.card}>
      <div className={shared.cardHead} style={{ padding: '14px 20px' }}>
        <div>
          <h3 className={shared.cardTitle} style={{ margin: 0 }}>기부액 상위 학교</h3>
          <p className={shared.pageSubtitle} style={{ margin: '2px 0 0' }}>Top Schools by Accumulated Donation</p>
        </div>
      </div>
      <div className={shared.tableResponsive}>
        <table className={shared.table}>
          <thead className={shared.thead}>
            <tr>
              <th className={`${shared.th} ${shared.thCenter}`}>순위</th>
              <th className={`${shared.th} ${shared.thCenter}`}>변동</th>
              <th className={shared.th}>학교명</th>
              <th className={`${shared.th} ${shared.thCenter}`}>지역</th>
              <th className={`${shared.th} ${shared.thRight}`}>누적 기부액</th>
              <th className={`${shared.th} ${shared.thRight}`}>참여자</th>
              <th className={`${shared.th} ${shared.thRight}`}>수혜 학생</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`rank-skeleton-${idx}`} className={shared.skeletonRow}>
                  {Array.from({ length: COLS }).map((__, col) => (
                    <td key={`rank-skeleton-${idx}-${col}`} className={shared.td}>
                      <span className={shared.skeletonLine} />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={COLS} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                  랭킹 데이터를 불러오지 못했습니다.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COLS} className={shared.tableStateCell}>
                  표시할 학교 기부 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className={shared.tr} style={r.active ? undefined : { opacity: 0.55 }}>
                  <td className={`${shared.td} ${shared.tdCenter} ${shared.tdBold}`}>{r.rank}</td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>
                    <RankChangeBadge change={r.rankChange} />
                  </td>
                  <td className={`${shared.td} ${shared.tdBold}`}>{r.name}</td>
                  <td className={`${shared.td} ${shared.tdCenter}`}>{r.regionLabel}</td>
                  <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>{krw(r.amount)}</td>
                  <td className={`${shared.td} ${shared.tdRight} ${shared.tdMuted}`}>
                    {r.participantCount.toLocaleString('ko-KR')}명
                  </td>
                  <td className={`${shared.td} ${shared.tdRight} ${shared.tdMuted}`}>
                    {r.studentCount.toLocaleString('ko-KR')}명
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
