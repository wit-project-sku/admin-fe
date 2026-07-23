// 통계 리포트 패널 — 주간/월간 촬영·버튼 4종 (stats-mockup 디자인 정합).
// 발행 규칙 안내 배너 + 카드형 리포트 선택기 + A4 폭 리포트 프레임.
// 기본은 실데이터(서버 집계), '표본 디자인' 모드로 전 섹션 레이아웃을 검토할 수 있다.
import { useState } from 'react';
import rp from '@pages/ReportsPage.module.css';
import s from './StatReports.module.css';
import { ButtonReportView } from './ButtonReportView';
import { ButtonLiveView, ShootingMonthlyLiveView, ShootingWeeklyLiveView } from './LiveReportViews';
import { ShootingMonthlyView, ShootingWeeklyView } from './ShootingReportView';

type ReportKind = 'shoot-weekly' | 'shoot-monthly' | 'button-weekly' | 'button-monthly';

const KINDS: { id: ReportKind; badge: string; green?: boolean; title: string; desc: string }[] = [
  { id: 'shoot-weekly', badge: '주간 · 매주 월 07:00', title: '주간 촬영 통계 리포트', desc: '전주 대비 · 지점별(전체·오전/오후·요일별) 상세' },
  { id: 'shoot-monthly', badge: '월간 · 매월 1일', green: true, title: '월간 촬영 통계 리포트', desc: '전월 대비 · 지점별(전체·오전/오후) 상세' },
  { id: 'button-weekly', badge: '주간 · 매주 월 07:00', title: '주간 버튼 사용 리포트', desc: '클릭·사용 시간 — 전체/키오스크별 아이콘 집계' },
  { id: 'button-monthly', badge: '월간 · 매월 1일', green: true, title: '월간 버튼 사용 리포트', desc: '전월 대비 · 키오스크별 아이콘별 상세' },
];

export function StatReportsTabPanel() {
  const [kind, setKind] = useState<ReportKind>('shoot-weekly');
  const [mode, setMode] = useState<'live' | 'sample'>('live');

  return (
    <div className={s.viewer}>
      <div className={s.infoBanner}>
        📄 <b>발행 규칙 · DOCX 템플릿</b> — 리포트는 <b>주간·월간 2종 단일 양식</b>(내부/제출 공용)입니다. 주간 = 매주 월 07:00,
        월간 = 매월 1일 발행, <b>월간 발행 주차에는 주간 리포트도 함께 발행</b>됩니다(동시 2건). 워드 템플릿의 자리표시자{' '}
        <code>{'{{총촬영}}'}</code> <code>{'{{전주대비}}'}</code> <code>{'{{차트:지점별}}'}</code> <code>{'{{AI분석}}'}</code> 에
        데이터·차트가 채워지고, 생성된 DOCX는 제출 전 자유롭게 가필·수정할 수 있습니다.
      </div>

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

      <div className={`${s.a4wrap} ${s.printRoot}`}>
        {mode === 'live' ? (
          kind === 'shoot-weekly' ? <ShootingWeeklyLiveView />
          : kind === 'shoot-monthly' ? <ShootingMonthlyLiveView />
          : kind === 'button-weekly' ? <ButtonLiveView variant='weekly' />
          : <ButtonLiveView variant='monthly' />
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
