// 통계 리포트 패널 — 주간/월간 촬영·버튼 4종.
// 기본은 실데이터(서버 집계), '표본 디자인' 모드로 전환하면 전체 레이아웃(전 섹션)을
// 정합 검증된 표본 수치로 확인할 수 있다(서버 집계 미개발 섹션 검토용).
// DOCX/PDF 다운로드는 P3(자동 발행) 단계에서 활성화.
import { useState } from 'react';
import shared from '@commons/shared.module.css';
import rp from '@pages/ReportsPage.module.css';
import s from './StatReports.module.css';
import { ButtonReportView } from './ButtonReportView';
import { ButtonLiveView, ShootingMonthlyLiveView, ShootingWeeklyLiveView } from './LiveReportViews';
import { ShootingMonthlyView, ShootingWeeklyView } from './ShootingReportView';

type ReportKind = 'shoot-weekly' | 'shoot-monthly' | 'button-weekly' | 'button-monthly';

const KINDS: { id: ReportKind; label: string }[] = [
  { id: 'shoot-weekly', label: '주간 촬영' },
  { id: 'shoot-monthly', label: '월간 촬영' },
  { id: 'button-weekly', label: '주간 버튼' },
  { id: 'button-monthly', label: '월간 버튼' },
];

export function StatReportsTabPanel() {
  const [kind, setKind] = useState<ReportKind>('shoot-weekly');
  const [mode, setMode] = useState<'live' | 'sample'>('live');

  return (
    <div className={s.viewer}>
      <div className={`${shared.card} ${rp.filterCard} ${s.toolbar}`}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className={rp.segment}>
            {KINDS.map(({ id, label }) => (
              <button
                key={id}
                type='button'
                className={`${rp.segmentBtn} ${kind === id ? rp.segmentBtnActive : ''}`}
                onClick={() => setKind(id)}
              >
                {label}
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
        <p className={s.toolbarHint}>
          주간: 매주 월요일 07:00 자동 발행 · 월간: 매월 1일 발행(해당 주차 주간 리포트 동시 발행) · DOCX/PDF 다운로드는 자동 발행(P3) 연동 후 제공
        </p>
      </div>

      {mode === 'live' ? (
        <>
          {kind === 'shoot-weekly' ? <ShootingWeeklyLiveView /> : null}
          {kind === 'shoot-monthly' ? <ShootingMonthlyLiveView /> : null}
          {kind === 'button-weekly' ? <ButtonLiveView variant='weekly' /> : null}
          {kind === 'button-monthly' ? <ButtonLiveView variant='monthly' /> : null}
        </>
      ) : (
        <>
          {kind === 'shoot-weekly' ? <ShootingWeeklyView /> : null}
          {kind === 'shoot-monthly' ? <ShootingMonthlyView /> : null}
          {kind === 'button-weekly' ? <ButtonReportView variant='weekly' /> : null}
          {kind === 'button-monthly' ? <ButtonReportView variant='monthly' /> : null}
        </>
      )}
    </div>
  );
}
