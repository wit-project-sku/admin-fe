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
/**
 * 행이 많은 표를 좌우 2단으로 쪼개 세로 길이를 절반으로 만든다(A4 한 장 유지용).
 * 마지막 소계 행은 2단 아래 전체 폭으로 한 번만 놓는다.
 */
export function SplitTable({
  head,
  rows,
  sum,
  boldFirstRow = true,
}: {
  head: string[];
  rows: (string | number)[][];
  /** 2단으로 나뉘어 열 위치로는 의미를 알 수 없으므로 항목명을 함께 받는다. */
  sum?: { label: string; value: string }[];
  boldFirstRow?: boolean;
}) {
  const half = Math.ceil(rows.length / 2);
  const cols = [rows.slice(0, half), rows.slice(half)].filter((c) => c.length > 0);
  return (
    <div className={s.tableSplit}>
      {cols.map((col, ci) => (
        <table className={s.table} key={ci}>
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {col.map((r, ri) => (
              <tr key={ri}>
                {r.map((cell, x) => (
                  <td
                    key={x}
                    className={`${x === 0 ? s.tdL : ''} ${boldFirstRow && ci === 0 && ri === 0 ? s.tdB : ''}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      {sum ? (
        <div className={s.sumStrip}>
          {sum.map((it) => (
            <span className={s.sumItem} key={it.label}>
              <span className={s.sumLabel}>{it.label}</span>
              <b>{it.value}</b>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** 최대값에 맞춰 시간 축 단위를 고른다 — 초 → 분 → 시간. */
function pickDurationUnit(maxSec: number): { unit: string; div: number } {
  if (maxSec < 120) return { unit: '초', div: 1 };
  if (maxSec < 7200) return { unit: '분', div: 60 };
  return { unit: '시간', div: 3600 };
}

/** 툴팁용 사람이 읽는 표기 — 초/분/시간을 섞어 쓴다. */
function humanDuration(sec: number): string {
  const v = Math.max(0, Math.round(sec));
  if (v < 60) return `${v}초`;
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

/**
 * 버튼별 사용 현황 — 클릭(막대, 좌축) + 사용 시간(선, 우축).
 *
 * <p>가로 막대(layout='vertical')는 높이가 버튼 개수에 비례해 A4 한 장을 넘겼다. 세로 막대는 개수와 무관하게
 * 높이가 고정이라 지점당 1페이지가 유지된다.
 *
 * <p>축이 둘이라 범례만으로는 어느 눈금이 무엇인지 알기 어렵다 → 범례 대신 <b>각 축 바로 위에 계열 색과 같은 색의
 * 라벨</b>을 둔다. 시간 축 단위(초/분/시간)는 최대값에 맞춰 자동으로 고른다.
 */
export type UsageMetric = 'ALL' | 'CLICKS' | 'DURATION';

export function ButtonUsageChart({
  data,
  title = '버튼별 클릭 · 사용 시간',
  metric = 'ALL',
}: {
  data: { label: string; clicks: number; durationSec: number }[];
  title?: string;
  /** 표시할 계열 — 전체(막대+선) / 클릭만 / 사용 시간만. */
  metric?: UsageMetric;
}) {
  const { unit, div } = pickDurationUnit(Math.max(0, ...data.map((d) => d.durationSec)));
  const rows = data.map((d) => ({
    label: d.label,
    clicks: d.clicks,
    duration: Math.round((d.durationSec / div) * 10) / 10,
    durationSec: d.durationSec,
  }));
  const showClicks = metric !== 'DURATION';
  const showDuration = metric !== 'CLICKS';
  // 한 계열만 볼 때는 선 대신 막대로 그린다(순위 비교가 목적이라 막대가 읽기 쉽다).
  const durationAsBar = metric === 'DURATION';
  return (
    <div className={s.chartCard}>
      <h4 className={s.chartTitle}>{title}</h4>
      <div className={s.axisLegend}>
        {showClicks ? <span className={s.axisLeft}>◼ 클릭(회)</span> : <span />}
        {showDuration ? (
          <span className={s.axisRight}>
            {durationAsBar ? '◼ ' : ''}사용 시간({unit}){durationAsBar ? '' : ' ―'}
          </span>
        ) : (
          <span />
        )}
      </div>
      <ResponsiveContainer width='100%' height={292}>
        <ComposedChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='var(--border-subtle)' vertical={false} />
          <XAxis
            dataKey='label'
            interval={0}
            angle={-45}
            textAnchor='end'
            height={96}
            tick={{ fontSize: 9.5, fill: 'var(--text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          {showClicks ? (
            <YAxis
              yAxisId='l'
              tick={{ fontSize: 10, fill: '#2563eb' }}
              axisLine={false}
              tickLine={false}
            />
          ) : null}
          {showDuration ? (
            <YAxis
              yAxisId='r'
              orientation={durationAsBar ? 'left' : 'right'}
              tick={{ fontSize: 10, fill: '#b45309' }}
              axisLine={false}
              tickLine={false}
            />
          ) : null}
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v: number, n: string, item: { payload?: { durationSec?: number } }) =>
              n === '사용 시간'
                ? [humanDuration(item?.payload?.durationSec ?? 0), n]
                : [`${v.toLocaleString()}회`, n]
            }
          />
          {showClicks ? (
            <Bar
              yAxisId='l'
              name='클릭'
              dataKey='clicks'
              fill='#2563eb'
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              isAnimationActive={false}
            />
          ) : null}
          {showDuration && durationAsBar ? (
            <Bar
              yAxisId='r'
              name='사용 시간'
              dataKey='duration'
              fill='#f59e0b'
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              isAnimationActive={false}
            />
          ) : null}
          {showDuration && !durationAsBar ? (
            <Line
              yAxisId='r'
              name='사용 시간'
              type='monotone'
              dataKey='duration'
              stroke='#f59e0b'
              strokeWidth={2}
              dot={{ r: 2 }}
              isAnimationActive={false}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
