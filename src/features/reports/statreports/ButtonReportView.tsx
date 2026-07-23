// 버튼(아이콘) 사용 통계 리포트 뷰(주간/월간) — 클라이언트 확정 구성:
// 헤더(제목+요약) → 그래프(키오스크별 클릭·사용 시간 2개, 전기 비교) → AI 분석
// → 지점별 상세(아이콘별 전체/키오스크별 집계) → 일별(주차별) 상세
// 지표·용어는 관리자 웹 '키오스크 분석'과 동일: 클릭 · 사용 시간 · 평균 체류.
import s from './StatReports.module.css';
import { AiPanel, CompareBarChart, Diff, KpiRow, Section } from './StatReportParts';
import {
  BUTTON_AVG_SEC,
  KIOSK_SHORT,
  buttonMonthly,
  buttonWeekly,
  type ButtonReportData,
} from './statReportsMockData';

function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

/** 아이콘별 전체 집계(모든 지점 합산) — 클릭 내림차순 */
function overallButtons(d: ButtonReportData): { name: string; clicks: number; sites: number }[] {
  const acc = new Map<string, { clicks: number; sites: number }>();
  for (const k of d.perKiosk) {
    for (const [name, clicks] of k.buttons) {
      const cur = acc.get(name) ?? { clicks: 0, sites: 0 };
      acc.set(name, { clicks: cur.clicks + clicks, sites: cur.sites + 1 });
    }
  }
  return [...acc.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.clicks - a.clicks);
}

