// 실데이터 리포트 뷰 — useStatReportLive 훅으로 서버 집계를 조합해 렌더.
// 서버 API가 아직 없는 섹션(오전/오후·시간대별·AI 분석·카테고리별 1위·의상 매트릭스·
// 버튼 일별 지점 분해)은 SampleTag 를 붙여 표본임을 명시한다(P2/P3 개발 목록).
import s from './StatReports.module.css';
import { AiPanel, CompareBarChart, Diff, HBarChart, KpiRow, Section } from './StatReportParts';
import { statsSinceLabel, type KpiItem } from './statReportsMockData';
import {
  diffBadge,
  fmtDurationSec,
  lastMonthRanges,
  lastWeekRanges,
  useButtonsLive,
  useOutfitTopLive,
  useShootingDailyLive,
  useShootingMonthlyLive,
  type LiveOutfitCard,
} from './useStatReportLive';

/** 표본 표시 태그 — 서버 집계 개발 전 임시 데이터 */
function SampleTag() {
  return (
    <span
      style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
        background: 'var(--amber-bg)', color: 'var(--amber-text)', verticalAlign: 'middle',
      }}
    >
      표본 데이터 · 서버 집계 개발 예정
    </span>
  );
}

function LoadingCard({ text }: { text: string }) {
  return <div className={s.kioskBlock} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{text}</div>;
}

/** 빈 데이터 표시 — 집계 자체가 없는 구간을 명확히 알린다 */
export function EmptyNote({ title, hint }: { title?: string; hint?: string }) {
  return (
    <div className={s.emptyBox}>
      <div className={s.emptyBoxTitle}>📭 {title ?? '아직 집계된 데이터가 없습니다'}</div>
      <div className={s.emptyBoxHint}>{hint ?? '해당 기간에 수집된 데이터가 없어 표시할 내용이 없습니다.'}</div>
    </div>
  );
}

