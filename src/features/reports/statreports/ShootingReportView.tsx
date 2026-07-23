// 촬영 통계 리포트 뷰(주간/월간) — 클라이언트 확정 구성:
// 헤더 → KPI(첫 지표 강조) → 그래프 → AI 분석 → 지점별·일별(주차별) 상세
// → 인기 의상 TOP10(사진+카테고리+표, 연속 배치) → 카테고리별 1위
// → (주간) 키오스크별 전체 의상 통계 / (월간) 인기 의상 월별 통계
import s from './StatReports.module.css';
import { AiPanel, CompareBarChart, Diff, KpiRow, Section } from './StatReportParts';
import { useOutfitTopLive, type LiveOutfitCard } from './useStatReportLive';
import { NewOutfitsSection } from './NewOutfitsSection';
import {
  KIOSK_SHORT,
  fmtMD,
  shootMonthly,
  shootWeekly,
  type ShootMonthlyData,
  type ShootWeeklyData,
} from './statReportsMockData';

/** 키오스크 컬럼 분할 — 6개 이하면 표 1개, 초과 시 표를 나눠 균형 배치(예: 8개 → 4+4) */
export function chunkKioskCols<T>(cols: T[], maxSingle = 6, chunkMax = 5): T[][] {
  if (cols.length <= maxSingle) return [cols];
  const n = Math.ceil(cols.length / Math.min(chunkMax, Math.ceil(cols.length / 2)));
  const size = Math.ceil(cols.length / n);
  const out: T[][] = [];
  for (let i = 0; i < cols.length; i += size) out.push(cols.slice(i, i + size));
  return out;
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

type OutfitCard = ShootWeeklyData['outfitTop10'][number] & { imageUrl?: string };

/** 표본 모드에서도 실제 등록 의상(사진·이름·카테고리)을 입혀 실물감 유지 — 수치는 표본 유지 */
function useRealisticCards(sample: OutfitCard[]): OutfitCard[] {
  const today = new Date().toISOString().slice(0, 10);
  const real = useOutfitTopLive('2025-01-01', today, true);
  const rows: LiveOutfitCard[] = real.data ?? [];
  return sample.map((c, i) => {
    const r = rows[i];
    return r ? { ...c, name: r.name, cat: r.cat ?? c.cat, code: r.code || c.code, imageUrl: r.imageUrl } : c;
  });
}

/** 인기 의상 TOP 10 — 사진 갤러리(카테고리 텍스트 포함) + 수치 표 연속 배치 */
function OutfitTop10({ cards, note }: { cards: OutfitCard[]; note: string }) {
  return (
    <>
      <div className={s.gal}>
        {cards.map((o) => (
          <div key={`${o.rank}-${o.code}`} className={s.gcard}>
            <span className={s.gcardRank}>{o.rank}</span>
            {o.imageUrl ? (
              <img src={o.imageUrl} alt={o.name} className={s.gcardImg} style={{ objectFit: 'cover', width: '100%' }} />
            ) : (
              <div className={s.gcardImg} style={{ background: `linear-gradient(135deg, ${o.grad[0]}, ${o.grad[1]})` }}>👘</div>
            )}
            <div className={s.gcardMeta}>
              <span className={s.gcardName}>{o.name}</span>
              <span className={s.gcardCat}>{o.cat}</span>
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
          <tr>
            <th style={{ width: '8%' }}>순위</th><th>의상</th><th>코드</th><th>카테고리</th><th>촬영 건수</th><th>비중</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((o) => (
            <tr key={o.code}>
              <td className={o.rank <= 3 ? s.tdB : ''}>{o.rank}</td>
              <td className={`${s.tdL} ${o.rank <= 3 ? s.tdB : ''}`}>{o.name}</td>
              <td>{o.code}</td>
              <td>{o.cat}</td>
              <td className={o.rank <= 3 ? s.tdB : ''}>{o.cnt.toLocaleString()}건</td>
              <td>{o.share}</td>
            </tr>
          ))}
          <tr className={s.sumRow}>
            <td colSpan={6} className={s.tdL}>{note}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

/** 카테고리별 1위 의상 — 전체 · 키오스크별 (사진 없음) */
/** "홍색 한복 47" → "홍색 한복 / 47건" (클라이언트 확정 표기) */
function fmtWinner(v: string): string {
  const m = v.match(/^(.*?)\s+(\d[\d,]*)$/);
  return m ? `${m[1]} / ${m[2]}건` : v;
}

function CatWinners({ rows }: { rows: ShootWeeklyData['catWinners'] }) {
  // 키오스크 수 증가 대비: 컬럼 분할 렌더(첫 표에만 '전체' 포함)
  const idx = KIOSK_SHORT.map((_, i) => i);
  const chunks = chunkKioskCols(idx);
  return (
    <>
      {chunks.map((chunk, ci) => (
        <table key={ci} className={s.table} style={ci > 0 ? { marginTop: 10 } : undefined}>
          <thead>
            <tr>
              <th>카테고리</th>
              {ci === 0 ? <th>전체</th> : null}
              {chunk.map((i) => <th key={i}>{KIOSK_SHORT[i]}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cat}>
                <td className={`${s.tdL} ${s.tdB}`}>{r.cat}</td>
                {ci === 0 ? <td className={s.tdB}>{fmtWinner(r.overall)}</td> : null}
                {chunk.map((i) => <td key={i}>{fmtWinner(r.per[i])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </>
  );
}

export function ShootingWeeklyView() {
  const d: ShootWeeklyData = shootWeekly;
  const cards = useRealisticCards(d.outfitTop10);
  return (
    <div className={s.report} data-report-root data-report-title='주간 촬영 통계 리포트'>
      <div data-report-page>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <h2 className={s.headTitle}>{d.title}</h2>
            <p className={s.headSub}>{d.sub}</p>
          </div>
          <div className={s.headMeta}><b>주간 촬영 통계 리포트</b>1 / 3 page</div>
        </div>
      </div>
      <KpiRow items={d.kpis} />

      <Section title='주간 추이' sub='모든 수치 표기 · 전주 대비 비교(점선)'>
        <div className={s.row2}>
          <CompareBarChart title='요일별 총 촬영 — 금주(막대) vs 전주(점선)' data={d.weekday} curName='금주 214건' prevName='전주 199건' />
          <CompareBarChart
            title='시간대별 촬영 분포 · 오전/오후'
            data={d.hourly.map((h) => ({ label: h.label, cur: h.v }))}
            curName='촬영 건수'
            color='#f59e0b'
          />
        </div>
      </Section>

      <Section title='AI 종합 분석' sub='자동 작성 · 담당자 검토'>
        <AiPanel tag='AI WEEKLY INSIGHT' overall={d.aiOverall} sites={d.aiSites} />
      </Section>

      <NewOutfitsSection periodLabel='이번 주' start='2026-07-13' end='2026-07-19' mode='sample' />
      </div>

      <div data-report-page>
      <Section title='지점별 상세' sub='전체 · 전주 대비 · 오전/오후 · 요일별'>
        <table className={s.table}>
          <thead>
            <tr><th>지점</th><th>촬영</th><th>전주</th><th>증감</th><th>오전 / 오후</th><th>요일별 (월~일)</th></tr>
          </thead>
          <tbody>
            {d.sites.map((r) => (
              <tr key={r.name}>
                <td className={`${s.tdL} ${s.tdB}`}>{r.name}</td>
                <td className={s.tdB}>{r.cur}건</td>
                <td>{r.prev}건</td>
                <td><Diff text={r.diff} /></td>
                <td>{r.ampm}</td>
                <td>{r.daily}</td>
              </tr>
            ))}
            <tr className={s.sumRow}>
              <td className={s.tdL}>합계</td><td>214건</td><td>199건</td><td><Diff text='▲ 7.5%' /></td>
              <td>오전 73 · 오후 141</td><td>22·21·26·22·29·52·42</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title='일별 상세' sub='키오스크 세로 × 일자 가로'>
        <table className={s.table}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>지점</th>
              {d.daily.map((r) => <th key={r.d}>{fmtMD(r.d)}</th>)}
              <th>합계</th>
            </tr>
          </thead>
          <tbody>
            {KIOSK_SHORT.map((k, ki) => (
              <tr key={k}>
                <td className={`${s.tdL} ${s.tdB}`}>{k}</td>
                {d.daily.map((r) => <td key={r.d}>{r.per[ki]}</td>)}
                <td className={s.tdB}>{d.sites[ki].cur}</td>
              </tr>
            ))}
            <tr className={s.sumRow}>
              <td className={s.tdL}>합계</td>
              {d.daily.map((r) => <td key={r.d}>{r.sum}</td>)}
              <td>214</td>
            </tr>
            <tr>
              <td className={`${s.tdL} ${s.tdB}`}>오전/오후</td>
              {d.daily.map((r) => <td key={r.d}>{r.ampm}</td>)}
              <td>73 / 141</td>
            </tr>
          </tbody>
        </table>
      </Section>

</div>

      <div data-report-page>
      <Section title='이번 주 인기 의상 TOP 10' sub='사진(카테고리 표기) + 수치 표 — 자동 생성 시 실물 사진으로 삽입'>
        <OutfitTop10 cards={cards} note={d.outfitTop10Note} />
      </Section>

</div>

      <div data-report-page>
      <Section title='카테고리별 1위 의상' sub='전체 · 키오스크별'>
        <CatWinners rows={d.catWinners} />
      </Section>

      <Section title='키오스크별 전체 의상 통계' sub='전체 의상 × 키오스크 촬영 건수 — 굵게 = 각 키오스크 1위 · 키오스크 증가 시 표 분할'>
        {chunkKioskCols(KIOSK_SHORT.map((_, i) => i)).map((chunk, ci, arr) => {
          const isLast = ci === arr.length - 1;
          return (
            <table key={ci} className={s.table} style={ci > 0 ? { marginTop: 10 } : undefined}>
              <thead>
                <tr>
                  <th>의상</th>
                  {ci === 0 ? <th>카테고리</th> : null}
                  {chunk.map((i) => <th key={i}>{KIOSK_SHORT[i]}</th>)}
                  {isLast ? <th>합계</th> : null}
                </tr>
              </thead>
              <tbody>
                {d.outfitAll.map((o) => (
                  <tr key={o.code}>
                    <td className={s.tdL}>{o.name}<span className={s.code}>{o.code}</span></td>
                    {ci === 0 ? <td>{o.cat}</td> : null}
                    {chunk.map((i) => {
                      const isTop = o.per[i] > 0 && o.per[i] === Math.max(...d.outfitAll.map((x) => x.per[i]));
                      return <td key={i} className={isTop ? s.tdB : ''}>{o.per[i]}</td>;
                    })}
                    {isLast ? <td className={s.tdB}>{o.total}</td> : null}
                  </tr>
                ))}
                <tr className={s.sumRow}>
                  <td className={s.tdL}>합계</td>
                  {ci === 0 ? <td>—</td> : null}
                  {chunk.map((i) => <td key={i}>{d.outfitAllColSum[i]}</td>)}
                  {isLast ? <td>214</td> : null}
                </tr>
              </tbody>
            </table>
          );
        })}
      </Section>

      <p className={s.footer}>집계 기준: AR 촬영 완료 건 · WIT 통계 시스템 자동 생성 · DOCX 편집 가능 (표본 데이터는 목업용 가상 수치)</p>
      </div>
    </div>
  );
}

export function ShootingMonthlyView() {
  const d: ShootMonthlyData = shootMonthly;
  const cards = useRealisticCards(d.outfitTop10);
  return (
    <div className={s.report} data-report-root data-report-title='월간 촬영 통계 리포트'>
      <div data-report-page>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <h2 className={s.headTitle}>{d.title}</h2>
            <p className={s.headSub}>{d.sub}</p>
          </div>
          <div className={s.headMeta}><b>월간 촬영 통계 리포트</b>1 / 3 page</div>
        </div>
      </div>
      <KpiRow items={d.kpis} />

      <Section title='월간 추이' sub='모든 수치 표기'>
        <div className={s.row2}>
          <CompareBarChart title='주차별 촬영 (6월 1~5주)' data={d.weeks} curName='월 합계 1,901건' />
          <CompareBarChart title='요일별 일평균 촬영' data={d.weekdayAvg} curName='일평균(건)' color='#f59e0b' />
        </div>
      </Section>

      <Section title='AI 종합 분석' sub='자동 작성 · 담당자 검토'>
        <AiPanel tag='AI MONTHLY INSIGHT' overall={d.aiOverall} sites={d.aiSites} />
      </Section>

      <NewOutfitsSection periodLabel='이번 달' start='2026-06-01' end='2026-06-30' mode='sample' />
      </div>

      <div data-report-page>
      <Section title='지점별 상세' sub='전체 · 전월 대비 · 오전/오후'>
        <table className={s.table}>
          <thead>
            <tr><th>지점</th><th>6월</th><th>5월</th><th>증감</th><th>오전 / 오후</th><th>비고</th></tr>
          </thead>
          <tbody>
            {d.sites.map((r) => (
              <tr key={r.name}>
                <td className={`${s.tdL} ${s.tdB}`}>{r.name}</td>
                <td className={s.tdB}>{r.cur.toLocaleString()}건</td>
                <td>{r.prev.toLocaleString()}건</td>
                <td><Diff text={r.diff} /></td>
                <td>{r.ampm}</td>
                <td>{r.note}</td>
              </tr>
            ))}
            <tr className={s.sumRow}>
              <td className={s.tdL}>합계</td><td>1,901건</td><td>2,039건</td><td><Diff text='▼ 6.8%' /></td>
              <td>오전 684 · 오후 1,217</td><td>—</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title='주차별 상세'>
        <table className={s.table}>
          <thead>
            <tr><th>주차</th><th>촬영</th><th>일평균</th><th>오전</th><th>오후</th><th>비고</th></tr>
          </thead>
          <tbody>
            {d.weeksDetail.map((r) => (
              <tr key={r.w}>
                <td>{r.w}</td><td className={s.tdB}>{r.cnt}</td><td>{r.avg}</td><td>{r.am}</td><td>{r.pm}</td><td>{r.note}</td>
              </tr>
            ))}
            <tr className={s.sumRow}>
              <td>합계</td><td>1,901</td><td>63.4</td><td>684</td><td>1,217</td><td>—</td>
            </tr>
          </tbody>
        </table>
      </Section>

</div>

      <div data-report-page>
      <Section title='이번 달 인기 의상 TOP 10' sub='사진(카테고리 표기) + 수치 표 — 자동 생성 시 실물 사진으로 삽입'>
        <OutfitTop10 cards={cards} note={d.outfitTop10Note} />
      </Section>

</div>

      <div data-report-page>
      <Section title='카테고리별 1위 의상' sub='전체 · 키오스크별 (6월 기준)'>
        <CatWinners rows={d.catWinners} />
      </Section>

      <Section title='인기 의상 월별 통계' sub='올해 1월~12월 · 당월 비중 (7~12월은 UI 확인용 예시 수치)'>
        {chunkKioskCols(MONTH_LABELS.map((_, i) => i), 8, 8).map((chunk, ci, arr) => {
          const isLast = ci === arr.length - 1;
          return (
            <table key={ci} className={s.table} style={ci > 0 ? { marginTop: 10 } : undefined}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>의상</th>
                  {chunk.map((i) => <th key={i}>{MONTH_LABELS[i]}</th>)}
                  {isLast ? <><th>합계</th><th>당월 비중</th></> : null}
                </tr>
              </thead>
              <tbody>
                {d.outfitMonthly.map((o) => (
                  <tr key={o.name}>
                    <td className={s.tdL}>{o.name}{o.code ? <span className={s.code}>{o.code}</span> : null}</td>
                    {chunk.map((i) => <td key={i} className={i === 5 ? s.tdB : ''}>{o.months[i].toLocaleString()}</td>)}
                    {isLast ? <><td className={s.tdB}>{o.total.toLocaleString()}</td><td>{o.share}</td></> : null}
                  </tr>
                ))}
                <tr className={s.sumRow}>
                  <td className={s.tdL}>전체 합계</td>
                  {chunk.map((i) => <td key={i}>{d.outfitMonthlySum.months[i].toLocaleString()}</td>)}
                  {isLast ? <><td>{d.outfitMonthlySum.total.toLocaleString()}</td><td>{d.outfitMonthlySum.share}</td></> : null}
                </tr>
              </tbody>
            </table>
          );
        })}
        <p className={s.note}>※ 당월 비중 = 표시 기간(1~12월) 촬영 중 당월(6월)이 차지하는 비율.</p>
      </Section>

      <p className={s.footer}>집계 기준: AR 촬영 완료 건 · 월간 발행 주차에는 주간 리포트 동시 발행 (표본 데이터는 목업용 가상 수치)</p>
      </div>
    </div>
  );
}