export function ButtonReportView({ variant }: { variant: 'weekly' | 'monthly' }) {
  const d: ButtonReportData = variant === 'weekly' ? buttonWeekly : buttonMonthly;
  const prevLabel = variant === 'weekly' ? '전주' : '전월';
  const overall = overallButtons(d);
  const totalClicks = overall.reduce((a, b) => a + b.clicks, 0);
  const totalUsage = overall.reduce((a, b) => a + b.clicks * BUTTON_AVG_SEC[b.name], 0);

  return (
    <div className={s.report}>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <h2 className={s.headTitle}>{d.title}</h2>
            <p className={s.headSub}>{d.sub}</p>
          </div>
          <div className={s.headMeta}><b>{variant === 'weekly' ? '주간' : '월간'} 버튼 사용 통계 리포트</b>1 / 2 page</div>
        </div>
      </div>
      <KpiRow items={d.kpis} />

      <Section title='키오스크별 사용 집계' sub={`클릭 · 사용 시간 — ${prevLabel} 대비 비교(점선)`}>
        <div className={s.row2}>
          <CompareBarChart
            title={`키오스크별 클릭 — ${variant === 'weekly' ? '금주' : '당월'}(막대) vs ${prevLabel}(점선)`}
            data={d.kioskClicks}
            curName={`${variant === 'weekly' ? '금주' : '당월'} ${totalClicks.toLocaleString()}회`}
            prevName={`${prevLabel}`}
          />
          <CompareBarChart
            title={`키오스크별 사용 시간(분) — ${variant === 'weekly' ? '금주' : '당월'}(막대) vs ${prevLabel}(점선)`}
            data={d.kioskUsageMin}
            curName={`${variant === 'weekly' ? '금주' : '당월'} ${fmtDur(totalUsage)}`}
            prevName={`${prevLabel}`}
            color='#f59e0b'
          />
        </div>
      </Section>

      <Section title='AI 종합 분석' sub='자동 작성 · 담당자 검토'>
        <AiPanel tag={variant === 'weekly' ? 'AI WEEKLY INSIGHT' : 'AI MONTHLY INSIGHT'} overall={d.aiOverall} sites={d.aiSites} />
      </Section>

      <Section title='지점별 상세' sub='아이콘별 클릭 · 사용 시간 · 평균 체류 — 전체 및 키오스크별 집계'>
        {/* 전체 집계 — 아이콘별 (운영 지점 수 포함) */}
        <div className={s.kioskBlock} style={{ marginBottom: 12 }}>
          <h4 className={s.kioskBlockTitle}>전체 (5개 지점 합산)</h4>
          <p className={s.kioskBlockSummary}>
            클릭 <b>{totalClicks.toLocaleString()}회</b> · 사용 시간 {fmtDur(totalUsage)} · 평균 체류 {Math.floor(totalUsage / totalClicks)}초
            — 키오스크마다 버튼 구성이 달라 운영 지점 수를 함께 표기
          </p>
          <table className={s.table}>
            <thead>
              <tr><th>아이콘</th><th>운영 지점</th><th>클릭</th><th>비중</th><th>사용 시간</th><th>평균 체류</th></tr>
            </thead>
            <tbody>
              {overall.map((b, i) => (
                <tr key={b.name}>
                  <td className={`${s.tdL} ${i < 3 ? s.tdB : ''}`}>{b.name}</td>
                  <td>{b.sites}곳</td>
                  <td className={i < 3 ? s.tdB : ''}>{b.clicks.toLocaleString()}회</td>
                  <td>{Math.round((b.clicks / totalClicks) * 100)}%</td>
                  <td>{fmtDur(b.clicks * BUTTON_AVG_SEC[b.name])}</td>
                  <td>{BUTTON_AVG_SEC[b.name]}초</td>
                </tr>
              ))}
              <tr className={s.sumRow}>
                <td className={s.tdL}>합계</td><td>—</td>
                <td>{totalClicks.toLocaleString()}회</td><td>100%</td>
                <td>{fmtDur(totalUsage)}</td><td>{Math.floor(totalUsage / totalClicks)}초</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 키오스크별 — 각 지점의 실제 버튼 구성 전체 나열 */}
        <div className={s.kioskGrid}>
          {d.perKiosk.map((k, ki) => {
            const kSum = d.kioskSummary[ki];
            const kClicks = k.buttons.reduce((a, [, v]) => a + v, 0);
            const kUsage = k.buttons.reduce((a, [name, v]) => a + v * BUTTON_AVG_SEC[name], 0);
            return (
              <div key={k.kiosk} className={s.kioskBlock}>
                <h4 className={s.kioskBlockTitle}>{k.kiosk}</h4>
                <p className={s.kioskBlockSummary}>
                  클릭 <b>{kClicks.toLocaleString()}회</b> · 사용 시간 {fmtDur(kUsage)} · 평균 체류 {Math.floor(kUsage / kClicks)}초
                  · {prevLabel} 대비 <Diff text={kSum.diff} /> ({prevLabel} {kSum.prevClicks.toLocaleString()}회)
                </p>
                <table className={s.table} style={{ fontSize: 12 }}>
                  <thead>
                    <tr><th>아이콘</th><th>클릭</th><th>사용 시간</th><th>평균 체류</th></tr>
                  </thead>
                  <tbody>
                    {k.buttons.map(([name, clicks], i) => (
                      <tr key={name}>
                        <td className={`${s.tdL} ${i === 0 ? s.tdB : ''}`}>{name}</td>
                        <td className={i === 0 ? s.tdB : ''}>{clicks.toLocaleString()}회</td>
                        <td>{fmtDur(clicks * BUTTON_AVG_SEC[name])}</td>
                        <td>{BUTTON_AVG_SEC[name]}초</td>
                      </tr>
                    ))}
                    <tr className={s.sumRow}>
                      <td className={s.tdL}>소계</td>
                      <td>{kClicks.toLocaleString()}회</td>
                      <td>{fmtDur(kUsage)}</td>
                      <td>{Math.floor(kUsage / kClicks)}초</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        <p className={s.note}>
          ※ 클릭 = 홈 화면 버튼 터치 1회 · 사용 시간 = 버튼 진입 후 다른 메뉴 이동/홈 복귀까지 체류 시간 합계 · 평균 체류 = 사용 시간 ÷ 클릭 수 (관리자 웹 '키오스크 분석'과 동일 지표).
        </p>
      </Section>

      <Section title={d.dailyHead} sub={`키오스크 세로 × ${variant === 'weekly' ? '일자' : '주차'} 가로`}>
        <table className={s.table}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>지점</th>
              {d.daily.map((r) => <th key={r.d}>{r.d.split(' ')[0]}</th>)}
              <th>합계</th>
            </tr>
          </thead>
          <tbody>
            {KIOSK_SHORT.map((k, ki) => (
              <tr key={k}>
                <td className={`${s.tdL} ${s.tdB}`}>{k}</td>
                {d.daily.map((r) => <td key={r.d}>{r.per[ki].toLocaleString()}</td>)}
                <td className={s.tdB}>{d.dailySum.per[ki].toLocaleString()}</td>
              </tr>
            ))}
            <tr className={s.sumRow}>
              <td className={s.tdL}>합계</td>
              {d.daily.map((r) => <td key={r.d}>{r.sum.toLocaleString()}</td>)}
              <td>{d.dailySum.sum.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <p className={s.footer}>
        집계 기준: 홈 버튼 클릭 이벤트 · WIT 통계 시스템 자동 생성{variant === 'monthly' ? ' · 월간 발행 주차에는 주간 리포트 동시 발행' : ''} (표본 데이터는 목업용 가상 수치)
      </p>
    </div>
  );
}
