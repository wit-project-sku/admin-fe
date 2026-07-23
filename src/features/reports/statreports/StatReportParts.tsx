// 통계 리포트 공용 파츠 — KPI 행, 섹션 헤더, 전기 비교 차트, AI 분석 패널.
// 색상 규칙(클라이언트 확정): 증가 파랑 / 감소 빨강, 첫 KPI 진한 테두리.
import type { ReactNode } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import s from './StatReports.module.css';
import type { KpiItem, TrendPoint } from './statReportsMockData';

export function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div className={s.kpis}>
      {items.map((k, i) => (
        <div key={k.label} className={`${s.kpi} ${i === 0 ? s.kpiPrimary : ''}`}>
          <div className={s.kpiLabel}>{k.label}</div>
          <div className={s.kpiValue}>{k.value}</div>
          {k.diff ? (
            <span className={`${s.badge} ${k.dir === 'down' ? s.badgeDown : s.badgeUp}`}>{k.diff}</span>
          ) : null}
          {k.hint ? <div className={s.kpiHint}>{k.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function Section({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <>
      <div className={s.sec}>
        <h3 className={s.secTitle}>{title}</h3>
        {sub ? <span className={s.secSub}>{sub}</span> : null}
      </div>
      {children}
    </>
  );
}

/** 증감 텍스트 — ▲ 파랑 / ▼ 빨강 */
export function Diff({ text }: { text: string }) {
  return <span className={text.startsWith('▼') ? s.down : s.up}>{text}</span>;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-card)',
    fontSize: 12,
    fontWeight: 600,
    padding: '8px 12px',
  },
} as const;

/** 금기(막대·값 라벨) vs 전기(점선) 비교 차트 */
export function CompareBarChart({
  title,
  data,
  curName,
  prevName,
  color = '#2563eb',
  height = 220,
}: {
  title: string;
  data: TrendPoint[];
  curName: string;
  prevName?: string;
  color?: string;
  height?: number;
}) {
  const hasPrev = data.some((d) => typeof d.prev === 'number');
  return (
    <div className={s.chartCard}>
      <h4 className={s.chartTitle}>{title}</h4>
      <ResponsiveContainer width='100%' height={height}>
        <ComposedChart data={data} margin={{ top: 22, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='var(--border-subtle)' vertical={false} />
          <XAxis dataKey='label' tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey='cur' name={curName} fill={color} radius={[4, 4, 0, 0]} maxBarSize={34}>
            <LabelList dataKey='cur' position='top' style={{ fontSize: 11, fontWeight: 700, fill: 'var(--text-primary)' }} formatter={(v: number) => v.toLocaleString()} />
          </Bar>
          {hasPrev ? (
            <Line dataKey='prev' name={prevName ?? '전기'} stroke='#94a3b8' strokeWidth={2} strokeDasharray='5 4' dot={{ r: 2.5 }} />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
      <div className={s.chartLegend}>
        <span><i className={s.legendDot} style={{ background: color }} />{curName}</span>
        {hasPrev ? <span><i className={s.legendDot} style={{ background: '#94a3b8' }} />{prevName ?? '전기'}</span> : null}
      </div>
    </div>
  );
}

/** AI 종합 분석 패널 — ① 전체 ② 키오스크별 */
export function AiPanel({ tag, overall, sites }: { tag: string; overall: string[][]; sites: string[][] }) {
  return (
    <div className={s.ai}>
      <span className={s.aiTag}>✦ {tag}</span>
      <p className={s.aiHead}>① 전체 분석</p>
      <ul className={s.aiList}>
        {overall.map(([head, body]) => (
          <li key={head}><b>{head}</b>{body}</li>
        ))}
      </ul>
      <p className={s.aiHead}>② 키오스크별 분석</p>
      <ul className={s.aiList}>
        {sites.map(([head, body]) => (
          <li key={head}><b>{head}</b> — {body}</li>
        ))}
      </ul>
    </div>
  );
}
