// 버튼(아이콘) 사용 통계 리포트 뷰(주간/월간) — 클라이언트 확정 구성:
// 헤더(제목+요약) → 그래프(키오스크별 클릭·사용 시간 2개, 전기 비교) → AI 분석
// → 지점별 상세(아이콘별 전체/키오스크별 집계) → 일별(주차별) 상세
// 지표·용어는 관리자 웹 '키오스크 분석'과 동일: 클릭 · 사용 시간 · 평균 체류.
import s from './StatReports.module.css';
import { AiPanel, CompareBarChart, Diff, HBarChart, KpiRow, Section } from './StatReportParts';
import {
  BUTTON_AVG_SEC,
  fmtMD,
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

export function ButtonReportView({ variant }: { variant: 'weekly' | 'monthly' }) {
  const d: ButtonReportData = variant === 'weekly' ? buttonWeekly : buttonMonthly;
  const prevLabel = variant === 'weekly' ? '전주' : '전월';
  const totalClicks = d.perKiosk.reduce((a, k) => a + k.buttons.reduce((x, [, v]) => x + v, 0), 0);
  const totalUsage = d.perKiosk.reduce((a, k) => a + k.buttons.reduce((x, [name, v]) => x + v * BUTTON_AVG_SEC[name], 0), 0);

  return (
    <div className={s.report} data-report-root data-report-title={`${variant === 'weekly' ? '주간' : '월간'} 버튼 사용 통계 리포트`}>
      <div data-report-page>
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

      </div>

      {d.perKiosk.map((k, ki) => {
            const kSum = d.kioskSummary[ki];
            const kClicks = k.buttons.reduce((a, [, v]) => a + v, 0);
            const kUsage = k.buttons.reduce((a, [name, v]) => a + v * BUTTON_AVG_SEC[name], 0);
            return (
              <div data-report-page key={k.kiosk}>
                {ki === 0 ? (
                  <div className={s.sec}>
                    <h3 className={s.secTitle}>지점별 상세</h3>
                    <span className={s.secSub}>키오스크별 버튼 터치 수·사용 시간 그래프 + 테이블 — 키오스크당 1페이지</span>
                  </div>
                ) : null}
                <div className={s.kioskBlock}>
                <h4 className={s.kioskBlockTitle}>{k.kiosk}</h4>
                <p className={s.kioskBlockSummary}>
                  클릭 <b>{kClicks.toLocaleString()}회</b> · 사용 시간 {fmtDur(kUsage)} · 평균 체류 {Math.floor(kUsage / kClicks)}초
                  · {prevLabel} 대비 <Diff text={kSum.diff} /> ({prevLabel} {kSum.prevClicks.toLocaleString()}회)
                </p>
                <div className={s.row2}>
                  <HBarChart title='버튼별 클릭(회)' data={k.buttons.map(([name, v]) => ({ label: name, value: v }))} unit='회' />
                  <HBarChart title='버튼별 사용 시간(분)' data={k.buttons.map(([name, v]) => ({ label: name, value: Math.round((v * BUTTON_AVG_SEC[name]) / 60) }))} unit='분' color='#f59e0b' />
                </div>
                <table className={s.table} style={{ marginTop: 10 }}>
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
                {ki === d.perKiosk.length - 1 ? (
                  <>
                    <p className={s.note}>※ 클릭 = 홈 화면 버튼 터치 1회 · 사용 시간 = 버튼 진입 후 다른 메뉴 이동/홈 복귀까지 체류 시간 합계 · 평균 체류 = 사용 시간 ÷ 클릭 수 (관리자 웹 '키오스크 분석'과 동일 지표).</p>
                    <p className={s.footer}>집계 기준: 홈 버튼 클릭 이벤트 · WIT 통계 시스템 자동 생성{variant === 'monthly' ? ' · 월간 발행 주차에는 주간 리포트 동시 발행' : ''} (표본 데이터는 목업용 가상 수치)</p>
                  </>
                ) : null}
              </div>
            );
          })}

    </div>
  );
}
