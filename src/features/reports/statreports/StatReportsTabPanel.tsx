// 통계 리포트 탭 — 주간/월간 촬영·버튼 리포트를 관리자 웹에서 미리 확인.
// 현재는 목업 데이터 렌더(statReportsMockData). P2/P3 서버 집계 API 연동 시
// 데이터 소스만 교체하고 DOCX/PDF 다운로드를 활성화한다.
import { useState } from 'react';
import shared from '@commons/shared.module.css';
import rp from '@pages/ReportsPage.module.css';
import s from './StatReports.module.css';
import { ButtonReportView } from './ButtonReportView';
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

  return (
    <div className={s.viewer}>
      <div className={`${shared.card} ${rp.filterCard} ${s.toolbar}`}>
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
        <p className={s.toolbarHint}>
          주간: 매주 월요일 07:00 자동 발행 · 월간: 매월 1일 발행(해당 주차 주간 리포트 동시 발행) · 표본 데이터 미리보기 — DOCX/PDF 다운로드는 서버 집계 API 연동 후 제공
        </p>
      </div>

      {kind === 'shoot-weekly' ? <ShootingWeeklyView /> : null}
      {kind === 'shoot-monthly' ? <ShootingMonthlyView /> : null}
      {kind === 'button-weekly' ? <ButtonReportView variant='weekly' /> : null}
      {kind === 'button-monthly' ? <ButtonReportView variant='monthly' /> : null}
    </div>
  );
}
