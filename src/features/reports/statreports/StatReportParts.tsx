// 통계 리포트 공용 파츠 — KPI 행, 섹션 헤더, 전기 비교 차트, AI 분석 패널.
// 색상 규칙(클라이언트 확정): 증가 파랑 / 감소 빨강, 첫 KPI 진한 테두리.
import { useRef, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
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

/** AI 분석 편집 토글 — 내용은 서버/Gemini 생성(P3), 이 화면에서는 다운로드 전 가필·수정 */
function AiEditToggle({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <button
      type='button'
      onClick={onToggle}
      style={{
        border: editing ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: editing ? 'var(--blue-bg)' : 'var(--bg-card)',
        color: editing ? 'var(--blue-text)' : 'var(--text-secondary)',
        borderRadius: 6, padding: '4px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
      }}
    >
      {editing ? '✓ 수정 완료' : '✏️ 내용 수정'}
    </button>
  );
}

/** AI 종합 분석 패널 — ① 전체 ② 키오스크별. '내용 수정'으로 다운로드 전 직접 가필 가능 */
export function AiPanel({ tag, overall, sites }: { tag: string; overall: string[][]; sites: string[][] }) {
  const [editing, setEditing] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <div className={s.ai}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span className={s.aiTag}>✦ {tag}</span>
        <span data-export-ignore>
          <AiEditToggle editing={editing} onToggle={() => { setEditing(!editing); if (!editing) setTimeout(() => bodyRef.current?.focus(), 0); }} />
        </span>
      </div>
      <div
        ref={bodyRef}
        contentEditable={editing}
        suppressContentEditableWarning
        style={editing ? { outline: '1.5px dashed var(--accent)', borderRadius: 8, padding: 6, marginTop: 4 } : undefined}
      >
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
    </div>
  );
}

/** 라이브 뷰용 AI 카드 — 실데이터로 자동 작성된 분석(overall·sites)을 렌더 + 다운로드 전 수동 수정.
 *  분석문은 규칙 기반 자동 생성(무과금). 추후 서버/외부 API 결과로 교체 시 overall/sites 만 갈아끼우면 됨. */
export function EditableAiCard({
  tag,
  overall,
  sites,
  note,
}: {
  tag: string;
  overall: string[][];
  sites: string[][];
  note?: string;
}) {
  const [editing, setEditing] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const empty = overall.length === 0 && sites.length === 0;
  return (
    <div className={s.ai}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span className={s.aiTag}>✦ {tag}</span>
        <span data-export-ignore>
          <AiEditToggle editing={editing} onToggle={() => { setEditing(!editing); if (!editing) setTimeout(() => bodyRef.current?.focus(), 0); }} />
        </span>
      </div>
      <div
        ref={bodyRef}
        contentEditable={editing}
        suppressContentEditableWarning
        style={editing ? { outline: '1.5px dashed var(--accent)', borderRadius: 8, padding: 6, marginTop: 4 } : undefined}
      >
        {empty ? (
          <p className={s.note} style={{ marginTop: 8 }}>기간 내 데이터가 없어 분석할 내용이 없습니다.</p>
        ) : (
          <>
            {overall.length > 0 ? (
              <>
                <p className={s.aiHead}>① 전체 분석</p>
                <ul className={s.aiList}>
                  {overall.map(([head, body]) => (
                    <li key={head}><b>{head}</b>{body}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {sites.length > 0 ? (
              <>
                <p className={s.aiHead}>② 키오스크별 분석</p>
                <ul className={s.aiList}>
                  {sites.map(([head, body]) => (
                    <li key={head}><b>{head}</b> — {body}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        )}
      </div>
      {note ? <p className={s.note} style={{ marginTop: 6 }} data-export-ignore>{note}</p> : null}
    </div>
  );
}

/** 가로 바차트 — 버튼별 클릭/사용 시간 등 항목 수가 늘어도 행만 늘어난다(관리자 웹 방식) */
export function HBarChart({
  title,
  data,
  color = '#2563eb',
  unit = '',
}: {
  title: string;
  data: { label: string; value: number }[];
  color?: string;
  unit?: string;
}) {
  const height = Math.max(120, data.length * 30 + 40);
  return (
    <div className={s.chartCard}>
      <h4 className={s.chartTitle}>{title}</h4>
      <ResponsiveContainer width='100%' height={height}>
        <BarChart layout='vertical' data={data} margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='var(--border-subtle)' horizontal={false} />
          <XAxis type='number' tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis type='category' dataKey='label' width={104} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toLocaleString()}${unit}`, '']} />
          <Bar dataKey='value' fill={color} radius={[0, 4, 4, 0]} maxBarSize={16}>
            <LabelList dataKey='value' position='right' style={{ fontSize: 10.5, fontWeight: 700, fill: 'var(--text-primary)' }} formatter={(v: number) => v.toLocaleString()} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
