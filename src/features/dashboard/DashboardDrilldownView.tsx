import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import shared from '@commons/shared.module.css';
import s from '@pages/DashboardPage.module.css';
import { DashboardChartFallback } from './DashboardChartFallback';
import type { DashboardPieSlice } from '@/utils/weeklyStatsNormalize';
import type { KioskCountRow, ShootingSummary } from './dashboardSummary';

export type DashboardDrillMode = 'today' | 'monthly';

type DashboardDrilldownViewProps = {
  mode: DashboardDrillMode;
  summary: ShootingSummary | null;
  pieSlices: DashboardPieSlice[];
  pieLoading?: boolean;
  pieError?: boolean;
  onBack: () => void;
};

export function DashboardDrilldownView({
  mode,
  summary,
  pieSlices,
  pieLoading = false,
  pieError = false,
  onBack,
}: DashboardDrilldownViewProps) {
  const isToday = mode === 'today';
  const totalVal = isToday ? (summary?.todayTotal ?? 0) : (summary?.monthlyTotal ?? 0);
  const locationData: KioskCountRow[] = isToday ? (summary?.todayByKiosk ?? []) : (summary?.monthlyByKiosk ?? []);
  const label = isToday ? '오늘 지점별 현황' : '이번 달 지점별 현황';

  const pieSection =
    pieLoading ? (
      <DashboardChartFallback variant='loading' />
    ) : pieError ? (
      <DashboardChartFallback variant='error' />
    ) : pieSlices.length === 0 ? (
      <DashboardChartFallback variant='empty' message='지점 점유 데이터가 없습니다.' />
    ) : (
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={pieSlices}
            dataKey='value'
            nameKey='name'
            cx='50%'
            cy='45%'
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            label={({ name, percent }) => {
              const pct = percent != null ? (percent * 100).toFixed(0) : '0';
              return  `${pct}%`;
            }}
            labelLine={{ stroke: 'var(--text-muted, #94a3b8)', strokeWidth: 1 }}
          >
            {pieSlices.map((e, i) => (
              <Cell key={i} fill={e.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _n, item) => {
              const row = item?.payload as { name?: string } | undefined;
              const place = row?.name ?? _n;
              return [`${value}건`, place];
            }}
            contentStyle={{
              borderRadius: 10,
              border: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontSize: 12,
              fontWeight: 600,
            }}
          />
          <Legend
            verticalAlign='bottom'
            iconType='circle'
            iconSize={8}
            wrapperStyle={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #64748b)', paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    );

  return (
    <div>
      <button type='button' className={s.backBtn} onClick={onBack}>
        ← 대시보드로 돌아가기
      </button>
      <div className={shared.pageHeader} style={{ marginTop: 16 }}>
        <div>
          <h1 className={shared.pageTitle}>{label}</h1>
          <p className={shared.pageSubtitle}>Location Breakdown</p>
        </div>
      </div>
      <div className={s.drillGrid}>
        <div className={shared.card}>
          <div style={{ padding: '18px 22px' }}>
            <p className={s.drillTotal}>{totalVal.toLocaleString()}건</p>
            <p className={shared.pageSubtitle}>{label}</p>
          </div>
          <div style={{ padding: '0 22px 18px', height: 280 }}>{pieSection}</div>
        </div>
        <div className={`${shared.card} ${s.rankCard}`}>
          <div className={shared.cardHead}>
            <span className={shared.cardTitle}>지점 랭킹</span>
          </div>
          <div style={{ padding: '18px 22px' }}>
            {locationData.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
                표시할 지점 데이터가 없습니다.
              </p>
            ) : (
              locationData.map((loc) => (
                <div key={String(loc.kioskId)} className={s.rankRow}>
                  <div className={s.rankMeta}>
                    <span className={s.rankName}>{loc.kioskName}</span>
                    <span className={s.rankVal}>{loc.count.toLocaleString()}건</span>
                  </div>
                  <div className={s.rankTrack}>
                    <div
                      className={s.rankFill}
                      style={{ width: `${totalVal > 0 ? (loc.count / totalVal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
