import type { KioskButtonStatsSummaryBlock } from '@/hooks/kiosk-api/kioskButtonStatsTypes';
// 실데이터 리포트 뷰 — useStatReportLive 훅으로 서버 집계를 조합해 렌더.
// P2 서버 API 연동 완료: 시간대·오전/오후·요일·카테고리별 1위·의상 매트릭스·월별 통계.
// AI 종합 분석은 실데이터 규칙 기반 자동 작성(aiAnalysis.ts, 무과금) — 외부 API 교체 여지 유지.
import { useEffect, useMemo, useState } from 'react';
import s from './StatReports.module.css';
import { ButtonUsageChart, CompareBarChart, Diff, EditableAiCard, KpiRow, Section, type UsageMetric } from './StatReportParts';
import { buildButtonAi, buildShootingAi } from './aiAnalysis';
import { chunkKioskCols } from './ShootingReportView';
import { kioskButtonLabel } from '@/features/kiosk/manage/kioskButtonDisplay';
import { KioskHomeStatsMirror } from './KioskHomeStatsMirror';
import { isOnRedesignHome, redesignSiteOf } from './RedesignHomeStatsMirror';
import type { KioskButtonDto } from '@/hooks/kiosk-api/kioskButtonsTypes';
import { fmtMD, type KpiItem } from './statReportsMockData';
import { NewOutfitsSection } from './NewOutfitsSection';
import {
  diffBadge,
  fmtDurationSec,
  monthRangesOf,
  weekRangesOf,
  useButtonsLive,
  useReportKioskButtons,
  useOutfitByKiosk,
  useOutfitCategoryTop,
  useOutfitMonthly,
  useOutfitTopLive,
  useShootingDailyLive,
  useShootingMonthlyLive,
  useShotsGender,
  useShotsHourly,
  useShotsWeekday,
  type CategoryTop,
  type GenderCounts,
  type ShotGenderData,
  type LiveOutfitCard,
  type OutfitByKioskData,
  type OutfitMonthlyData,
} from './useStatReportLive';

const AI_NOTE = "※ 실데이터 기반 자동 작성(무과금). '내용 수정'으로 다운로드 전 직접 가필할 수 있습니다.";
const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

/** "code · category" → "카테고리 1위 셀" 표기 통일 */
function winnerCell(w: { name: string; code: string; count: number } | null): string {
  return w ? `${w.name} / ${w.count}건` : '—';
}

