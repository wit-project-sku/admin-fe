// 통계 리포트 패널 — 주간/월간 촬영·버튼 4종 (stats-mockup 디자인 정합).
// 발행 규칙 안내 배너 + 카드형 리포트 선택기 + 기간 선택기 + A4 폭 리포트 프레임.
// 기본은 실데이터(서버 집계), '표본 디자인' 모드로 전 섹션 레이아웃을 검토할 수 있다.
import { useState } from 'react';
import rp from '@pages/ReportsPage.module.css';
import s from './StatReports.module.css';
import { ButtonReportView } from './ButtonReportView';
import { ButtonLiveView, ShootingMonthlyLiveView, ShootingWeeklyLiveView } from './LiveReportViews';
import { ShootingMonthlyView, ShootingWeeklyView } from './ShootingReportView';
import { weekRangesOf } from './useStatReportLive';

type ReportKind = 'shoot-weekly' | 'shoot-monthly' | 'button-weekly' | 'button-monthly';

const KINDS: { id: ReportKind; badge: string; green?: boolean; title: string; desc: string }[] = [
  { id: 'shoot-weekly', badge: '주간', title: '주간 촬영 통계 리포트', desc: '전주 대비 · 지점별(전체·오전/오후·요일별) 상세' },
  { id: 'shoot-monthly', badge: '월간 · 매월 1일', green: true, title: '월간 촬영 통계 리포트', desc: '전월 대비 · 지점별(전체·오전/오후) 상세' },
  { id: 'button-weekly', badge: '주간', title: '주간 버튼 사용 리포트', desc: '클릭·사용 시간 — 전체/키오스크별 아이콘 집계' },
  { id: 'button-monthly', badge: '월간 · 매월 1일', green: true, title: '월간 버튼 사용 리포트', desc: '전월 대비 · 키오스크별 아이콘별 상세' },
];

/** YYYY-MM-DD (로컬) */
function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function thisMonthYm(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function StatReportsTabPanel() {
  const [kind, setKind] = useState<ReportKind>('shoot-weekly');
  const [mode, setMode] = useState<'live' | 'sample'>('live');
  // 기간 선택 — 주간(anchor 날짜)·월간(YYYY-MM). 빈 값이면 지난 완결 주/달.
  const [anchor, setAnchor] = useState<string>('');
  const [ym, setYm] = useState<string>('');

  const isWeekly = kind === 'shoot-weekly' || kind === 'button-weekly';
  const wk = weekRangesOf(anchor); // 선택 주 라벨 표시용

  return (
    <div className={s.viewer}>
      <div className={s.toolbar}>
        <div className={s.kindCards}>
          {KINDS.map(({ id, badge, green, title, desc }) => (
            <button
              key={id}
              type='button'
              className={`${s.kindCard} ${kind === id ? s.kindCardActive : ''}`}
              onClick={() => setKind(id)}
            >
              <span className={`${s.kindBadge} ${green ? s.kindBadgeGreen : ''}`}>{badge}</span>
              <div className={s.kindTitle}>{title}</div>
              <div className={s.kindDesc}>{desc}</div>
            </button>
          ))}
        </div>
        <div className={rp.segment}>
          <button type='button' className={`${rp.segmentBtn} ${mode === 'live' ? rp.segmentBtnActive : ''}`} onClick={() => setMode('live')}>
            실데이터
          </button>
          <button type='button' className={`${rp.segmentBtn} ${mode === 'sample' ? rp.segmentBtnActive : ''}`} onClick={() => setMode('sample')}>
            표본 디자인
          </button>
        </div>
      </div>

      {/* 기간 선택기 — 실데이터 모드에서만. 주간=주(날짜), 월간=월. 표본은 고정 데이터라 숨김. */}
      {mode === 'live' ? (
        <div className={s.periodBar}>
          <span className={s.periodLabel}>대상 기간</span>
          {isWeekly ? (
            <>
              <input
                type='date'
                className={s.periodInput}
                max={todayYmd()}
                value={anchor}
                onChange={(e) => setAnchor(e.target.value)}
              />
              <span className={s.periodResolved}>{wk.start} ~ {wk.end} (해당 주 월~일)</span>
            </>
          ) : (
            <>
              <input
                type='month'
                className={s.periodInput}
                max={thisMonthYm()}
                value={ym}
                onChange={(e) => setYm(e.target.value)}
              />
              <span className={s.periodResolved}>선택 월의 1일~말일 · 전월 대비</span>
            </>
          )}
          <button
            type='button'
            className={s.periodReset}
            onClick={() => { setAnchor(''); setYm(''); }}
            disabled={isWeekly ? !anchor : !ym}
          >
            지난 {isWeekly ? '주' : '달'}로
          </button>
        </div>
      ) : null}

      <div className={`${s.a4wrap} ${s.printRoot}`}>
        {mode === 'live' ? (
          kind === 'shoot-weekly' ? <ShootingWeeklyLiveView anchor={anchor || undefined} />
          : kind === 'shoot-monthly' ? <ShootingMonthlyLiveView ym={ym || undefined} />
          : kind === 'button-weekly' ? <ButtonLiveView variant='weekly' anchor={anchor || undefined} />
          : <ButtonLiveView variant='monthly' ym={ym || undefined} />
        ) : (
          kind === 'shoot-weekly' ? <ShootingWeeklyView />
          : kind === 'shoot-monthly' ? <ShootingMonthlyView />
          : kind === 'button-weekly' ? <ButtonReportView variant='weekly' />
          : <ButtonReportView variant='monthly' />
        )}
      </div>
    </div>
  );
}
