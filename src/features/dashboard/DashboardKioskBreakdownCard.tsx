import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import shared from '@commons/shared.module.css';
import s from '@pages/DashboardPage.module.css';
import { DashboardChartFallback } from './DashboardChartFallback';
import type { KioskCountRow } from './dashboardSummary';

const PIE_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#6366f1', '#8b5cf6', '#a78bfa'];

type DashboardKioskBreakdownCardProps = {
  title: string;
  totalValue: number;
  locationData: KioskCountRow[];
  loading?: boolean;
  error?: boolean;
};

export function DashboardKioskBreakdownCard({
  title,
  totalValue,
  locationData,
  loading = false,
  error = false,
}: DashboardKioskBreakdownCardProps) {
  const pieSlices = locationData.map((loc, i) => ({
    name: loc.kioskName,
    value: loc.count,
    count: loc.count,
    color: PIE_COLORS[i % PIE_COLORS.length]!,
  }));

  const pieSection =
    loading ? (
      <DashboardChartFallback variant='loading' />
    ) : error ? (
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
            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
            labelLine={{ stroke: 'var(--text-muted, #94a3b8)', strokeWidth: 1 }}
          >
            {pieSlices.map((e, i) => (
              <Cell key={i} fill={e.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _n, item) => {
              const row = item?.payload as { name?: string; count?: number } | undefined;
              const place = row?.name ?? _n;
              const count = typeof row?.count === 'number' ? row.count : Number(value);
              return [`${count.toLocaleString()}건`, place];
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
    <div className={shared.card}>
      <div className={shared.cardHead}>
        <span className={shared.cardTitle}>{title}</span>
      </div>
      <div style={{ padding: '18px 22px' }}>
        <p className={s.drillTotal}>{totalValue.toLocaleString()}건</p>
      </div>
      <div style={{ padding: '0 22px 18px', height: 280 }}>{pieSection}</div>
      <div style={{ padding: '18px 22px', borderTop: '1px solid #e2e8f0' }}>
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
                  style={{ width: `${totalValue > 0 ? (loc.count / totalValue) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