/** 카테고리별 1위 표 (전체 · 키오스크별) — 실데이터. 지점 리포트는 overallLabel 에 지점명을 넘겨 '전체' 대신 쓴다. */
function LiveCatWinners({ rows, overallLabel = '전체' }: { rows: CategoryTop[]; overallLabel?: string }) {
  if (rows.length === 0) return <EmptyNote title='기간 내 카테고리 촬영 데이터가 없습니다' />;
  // 키오스크 열 = 전체 카테고리에 등장하는 키오스크 합집합(순서 안정)
  const kioskMap = new Map<number, string>();
  for (const r of rows) for (const k of r.byKiosk) if (!kioskMap.has(k.kioskId)) kioskMap.set(k.kioskId, k.kioskName);
  // 열 순서는 키오스크 번호순 — 등장 순서로 두면 첫 카테고리에 나온 지점(예: 제주)이 맨 앞에 섰다
  const kiosks = [...kioskMap.entries()].sort(([a], [b]) => a - b).map(([id, name]) => ({ id, name }));
  const idxChunks = chunkKioskCols(kiosks.map((_, i) => i));
  return (
    <>
      {idxChunks.map((chunk, ci) => (
        <table key={ci} className={`${s.table} ${s.tableFixed}`} style={ci > 0 ? { marginTop: 10 } : undefined}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>카테고리</th>
              {ci === 0 ? <th>{overallLabel}</th> : null}
              {chunk.map((i) => <th key={kiosks[i].id}>{kiosks[i].name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const byId = new Map(r.byKiosk.map((k) => [k.kioskId, k]));
              return (
                <tr key={r.category}>
                  <td className={`${s.tdL} ${s.tdB}`}>{r.category}</td>
                  {ci === 0 ? <td className={s.tdB}>{winnerCell(r.overall)}</td> : null}
                  {chunk.map((i) => <td key={kiosks[i].id}>{winnerCell(byId.get(kiosks[i].id) ?? null)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      ))}
    </>
  );
}

/** 키오스크별 전체 의상 매트릭스 표 — 실데이터 */
function LiveOutfitByKiosk({ data }: { data?: OutfitByKioskData }) {
  if (!data || data.outfits.length === 0) return <EmptyNote title='기간 내 의상 촬영 데이터가 없습니다' />;
  const idxChunks = chunkKioskCols(data.kiosks.map((_, i) => i));
  return (
    <>
      {idxChunks.map((chunk, ci, arr) => {
        const isLast = ci === arr.length - 1;
        return (
          <table key={ci} className={s.table} style={ci > 0 ? { marginTop: 10 } : undefined}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>의상</th>
                {ci === 0 ? <th>카테고리</th> : null}
                {chunk.map((i) => <th key={data.kiosks[i].id}>{data.kiosks[i].name}</th>)}
                {isLast ? <th>합계</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.outfits.map((o) => (
                <tr key={o.code}>
                  <td className={s.tdL}>{o.name}<span className={s.code}>{o.code}</span></td>
                  {ci === 0 ? <td>{o.category}</td> : null}
                  {chunk.map((i) => {
                    const v = o.perKiosk[i] ?? 0;
                    const isTop = v > 0 && v === Math.max(...data.outfits.map((x) => x.perKiosk[i] ?? 0));
                    return <td key={data.kiosks[i].id} className={isTop ? s.tdB : ''}>{v}</td>;
                  })}
                  {isLast ? <td className={s.tdB}>{o.total}</td> : null}
                </tr>
              ))}
              <tr className={s.sumRow}>
                <td className={s.tdL}>합계</td>
                {ci === 0 ? <td>—</td> : null}
                {chunk.map((i) => <td key={data.kiosks[i].id}>{data.colTotals[i] ?? 0}</td>)}
                {isLast ? <td>{data.colTotals.reduce((a, b) => a + b, 0)}</td> : null}
              </tr>
            </tbody>
          </table>
        );
      })}
    </>
  );
}

/** 의상 월별 통계 — 월 구간별로 페이지 분리(각 표가 A4 한 장에 정상 크기로 들어가도록) */
function LiveOutfitMonthly({ data, year, footer }: { data?: OutfitMonthlyData; year: number; footer?: React.ReactNode }) {
  if (!data || data.outfits.length === 0) {
    return (
      <div data-report-page>
        <Section title='인기 의상 월별 통계' sub={`${year}년 · 실데이터`}>
          <EmptyNote title='해당 연도 의상 촬영 데이터가 없습니다' />
        </Section>
        {footer}
      </div>
    );
  }
  const colSums = MONTH_LABELS.map((_, m) => data.outfits.reduce((a, o) => a + (o.months[m] ?? 0), 0));
  const grand = colSums.reduce((a, b) => a + b, 0);
  const monthChunks = chunkKioskCols(MONTH_LABELS.map((_, i) => i), 8, 8);
  return (
    <>
      {monthChunks.map((chunk, ci, arr) => {
        const isLast = ci === arr.length - 1;
        const rangeLabel = `${MONTH_LABELS[chunk[0]]}~${MONTH_LABELS[chunk[chunk.length - 1]]}`;
        return (
          <div data-report-page key={ci}>
            <Section title={`인기 의상 월별 통계 (${rangeLabel})`} sub={`${year}년 · 실데이터`}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>의상</th>
                    {chunk.map((i) => <th key={i}>{MONTH_LABELS[i]}</th>)}
                    {isLast ? <th>합계</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {data.outfits.map((o) => (
                    <tr key={o.code}>
                      <td className={s.tdL}>{o.name}<span className={s.code}>{o.code}</span></td>
                      {chunk.map((i) => <td key={i}>{(o.months[i] ?? 0).toLocaleString()}</td>)}
                      {isLast ? <td className={s.tdB}>{o.total.toLocaleString()}</td> : null}
                    </tr>
                  ))}
                  <tr className={s.sumRow}>
                    <td className={s.tdL}>전체 합계</td>
                    {chunk.map((i) => <td key={i}>{colSums[i].toLocaleString()}</td>)}
                    {isLast ? <td>{grand.toLocaleString()}</td> : null}
                  </tr>
                </tbody>
              </table>
            </Section>
            {isLast ? footer : null}
          </div>
        );
      })}
    </>
  );
}

function LoadingCard({ text }: { text: string }) {
  return <div className={s.kioskBlock} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{text}</div>;
}

/** 빈 데이터 표시 — 집계 자체가 없는 구간을 명확히 알린다 */
/* ── 지점별 상세의 성별 — 고른 의상 기준(남자 의상=남, 여자 의상=여, 2026-10-28 사용자 결정) ── */
const GENDER_NOTE = '성별의 경우 선택한 의상(남성, 여성 전용)으로 판별. 성별 구분이 없는 의상은 총 건수에만 포함.';

/** 지점(표시명)의 성별 집계. 이름을 빼면 전체 합계. 집계가 아직 없으면 undefined(건수만 표시). */
function genderOf(d: ShotGenderData | undefined, kioskName?: string): GenderCounts | undefined {
  if (!d) return undefined;
  if (!kioskName) return d;
  return d.kiosks.find((k) => k.kioskName === kioskName) ?? { male: 0, female: 0, unspecified: 0 };
}

/** "628건 (남 191 / 여 410)" */
function CountWithGender({ count, g }: { count: number; g?: GenderCounts }) {
  return (
    <>
      {count.toLocaleString()}건
      {g ? <span className={s.genderSplit}> (남 {g.male.toLocaleString()} / 여 {g.female.toLocaleString()})</span> : null}
    </>
  );
}

/** 남·여 중 비율 "31.8% : 68.2%" — 남녀 모두 0 이면 — */
function genderRatio(g?: GenderCounts): string {
  const mf = g ? g.male + g.female : 0;
  if (!g || mf === 0) return '—';
  const m = Math.round((g.male / mf) * 1000) / 10;
  return `${m}% : ${Math.round((100 - m) * 10) / 10}%`;
}

export function EmptyNote({ title, hint }: { title?: string; hint?: string | null }) {
  // hint === null 이면 서브텍스트를 아예 표시하지 않음. undefined면 기본 문구.
  const sub = hint === undefined ? '해당 기간에 수집된 데이터가 없어 표시할 내용이 없습니다.' : hint;
  return (
    <div className={s.emptyBox}>
      <div className={s.emptyBoxTitle}>📭 {title ?? '아직 집계된 데이터가 없습니다'}</div>
      {sub ? <div className={s.emptyBoxHint}>{sub}</div> : null}
    </div>
  );
}

/* ── 의상 TOP 10 (실물 사진) ── */
/** 인기 의상 TOP 10 사진 카드. 순위표는 2026-10-28 사용자 요청으로 뺐다(카테고리별 1위는 다음 페이지). */
function LiveOutfitGallery({ cards }: { cards: LiveOutfitCard[] }) {
  if (cards.length === 0) return <EmptyNote title='기간 내 의상 촬영 데이터가 없습니다' hint='의상 촬영이 집계되면 실물 사진과 함께 표시됩니다.' />;
  return (
    <>
      <div className={`${s.gal} ${s.galTop}`}>
        {cards.map((o) => (
          <div key={`${o.rank}-${o.code}`} className={s.gcard}>
            <span className={s.gcardRank}>{o.rank}</span>
            {o.imageUrl ? (
              <img src={o.imageUrl} alt={o.name} className={s.gcardImg} style={{ objectFit: 'contain' }} />
            ) : (
              <div className={s.gcardImg} style={{ background: 'linear-gradient(135deg, #e2e8f0, #f1f5f9)' }}>👘</div>
            )}
            <div className={s.gcardMeta}>
              <span className={s.gcardName}>{o.name}</span>
              <span className={s.gcardCat}>{o.cat ?? ' '}</span>
            </div>
            <div className={s.gcardFooter}>
              <span className={s.gcardFooterLabel}>촬영 건수</span>
              <span className={s.gcardFooterVal}>{o.cnt.toLocaleString()}건</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── 촬영 리포트 (주간) ── */
export function ShootingWeeklyLiveView({ anchor }: { anchor?: string }) {
  const r = weekRangesOf(anchor);
  const cur = useShootingDailyLive(r.start, r.end, true);
  const prev = useShootingDailyLive(r.prevStart, r.prevEnd, true);
  const monthly = useShootingMonthlyLive(true);
  const outfits = useOutfitTopLive(r.start, r.end, true);
  const hourly = useShotsHourly(r.start, r.end, true);
  const catTop = useOutfitCategoryTop(r.start, r.end, true);
  const outfitMatrix = useOutfitByKiosk(r.start, r.end, true);
  const gender = useShotsGender(r.start, r.end, true);
  const genderPrev = useShotsGender(r.prevStart, r.prevEnd, true);

  if (cur.isPending) return <LoadingCard text='실데이터를 불러오는 중…' />;
  if (cur.isError) return <LoadingCard text='촬영 통계를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' />;

  const kioskNames = cur.data?.kioskNames ?? [];
  const rows = cur.data?.rows ?? [];
  const total = rows.reduce((a, row) => a + Number(row.total ?? 0), 0);
  const prevTotal = (prev.data?.rows ?? []).reduce((a, row) => a + Number(row.total ?? 0), 0);
  const weekend = rows.slice(-2).reduce((a, row) => a + Number(row.total ?? 0), 0);
  const cumTotal = (monthly.data?.rows ?? []).reduce((a, row) => a + Number(row.total ?? 0), 0);
  const badge = diffBadge(total, prevTotal, '건', '전주 대비');

  const siteTotals = kioskNames.map((k) => rows.reduce((a, row) => a + Number(row[k] ?? 0), 0));
  const sitePrev = kioskNames.map((k) => (prev.data?.rows ?? []).reduce((a, row) => a + Number(row[k] ?? 0), 0));

  const am = hourly.data?.amCount ?? 0;
  const pm = hourly.data?.pmCount ?? 0;
  const amPmTotal = am + pm;
  const peakHour = (hourly.data?.hourly ?? []).reduce((best, h) => (h.count > best.count ? h : best), { hour: -1, count: -1 });

  const kpis: KpiItem[] = [
    { label: '총 촬영', value: `${total.toLocaleString()}건`, diff: badge?.text, dir: badge?.dir },
    { label: '일평균', value: `${(total / 7).toFixed(1)}건` },
    { label: '주말 비중', value: total > 0 ? `${Math.round((weekend / total) * 100)}%` : '—', hint: `토·일 ${weekend.toLocaleString()}건` },
    {
      label: '오전 / 오후',
      value: amPmTotal > 0 ? `${Math.round((am / amPmTotal) * 100)}/${Math.round((pm / amPmTotal) * 100)}%` : '—',
      hint: peakHour.hour >= 0 ? `피크 ${peakHour.hour}시` : undefined,
    },
    { label: '총 누적 촬영', value: `${cumTotal.toLocaleString()}건` },
  ];

  const weekdayTrend = rows.map((row, i) => ({
    label: String(row.date ?? '').slice(5),
    cur: Number(row.total ?? 0),
    prev: Number(prev.data?.rows?.[i]?.total ?? 0) || undefined,
  }));

  const topOutfitCard = (outfits.data ?? [])[0];
  const ai = buildShootingAi({
    periodLabel: '전주',
    total,
    prevTotal,
    am,
    pm,
    peakHour: peakHour.hour,
    weekendRatio: total > 0 ? weekend / total : null,
    sites: kioskNames.map((k, i) => ({ name: k, cur: siteTotals[i], prev: sitePrev[i] })),
    topOutfit: topOutfitCard ? { name: topOutfitCard.name, count: topOutfitCard.cnt } : null,
  });

  return (
    <div className={s.report} data-report-root data-report-title='주간 촬영 통계 리포트'>
      <div data-report-page>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <h2 className={s.headTitle}>주간 촬영 통계 리포트</h2>
            <p className={s.headSub}>대상 기간: {r.start} ~ {r.end} · {kioskNames.length}개 지점 · 실데이터</p>
          </div>
          <div className={s.headMeta}><b>주간 촬영 통계 리포트</b></div>
        </div>
      </div>
      <KpiRow items={kpis} />
      {total === 0 ? <div style={{ marginTop: 12 }}><EmptyNote title='이번 기간에는 촬영 데이터가 없습니다' hint='집계 기간 내 촬영이 발생하면 그래프·상세 표가 채워집니다.' /></div> : null}

      <Section title='주간 추이' sub='일별 총 촬영 · 전주 대비 비교(점선)'>
        <div className={s.row2}>
          <CompareBarChart title='일별 총 촬영 — 금주(막대) vs 전주(점선)' data={weekdayTrend} curName={`금주 ${total.toLocaleString()}건`} prevName={`전주 ${prevTotal.toLocaleString()}건`} />
          <CompareBarChart
            title={`시간대별 촬영 분포 · 오전 ${am} / 오후 ${pm}`}
            data={(hourly.data?.hourly ?? []).filter((h) => h.count > 0 || (h.hour >= 8 && h.hour <= 20)).map((h) => ({ label: `${h.hour}`, cur: h.count }))}
            curName='촬영 건수'
            color='#f59e0b'
          />
        </div>
      </Section>

      <Section title='AI 종합 분석' sub='실데이터 자동 작성 · 수정 가능'>
        <EditableAiCard tag='AI WEEKLY INSIGHT' overall={ai.overall} sites={ai.sites} note={AI_NOTE} />
      </Section>

      </div>

      {/* 신규 의상은 카드 높이가 커서 1페이지 끝에 두면 제목만 남고 카드가 다음 장으로 넘어갔다.
          섹션 통째로 다음 페이지로 내리고, 남는 공간은 지점별·일별 상세로 채운다. */}
      <div data-report-page>
      <NewOutfitsSection periodLabel='이번 주' start={r.start} end={r.end} mode='live' />
      <div data-report-keep>
      <Section title='지점별 상세' sub={`전체 · 전주 대비 · ${GENDER_NOTE}`}>
        <table className={s.table}>
          <thead>
            <tr><th>지점</th><th>촬영</th><th>전주</th><th>증감</th><th>남:여 비율</th></tr>
          </thead>
          <tbody>
            {kioskNames.map((k, i) => {
              const b = diffBadge(siteTotals[i], sitePrev[i], '건', '');
              return (
                <tr key={k}>
                  <td className={`${s.tdL} ${s.tdB}`}>{k}</td>
                  <td className={s.tdB}><CountWithGender count={siteTotals[i]} g={genderOf(gender.data, k)} /></td>
                  <td><CountWithGender count={sitePrev[i]} g={genderOf(genderPrev.data, k)} /></td>
                  <td>{b ? <Diff text={b.text.replace(/^ /, '').split(' (')[0].trim()} /> : '—'}</td>
                  <td>{genderRatio(genderOf(gender.data, k))}</td>
                </tr>
              );
            })}
            <tr className={s.sumRow}>
              <td className={s.tdL}>합계</td>
              <td><CountWithGender count={total} g={genderOf(gender.data)} /></td>
              <td><CountWithGender count={prevTotal} g={genderOf(genderPrev.data)} /></td>
              <td>{badge ? <Diff text={badge.text.split(' (')[0].replace('전주 대비 ', '')} /> : '—'}</td>
              <td>{genderRatio(genderOf(gender.data))}</td>
            </tr>
          </tbody>
        </table>
      </Section>
      </div>

      <div data-report-keep>
      <Section title='일별 상세' sub='키오스크 세로 × 일자 가로'>
        {rows.length === 0 ? (
          <EmptyNote />
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>지점</th>
                {rows.map((row) => <th key={String(row.date)}>{fmtMD(String(row.date))}</th>)}
                <th>합계</th>
              </tr>
            </thead>
            <tbody>
              {kioskNames.map((k, i) => (
                <tr key={k}>
                  <td className={`${s.tdL} ${s.tdB}`}>{k}</td>
                  {rows.map((row) => <td key={String(row.date)}>{Number(row[k] ?? 0).toLocaleString()}</td>)}
                  <td className={s.tdB}>{siteTotals[i].toLocaleString()}</td>
                </tr>
              ))}
              <tr className={s.sumRow}>
                <td className={s.tdL}>합계</td>
                {rows.map((row) => <td key={String(row.date)}>{Number(row.total ?? 0).toLocaleString()}</td>)}
                <td>{total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Section>
      </div>

</div>

      <div data-report-page>
      <Section title='이번 주 인기 의상 TOP 10' sub='실물 등록 사진 · 실데이터'>
        {outfits.isPending ? <LoadingCard text='의상 랭킹을 불러오는 중…' /> : <LiveOutfitGallery cards={outfits.data ?? []} />}
      </Section>
      </div>

      {/* 카테고리별 1위는 독립 페이지 — 지점이 늘면 표가 둘로 나뉘어 TOP 10 과 한 장에 들어가지 않는다(2026-10-28 사용자 결정) */}
      <div data-report-page>
      <Section title='카테고리별 1위 의상' sub='전체 · 키오스크별 · 실데이터'>
        {catTop.isPending ? <LoadingCard text='불러오는 중…' /> : <LiveCatWinners rows={catTop.data ?? []} />}
      </Section>
      </div>

      <div data-report-page>
      <Section title='키오스크별 전체 의상 통계' sub='전체 의상 × 키오스크 촬영 건수 · 굵게 = 각 키오스크 1위'>
        {outfitMatrix.isPending ? <LoadingCard text='불러오는 중…' /> : <LiveOutfitByKiosk data={outfitMatrix.data} />}
      </Section>

      <p className={s.footer}>집계 기준: AR 촬영 완료 건 · 실데이터(서버 집계)</p>
      </div>
    </div>
  );
}

/* ── 촬영 리포트 (월간) ── */
/**
 * 월간 촬영 리포트. 지점을 고르면(kioskSel) 그 지점만의 리포트가 되고, PDF 도 화면 그대로 그 지점으로 나간다(2026-10-28 사용자 요청 —
 * 키오스크별 분리 추출). 지점 목록은 그 달 촬영이 있는 지점(성별 집계 응답)에서 올려 준다.
 */
export function ShootingMonthlyLiveView({
  ym,
  kioskSel = 'ALL',
  onKiosks,
}: {
  ym?: string;
  kioskSel?: 'ALL' | number;
  onKiosks?: (list: ReportKioskOption[]) => void;
}) {
  const r = monthRangesOf(ym);
  const kioskId = kioskSel === 'ALL' ? undefined : kioskSel;
  const cur = useShootingDailyLive(r.start, r.end, true);
  const monthly = useShootingMonthlyLive(true);
  const outfits = useOutfitTopLive(r.start, r.end, true, kioskId);
  const hourly = useShotsHourly(r.start, r.end, true, kioskId);
  const weekday = useShotsWeekday(r.start, r.end, true, kioskId);
  const catTop = useOutfitCategoryTop(r.start, r.end, true);
  const year = Number(r.start.slice(0, 4));
  const outfitMonthlyMatrix = useOutfitMonthly(year, true, kioskId);
  const genderAll = useShotsGender(r.start, r.end, true);
  const gender = useShotsGender(r.start, r.end, true, kioskId);
  const genderPrev = useShotsGender(r.prevStart, r.prevEnd, true, kioskId);

  const kioskOptions = genderAll.data?.kiosks;
  useEffect(() => {
    if (onKiosks && kioskOptions) onKiosks(kioskOptions.map((k) => ({ id: k.kioskId, name: k.kioskName })));
  }, [onKiosks, kioskOptions]);

  if (cur.isPending || monthly.isPending) return <LoadingCard text='실데이터를 불러오는 중…' />;
  if (cur.isError) return <LoadingCard text='촬영 통계를 불러오지 못했습니다.' />;

  // 지점 리포트면 일별·월별 표의 그 지점 열만 본다(열 이름 = 표시명).
  const selName = kioskId ? kioskOptions?.find((k) => k.kioskId === kioskId)?.kioskName : undefined;
  const rowTotal = (row: Record<string, string | number>) => Number((selName ? row[selName] : row.total) ?? 0);
  const allNames = cur.data?.kioskNames ?? [];
  const kioskNames = selName ? allNames.filter((n) => n === selName) : allNames;
  const rows = cur.data?.rows ?? [];
  const total = rows.reduce((a, row) => a + rowTotal(row), 0);
  const days = rows.length || 1;
  const cumTotal = (monthly.data?.rows ?? []).reduce((a, row) => a + rowTotal(row), 0);
  // 카테고리별 1위 — 지점 리포트는 그 지점의 1위만(표의 '전체' 열 = 이 지점)
  const catRows = kioskId
    ? (catTop.data ?? []).flatMap((c) => {
        const k = c.byKiosk.find((x) => x.kioskId === kioskId);
        return k ? [{ ...c, overall: { name: k.name, code: k.code, count: k.count }, byKiosk: [] }] : [];
      })
    : (catTop.data ?? []);
  const scope = selName ? ` · ${selName}` : '';

  // 전월 합계: 월별 집계에서 직전 2개월 행 비교
  const monthRows = monthly.data?.rows ?? [];
  const curMonthKey = r.start.slice(0, 7);
  const curIdx = monthRows.findIndex((row) => String(row.month) === curMonthKey);
  const prevRow = curIdx >= 0 ? monthRows[curIdx + 1] : undefined;
  const prevTotal = prevRow ? rowTotal(prevRow) : 0;
  const badge = diffBadge(total, prevTotal, '건', '전월 대비');

  // 주차별 집계(7일 단위)
  const weeks: { label: string; cur: number }[] = [];
  for (let i = 0; i < rows.length; i += 7) {
    const chunk = rows.slice(i, i + 7);
    weeks.push({ label: `${Math.floor(i / 7) + 1}주`, cur: chunk.reduce((a, row) => a + rowTotal(row), 0) });
  }

  const siteTotals = kioskNames.map((k) => rows.reduce((a, row) => a + Number(row[k] ?? 0), 0));
  const sitePrev = kioskNames.map((k) => Number(prevRow?.[k] ?? 0));

  const am = hourly.data?.amCount ?? 0;
  const pm = hourly.data?.pmCount ?? 0;
  const amPmTotal = am + pm;
  const peakHour = (hourly.data?.hourly ?? []).reduce((best, h) => (h.count > best.count ? h : best), { hour: -1, count: -1 });
  const weekdayRows = weekday.data ?? [];
  const weekendTotal = weekdayRows.filter((w) => w.weekday === '토' || w.weekday === '일').reduce((a, w) => a + w.total, 0);

  const topOutfitCard = (outfits.data ?? [])[0];
  const ai = buildShootingAi({
    periodLabel: '전월',
    total,
    prevTotal,
    am,
    pm,
    peakHour: peakHour.hour,
    weekendRatio: total > 0 ? weekendTotal / total : null,
    sites: kioskNames.map((k, i) => ({ name: k, cur: siteTotals[i], prev: sitePrev[i] })),
    topOutfit: topOutfitCard ? { name: topOutfitCard.name, count: topOutfitCard.cnt } : null,
  });

  return (
    <div className={s.report} data-report-root data-report-title={`월간 촬영 통계 리포트${selName ? `_${selName}` : ''}`}>
      <div data-report-page>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <h2 className={s.headTitle}>월간 촬영 통계 리포트{selName ? ` — ${selName}` : ''}</h2>
            <p className={s.headSub}>
              대상: {r.label} ({r.start} ~ {r.end}) · {selName ? '지점 리포트' : `${kioskNames.length}개 지점`} · 실데이터
            </p>
          </div>
          <div className={s.headMeta}><b>월간 촬영 통계 리포트</b></div>
        </div>
      </div>
      <KpiRow items={[
        { label: '월 총 촬영', value: `${total.toLocaleString()}건`, diff: badge?.text, dir: badge?.dir },
        { label: '일평균', value: `${(total / days).toFixed(1)}건` },
        {
          label: '오전 / 오후',
          value: amPmTotal > 0 ? `${Math.round((am / amPmTotal) * 100)}/${Math.round((pm / amPmTotal) * 100)}%` : '—',
          hint: peakHour.hour >= 0 ? `피크 ${peakHour.hour}시` : undefined,
        },
        {
          label: '주말 비중',
          value: total > 0 ? `${Math.round((weekendTotal / total) * 100)}%` : '—',
          hint: `주말 ${weekendTotal.toLocaleString()}건`,
        },
        { label: '총 누적 촬영', value: `${cumTotal.toLocaleString()}건` },
      ]} />
      {total === 0 ? <div style={{ marginTop: 12 }}><EmptyNote title='이번 달에는 촬영 데이터가 없습니다' hint='집계 기간 내 촬영이 발생하면 그래프·상세 표가 채워집니다.' /></div> : null}

      <Section title='월간 추이' sub='주차별 촬영 · 요일별 일평균(실데이터)'>
        <div className={s.row2}>
          <CompareBarChart title={`주차별 촬영 (${r.label})`} data={weeks} curName={`월 합계 ${total.toLocaleString()}건`} />
          <CompareBarChart
            title='요일별 일평균 촬영'
            data={weekdayRows.map((w) => ({ label: w.weekday, cur: Math.round(w.avg * 10) / 10 }))}
            curName='일평균(건)'
            color='#f59e0b'
          />
        </div>
      </Section>

      <Section title='AI 종합 분석' sub='실데이터 자동 작성 · 수정 가능'>
        <EditableAiCard tag='AI MONTHLY INSIGHT' overall={ai.overall} sites={ai.sites} note={AI_NOTE} />
      </Section>

      </div>

      {/* 신규 의상 섹션을 통째로 다음 페이지로(제목만 남고 카드가 넘어가는 것 방지) — 남는 공간은 지점별 상세로 */}
      <div data-report-page>
      <NewOutfitsSection periodLabel='이번 달' start={r.start} end={r.end} mode='live' />
      <div data-report-keep>
      <Section title={selName ? '지점 상세' : '지점별 상세'} sub={`전체 · 전월 대비 · ${GENDER_NOTE}`}>
        <table className={s.table}>
          <thead>
            <tr><th>지점</th><th>당월</th><th>전월</th><th>증감</th><th>남:여 비율</th></tr>
          </thead>
          <tbody>
            {kioskNames.map((k, i) => {
              const b = diffBadge(siteTotals[i], sitePrev[i], '건', '');
              return (
                <tr key={k}>
                  <td className={`${s.tdL} ${s.tdB}`}>{k}</td>
                  <td className={s.tdB}><CountWithGender count={siteTotals[i]} g={genderOf(gender.data, k)} /></td>
                  <td><CountWithGender count={sitePrev[i]} g={genderOf(genderPrev.data, k)} /></td>
                  <td>{b ? <Diff text={b.text.split(' (')[0].trim()} /> : '—'}</td>
                  <td>{genderRatio(genderOf(gender.data, k))}</td>
                </tr>
              );
            })}
            <tr className={s.sumRow}>
              <td className={s.tdL}>합계</td>
              <td><CountWithGender count={total} g={genderOf(gender.data)} /></td>
              <td><CountWithGender count={prevTotal} g={genderOf(genderPrev.data)} /></td>
              <td>{badge ? <Diff text={badge.text.split(' (')[0].replace('전월 대비 ', '')} /> : '—'}</td>
              <td>{genderRatio(genderOf(gender.data))}</td>
            </tr>
          </tbody>
        </table>
      </Section>
      </div>

</div>

      <div data-report-page>
      <Section title='이번 달 인기 의상 TOP 10' sub={`실물 등록 사진 · 실데이터${scope}`}>
        {outfits.isPending ? <LoadingCard text='의상 랭킹을 불러오는 중…' /> : <LiveOutfitGallery cards={outfits.data ?? []} />}
      </Section>
      </div>

      <div data-report-page>
      <Section title='카테고리별 1위 의상' sub={`${selName ? selName : '전체 · 키오스크별'} (${r.label} 기준) · 실데이터`}>
        {catTop.isPending ? <LoadingCard text='불러오는 중…' /> : <LiveCatWinners rows={catRows} overallLabel={selName} />}
      </Section>
      </div>

      {outfitMonthlyMatrix.isPending ? (
        <div data-report-page>
          <Section title='인기 의상 월별 통계' sub={`${year}년 · 실데이터`}><LoadingCard text='불러오는 중…' /></Section>
        </div>
      ) : (
        <LiveOutfitMonthly
          data={outfitMonthlyMatrix.data}
          year={year}
          footer={<p className={s.footer}>집계 기준: AR 촬영 완료 건 · 실데이터(서버 집계)</p>}
        />
      )}
    </div>
  );
}

/* ── 버튼 리포트 (주간/월간) ── */
export type ReportKioskOption = { id: number; name: string };

type KioskRow = NonNullable<KioskButtonStatsSummaryBlock['kioskButtonDetails']>[number];

/** 오색시장·화성휴게소는 2026-10 새 홈에 없는 버튼을 집계하지 않는다(사용자 결정) — 그 행을 빼고 합계도 다시 맞춘다. */
function isCountedRow(row: { kioskId: number; kioskName: string; buttonName?: string | null; buttonType: string }, catalog?: Record<string, KioskButtonDto[]>): boolean {
  const site = redesignSiteOf(row.kioskId, row.kioskName);
  return !site || isOnRedesignHome(site, row, catalog?.[row.kioskName] ?? []);
}

function withoutOffScreenButtons(
  block: KioskButtonStatsSummaryBlock | null | undefined,
  catalog?: Record<string, KioskButtonDto[]>,
): KioskButtonStatsSummaryBlock | null {
  if (!block) return null;
  const rows = block.kioskButtonDetails ?? [];
  const dropped = rows.filter((row) => !isCountedRow(row, catalog));
  if (dropped.length === 0) return block;

  // 버튼타입별 전 지점 합계(buttonDetails)에서도 뺀 만큼 덜어 낸다 — 같은 이름이 다른 지점에도 있을 수 있어 행째 지우지 않는다.
  const minus = new Map<string, { clicks: number; duration: number }>();
  for (const row of dropped) {
    const cu = minus.get(row.buttonType) ?? { clicks: 0, duration: 0 };
    cu.clicks += row.totalClicks;
    cu.duration += row.totalDuration;
    minus.set(row.buttonType, cu);
  }
  const buttonDetails = block.buttonDetails
    .map((d) => {
      const m = minus.get(d.buttonType);
      if (!m) return d;
      const totalClicks = Math.max(0, d.totalClicks - m.clicks);
      const totalDuration = Math.max(0, d.totalDuration - m.duration);
      return { ...d, totalClicks, totalDuration, avgDuration: totalClicks > 0 ? totalDuration / totalClicks : 0 };
    })
    .filter((d) => d.totalClicks > 0);
  const totalClicks = Math.max(0, block.totalClicks - dropped.reduce((a, r) => a + r.totalClicks, 0));
  const totalDuration = Math.max(0, block.totalDuration - dropped.reduce((a, r) => a + r.totalDuration, 0));
  return {
    ...block,
    totalClicks,
    totalDuration,
    avgDuration: totalClicks > 0 ? totalDuration / totalClicks : 0,
    buttonDetails,
    kioskButtonDetails: rows.filter((row) => isCountedRow(row, catalog)),
  };
}

export function ButtonLiveView({
  variant,
  anchor,
  ym,
  exportMode = false,
  kioskSel = 'ALL',
  onKiosks,
}: {
  variant: 'weekly' | 'monthly';
  anchor?: string;
  ym?: string;
  /** PDF 생성 중 — 화면 필터를 무시하고 항상 전체 리포트를 렌더한다. */
  exportMode?: boolean;
  /** 화면에서 고른 지점(상단 대상 기간 바의 드롭다운). */
  kioskSel?: 'ALL' | number;
  /** 드롭다운 옵션을 상단 바에서 그리도록 지점 목록을 올려 보낸다(리포트가 실제로 가진 지점만). */
  onKiosks?: (list: ReportKioskOption[]) => void;
}) {
  const r = variant === 'weekly' ? weekRangesOf(anchor) : monthRangesOf(ym);
  const prevLabel = variant === 'weekly' ? '전주' : '전월';
  const live = useButtonsLive(r.start, r.end, r.prevStart, r.prevEnd, true);
  const catalog = useReportKioskButtons(true); // 홈 버튼 전체(클릭 0 포함)
  // 오색·화성은 새 홈에 없는 버튼을 뺀 수치로 리포트 전체(합계·그래프·표·AI)를 만든다.
  const curData = useMemo(() => withoutOffScreenButtons(live.cur.data, catalog.data), [live.cur.data, catalog.data]);
  const prevData = useMemo(() => withoutOffScreenButtons(live.prev.data, catalog.data), [live.prev.data, catalog.data]);
  const cumData = useMemo(() => withoutOffScreenButtons(live.cum.data, catalog.data), [live.cum.data, catalog.data]);
  const cur = { ...live.cur, data: curData };
  const prev = { ...live.prev, data: prevData };
  const cum = { ...live.cum, data: cumData };
  // 그래프 계열 선택은 그래프 옆에 두므로 이 뷰가 갖는다. 지점 선택은 상단 바(패널)에서 내려온다.
  const [metric, setMetric] = useState<UsageMetric>('ALL');
  const effKiosk: 'ALL' | number = exportMode ? 'ALL' : kioskSel;
  const effMetric: UsageMetric = exportMode ? 'ALL' : metric;

  // 지점 목록(금기·전기·누적 합집합) — 훅 순서를 지키려 early return 앞에서 계산한다.
  const kioskOptions = useMemo<ReportKioskOption[]>(() => {
    const order = new Map<string, number>();
    for (const b of [cur.data, prev.data, cum.data]) {
      for (const row of b?.kioskButtonDetails ?? []) {
        if (!order.has(row.kioskName)) order.set(row.kioskName, row.kioskId);
      }
    }
    return [...order.entries()].sort((a, b) => a[1] - b[1]).map(([name, id]) => ({ id, name }));
  }, [cur.data, prev.data, cum.data]);

  useEffect(() => {
    onKiosks?.(kioskOptions);
  }, [kioskOptions, onKiosks]);

  if (cur.isPending) return <LoadingCard text='실데이터를 불러오는 중…' />;
  if (cur.isError) return <LoadingCard text='버튼 통계를 불러오지 못했습니다.' />;

  const block = cur.data;
  if (!block || block.totalClicks === 0) {
    return <EmptyNote title='기간 내 버튼 사용 데이터가 없습니다' hint='해당 기간에 홈 버튼 클릭이 집계되면 리포트가 채워집니다.' />;
  }

  const prevBlock = prev.data ?? null;
  const cumBlock = cum.data ?? null;
  const badge = diffBadge(block.totalClicks, prevBlock?.totalClicks ?? 0, '회', `${prevLabel} 대비`);

  // 지점별 집계 — 반드시 kioskButtonDetails 를 쓴다.
  // buttonDetails 는 버튼타입별로 전 지점을 합친 1행이고 representativeKioskName 은 '최다 클릭 지점'이라,
  // 그걸로 그룹핑하면 지점마다 자기가 1위인 버튼만 남고 수치는 전 지점 합계가 된다(과거 버그).
  const byKiosk = new Map<string, { rows: KioskRow[]; clicks: number; duration: number }>();
  for (const row of block.kioskButtonDetails ?? []) {
    const cu = byKiosk.get(row.kioskName) ?? { rows: [], clicks: 0, duration: 0 };
    cu.rows.push(row);
    cu.clicks += row.totalClicks;
    cu.duration += row.totalDuration;
    byKiosk.set(row.kioskName, cu);
  }
  // 버튼별 전기 클릭(지점|버튼) — 표의 '전주 대비' 열에 쓴다.
  const prevByButton = new Map<string, number>();
  const prevByKiosk = new Map<string, number>();
  for (const row of prevBlock?.kioskButtonDetails ?? []) {
    const bk = `${row.kioskName}|${row.buttonType}`;
    prevByButton.set(bk, (prevByButton.get(bk) ?? 0) + row.totalClicks);
    prevByKiosk.set(row.kioskName, (prevByKiosk.get(row.kioskName) ?? 0) + row.totalClicks);
  }
  // 전체 키오스크 합집합(금기·전기·누적) — 기간 내 사용이 0인 지점도 상세에 모두 표시
  const kioskOrder = new Map<string, number>();
  for (const b of [block, prevBlock, cumBlock]) {
    for (const row of b?.kioskButtonDetails ?? []) {
      if (!kioskOrder.has(row.kioskName)) kioskOrder.set(row.kioskName, row.kioskId);
    }
  }
  const kiosks: [string, { rows: KioskRow[]; clicks: number; duration: number }][] =
    [...kioskOrder.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => [name, byKiosk.get(name) ?? { rows: [], clicks: 0, duration: 0 }]);

  // 아이콘별 전체 집계(클릭 1위·평균 체류 최장) — buttonDetails 합산
  const byButton = new Map<string, { clicks: number; duration: number }>();
  for (const row of block.buttonDetails) {
    const cu = byButton.get(row.buttonType) ?? { clicks: 0, duration: 0 };
    cu.clicks += row.totalClicks;
    cu.duration += row.totalDuration;
    byButton.set(row.buttonType, cu);
  }
  const buttonList = [...byButton.entries()];
  const topButton = buttonList.reduce<{ name: string; clicks: number } | null>(
    (best, [name, v]) => (best && best.clicks >= v.clicks ? best : { name, clicks: v.clicks }), null);
  const longestButton = buttonList.reduce<{ name: string; avgSec: number } | null>((best, [name, v]) => {
    const avg = v.clicks > 0 ? v.duration / v.clicks : 0;
    return best && best.avgSec >= avg ? best : { name, avgSec: avg };
  }, null);

  const ai = buildButtonAi({
    periodLabel: prevLabel,
    totalClicks: block.totalClicks,
    prevClicks: prevBlock?.totalClicks ?? 0,
    avgDurationSec: block.avgDuration,
    topButton,
    longestButton,
    kiosks: kiosks.map(([k, v]) => ({
      name: k,
      clicks: v.clicks,
      prevClicks: prevByKiosk.get(k) ?? 0,
      topButton: [...v.rows].sort((a, b) => b.totalClicks - a.totalClicks)[0]?.buttonType,
    })),
  });

  // 선택 지점만 추림. 전체면 그대로. (PDF 는 exportMode 로 항상 전체)
  const shown = effKiosk === 'ALL' ? kiosks : kiosks.filter(([k]) => kioskOrder.get(k) === effKiosk);

  return (
    <div className={s.report} data-report-root data-report-title={`${variant === 'weekly' ? '주간' : '월간'} 버튼 사용 통계 리포트`}>
      {effKiosk === 'ALL' ? (
      <div data-report-page>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <h2 className={s.headTitle}>{variant === 'weekly' ? '주간' : '월간'} 버튼 사용 통계 리포트</h2>
            <p className={s.headSub}>대상 기간: {r.start} ~ {r.end} · {kiosks.length}개 지점 · 실데이터</p>
          </div>
          <div className={s.headMeta}><b>{variant === 'weekly' ? '주간' : '월간'} 버튼 사용 통계 리포트</b></div>
        </div>
      </div>
      <KpiRow items={[
        { label: '총 클릭', value: `${block.totalClicks.toLocaleString()}회`, diff: badge?.text, dir: badge?.dir },
        { label: '총 사용 시간', value: fmtDurationSec(block.totalDuration), hint: prevBlock ? `${prevLabel} ${fmtDurationSec(prevBlock.totalDuration)}` : undefined },
        { label: '평균 체류', value: `${Math.round(block.avgDuration)}초`, hint: prevBlock ? `${prevLabel} ${Math.round(prevBlock.avgDuration)}초` : undefined },
        { label: '누적 클릭', value: cumBlock ? `${cumBlock.totalClicks.toLocaleString()}회` : '—' },
        { label: '누적 사용 시간', value: cumBlock ? fmtDurationSec(cumBlock.totalDuration) : '—' },
      ]} />

      {/* 지점별 상세와 같은 형태(세로 막대 + 사용 시간 선, 이중 축) — 문서 안에서 그래프 읽는 법이 하나로 통일된다. */}
      <Section
        title='키오스크별 사용 집계'
        sub={`클릭 합계 ${block.totalClicks.toLocaleString()}회 · 사용 시간 합계 ${fmtDurationSec(block.totalDuration)}`}
      >
        {/* 화면 조회 전용 — PDF 에는 항상 전체 계열이 들어간다. */}
        <div className={s.chartFilter} data-export-ignore>
          <span className={s.filterLabel}>표시 데이터</span>
          <select
            className={s.filterSelect}
            value={effMetric}
            onChange={(e) => setMetric(e.target.value as UsageMetric)}
          >
            <option value='ALL'>전체</option>
            <option value='CLICKS'>클릭수</option>
            <option value='DURATION'>사용시간</option>
          </select>
        </div>
        <ButtonUsageChart
          title='키오스크별 클릭 · 사용 시간'
          metric={effMetric}
          data={kiosks.map(([k, v]) => ({ label: k, clicks: v.clicks, durationSec: v.duration }))}
        />
      </Section>

      {/* 지점이 늘면 AI 지점 코멘트가 지점당 1줄씩 쌓여 첫 장을 밀어낸다.
          넘치면 축소가 아니라 다음 장으로 이어지므로 우선은 그래프와 같은 장에 둔다. */}
      <Section title='AI 종합 분석' sub='실데이터 자동 작성 · 수정 가능'>
        <EditableAiCard tag={variant === 'weekly' ? 'AI WEEKLY INSIGHT' : 'AI MONTHLY INSIGHT'} overall={ai.overall} sites={ai.sites} note={AI_NOTE} />
      </Section>

      </div>
      ) : null}

      {shown.map(([k, v], ki) => {
            const pb = diffBadge(v.clicks, prevByKiosk.get(k) ?? 0, '회', '');
            // 클릭된 버튼 + 홈 버튼 카탈로그(클릭 0 포함) 병합 — 미사용 버튼도 빈 막대/0행으로 표시
            const seen = new Set<string>();
            const merged = v.rows.map((rw) => {
              seen.add(rw.buttonType);
              return { key: rw.buttonType, label: kioskButtonLabel(rw.buttonType), clicks: rw.totalClicks, duration: rw.totalDuration, avg: rw.avgDuration, line: 0, position: 0 };
            });
            for (const hb of catalog.data?.[k] ?? []) {
              if (seen.has(hb.buttonType)) continue;
              // 새 홈에 없는 버튼은 0회 행으로도 넣지 않는다(오색·화성).
              if (!isCountedRow({ kioskId: kioskOrder.get(k) ?? -1, kioskName: k, buttonName: hb.buttonName, buttonType: hb.buttonType }, catalog.data)) continue;
              seen.add(hb.buttonType);
              merged.push({ key: hb.buttonType, label: kioskButtonLabel(hb.buttonType), clicks: 0, duration: 0, avg: 0, line: hb.line, position: hb.position });
            }
            const rows = merged.sort((a, b) => b.clicks - a.clicks || a.line - b.line || a.position - b.position);
            return (
              <div data-report-page key={k}>
                {ki === 0 ? (
                  <div className={s.sec}>
                    <h3 className={s.secTitle}>지점별 상세</h3>
                    <span className={s.secSub}>키오스크별 버튼 터치 수·사용 시간 그래프 + 테이블 — 키오스크당 1페이지</span>
                  </div>
                ) : null}
                <div className={s.kioskBlock}>
                <h4 className={s.kioskBlockTitle}>{k}</h4>
                <p className={s.kioskBlockSummary}>
                  클릭 <b>{v.clicks.toLocaleString()}회</b> · 사용 시간 {fmtDurationSec(v.duration)}
                  {v.clicks > 0 ? ` · 평균 체류 ${Math.round(v.duration / v.clicks)}초` : ''}
                  {pb ? <> · {prevLabel} 대비 <Diff text={pb.text.split(' (')[0].trim()} /></> : null}
                </p>
                {rows.length === 0 ? (
                  <EmptyNote title='기간 내 사용 데이터가 없습니다' hint='해당 키오스크에서 버튼 클릭이 집계되면 그래프와 표가 채워집니다.' />
                ) : (
                <div className={s.mirrorRow}>
                  <KioskHomeStatsMirror
                    kioskName={k}
                    kioskId={kioskOrder.get(k)}
                    buttons={catalog.data?.[k] ?? []}
                    stats={
                      new Map(
                        rows.map((r) => [
                          r.key,
                          { clicks: r.clicks, durationSec: r.duration, avgSec: r.avg },
                        ]),
                      )
                    }
                  />
                  <div className={s.mirrorSide}>
                    {/* 그래프 대신 표 — 전주 대비까지 담기고, 순위는 클릭 내림차순 정렬로 대신한다. */}
                    <table className={s.table}>
                      <thead>
                        <tr>
                          <th>아이콘</th><th>클릭</th><th>{prevLabel} 대비</th><th>사용 시간</th><th>평균 체류</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const pc = prevByButton.get(`${k}|${row.key}`) ?? 0;
                          const d = row.clicks - pc;
                          return (
                            <tr key={row.key}>
                              <td className={`${s.tdL} ${i === 0 ? s.tdB : ''}`}>{row.label}</td>
                              <td className={i === 0 ? s.tdB : ''}>{row.clicks.toLocaleString()}회</td>
                              <td>{pc === 0 && row.clicks === 0 ? '—' : <Diff text={`${d < 0 ? '▼' : '▲'}${Math.abs(d)}회`} />}</td>
                              <td>{fmtDurationSec(row.duration)}</td>
                              <td>{Math.round(row.avg)}초</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}
                <div className={s.sumStrip} style={{ marginTop: 10 }}>
                  <span className={s.sumItem}>
                    <span className={s.sumLabel}>총 클릭수</span>
                    <b>{v.clicks.toLocaleString()}회</b>
                  </span>
                  <span className={s.sumItem}>
                    <span className={s.sumLabel}>총 사용시간</span>
                    <b>{fmtDurationSec(v.duration)}</b>
                  </span>
                  <span className={s.sumItem}>
                    <span className={s.sumLabel}>평균 체류</span>
                    <b>{v.clicks > 0 ? Math.round(v.duration / v.clicks) : 0}초</b>
                  </span>
                </div>
                </div>
                {ki === shown.length - 1 ? (
                  <>
                    <p className={s.note}>※ 클릭 = 홈 화면 버튼 터치 1회 · 사용 시간 = 버튼 진입 후 다른 메뉴 이동/홈 복귀까지 체류 시간 합계 · 평균 체류 = 사용 시간 ÷ 클릭 수 (관리자 웹 '키오스크 분석'과 동일 지표).</p>
                  </>
                ) : null}
              </div>
            );
          })}

    </div>
  );
}
