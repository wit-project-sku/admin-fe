import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import s from './DashboardPage.module.css';
import shared from '@commons/shared.module.css';

const TODAY_DAY = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];

const TREND_DATA = [
  { day: '월', thisWeek: 102, lastWeek: 88 },
  { day: '화', thisWeek: 95,  lastWeek: 110 },
  { day: '수', thisWeek: 120, lastWeek: 105 },
  { day: '목', thisWeek: 135, lastWeek: 128 },
  { day: '금', thisWeek: 88,  lastWeek: 92 },
  { day: '토', thisWeek: 110, lastWeek: 105 },
  { day: '일', thisWeek: 155, lastWeek: 140 },
];

const PIE_DATA = [
  { name: '화성(상)',  value: 42, color: '#3b82f6' },
  { name: '화성(하)',  value: 38, color: '#60a5fa' },
  { name: '인사동',    value: 21, color: '#93c5fd' },
  { name: '강남',      value: 15, color: '#bfdbfe' },
  { name: '제주',      value: 8,  color: '#dbeafe' },
];

const LOCATION_DATA = [
  { name: '화성휴게소(상)', today: 124, monthly: 4200, total: 42000 },
  { name: '화성휴게소(하)', today: 98,  monthly: 3850, total: 38500 },
  { name: '인사동 본점',    today: 85,  monthly: 2100, total: 21000 },
  { name: '강남 팝업',      today: 72,  monthly: 1540, total: 15400 },
  { name: '제주공항점',     today: 49,  monthly: 850,  total: 8500 },
];

function StatCard({ title, value, unit = '건', color, icon, trendPct, onClick }) {
  return (
    <div className={`${s.statCard} ${onClick ? s.clickable : ''}`} onClick={onClick}>
      <div className={s.statTop}>
        <div className={s.statIcon} style={{ background: color }}>{icon}</div>
        {trendPct && (
          <span className={s.trendBadge}>▲ {trendPct}%</span>
        )}
        {onClick && !trendPct && (
          <span className={s.viewBadge}>VIEW</span>
        )}
      </div>
      <p className={s.statLabel}>{title}</p>
      <h3 className={s.statValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className={s.statUnit}>{unit}</span>
      </h3>
    </div>
  );
}

const CustomTick = ({ x, y, payload }) => {
  const isToday = payload.value === TODAY_DAY;
  return (
    <g transform={`translate(${x},${y})`}>
      {isToday && <circle cx="0" cy="11" r="11" fill="#3b82f6" fillOpacity="0.12" />}
      <text
        x={0} y={0} dy={15}
        textAnchor="middle"
        fill={isToday ? '#3b82f6' : '#94a3b8'}
        fontSize={10}
        fontWeight={isToday ? 900 : 700}
      >
        {payload.value}
      </text>
    </g>
  );
};

export default function DashboardPage() {
  const [drilldown, setDrilldown] = useState(null);

  if (drilldown) {
    const isToday = drilldown === 'today';
    const totalVal = isToday ? 428 : 12540;
    const label = isToday ? '오늘 지점별 현황' : '이번 달 지점별 현황';
    const dataKey = isToday ? 'today' : 'monthly';

    return (
      <div>
        <button className={s.backBtn} onClick={() => setDrilldown(null)}>
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
            <div style={{ padding: '0 22px 18px', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={`${shared.card} ${s.rankCard}`}>
            <div className={shared.cardHead}>
              <span className={shared.cardTitle}>지점 랭킹</span>
            </div>
            <div style={{ padding: '18px 22px' }}>
              {LOCATION_DATA.map((loc) => (
                <div key={loc.name} className={s.rankRow}>
                  <div className={s.rankMeta}>
                    <span className={s.rankName}>{loc.name}</span>
                    <span className={s.rankVal}>{loc[dataKey].toLocaleString()}건</span>
                  </div>
                  <div className={s.rankTrack}>
                    <div
                      className={s.rankFill}
                      style={{ width: `${(loc[dataKey] / totalVal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>실시간 운영 대시보드</h1>
          <p className={shared.pageSubtitle}>Wit AR Service Insights</p>
        </div>
        <div className={shared.liveBadge}>
          <div className={shared.liveDot} />
          <span className={shared.liveText}>Live System Connected</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className={s.statsGrid}>
        <StatCard title="오늘 촬영 수" value={428} color="#f59e0b"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
          onClick={() => setDrilldown('today')}
        />
        <StatCard title="이번 달 촬영" value={12540} color="#a855f7" trendPct={15}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          onClick={() => setDrilldown('monthly')}
        />
        <StatCard title="총 누적 촬영" value={154200} color="#3b82f6"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>}
        />
        <StatCard title="의상 종류" value={15} unit="종" color="#ec4899"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>}
          onClick={() => window.location.href = '/admin/outfits'}
        />
      </div>

      {/* Charts */}
      <div className={s.chartsGrid}>
        <div className={`${shared.card} ${s.lineChartCard}`}>
          <div className={shared.cardHead}>
            <span className={shared.cardTitle} style={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>Weekly Trend</span>
            <div className={s.chartLegend}>
              <div className={s.legendItem}><div className={s.legendLine} style={{ background: '#3b82f6' }} /><span>This Week</span></div>
              <div className={s.legendItem}><div className={s.legendDash} /><span>Last Week</span></div>
            </div>
          </div>
          <div className={s.chartArea}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA} margin={{ top: 8, right: 16, left: -20, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={<CustomTick />} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 11 }}
                  formatter={(v) => [v + '건']}
                />
                <Line type="monotone" dataKey="lastWeek" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 4" dot={false} name="지난주" />
                <Line type="monotone" dataKey="thisWeek" stroke="#3b82f6" strokeWidth={3.5}
                  dot={{ r: 4, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }}
                  activeDot={{ r: 6 }} name="금주" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${shared.card} ${s.pieChartCard}`}>
          <div className={shared.cardHead}>
            <span className={s.pieLabel}>Market Share</span>
          </div>
          <div className={s.chartArea}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="45%" innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value">
                  {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [v + '%']} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