/* ── 의상 TOP 10 (실물 사진) ── */
function LiveOutfitGallery({ cards }: { cards: LiveOutfitCard[] }) {
  if (cards.length === 0) return <EmptyNote title='기간 내 의상 촬영 데이터가 없습니다' hint='의상 촬영이 집계되면 실물 사진과 함께 표시됩니다.' />;
  return (
    <>
      <div className={s.gal}>
        {cards.map((o) => (
          <div key={`${o.rank}-${o.code}`} className={s.gcard}>
            <span className={s.gcardRank}>{o.rank}</span>
            {o.imageUrl ? (
              <img src={o.imageUrl} alt={o.name} className={s.gcardImg} style={{ objectFit: 'cover', width: '100%' }} />
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
      <table className={s.table}>
        <thead>
          <tr><th style={{ width: '10%' }}>순위</th><th>의상</th><th>코드</th><th>카테고리</th><th>촬영 건수</th></tr>
        </thead>
        <tbody>
          {cards.map((o) => (
            <tr key={`t-${o.rank}-${o.code}`}>
              <td className={o.rank <= 3 ? s.tdB : ''}>{o.rank}</td>
              <td className={`${s.tdL} ${o.rank <= 3 ? s.tdB : ''}`}>{o.name}</td>
              <td>{o.code}</td>
              <td>{o.cat ?? '—'}</td>
              <td className={o.rank <= 3 ? s.tdB : ''}>{o.cnt.toLocaleString()}건</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ── 촬영 리포트 (주간) ── */
export function ShootingWeeklyLiveView() {
  const r = lastWeekRanges();
  const cur = useShootingDailyLive(r.start, r.end, true);
  const prev = useShootingDailyLive(r.prevStart, r.prevEnd, true);
  const monthly = useShootingMonthlyLive(true);
  const outfits = useOutfitTopLive(r.start, r.end, true);

  if (cur.isPending) return <LoadingCard text='실데이터를 불러오는 중…' />;
  if (cur.isError) return <LoadingCard text='촬영 통계를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' />;

  const kioskNames = cur.data?.kioskNames ?? [];
  const rows = cur.data?.rows ?? [];
  const total = rows.reduce((a, row) => a + Number(row.total ?? 0), 0);
  const prevTotal = (prev.data?.rows ?? []).reduce((a, row) => a + Number(row.total ?? 0), 0);
  const weekend = rows.slice(-2).reduce((a, row) => a + Number(row.total ?? 0), 0);
  const cumTotal = (monthly.data?.rows ?? []).reduce((a, row) => a + Number(row.total ?? 0), 0);
  const oldestMonth = String((monthly.data?.rows ?? []).at(-1)?.month ?? '');
  const earliestMonthStart = /^\d{4}-\d{2}$/.test(oldestMonth) ? `${oldestMonth}-01` : undefined;
  const badge = diffBadge(total, prevTotal, '건', '전주 대비');

  const siteTotals = kioskNames.map((k) => rows.reduce((a, row) => a + Number(row[k] ?? 0), 0));
  const sitePrev = kioskNames.map((k) => (prev.data?.rows ?? []).reduce((a, row) => a + Number(row[k] ?? 0), 0));

  const kpis: KpiItem[] = [
    { label: '총 촬영', value: `${total.toLocaleString()}건`, diff: badge?.text, dir: badge?.dir },
    { label: '일평균', value: `${(total / 7).toFixed(1)}건` },
    { label: '주말 비중', value: total > 0 ? `${Math.round((weekend / total) * 100)}%` : '—', hint: `토·일 ${weekend.toLocaleString()}건` },
    { label: '오전 / 오후', value: '—', hint: '서버 집계 개발 예정' },
    { label: '총 누적 촬영', value: `${cumTotal.toLocaleString()}건`, hint: statsSinceLabel(earliestMonthStart) },
  ];

  const weekdayTrend = rows.map((row, i) => ({
    label: String(row.date ?? '').slice(5),
    cur: Number(row.total ?? 0),
    prev: Number(prev.data?.rows?.[i]?.total ?? 0) || undefined,
  }));

  return (
    <div className={s.report}>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <h2 className={s.headTitle}>주간 촬영 통계 리포트</h2>
            <p className={s.headSub}>대상 기간: {r.start} ~ {r.end} · {kioskNames.length}개 지점 · 실데이터</p>
          </div>
          <div className={s.headMeta}><b>주간 촬영 통계 리포트</b>1 / 3 page</div>
        </div>
      </div>
      <KpiRow items={kpis} />
      {total === 0 ? <div style={{ marginTop: 12 }}><EmptyNote title='이번 기간에는 촬영 데이터가 없습니다' hint='집계 기간 내 촬영이 발생하면 그래프·상세 표가 채워집니다.' /></div> : null}

      <Section title='주간 추이' sub='일별 총 촬영 · 전주 대비 비교(점선)'>
        <div className={s.row2}>
          <CompareBarChart title='일별 총 촬영 — 금주(막대) vs 전주(점선)' data={weekdayTrend} curName={`금주 ${total.toLocaleString()}건`} prevName={`전주 ${prevTotal.toLocaleString()}건`} />
          <div className={s.chartCard}>
            <h4 className={s.chartTitle}>시간대별 촬영 분포 <SampleTag /></h4>
            <p className={s.note} style={{ padding: '30px 8px' }}>
              시간대별(오전/오후) 분포는 촬영 원본(shot_at) 시간 집계 API 개발 후 제공됩니다.
            </p>
          </div>
        </div>
      </Section>

      <Section title='AI 종합 분석'>
        <div className={s.ai}>
          <span className={s.aiTag}>✦ AI INSIGHT</span>
          <p className={s.note} style={{ marginTop: 8 }}>
            AI 자동 분석은 P3(리포트 자동 발행) 단계에서 제공됩니다 — 발행 시점의 실데이터로 전체/키오스크별 분석을 자동 작성.
          </p>
        </div>
      </Section>

      <Section title='지점별 상세' sub='전체 · 전주 대비'>
        <table className={s.table}>
          <thead>
            <tr><th>지점</th><th>촬영</th><th>전주</th><th>증감</th></tr>
          </thead>
          <tbody>
            {kioskNames.map((k, i) => {
              const b = diffBadge(siteTotals[i], sitePrev[i], '건', '');
              return (
                <tr key={k}>
                  <td className={`${s.tdL} ${s.tdB}`}>{k}</td>
                  <td className={s.tdB}>{siteTotals[i].toLocaleString()}건</td>
                  <td>{sitePrev[i].toLocaleString()}건</td>
                  <td>{b ? <Diff text={b.text.replace(/^ /, '').split(' (')[0].trim()} /> : '—'}</td>
                </tr>
              );
            })}
            <tr className={s.sumRow}>
              <td className={s.tdL}>합계</td>
              <td>{total.toLocaleString()}건</td>
              <td>{prevTotal.toLocaleString()}건</td>
              <td>{badge ? <Diff text={badge.text.split(' (')[0].replace('전주 대비 ', '')} /> : '—'}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title='일별 상세' sub='키오스크 세로 × 일자 가로'>
        {rows.length === 0 ? (
          <EmptyNote />
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>지점</th>
                {rows.map((row) => <th key={String(row.date)}>{String(row.date).slice(5)}</th>)}
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

      <Section title='이번 주 인기 의상 TOP 10' sub='실물 등록 사진 · 실데이터'>
        {outfits.isPending ? <LoadingCard text='의상 랭킹을 불러오는 중…' /> : <LiveOutfitGallery cards={outfits.data ?? []} />}
      </Section>

      <p className={s.footer}>집계 기준: AR 촬영 완료 건 · 실데이터(서버 집계) · 카테고리별 1위/키오스크별 전체 의상 매트릭스는 서버 집계 API 개발 후 제공</p>
    </div>
  );
}

/* ── 촬영 리포트 (월간) ── */
export function ShootingMonthlyLiveView() {
  const r = lastMonthRanges();
  const cur = useShootingDailyLive(r.start, r.end, true);
  const monthly = useShootingMonthlyLive(true);
  const outfits = useOutfitTopLive(r.start, r.end, true);

  if (cur.isPending || monthly.isPending) return <LoadingCard text='실데이터를 불러오는 중…' />;
  if (cur.isError) return <LoadingCard text='촬영 통계를 불러오지 못했습니다.' />;

  const kioskNames = cur.data?.kioskNames ?? [];
  const rows = cur.data?.rows ?? [];
  const total = rows.reduce((a, row) => a + Number(row.total ?? 0), 0);
  const days = rows.length || 1;
  const cumTotal = (monthly.data?.rows ?? []).reduce((a, row) => a + Number(row.total ?? 0), 0);
  const oldestMonth = String((monthly.data?.rows ?? []).at(-1)?.month ?? '');
  const earliestMonthStart = /^\d{4}-\d{2}$/.test(oldestMonth) ? `${oldestMonth}-01` : undefined;

  // 전월 합계: 월별 집계에서 직전 2개월 행 비교
  const monthRows = monthly.data?.rows ?? [];
  const curMonthKey = r.start.slice(0, 7);
  const curIdx = monthRows.findIndex((row) => String(row.month) === curMonthKey);
  const prevRow = curIdx >= 0 ? monthRows[curIdx + 1] : undefined;
  const prevTotal = Number(prevRow?.total ?? 0);
  const badge = diffBadge(total, prevTotal, '건', '전월 대비');

  // 주차별 집계(7일 단위)
  const weeks: { label: string; cur: number }[] = [];
  for (let i = 0; i < rows.length; i += 7) {
    const chunk = rows.slice(i, i + 7);
    weeks.push({ label: `${Math.floor(i / 7) + 1}주`, cur: chunk.reduce((a, row) => a + Number(row.total ?? 0), 0) });
  }

  const siteTotals = kioskNames.map((k) => rows.reduce((a, row) => a + Number(row[k] ?? 0), 0));
  const sitePrev = kioskNames.map((k) => Number(prevRow?.[k] ?? 0));

  return (
    <div className={s.report}>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <h2 className={s.headTitle}>월간 촬영 통계 리포트</h2>
            <p className={s.headSub}>대상: {r.label} ({r.start} ~ {r.end}) · {kioskNames.length}개 지점 · 실데이터</p>
          </div>
          <div className={s.headMeta}><b>월간 촬영 통계 리포트</b>1 / 3 page</div>
        </div>
      </div>
      <KpiRow items={[
        { label: '월 총 촬영', value: `${total.toLocaleString()}건`, diff: badge?.text, dir: badge?.dir },
        { label: '일평균', value: `${(total / days).toFixed(1)}건` },
        { label: '오전 / 오후', value: '—', hint: '서버 집계 개발 예정' },
        { label: '주말 비중', value: '—', hint: '요일 집계 개발 예정' },
        { label: '총 누적 촬영', value: `${cumTotal.toLocaleString()}건`, hint: statsSinceLabel(earliestMonthStart) },
      ]} />
      {total === 0 ? <div style={{ marginTop: 12 }}><EmptyNote title='이번 달에는 촬영 데이터가 없습니다' hint='집계 기간 내 촬영이 발생하면 그래프·상세 표가 채워집니다.' /></div> : null}

      <Section title='월간 추이' sub='주차별 촬영(실데이터)'>
        <div className={s.row2}>
          <CompareBarChart title={`주차별 촬영 (${r.label})`} data={weeks} curName={`월 합계 ${total.toLocaleString()}건`} />
          <div className={s.chartCard}>
            <h4 className={s.chartTitle}>요일별 일평균 <SampleTag /></h4>
            <p className={s.note} style={{ padding: '30px 8px' }}>요일별 평균 집계 API 개발 후 제공됩니다.</p>
          </div>
        </div>
      </Section>

      <Section title='AI 종합 분석'>
        <div className={s.ai}>
          <span className={s.aiTag}>✦ AI INSIGHT</span>
          <p className={s.note} style={{ marginTop: 8 }}>AI 자동 분석은 P3(리포트 자동 발행) 단계에서 제공됩니다.</p>
        </div>
      </Section>

      <Section title='지점별 상세' sub='전체 · 전월 대비'>
        <table className={s.table}>
          <thead>
            <tr><th>지점</th><th>당월</th><th>전월</th><th>증감</th></tr>
          </thead>
          <tbody>
            {kioskNames.map((k, i) => {
              const b = diffBadge(siteTotals[i], sitePrev[i], '건', '');
              return (
                <tr key={k}>
                  <td className={`${s.tdL} ${s.tdB}`}>{k}</td>
                  <td className={s.tdB}>{siteTotals[i].toLocaleString()}건</td>
                  <td>{sitePrev[i].toLocaleString()}건</td>
                  <td>{b ? <Diff text={b.text.split(' (')[0].trim()} /> : '—'}</td>
                </tr>
              );
            })}
            <tr className={s.sumRow}>
              <td className={s.tdL}>합계</td>
              <td>{total.toLocaleString()}건</td>
              <td>{prevTotal.toLocaleString()}건</td>
              <td>{badge ? <Diff text={badge.text.split(' (')[0].replace('전월 대비 ', '')} /> : '—'}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title='이번 달 인기 의상 TOP 10' sub='실물 등록 사진 · 실데이터'>
        {outfits.isPending ? <LoadingCard text='의상 랭킹을 불러오는 중…' /> : <LiveOutfitGallery cards={outfits.data ?? []} />}
      </Section>

      <p className={s.footer}>집계 기준: AR 촬영 완료 건 · 실데이터(서버 집계) · 카테고리별 1위/의상 월별 매트릭스는 서버 집계 API 개발 후 제공</p>
    </div>
  );
}

/* ── 버튼 리포트 (주간/월간) ── */
export function ButtonLiveView({ variant }: { variant: 'weekly' | 'monthly' }) {
  const r = variant === 'weekly' ? lastWeekRanges() : lastMonthRanges();
  const prevLabel = variant === 'weekly' ? '전주' : '전월';
  const { cur, prev, cum } = useButtonsLive(r.start, r.end, r.prevStart, r.prevEnd, true);

  if (cur.isPending) return <LoadingCard text='실데이터를 불러오는 중…' />;
  if (cur.isError) return <LoadingCard text='버튼 통계를 불러오지 못했습니다.' />;

  const block = cur.data;
  if (!block || block.totalClicks === 0) {
    return <EmptyNote title='기간 내 버튼 사용 데이터가 없습니다' hint='해당 기간에 홈 버튼 클릭이 집계되면 리포트가 채워집니다.' />;
  }

  const prevBlock = prev.data ?? null;
  const cumBlock = cum.data ?? null;
  const badge = diffBadge(block.totalClicks, prevBlock?.totalClicks ?? 0, '회', `${prevLabel} 대비`);

  // 지점별 집계(그래프·블록) — buttonDetails를 지점으로 그룹
  const byKiosk = new Map<string, { rows: typeof block.buttonDetails; clicks: number; duration: number }>();
  for (const row of block.buttonDetails) {
    const key = row.representativeKioskName || `키오스크 ${row.kioskId}`;
    const cu = byKiosk.get(key) ?? { rows: [], clicks: 0, duration: 0 };
    cu.rows.push(row);
    cu.clicks += row.totalClicks;
    cu.duration += row.totalDuration;
    byKiosk.set(key, cu);
  }
  const prevByKiosk = new Map<string, number>();
  for (const row of prevBlock?.buttonDetails ?? []) {
    const key = row.representativeKioskName || `키오스크 ${row.kioskId}`;
    prevByKiosk.set(key, (prevByKiosk.get(key) ?? 0) + row.totalClicks);
  }
  const kiosks = [...byKiosk.entries()];


  return (
    <div className={s.report}>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <h2 className={s.headTitle}>{variant === 'weekly' ? '주간' : '월간'} 버튼 사용 통계 리포트</h2>
            <p className={s.headSub}>대상 기간: {r.start} ~ {r.end} · {kiosks.length}개 지점 · 실데이터</p>
          </div>
          <div className={s.headMeta}><b>{variant === 'weekly' ? '주간' : '월간'} 버튼 사용 통계 리포트</b>1 / 2 page</div>
        </div>
      </div>
      <KpiRow items={[
        { label: '총 클릭', value: `${block.totalClicks.toLocaleString()}회`, diff: badge?.text, dir: badge?.dir },
        { label: '총 사용 시간', value: fmtDurationSec(block.totalDuration), hint: prevBlock ? `${prevLabel} ${fmtDurationSec(prevBlock.totalDuration)}` : undefined },
        { label: '평균 체류', value: `${Math.round(block.avgDuration)}초`, hint: prevBlock ? `${prevLabel} ${Math.round(prevBlock.avgDuration)}초` : undefined },
        { label: '누적 클릭', value: cumBlock ? `${cumBlock.totalClicks.toLocaleString()}회` : '—', hint: statsSinceLabel() },
        { label: '누적 사용 시간', value: cumBlock ? fmtDurationSec(cumBlock.totalDuration) : '—', hint: statsSinceLabel() },
      ]} />

      <Section title='키오스크별 사용 집계' sub={`클릭 · 사용 시간 — ${prevLabel} 대비 비교(점선)`}>
        <div className={s.row2}>
          <CompareBarChart
            title={`키오스크별 클릭 vs ${prevLabel}(점선)`}
            data={kiosks.map(([k, v]) => ({ label: k, cur: v.clicks, prev: prevByKiosk.get(k) || undefined }))}
            curName={`합계 ${block.totalClicks.toLocaleString()}회`}
            prevName={prevLabel}
          />
          <CompareBarChart
            title='키오스크별 사용 시간(분)'
            data={kiosks.map(([k, v]) => ({ label: k, cur: Math.round(v.duration / 60) }))}
            curName={`합계 ${fmtDurationSec(block.totalDuration)}`}
            color='#f59e0b'
          />
        </div>
      </Section>

      <Section title='AI 종합 분석'>
        <div className={s.ai}>
          <span className={s.aiTag}>✦ AI INSIGHT</span>
          <p className={s.note} style={{ marginTop: 8 }}>AI 자동 분석은 P3(리포트 자동 발행) 단계에서 제공됩니다.</p>
        </div>
      </Section>

      <Section title='지점별 상세' sub='키오스크별 버튼 터치 수·사용 시간 그래프 + 테이블'>
        <div className={s.kioskGrid}>
          {kiosks.map(([k, v]) => {
            const pb = diffBadge(v.clicks, prevByKiosk.get(k) ?? 0, '회', '');
            const rows = [...v.rows].sort((a, b) => b.totalClicks - a.totalClicks);
            return (
              <div key={k} className={s.kioskBlock}>
                <h4 className={s.kioskBlockTitle}>{k}</h4>
                <p className={s.kioskBlockSummary}>
                  클릭 <b>{v.clicks.toLocaleString()}회</b> · 사용 시간 {fmtDurationSec(v.duration)}
                  {v.clicks > 0 ? ` · 평균 체류 ${Math.round(v.duration / v.clicks)}초` : ''}
                  {pb ? <> · {prevLabel} 대비 <Diff text={pb.text.split(' (')[0].trim()} /></> : null}
                </p>
                <div className={s.row2}>
                  <HBarChart title='버튼별 클릭(회)' data={rows.map((r) => ({ label: r.buttonName, value: r.totalClicks }))} unit='회' />
                  <HBarChart title='버튼별 사용 시간(분)' data={rows.map((r) => ({ label: r.buttonName, value: Math.round(r.totalDuration / 60) }))} unit='분' color='#f59e0b' />
                </div>
                <table className={s.table} style={{ marginTop: 10 }}>
                  <thead>
                    <tr><th>아이콘</th><th>클릭</th><th>사용 시간</th><th>평균 체류</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={`${row.kioskId}-${row.buttonType}-${row.position}`}>
                        <td className={`${s.tdL} ${i === 0 ? s.tdB : ''}`}>{row.buttonName}</td>
                        <td className={i === 0 ? s.tdB : ''}>{row.totalClicks.toLocaleString()}회</td>
                        <td>{fmtDurationSec(row.totalDuration)}</td>
                        <td>{Math.round(row.avgDuration)}초</td>
                      </tr>
                    ))}
                    <tr className={s.sumRow}>
                      <td className={s.tdL}>소계</td>
                      <td>{v.clicks.toLocaleString()}회</td>
                      <td>{fmtDurationSec(v.duration)}</td>
                      <td>{v.clicks > 0 ? Math.round(v.duration / v.clicks) : 0}초</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        <p className={s.note}>※ 클릭 = 홈 화면 버튼 터치 1회 · 사용 시간 = 버튼 진입 후 다른 메뉴 이동/홈 복귀까지 체류 시간 합계 · 평균 체류 = 사용 시간 ÷ 클릭 수 (관리자 웹 '키오스크 분석'과 동일 지표).</p>
      </Section>

      <Section title={variant === 'weekly' ? '일별 상세' : '일별 추이'}>
        {block.chartData.length > 0 ? (
          <table className={s.table}>
            <thead>
              <tr><th>일자</th><th>클릭</th><th>사용 시간</th></tr>
            </thead>
            <tbody>
              {block.chartData.map((p) => (
                <tr key={p.label}>
                  <td>{p.label}</td>
                  <td className={s.tdB}>{p.clicks.toLocaleString()}회</td>
                  <td>{fmtDurationSec(p.duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={s.note}>기간 내 일별 데이터가 없습니다.</p>
        )}
        <p className={s.note}>※ 일×지점 분해 표는 버튼 일별 지점별 집계 API 개발 후 제공됩니다.</p>
      </Section>

      <p className={s.footer}>집계 기준: 홈 버튼 클릭 이벤트 · 실데이터(서버 집계)</p>
    </div>
  );
}
